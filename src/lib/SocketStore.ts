import { WebSocket } from 'ws';

export class SocketStore {
  private authSocket: Map<string, WebSocket> = new Map();
  private tmpSocket: Map<string, WebSocket> = new Map();
  private limit?: number;
  // For tmp socket connection that will be removed after some amount of times if not authenticated
  setTmpConnection(uuid: string, ws: WebSocket): void {
    this.tmpSocket.set(uuid, ws);
  }
  getTmpSocket(uuid: string): WebSocket | undefined {
    return this.tmpSocket.get(uuid);
  }
  upgradeSocket(uuid: string): WebSocket {
    const ws = this.tmpSocket.get(uuid);
    if (!ws) throw new Error(`No websocket with uuid ${uuid} found.`);
    this.removeTmpSocket(uuid);
    this.setConnection(uuid, ws);
    return ws;
  }
  // TODO: Add some kind of limit to the recursion
  removeTmpSocket(uuid: string): boolean {
    if (!this.tmpSocket.has(uuid)) return true;
   const isRemoved = this.tmpSocket.delete(uuid);
    return isRemoved || this.removeTmpSocket(uuid);
  }

  getConnection(uuid: string): WebSocket | undefined {
    return this.authSocket.get(uuid);
  }
  setConnection(uuid: string, ws: WebSocket): void {
    if (this.limit && this.authSocket.size > this.limit) throw new Error('Maximum concurrent websocket limit reached.');
    this.authSocket.set(uuid, ws);
  }
  removeConnection(uuid: string): boolean {
    if (this.authSocket.size == 0) return false;
    const ws = this.authSocket.get(uuid);
    ws?.close(0x02);
    return this.authSocket.delete(uuid);
  }
  setLimit(limit: number): this {
    this.limit = limit;
    return this;
  }
}

const store = new SocketStore();
export default store;
