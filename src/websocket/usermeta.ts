import { prisma } from '../lib';

/**
 * @param id user Id
 * @returns Returns user metadata
 */
async function getUserMetadata(id: string) {
  const metadata = await prisma.groupUser.findMany({
    where: {
      userId: id
    },
    select: {
      // Get all groups which user has joined
      // has keys such as name, id, owner, messages
      group: {
        select: {
          name: true,
          id: true,
          owner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          },
          messages: {
            take: 25,
            select: {
              id: true,
              author: {
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
  // metadata has to be sent in format Record<string,any>[]
  // but prisma returns {group: Record<string,any>}[]
  return metadata.map((filter: Record<"group", unknown>) => filter.group);
}

export { getUserMetadata };
