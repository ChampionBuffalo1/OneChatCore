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
          channels: {
            select: {
              id: true,
              messages: {
                take: 50
              }
            }
          }
        }
      }
    }
  });
  return metadata;
}

export { getUserMetadata };
