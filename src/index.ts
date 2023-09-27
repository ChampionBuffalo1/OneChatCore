import 'dotenv-safe/config';
import './lib/createConnection';
import '@total-typescript/ts-reset';
import cors from 'cors';
import apiRoute from './api';
import express from 'express';
import Logger from './lib/Logger';
import { createServer } from 'node:http';
import { PORT, HttpCodes } from './Constants';
import { createSocketServer } from './websocket';
import { attachSession } from './api/middlewares';

(async (): Promise<void> => {
  const app = express();
  const server = createServer(app);
  app.disable('etag');
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(cors(), express.json(), express.urlencoded({ extended: true }));
  app.use(attachSession);

  app.use('/api', apiRoute);
  app.get('/', (_, res) => res.sendStatus(HttpCodes.OK));
  createSocketServer(server);

  server.listen(PORT, () => Logger.info(`Listening on port: ${PORT}`));

  process.on('unhandledRejection', (error: Error) =>
    Logger.error(`Unhandled Promise Rejection\nError: ${error.message || error}`)
  );
})();
