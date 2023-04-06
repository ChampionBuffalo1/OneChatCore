import 'dotenv-safe/config';
import cors from 'cors';
import express from 'express';
import apiRoute from './api';
import Logger from './utils/Logger';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { WebSocketServer } from 'ws';
import { createServer } from 'node:http';
import { createMongoConnection, createRedisConnection } from './utils';
import { PORT, isProd, cookieName, cookieSecret, HttpCodes, maxCookieAge } from './Constants';

(async (): Promise<void> => {
  await createMongoConnection();

  const app = express();
  const server = createServer(app);
  const RedisStore = connectRedis(session);
  const redisClient = await createRedisConnection();

  app.disable('etag');
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      name: cookieName,
      secret: cookieSecret,
      store: new RedisStore({
        client: redisClient
      }),
      cookie: {
        httpOnly: true,
        maxAge: maxCookieAge,
        sameSite: 'lax',
        secure: isProd // cookie only works in https
      },
      saveUninitialized: false,
      resave: false
    })
  );

  app.use('/api', apiRoute);
  app.get('/', (_, res) => res.sendStatus(HttpCodes.OK));

  server.listen(PORT, () => Logger.info(`Listening on port: ${PORT}`));

  // `noServer` is so that `ws` doesn't create it's own HTTP Server for upgrade
  const wss = new WebSocketServer({
    noServer: true,
    path: '/ws'
  });

  wss.on('connection', ws => {
    ws.send('Websocket test');
  });

  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, socket => {
      wss.emit('connection', socket, req);
    });
  });

  process.on('unhandledRejection', (error: Error) =>
    Logger.error(`Unhandled Promise Rejection\nError: ${error.message || error}`)
  );
})();
