import store from './Store';
import Logger from '../lib/Logger';
import { WebSocketServer } from 'ws';
import type { Server } from 'node:http';
import { handleConnection } from './connection';
import { PORT } from '../Constants';

const path = '/ws';
function createSocketServer(server: Server) {
  // `server` is provided so that the `ws` doesn't create it's own HTTP Server for ws-upgrade
  const socket = new WebSocketServer({
    path,
    server
  });
  socket.on('connection', handleConnection);
  socket.on('close', () => {
    socket.removeAllListeners();
    store.reset();
    Logger.info('Websocket server closed');
  });
  socket.on('error', err => Logger.error('Websocket server error: ' + err));
  socket.on('listening', () => Logger.info(`Websocket server listening ${path} at port: ${PORT}`));
}

export { createSocketServer };
