import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info']
});
// connecting immediately to counter cold starts
prisma.$connect();

export { prisma };
