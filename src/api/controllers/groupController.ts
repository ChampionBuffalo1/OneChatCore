import { prisma } from '../../lib';

const createGroup = async (ownerId: string, name: string, description?: string) => {
  const data = await prisma.group.create({
    data: {
      name,
      description,
      createdBy: {
        connect: {
          id: ownerId
        }
      }
    },
    include: {
      createdBy: true
    }
  });
  return data;
};

const deleteGroup = async (groupId: string) => {
  const data = await prisma.group.delete({
    where: {
      id: groupId
    }
  });
  return data;
};

// const updateGroup = () => {};

export { createGroup, deleteGroup };
