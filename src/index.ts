import 'dotenv-safe/config';
import cors from 'cors';
import express from 'express';
import apiRoute from './api';
import Logger from './lib/Logger';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { WebSocketServer } from 'ws';
import { createServer } from 'node:http';
import { createMongoConnection, createRedisConnection } from './lib';
import { PORT, isProd, cookieName, cookieSecret, HttpCodes, maxCookieAge } from './Constants';
import SocketStore from './lib/SocketStore';

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

  // `server` is provided so that the `ws` doesn't create it's own HTTP Server for ws-upgrade
  const wss = new WebSocketServer({
    path: '/ws',
    server
  });

  wss.on('connection', ws => {
    ws.send('hello');
    SocketStore.setConnection("tmpid", ws)
    ws.on('message', buf => {
      console.debug(buf.toString());
      SocketStore.getConnection("tmpid")?.send("welcome")
    });
  });

  process.on('unhandledRejection', (error: Error) =>
    Logger.error(`Unhandled Promise Rejection\nError: ${error.message || error}`)
  );
})();
