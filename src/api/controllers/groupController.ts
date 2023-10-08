import { prisma } from '../../lib';
import { Request, Response } from 'express';
import { ERROR_CODES, HttpCodes } from '../../Constants';
import { deleteGroup } from '../../lib/helpers/groupHelper';

async function getGroup(req: Request, res: Response) {
  const data = await prisma.user.findFirst({
    where: {
      id: req.payload.data.userId!
    },
    include: {
      Group: true
    }
  });
  res.status(200).send(data);
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
  res.status(200).send(data);
}

async function removeGroup(req: Request, res: Response) {
  const groupId = req.body.groupId;
  const group = await deleteGroup(groupId);
  res.status(200).send(group);
}

// lol
async function leaveGroup(req: Request, res: Response) {
  res.status(200).send(req.body);
}

async function makeGroup(req: Request, res: Response) {
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
  return res.status(200).send({
    data
  });
}

export { getGroup, joinGroup, removeGroup, leaveGroup, makeGroup };
