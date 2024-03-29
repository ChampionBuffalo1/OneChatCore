import { z } from 'zod';
import store from './Store';
import { WebSocket } from 'ws';
import { RESULT_PER_PAGE } from '../Constants';
import { manualClose, sendMessage, getUserMetadata } from './utils';
import { prisma, Logger, getJwtPayload, paginatedParameters } from '../lib';

const WsAuthSchema = z.object({
  token: z.string().min(1)
});

const maxwait = 30; // in seconds

async function handshake(message: string, uuid: string) {
  try {
    const authSchema = await WsAuthSchema.spa(JSON.parse(message));
    if (authSchema.success) {
      const { token } = authSchema.data;
      // User auth verification and socket upgrade
      const payload = getJwtPayload(token);
      if (payload.userId) {
        const socket = store.upgradeSocket(uuid, payload.userId);
        const total = await prisma.member.count({
          where: { userId: payload.userId }
        });
        if (total === 0) {
          socket.send(
            JSON.stringify({
              op: 'USER_METADATA',
              d: []
            })
          );
          return;
        }
        const totalPages = total / RESULT_PER_PAGE;

        const groupIds: string[] = [];
        for (let i = 0; i < totalPages; i++) {
          const { take, skip } = paginatedParameters(i, total, RESULT_PER_PAGE);

          const metadata = await getUserMetadata(payload.userId, take, skip);
          metadata.forEach(group => groupIds.push(group.id));

          for (const group of metadata) {
            store.setGroupConnection(group.id, payload.userId);
          }
          socket.send(
            JSON.stringify({
              op: 'USER_METADATA',
              d: metadata
            })
          );
        }

        // Removing old tmp listeners
        //  0th listener is setup by `ws` package itself
        const listener = socket.listeners('close')[1] as (this: WebSocket, ...args: unknown[]) => void;
        socket.off('close', listener);
        socket.removeAllListeners('message');
        // Leaving the below as an example (check git history for better example)
        // socket.on('message', async (buffer: Buffer) => {});
        socket.on('close', async (code: number, reason: string) => {
          if (code !== manualClose) Logger.info('Websocket connection closed with code: ' + code + ' reason:' + reason);
          store.removeConnection(payload.userId);
          for (const id of groupIds) {
            store.removeGroupConnection(id, payload.userId);
          }
        });
      }
    } else {
      sendMessage(
        uuid,
        {
          op: 'INVALID_SCHEMA',
          d: {
            error: authSchema.error
          }
        },
        true
      );
    }
  } catch (err) {
    if ((err as Error).message === 'JwtError') {
      sendMessage(
        uuid,
        {
          op: 'USER_AUTH_FAILURE',
          d: { error: (err as Error).cause + '\nGenerate a new token and try again' }
        },
        true
      );
    }
  }
}

function handleConnection(ws: WebSocket) {
  const uuid = store.setTmpConnection(ws);
  sendMessage(
    uuid,
    {
      op: 'USER_AUTH_INIT',
      d: {
        time: maxwait,
        message: `Verify with token within ${maxwait} seconds`
      }
    },
    true
  );

  // Time to wait before closing the connection (Unauthorized connection)
  setTimeout(() => {
    const tmpSocket = store.getTmpSocket(uuid);
    if (tmpSocket) {
      tmpSocket.close(manualClose, 'Authentication timeout');
      store.removeTmpSocket(uuid);
    }
  }, 1000 * maxwait);

  ws.on('message', buffer => handshake(buffer.toString(), uuid));
  ws.on('error', Logger.error);
  ws.on('close', () => store.removeTmpSocket(uuid));
}

export { handleConnection };
