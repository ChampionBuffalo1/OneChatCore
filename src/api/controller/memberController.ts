import { Prisma } from '@prisma/client';
import { checkPermission } from '../../lib/permissions';
import type { Request, Response, NextFunction } from 'express';
import { errorResponse, paginatedParameters, prisma, successResponse } from '../../lib';

async function getGroupMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id;
  try {
    const [members, meta] = await prisma.$transaction(async tx => {
      const total = await tx.member.count({
        where: { groupId }
      });

      const { take, skip, totalPages, currentPage } = paginatedParameters(req.query.page as string, total);

      const members = await tx.member.findMany({
        where: { groupId },
        select: {
          group: { select: { id: true } },
          user: { select: { id: true, username: true, avatarUrl: true } }
        },
        skip,
        take
      });

      return [
        members,
        {
          currentPage,
          totalPages,
          totalRecords: total
        }
      ];
    });

    res.status(200).json(successResponse(members, meta));
  } catch (err) {
    next(err);
  }
}

async function changePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id,
    authUserId = req.payload.userId;
  const { userId, permissions } = req.body;
  try {
    const member = await prisma.$transaction(async tx => {
      const member = await tx.member.findFirstOrThrow({
        where: { userId: authUserId, groupId }
      });
      if (!checkPermission(member.permissions, 'CHANGE_PERMISSION')) {
        throw new Error('INSUFFICIENT_PERMISSION', {
          cause: "You do't have the permissions required to perform this action."
        });
      }
      // Only admins can give admin permission to others
      if (checkPermission(permissions, 'ADMINISTRATOR') && !checkPermission(member.permissions, 'ADMINISTRATOR')) {
        throw new Error('INSUFFICIENT_PERMISSION', {
          cause: 'Only admininistrators can give administrator permission to others.'
        });
      }

      const updatedMember = await tx.member.update({
        where: { id: userId },
        data: { permissions },
        select: {
          userId: true,
          permissions: true,
          group: {
            select: {
              id: true
            }
          }
        }
      });
      return updatedMember;
    });
    req.socketPayload = {
      op: 'PERM_EDIT',
      d: member
    };
    res.status(200).json(successResponse(member));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'INVALID_REQUEST',
          message: 'Group not found!'
        })
      );
      return;
    } else if (err instanceof Error && err.message === 'INSUFFICIENT_PERMISSION') {
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

async function getCurrentMemberPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.body.userId || req.payload.userId,
    groupId = req.params.id;
  try {
    const permission = await prisma.member.findFirstOrThrow({
      where: { userId, groupId },
      select: { id: true, permissions: true }
    });
    res.status(200).json(successResponse(permission));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'MEMBER_NOT_FOUND',
          message: 'User is not a part of this group.'
        })
      );
      return;
    }
    next(err);
  }
}

export { getGroupMembers, changePermission, getCurrentMemberPermission };
