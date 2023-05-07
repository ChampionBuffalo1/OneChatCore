import { prisma } from "../lib";

async function getUserMetadata(id: string) {
  const metadata = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      username: true,
      Group: true
    }
  });
  return metadata;
}

export { getUserMetadata };
