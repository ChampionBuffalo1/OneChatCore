import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info']
});

prisma.$connect();

export { prisma };
