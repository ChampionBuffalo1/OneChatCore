import { prisma } from '../../lib';
import { Request, Response } from 'express';
import { ERROR_CODES, HttpCodes } from '../../Constants';

async function getGroup(req: Request, res: Response) {
  const data = await prisma.user.findFirst({
    where: {
      id: req.payload.data.userId!
    },
    include: {
      Group: true
    }
  });
  res.send(data);
}

async function joinGroup(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const data = await prisma.user.update({
    where: {
      id: req.payload.data.userId!
    },
    data: {
      Group: {
        connect: {
          id: groupId
        }
      }
    },
    include: {
      Group: true
    }
  });
  res.send(data);
}

async function deleteGroup(req: Request, res: Response) {
  const groupId = req.body.groupId;
  const group = await prisma.group.delete({
    where: {
      id: groupId
    }
  });
  res.send({ group });
}

async function leaveGroup(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const group = await prisma.user.update({
    where: {
      id: req.payload.data.userId!
    },
    data: {
      Group: {
        disconnect: {
          id: groupId
        }
      }
    },
    select: {
      id: true
    }
  });
  res.send({
    group
  });
}

async function createGroup(req: Request, res: Response) {
  const name = req.body.name;
  if (!name) {
    return res.status(HttpCodes.NOT_ACCEPTABLE).send({
      code: ERROR_CODES.INCOMPLETE_FORM,
      message: 'name was missing in req body'
    });
  }
  const data = await prisma.group.create({
    data: {
      name,
      userId: req.payload.data.userId!
    },
    select: {
      name: true,
      createdBy: {
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

export { getGroup, joinGroup, deleteGroup, leaveGroup, createGroup };
