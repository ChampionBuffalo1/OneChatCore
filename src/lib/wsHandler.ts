import { z } from 'zod';
import Logger from './Logger';
import { maxWsCon } from '../Constants';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import Store, { SocketStore } from './SocketStore';
import { WsAuthSchema } from './ZodSchema';

const maxwait = 30; // seconds

export default class WebsocketMainter {
  private server: WebSocketServer;
  protected store: SocketStore;
  UnAuthWrapper?: (buffer: Buffer) => Promise<void>;

  constructor(server: Server) {
    // `server` is provided so that the `ws` doesn't create it's own HTTP Server for ws-upgrade
    this.server = new WebSocketServer({
      path: '/ws',
      server
    });
    this.store = Store.setLimit(maxWsCon);
    this.server.on('connection', this.handleConnection);
  }
  handleConnection = (ws: WebSocket) => {
    const uuid = randomUUID();
    this.sendMessage(
      uuid,
      {
        id: uuid,
        time: maxwait,
        message: `Verify with token within ${maxwait} seconds`
      },
      true
    );

    // FIX: Something isn't right
    // What will happen if two concurrent connections were made
    this.UnAuthWrapper = (buffer: Buffer) => this.handleUnAuthSocket(buffer.toString(), uuid);
    // Time to wait before closing the connection (Unauthorized connection)
    setTimeout(() => {
      const tmpSocket = this.store.getTmpSocket(uuid);
      if (tmpSocket) {
        tmpSocket.close();
        this.store.removeTmpSocket(uuid);
      }
    }, 1000 * maxwait);

    ws.on('message', this.UnAuthWrapper);
    ws.on('error', this.handleError);
    ws.on('close', (code: number, reason: string) => {
      ws.removeAllListeners();
      this.store.removeConnection(this.getId(ws));
      Logger.info('Websocket connection closed with code: ' + code + ' reason:' + reason);
    });
  };

  handleMessage(message: string, uuid: string) {
    Logger.debug(message);
    if (message.includes('hello')) {
      this.store.getConnection(uuid)?.send('I am good, what about you?');
    }
  }

  async handleUnAuthSocket(message: string, uuid: string) {
    const auth = await WsAuthSchema.safeParseAsync(JSON.parse(message) as z.infer<typeof WsAuthSchema>);
    if (auth.success) {
      const { token } = auth.data;
      const isLegit = await verifyToken(token);
      if (isLegit) {
        const socket = this.store.upgradeSocket(uuid);
        // Removing UnAuthSocket handler and setting proper listener
        socket?.off('message', this.UnAuthWrapper!);
        socket.on('message', buffer => {
          this.handleMessage(buffer.toString(), uuid);
        });
        return;
      }
      this.sendMessage(
        uuid,
        {
          error: 'Invalid Token'
        },
        true
      );
    } else {
      this.sendMessage(uuid, {
        error: auth.error
      }, true);
    }
  }
  // TODO
  handleError() {}

  sendMessage(uuid: string, content: string | Record<string, unknown> | Buffer, useTmpStore: boolean = false): boolean {
    const socket = useTmpStore ? this.store.getTmpSocket(uuid) : this.store.getConnection(uuid);
    if (!socket) return false;
    let message: Buffer = content as Buffer;
    if (typeof content === 'string' || typeof content === 'object')
      message = Buffer.from(typeof content === 'object' ? JSON.stringify(content) : content);
    socket.send(message);
    return true;
  }
  // TODO
  protected getId(_: WebSocket): string {
    return 'theid';
  }
}
// TODO: Make this later
async function verifyToken(token: string) {
  return !!token;
}
