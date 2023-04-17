import 'dotenv-safe/config';
import '@total-typescript/ts-reset';
import cors from 'cors';
import express from 'express';
import apiRoute from './api';
import Logger from './lib/Logger';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createServer } from 'node:http';
import { createMongoConnection, createRedisConnection } from './lib';
import { PORT, isProd, cookieName, cookieSecret, HttpCodes, maxCookieAge } from './Constants';
import WebsocketMainter from './lib/wsHandler';

(async (): Promise<void> => {
  await createMongoConnection();

  const app = express();
  const server = createServer(app);
  const redisClient = await createRedisConnection();
  const RedisStore = connectRedis(session);

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
  new WebsocketMainter(server);

  server.listen(PORT, () => Logger.info(`Listening on port: ${PORT}`));

  process.on('unhandledRejection', (error: Error) =>
    Logger.error(`Unhandled Promise Rejection\nError: ${error.message || error}`)
  );
})();
