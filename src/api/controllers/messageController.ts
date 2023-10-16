import { Request, Response } from 'express';
import { prisma } from '../../lib';
import { broadcastUpdate } from '../../websocket/message';

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
  broadcastUpdate(groupId, {
    type: 'UPDATE',
    message
  })
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
  broadcastUpdate(groupId, {
    type: 'CREATE',
    message
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
  broadcastUpdate(groupId, {
    type: 'DELETE',
    message: deleted
  });
  res.send({
    deleted
  });
}

export { getMessage, createMessage, editMessage, deleteMessage };
