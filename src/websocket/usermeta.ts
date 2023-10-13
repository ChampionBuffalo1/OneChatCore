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
          name: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          },
          messages: {
            take: 50,
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              sentBy: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true
                }
              },
              text: true
            }
          }
        }
      }
    }
  });
  return metadata;
}

export { getUserMetadata };
