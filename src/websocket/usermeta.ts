import { prisma } from '../lib';
const selectUser = {
  id: true,
  username: true,
  avatarUrl: true
};

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
            select: selectUser
          },
          messages: {
            take: 50,
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              sentBy: {
                select: selectUser
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
