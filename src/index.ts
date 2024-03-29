import cors from 'cors';
import 'dotenv-safe/config';
import apiRoute from './api';
import helmet from 'helmet';
import express from 'express';
import Logger from './lib/Logger';
import { PORT } from './Constants';
import '@total-typescript/ts-reset';
import { createServer } from 'node:http';
import responseTime from 'response-time';
import { errorResponse } from './lib/response';
import { createSocketServer } from './websocket';
import { attachSession } from './api/middlewares';
import { metricHandler, responseTimeMetric } from './metrics';
import { prismaHandler, unknownHandler } from './api/middlewares/error';

(async (): Promise<void> => {
  const app = express();
  const server = createServer(app);
  app
    .disable('x-powered-by')
    .set('trust proxy', 1)
    .use(
      helmet(),
      cors(),
      express.json({ limit: '2mb' }),
      express.urlencoded({ extended: true, limit: '100kb' }),
      attachSession,
      responseTime((req, _res, time) => {
        responseTimeMetric
          .labels({
            route: req.url,
            method: req.method,
            status_code: req.statusCode
          })
          .observe(time);
      })
    );

  app.use('/api/v1', apiRoute);
  // TODO: protect route for only authorized prom server access
  app.get('/metrics', metricHandler);

  app.get('/', (_, res) => res.sendStatus(200));
  createSocketServer(server);
  // Error handler middlewares
  app.use(prismaHandler, unknownHandler);
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
