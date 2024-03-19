import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse, prisma, successResponse } from '../../lib';
import { checkPermission, setPermission } from '../../lib/permissions';

async function createInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.body.groupId,
    authUserId = req.payload.userId;

  try {
    const invite = await prisma.$transaction(async tx => {
      const me = await tx.member.findFirstOrThrow({
        where: {
          groupId,
          userId: authUserId
        },
        select: {
          id: true,
          permissions: true
        }
      });

      if (!checkPermission(me.permissions, 'INVITE_MEMBER')) {
        throw new Error('ACTION_NOT_ALLOWED', {
          cause: "You don't have permission to perform this action"
        });
      }

      const invite = await tx.invite.create({
        data: {
          groupId,
          inviterId: me.id,
          limit: req.body.limit || null,
          expiresAt: req.body.expiresAt || null
        }
      });
      return invite;
    });

    const response = {
      token: invite.id,
      limit: invite.limit,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt
    };

    res.status(200).json(successResponse(response));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'MEMBER_NOT_FOUND',
          message: 'You are not in present in the group'
        })
      );
      return;
    } else if (err instanceof Error && err.message === 'ACTION_NOT_ALLOWED') {
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
async function useInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  const inviteId = req.params.id;
  const authUserId = req.payload.userId;
  try {
    const member = await prisma.$transaction(async tx => {
      const invite = await tx.invite.findFirstOrThrow({
        where: { id: inviteId }
      });

      if ((invite.limit && invite.limit === 0) || (invite.expiresAt && new Date(invite.expiresAt) >= new Date())) {
        await tx.invite.delete({ where: { id: inviteId } });
        throw new Error('INVITE_EXPIRED', {
          cause: 'Invite has been expired.'
        });
      }
      const alreadyExists = await tx.member.findFirst({
        where: { userId: authUserId, groupId: invite.groupId },
        select: { id: true }
      });
      if (alreadyExists?.id) {
        throw new Error('UNAUTHORIZED', {
          cause: "You are trying to join a group you're already part of!"
        });
      }

      const member = await tx.member.create({
        data: {
          groupId: invite.groupId,
          userId: authUserId,
          permissions: setPermission(0, ['READ_MESSAGES', 'WRITE_MESSAGES'])
        },
        select: {
          id: true,
          group: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
              description: true
            }
          },
          user: { select: { id: true, username: true } }
        }
      });

      if (member.id) {
        await tx.invite.update({
          where: { id: inviteId },
          data: {
            limit: {
              decrement: 1
            }
          }
        });
      }
      return member;
    });

    req.socketPayload = {
      op: 'GROUP_JOIN',
      d: member
    };
    res.status(200).json(successResponse(member));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(200).json(
        errorResponse({
          code: 'INVALID_INVITE',
          message: 'Invite not found.'
        })
      );
      return;
    } else if (err instanceof Error && err.cause === 'INVITE_EXPIRED') {
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

export { createInvite, useInvite };
