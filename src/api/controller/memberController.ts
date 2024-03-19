import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import { removePermission, setPermission } from '../../lib/permissions';
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
    userId = req.payload.userId;
  const { permissions } = req.body;
  try {
    const member = await prisma.$transaction(async tx => {
      const member = await tx.member.findFirstOrThrow({
        where: { userId, groupId }
      });
      let newPermission = member.permissions;

      for (const { method, permission } of permissions) {
        if (method === 'add') {
          newPermission = setPermission(newPermission, permission);
        } else if (method === 'remove') {
          newPermission = removePermission(newPermission, permission);
        }
      }

      const updatedMember = await tx.member.update({
        where: { id: member.id },
        data: { permissions: newPermission },
        select: {
          id: true,
          permissions: true
        }
      });
      return updatedMember;
    });
    res.status(200).json(successResponse(member));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'INVALID_REQUEST',
          message: 'Group not found!'
        })
      );
      return;
    }
    next(err);
  }
}

async function getCurrentMemberPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.payload.userId,
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
          message: 'You are not a part of this group.'
        })
      );
      return;
    }
    next(err);
  }
}

export { getGroupMembers, changePermission, getCurrentMemberPermission };
