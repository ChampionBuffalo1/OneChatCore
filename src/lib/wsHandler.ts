import Logger from './Logger';
import { maxWsCon } from '../Constants';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import Store, { SocketStore } from './SocketStore';
import { WsAuthSchema, WsMessageSchema } from './ZodSchema';

const maxwait = 30; // seconds
// https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
const manualClose = 1010;

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
    this.store.setTmpConnection(uuid, ws);
    this.sendMessage(
      uuid,
      {
        id: uuid,
        time: maxwait,
        message: `Verify with token within ${maxwait} seconds`
      },
      true
    );
    // Time to wait before closing the connection (Unauthorized connection)
    setTimeout(() => {
      const tmpSocket = this.store.getTmpSocket(uuid);
      if (tmpSocket) {
        tmpSocket.close(manualClose, 'Authentication timeout');
        this.store.removeTmpSocket(uuid);
      }
    }, 1000 * maxwait);
    // FIX: Something isn't right
    // What will happen if two concurrent connections were made
    this.UnAuthWrapper = (buffer: Buffer) => this.handleUnAuthSocket(buffer.toString(), uuid);

    ws.on('message', this.UnAuthWrapper);
    ws.on('error', this.handleError);
    ws.on('close', (code: number, reason: string) => {
      ws.removeAllListeners();
      this.store.removeConnection(this.getId(ws));
      if (code !== manualClose) Logger.info('Websocket connection closed with code: ' + code + ' reason:' + reason);
    });
  };

  async handleMessage(message: WsMessageSchema, uuid: string) {
      if (message.content.includes('hello')) {
        this.sendMessage(uuid, 'I am good, what about you?');
      }
  }

  async handleUnAuthSocket(message: string, uuid: string) {
    const auth = await WsAuthSchema.safeParseAsync(JSON.parse(message));
    if (auth.success) {
      const { token } = auth.data;
      const isLegit = await verifyToken(token);
      if (isLegit) {
        const socket = this.store.upgradeSocket(uuid);
        this.sendMessage(uuid, {
          message: 'authenticated successfully'
        });
        // Removing UnAuthSocket handler and setting proper listener
        socket?.off('message', this.UnAuthWrapper!);
        socket?.on('message', async (buffer: Buffer) => {
          const parsedMsg = await WsMessageSchema.safeParseAsync(JSON.parse(buffer.toString()));
          if (parsedMsg.success) {
            this.handleMessage(parsedMsg.data, uuid);
          } else {
            this.sendMessage(uuid, {
              ...parsedMsg.error
            });
          }
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
      this.sendMessage(
        uuid,
        {
          error: auth.error
        },
        true
      );
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
async function verifyToken(token: string): Promise<boolean> {
  return !!token;
}
