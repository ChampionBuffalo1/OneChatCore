import store from './Store';
import { WsMessageSchema } from './zschema';

// Serve side websocket connection handler
async function broadcastUpdate(
  groupId: string,
  status: {
    type: 'M_CREATE' | 'M_UPDATE' | 'M_DELETE' | 'G_CREATE' | 'G_UPDATE' | 'G_DELETE';
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
