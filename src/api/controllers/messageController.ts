import { Request, Response } from 'express';
import { prisma } from '../../lib';

async function getMessage(req: Request, res: Response) {
  const { id, before, after, limit } = req.body;
  const groupId = req.params.groupId;
  const messages = await prisma.message.findMany({
    where: {
      id,
      groupId,
      createdAt: {
        lte: before && new Date(before),
        gte: after && new Date(after)
      }
    },
    take: Math.min(limit || 100, 50),
    select: {
      id: true,
      text: true,
      sentBy: {
        select: {
          id: true,
          avatarUrl: true,
          username: true
        }
      },
      groupId: true,
      createdAt: true
    }
  });
  res.send({
    messages
  });
}

async function editMessage(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const { id, text } = req.body;
  const message = await prisma.message.update({
    where: {
      id,
      groupId
    },
    data: {
      text
    },
    select: {
      id: true,
      text: true
    }
  });
  res.send({
    message
  });
}

async function createMessage(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const { text } = req.body;
  const message = await prisma.message.create({
    data: {
      text,
      groupId,
      userId: req.payload.data.userId!
    },
    select: {
      id: true,
      text: true,
      sentBy: {
        select: {
          id: true,
          avatarUrl: true,
          username: true
        }
      },
      groupId: true
    }
  });
  res.send({
    message
  });
}

async function deleteMessage(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const { id } = req.body;

  const deleted = await prisma.message.delete({
    where: {
      id,
      groupId,
      userId: req.payload.data.userId!
    },
    select: {
      id: true
    }
  });
  res.send({
    deleted
  });
}

export { getMessage, createMessage, editMessage, deleteMessage };
