import store from './Store';
import { WebSocket } from 'ws';
import { handleMessage } from './message';
import { handleSocketError } from './error';
import { WsMessageSchema } from './zschema';
import { getUserMetadata } from './usermeta';
import { manualClose, sendMessage } from './utils';
import { Logger, WsAuthSchema, getJwtPayload } from '../lib';

const maxwait = 30; // in seconds

async function handshake(message: string, uuid: string) {
  try {
    const authSchema = await WsAuthSchema.spa(JSON.parse(message));
    if (authSchema.success) {
      const { token } = authSchema.data;
      // User auth verification and socket upgrade
      const payload = await getJwtPayload(token);
      if (payload.data.userId) {
        const token = payload.data.userId;
        const metadata = await getUserMetadata(token);
        const socket = store.upgradeSocket(uuid, token);
        sendMessage(token, {
          message: 'Authenticated successfully',
          data: metadata
        });
        for (const { id } of metadata!.Group) {
          store.setGroupConnection(id, socket);
        }

        // Removing old tmp listeners
        //  0th listener is setup by `ws` package itself
        const listener = socket.listeners('close')[1] as (this: WebSocket, ...args: unknown[]) => void;
        socket.off('close', listener);
        socket.removeAllListeners('message');

        socket.on('message', async (buffer: Buffer) => {
          const messageSchema = await WsMessageSchema.spa(JSON.parse(buffer.toString()));
          if (messageSchema.success) handleMessage(messageSchema.data, token);
          else sendMessage(token, { ...messageSchema.error });
        });
        socket.on('close', async (code: number, reason: string) => {
          if (code !== manualClose) Logger.info('Websocket connection closed with code: ' + code + ' reason:' + reason);
          store.removeConnection(token);
        });
      }
    } else {
      // Schema validation error
      sendMessage(
        uuid,
        {
          error: authSchema.error
        },
        true
      );
    }
  } catch (err) {
    if ((err as Error).message === 'JwtError') {
      sendMessage(
        uuid,
        {
          error: (err as Error).cause + '\nGenerate a new token and try again'
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
      time: maxwait,
      message: `Verify with token within ${maxwait} seconds`
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
  ws.on('error', handleSocketError);
  ws.on('close', () => store.removeTmpSocket(uuid));
}

export { handleConnection };
