import Redis from 'ioredis';
import Logger from './Logger';
import { expBackOff } from './utils';
import { Db, MongoClient } from 'mongodb';
import { mongoURL, redisURL, MINUTE, maxRetries, defaultDelay, databaseName } from '../Constants';

let retryCount = 1;
let redis: Redis | undefined;
let DbInstance: Db | undefined;

const createRedisConnection = (): Promise<Redis> =>
  new Promise((resolve, reject) => {
    if (!redis) {
      const _redis = new Redis(redisURL, {
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > maxRetries) reject('Maximum retry limit reached for redis.');
          return defaultDelay;
        }
      })
        .on('connect', () => {
          Logger.info('Redis client connected.');
          redis = _redis;
          resolve(redis);
        })
        .on('wait', () => {
          Logger.info('Redis client is waiting for commands to establish connection.');
          redis = _redis;
          resolve(redis);
        })
        .on('end', () => {
          redis = undefined;
        })
        .on('error', err => Logger.error(err));
    } else {
      resolve(redis);
    }
  });
const createMongoConnection = (): Promise<void> =>
  new Promise(resolve => {
    if (!DbInstance) {
      const client = new MongoClient(mongoURL, {
        family: 4,
        maxPoolSize: 100,
        retryWrites: true,
        connectTimeoutMS: 1000 * 10,
        heartbeatFrequencyMS: 1000 * 30,
        keepAlive: true,
        keepAliveInitialDelay: MINUTE
      });
      // Cannot keep the server alive without having the connection to mongodb
      if (retryCount > maxRetries) process.exit(0)
      client.connect().catch(handleError);
      client.on('connectionReady', () => {
        DbInstance = client.db(databaseName);
        // Reset retry count once the connection has established
        retryCount = 1;
        resolve();
      });
      client.on('serverHeartbeatFailed', handleError);
      // Called on `client#close()` but this listener might be useless because client isn't exposed outside 
      client.on('serverClosed', () => Logger.info('Connection to mongodb has been closed.'));
      client.on('error', (error: Error) => Logger.error(`Mongodb error: ${error.message || error}`));
    } else {
      resolve();
    }
  });

export { createMongoConnection, createRedisConnection, DbInstance };

function handleError(err: Error & { code: number }) {
  // Authentication error
  if (err.code === 18) return;
  // Incase the error occurs after connection establishment
  DbInstance = undefined;
  retryCount++;
  Logger.error(err.toString());
  Logger.debug(`MongoDB connection failure count: ${retryCount - 1}`);

  const retryTime = expBackOff(retryCount);
  setTimeout(createMongoConnection, retryTime);
  Logger.info(`Re-connecting to MongoDB in ${retryTime} seconds.`);
}
