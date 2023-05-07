import store from './Store';

// https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
const manualClose = 1010;

function sendMessage(uuid: string, content: string | Record<string, unknown> | Buffer, useTmpStore = false): boolean {
  const socket = useTmpStore ? store.getTmpSocket(uuid) : store.getConnection(uuid);
  if (!socket) return false;
  let message: Buffer = content as Buffer;
  if (typeof content === 'string' || typeof content === 'object')
    message = Buffer.from(typeof content === 'object' ? JSON.stringify(content) : content);
  socket.send(message);
  return true;
}

export { sendMessage, manualClose };
