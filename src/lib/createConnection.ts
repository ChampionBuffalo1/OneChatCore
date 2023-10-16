import Redis from 'ioredis';
import Logger from './Logger';
import { PrismaClient } from '@prisma/client';
import { redisURL, maxRetries, defaultDelay } from '../Constants';

const prisma = new PrismaClient();
prisma.$connect().then(() => Logger.info('Prisma client connected.'));

let redis: Redis | undefined = new Redis(redisURL, {
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > maxRetries) throw new Error('Maximum retry limit reached for redis.');
    return defaultDelay;
  }
})
  .on('connect', () => Logger.info('Redis client connected.'))
  .on('wait', () => Logger.info('Redis client is waiting for commands to establish connection.'))
  .on('end', () => {
    redis = undefined;
    Logger.info('Redis connection ended');
  })
  .on('error', err => {
    redis = undefined;
    Logger.error(err);
  });

export { redis, prisma };
