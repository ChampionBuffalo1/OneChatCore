import './lib/db';
import cors from 'cors';
import 'dotenv-safe/config';
import apiRoute from './api';
import helmet from 'helmet';
import express from 'express';
import '@total-typescript/ts-reset';
import Logger from './lib/Logger';
import { PORT } from './Constants';
import { createServer } from 'node:http';
import { createSocketServer } from './websocket';
import { attachSession } from './api/middlewares';
import { errorResponse } from './lib/response';

(async (): Promise<void> => {
  const app = express();
  const server = createServer(app);
  app
    .disable('x-powered-by')
    .set('trust proxy', 1)
    .use(cors(), helmet(), express.json(), express.urlencoded({ extended: true }), attachSession);

  app.use('/api/v1', apiRoute);
  app.get('/', (_, res) => res.sendStatus(200));
  createSocketServer(server);
  app.all('*', (req, res) => {
    res.status(404).json(
      errorResponse({
        code: 'INVALID_ROUTE',
        message: `${req.method} ${req.url} route not found.`
      })
    );
  });

  server.listen(PORT, () => Logger.info(`Listening on port: ${PORT}`));

  process.on('unhandledRejection', (error: Error) =>
    Logger.error(`Unhandled Promise Rejection\nError: ${error.message || error}`)
  );
})();
