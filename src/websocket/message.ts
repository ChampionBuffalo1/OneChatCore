import store from './Store';
import { WsMessageSchema } from './zschema';

// Serve side websocket connection handler
async function broadcastUpdate(
  groupId: string,
  status: {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    message: Record<string, unknown>;
  }
) {
  const sockets = store.getGroupConnections(groupId);
  if (!sockets) return;
  for (const socket of sockets) {
    socket.send(JSON.stringify(status));
  }
}

async function handleMessage(_message: WsMessageSchema, _token: string) {}
export { broadcastUpdate, handleMessage };
