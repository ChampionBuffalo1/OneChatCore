import 'dotenv-safe/config';
import cors from 'cors';
import express from 'express';
import apiRoute from './api';
import Logger from './utils/Logger';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createMongoConnection, createRedisConnection } from './utils';
import { PORT, isProd, cookieName, cookieSecret, HttpCodes, maxCookieAge } from './Constants';

(async (): Promise<void> => {
  await createMongoConnection();

  const app = express();
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
        // https://github.com/tj/connect-redis/issues/300#issuecomment-580038867
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
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

  app.listen(PORT, () => Logger.info(`Listening on port: ${PORT}`));

  process.on('unhandledRejection', error => {
    Logger.error(`Unhandled Promise Rejection\nError: ${(error as Error).message || error}`);
  });
})();
