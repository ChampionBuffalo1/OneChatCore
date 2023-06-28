import store from './Store';

// https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
const manualClose = 1010;
// TODO: Remove Buffer or store isBinary in store and attach them for each socket
type BufStr = Buffer | string;

function sendMessage(uuid: string, content: BufStr | Record<string, unknown>, useTmpStore = false): boolean {
  const socket = useTmpStore ? store.getTmpSocket(uuid) : store.getConnection(uuid);
  if (!socket) return false;
  let message = content as BufStr;
  if (typeof content === 'object') message = JSON.stringify(content);
  socket.send(message);
  return true;
}
//   socket.send(message, { binary: isBinary });
export { sendMessage, manualClose };
