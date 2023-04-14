import { WebSocket } from 'ws';
import { maxWsCon } from '../Constants';

class SocketStore extends Map<string, WebSocket> {
  constructor(private limit: number = maxWsCon) {
    super();
  }
  getConnection(uuid: string) {
    return this.get(uuid);
  }
  setConnection(uuid: string, ws: WebSocket) {
    if (this.size > this.limit) throw new Error('Maximum concurrent websocket limit reached.');
    return this.set(uuid, ws);
  }
  removeConnection(uuid: string): boolean {
    if (this.size == 0) return false;
    const ws = this.get(uuid);
    ws?.close(0x02);
    return this.delete(uuid);
  }
}

const store = new SocketStore()
export default store;