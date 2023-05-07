import { WebSocket } from 'ws';
import { maxWsCon } from '../Constants';
import { manualClose } from './utils';

class SocketStore {
  private authSocket: Map<string, WebSocket> = new Map();
  private tmpSocket: Map<string, WebSocket> = new Map();
  constructor(private readonly limit: number) {}
  // For tmp socket connection that will be removed after some amount of times if not authenticated
  setTmpConnection(uuid: string, ws: WebSocket): void {
    this.tmpSocket.set(uuid, ws);
  }
  getTmpSocket(uuid: string): WebSocket | undefined {
    return this.tmpSocket.get(uuid);
  }
  upgradeSocket(uuid: string, key: string): WebSocket {
    const ws = this.tmpSocket.get(uuid);
    if (!ws) throw new Error(`No websocket with uuid ${uuid} found.`);
    this.removeTmpSocket(uuid);
    this.setConnection(key, ws);
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
    if (this.authSocket.size > this.limit) throw new Error('Maximum concurrent websocket limit reached.');
    this.authSocket.set(uuid, ws);
  }

  removeConnection(uuid: string): boolean {
    if (this.authSocket.size == 0) return false;
    const ws = this.authSocket.get(uuid);
    if (ws?.CLOSED) ws.close(manualClose);
    return this.authSocket.delete(uuid);
  }
  reset(): void {
    this.authSocket.forEach(ws => ws.close(manualClose));
    this.authSocket.clear();
    this.tmpSocket.forEach(ws => ws.close(manualClose));
    this.tmpSocket.clear();
  }
}

const store = new SocketStore(maxWsCon);
export default store;
