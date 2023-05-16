import { prisma } from '../lib';

async function getUserMetadata(id: string) {
  const metadata = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      username: true,      
      Group: {
        select: {
          id: true,
          messages: {
            // Get last 100 messages
            take: 100
          }
        }
      }
    }
  });
  return metadata;
}

export { getUserMetadata };
