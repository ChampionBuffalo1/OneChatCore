import { prisma } from '../lib';

/**
 * @param id user Id
 * @returns Returns user metadata
 */
async function getUserMetadata(id: string) {
  const metadata = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      username: true,
      // Get all groups which user has joined
      // has keys such as name, id, owner, messages
      groups: {
        include: {
          group: {
            select: {
              name: true,
              id: true,
              owner: {
                select: {
                  username: true,
                  avatarUrl: true
                }
              },
              // Last 25 messages from each group
              messages: {
                take: 25,
                orderBy: {
                  createdAt: 'desc'
                },
                select: {
                  id: true,
                  author: {
                    select: {
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
      }
    }
  });
  return metadata;
}

export { getUserMetadata };
