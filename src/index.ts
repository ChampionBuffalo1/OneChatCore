import 'dotenv-safe/config';
import '@total-typescript/ts-reset';
import cors from 'cors';
import express from 'express';
import apiRoute from './api';
import Logger from './lib/Logger';
import { createServer } from 'node:http';
import { PORT, HttpCodes } from './Constants';
import WebsocketMainter from './lib/wsHandler';
import { attachSession } from './api/middlewares';
import { createMongoConnection, createRedisConnection } from './lib';

(async (): Promise<void> => {
  await Promise.allSettled([createMongoConnection(), createRedisConnection()]);

  const app = express();
  const server = createServer(app);
  app.disable('etag');
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(cors(), express.json(), express.urlencoded({ extended: true }));
  app.use(attachSession);

  app.use('/api', apiRoute);
  app.get('/', (_, res) => res.sendStatus(HttpCodes.OK));
  new WebsocketMainter(server);

  server.listen(PORT, () => Logger.info(`Listening on port: ${PORT}`));

  process.on('unhandledRejection', (error: Error) =>
    Logger.error(`Unhandled Promise Rejection\nError: ${error.message || error}`)
  );
})();
