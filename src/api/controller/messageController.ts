import { Prisma } from '@prisma/client';
import { checkPermission } from '../../lib/permissions';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse, paginatedParameters, prisma, successResponse } from '../../lib';

const messageInfo = {
  id: true,
  text: true,
  author: {
    select: {
      id: true,
      username: true,
      avatarUrl: true
    }
  },
  group: {
    select: {
      id: true,
      name: true,
      iconUrl: true,
      description: true
    }
  },
  createdAt: true,
  updatedAt: true
};

async function getMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id;
  try {
    const [messages, meta] = await prisma.$transaction(async tx => {
      const predicate = {
        groupId,
        createdAt: {
          gt: req.body.after,
          lt: req.body.before
        }
      };
      const total = await tx.message.count({ where: predicate });
      const { take, skip, currentPage, totalPages } = paginatedParameters(req.query.page as string, total);
      const message = await tx.message.findMany({
        select: messageInfo,
        where: predicate,
        take,
        skip
      });
      return [
        message,
        {
          currentPage,
          totalPages,
          totalRecords: total
        }
      ];
    });

    res.status(200).json(successResponse(messages, meta));
  } catch (err) {
    next(err);
  }
}
async function editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id,
    userId = req.payload.userId;
  const { id, text } = req.body;
  try {
    const message = await prisma.$transaction(async tx => {
      const member = await tx.member.findFirst({
        where: { userId, groupId },
        select: { permissions: true }
      });
      if (!member) {
        throw new Error('INVALID_REQUEST', {
          cause: 'Invalid group id'
        });
      }

      if (!checkPermission(member.permissions, 'WRITE_MESSAGES')) {
        throw new Error('INVALID_PERMISSION', {
          cause: "You don't have permission required to send messages to the group"
        });
      }

      const message = await tx.message.update({
        where: { id },
        data: { text },
        select: messageInfo
      });
      return message;
    });

    req.socketPayload = {
      op: 'MESSAGE_EDIT',
      d: message
    };
    res.status(200).json(successResponse(message));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'INVALID_MESSAGE',
          message: 'No message with the given id were found.'
        })
      );
      return;
    } else if (err instanceof Error) {
      res.status(400).json(
        errorResponse({
          code: err.message,
          message: err.cause as string
        })
      );
      return;
    }
    next(err);
  }
}

async function createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id,
    userId = req.payload.userId;
  const { text } = req.body;
  try {
    const message = await prisma.$transaction(async tx => {
      const member = await tx.member.findFirstOrThrow({
        where: { userId, groupId },
        select: { permissions: true }
      });
      if (!checkPermission(member.permissions, 'WRITE_MESSAGES')) {
        throw new Error('INVALID_PERMISSION', {
          cause: "You don't have permission required to send messages to the group"
        });
      }

      const message = await tx.message.create({
        data: {
          text,
          userId,
          groupId
        },
        select: messageInfo
      });
      return message;
    });

    req.socketPayload = {
      op: 'MESSAGE_CREATE',
      d: message
    };
    res.status(200).json(successResponse(message));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'INVALID_REQUEST',
          // No group of which current member is an member of
          message: 'Group not found!'
        })
      );
      return;
    } else if (err instanceof Error) {
      res.status(400).json(
        errorResponse({
          code: err.message,
          message: err.cause as string
        })
      );
      return;
    }
    next(err);
  }
}

async function deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = req.params.message_id;
  try {
    const deletedMessage = await prisma.message.delete({
      where: { id },
      select: messageInfo
    });
    req.socketPayload = {
      op: 'MESSAGE_DELETE',
      d: deletedMessage
    };
    res.status(200).json(successResponse(deletedMessage));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'INVALID_MESSAGE',
          message: 'Invalid message id'
        })
      );
      return;
    }
    next(err);
  }
}

export { getMessage, createMessage, editMessage, deleteMessage };
