import store from './Store';
import { WebSocket } from 'ws';
import { Logger, WsAuthSchema, getJwtPayload } from '../lib';
import { manualClose, sendMessage, getUserMetadata } from './utils';

const maxwait = 30; // in seconds

async function handshake(message: string, uuid: string) {
  try {
    const authSchema = await WsAuthSchema.spa(JSON.parse(message));
    if (authSchema.success) {
      const { token } = authSchema.data;
      // User auth verification and socket upgrade
      const payload = getJwtPayload(token);
      if (payload.userId) {
        const metadata = await getUserMetadata(payload.userId);
        const socket = store.upgradeSocket(uuid, payload.userId);
        sendMessage(payload.userId, { data: metadata, message: 'Authenticated successfully' });

        const groupIds = metadata.map(group => group.id);
        for (const id of groupIds) {
          store.setGroupConnection(id, payload.userId);
        }

        // Initial data send
        socket.send(JSON.stringify(metadata));

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
      sendMessage(uuid, { error: authSchema.error }, true);
    }
  } catch (err) {
    if ((err as Error).message === 'JwtError') {
      sendMessage(uuid, { error: (err as Error).cause + '\nGenerate a new token and try again' }, true);
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
  ws.on('error', Logger.error);
  ws.on('close', () => store.removeTmpSocket(uuid));
}

export { handleConnection };
