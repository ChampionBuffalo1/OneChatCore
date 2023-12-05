import { prisma } from '../../lib';
import { Request, Response } from 'express';
import { broadcastUpdate } from '../../websocket/message';

async function getGroup(req: Request, res: Response) {
  const group = await prisma.groupUser.findFirst({
    where: {
      userId: req.payload.data.userId
    },
    select: {
      group: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  res.send({ group });
}

async function editGroup(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const { name } = req.body;
  const group = await prisma.group.update({
    where: {
      id: groupId
    },
    data: {
      name
    },
    select: {
      id: true,
      name: true
    }
  });
  broadcastUpdate(groupId, {
    type: 'G_UPDATE',
    message: group
  });
  res.json(group);
}

async function joinGroup(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const userId = req.payload.data.userId!;

  const existingMembership = await prisma.groupUser.findFirst({
    where: {
      groupId,
      userId
    }
  });

  if (existingMembership) {
    res.status(400).send({ error: 'User is already a member of the group.' });
    return;
  }

  const group = await prisma.groupUser.create({
    data: {
      userId,
      groupId
    },
    select: {
      // This code is duplicated from getUserMetadata in src/websocket/usermeta.ts
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
            orderBy: {
              createdAt: 'desc'
            },
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

  res.json(group);
}

async function deleteGroup(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const userId = req.payload.data.userId!;

  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      owner: {
        id: userId
      }
    },
    select: {
      id: true,
      name: true,
      owner: {
        select: {
          id: true
        }
      }
    }
  });
  if (!group) {
    res.status(404).send({
      error: 'group not found'
    });
    return;
  }
  await prisma.groupUser.deleteMany({
    where: {
      groupId: groupId
    }
  });
  await prisma.group.delete({
    where: {
      id: groupId
    }
  });
  broadcastUpdate(groupId, {
    type: 'G_DELETE',
    message: group
  });

  res.send({ group });
}

async function leaveGroup(req: Request, res: Response) {
  const userId = req.payload.data.userId!;
  const groupId = req.params.groupId;

  const groupRel = await prisma.groupUser.findFirst({
    where: {
      groupId: groupId,
      userId: userId
    },
    select: {
      id: true,
      group: {
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });
  if (!groupRel) {
    res.status(404).send({
      error: 'group not found'
    });
    return;
  }

  if (groupRel.group.owner.id === userId) {
    return deleteGroup(req, res);
  }

  const removed = await prisma.groupUser.delete({
    where: { id: groupRel.id }
  });

  res.json({
    groupId: removed.groupId
  });
}

async function createGroup(req: Request, res: Response) {
  const { name } = req.body;
  const data = await prisma.group.create({
    data: {
      name,
      owner: {
        connect: {
          id: req.payload.data.userId
        }
      },
      members: {
        create: {
          user: {
            connect: {
              id: req.payload.data.userId
            }
          }
        }
      }
    },
    select: {
      name: true,
      owner: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      messages: true,
      id: true
    }
  });
  return res.send({
    data
  });
}

export { getGroup, joinGroup, deleteGroup, leaveGroup, createGroup, editGroup };
