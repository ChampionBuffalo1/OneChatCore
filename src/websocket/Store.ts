import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { manualClose } from './utils';
import { maxWsCon } from '../Constants';

class SocketStore {
  // group_id => user_id
  private groupSocket: Map<string, Set<string>> = new Map();
  // user_id => Socket
  private authSocket: Map<string, WebSocket> = new Map();
  // nano_id => Socket (Removed after 30s if not authenticated)
  private tmpSocket: Map<string, WebSocket> = new Map();
  constructor(private readonly limit: number) {}
  // For tmp socket connection that will be removed after some amount of times if not authenticated
  setTmpConnection(ws: WebSocket): string {
    const uuid = randomUUID();
    this.tmpSocket.set(uuid, ws);
    return uuid;
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

  setGroupConnection(groupId: string, userId: string): void {
    if (!this.groupSocket.has(groupId)) {
      this.groupSocket.set(groupId, new Set());
    }
    this.groupSocket.get(groupId)!.add(userId);
  }

  getGroupConnections(groupId: string): Set<string> | undefined {
    return this.groupSocket.get(groupId);
  }

  removeGroupConnection(groupId: string, userId: string): void {
    if (!this.groupSocket.has(groupId)) {
      return;
    }
    this.groupSocket.get(groupId)!.delete(userId);
  }

  removeGroup(groupId: string): boolean {
    return this.groupSocket.delete(groupId);
  }

  reset(): void {
    this.groupSocket.clear();
    this.authSocket.forEach(ws => ws.close(manualClose));
    this.authSocket.clear();
    this.tmpSocket.forEach(ws => ws.close(manualClose));
    this.tmpSocket.clear();
  }
}

const store = new SocketStore(maxWsCon);
export default store;
