import Logger from './Logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => Logger.info('Prisma client connected.'))
  .catch(err => {
    Logger.error(`Connection to database failed with error: ${err}`);
  });

export { prisma };
