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
  new Promise((resolve, reject) => {
    if (!DbInstance) {
      const client = new MongoClient(mongoURL, {
        family: 4,
        maxPoolSize: 100,
        retryWrites: true,
        connectTimeoutMS: 1000 * 10,
        keepAlive: true,
        keepAliveInitialDelay: MINUTE * 2
      });

      client.connect().catch(reject);
      client.on('connectionCreated', () => {
        DbInstance = client.db(databaseName);
        // Reset incase error occurs
        retryCount = 1;
        resolve();
      });
      client.on('error', err => {
        // Incase the error occurs after connection establishment
        DbInstance = undefined;

        retryCount++;
        Logger.error(err.toString());
        Logger.debug(`MongoDB connection failure count: ${retryCount}`);
        if (retryCount > maxRetries) reject('Maximum mongo re-connect tries exceeded.');

        const retryTime = expBackOff(retryCount);
        // Retry after some time
        setTimeout(createMongoConnection, retryTime);
        Logger.info(`Re-connecting to MongoDB in ${retryTime / MINUTE} minutes.`);
      });
    } else {
      resolve();
    }
  });

export { createMongoConnection, createRedisConnection, DbInstance };
