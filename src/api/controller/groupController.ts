import { Prisma, member } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { checkPermission, setPermission } from '../../lib/permissions';
import { cloudinaryUpload, errorResponse, paginatedParameters, prisma, successResponse } from '../../lib';

const BasicInfo = {
  id: true,
  name: true,
  iconUrl: true,
  owner: {
    select: {
      id: true,
      username: true,
      avatarUrl: true
    }
  },
  description: true
};
async function createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { name, description }: Record<string, string> = req.body;
  const authUserId = req.payload.userId;
  try {
    // Creates a group and adds owner as a member and assigns a administrator role
    const group = await prisma.$transaction(async tx => {
      const createInfo = await tx.group.create({
        data: {
          name,
          ownerId: authUserId,
          description: description || '',
          members: {
            create: {
              userId: authUserId,
              permissions: setPermission(0, 'ADMINISTRATOR')
            }
          }
        },
        select: {
          ...BasicInfo,
          members: {
            where: {
              userId: authUserId
            },
            select: { id: true },
            take: 1
          }
        }
      });
      const { members, ...group } = createInfo;
      return group;
    });

    req.socketPayload = {
      op: 'GROUP_CREATE',
      d: group
    };

    res.status(200).json(successResponse(group));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(400).json(
        errorResponse({
          param: 'name',
          code: 'RESOURCE_EXISTS',
          message: 'Group name is already taken'
        })
      );
      return;
    }
    next(err);
  }
}

async function leaveGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id;
  const authUserId = req.payload.userId;
  try {
    // The `id` of the member belonging in the group while ensuring the member isn't the owner
    const [data] = await prisma.$queryRaw<Pick<member, 'id'>[]>`
          SELECT m.id FROM "member" AS m 
          LEFT JOIN "group" AS g ON g.id = m."groupId" AND m."userId" = ${authUserId} 
          WHERE g."ownerId" <> ${authUserId} AND g.id = ${groupId}`;

    if (!data?.id) {
      // The current user is either the Owner of the group
      // or they're trying to leave that they're not part of
      // Either way they're not allowed to perform this action
      throw new Error('ACTION_NOT_ALLOWED', {
        cause: "You're not allowed to perform this action\nOnly non-owner group members can leave the group."
      });
    }
    const deletedMember = await prisma.member.delete({
      where: { id: data.id },
      select: {
        id: true,
        user: {
          select: { id: true, username: true }
        },
        group: {
          select: { id: true, name: true }
        }
      }
    });
    req.socketPayload = {
      d: deletedMember,
      op: 'GROUP_LEAVE'
    };
    res.status(200).json(deletedMember);
    next();
  } catch (err) {
    if (err instanceof Error && err.message === 'ACTION_NOT_ALLOWED') {
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

async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  const groupId = req.params.id;
  const authUserId = req.payload.userId;
  try {
    // Only the group owner can delete the group, none else (even with administrator role)
    const groupDelete = await prisma.group.delete({
      where: {
        id: groupId,
        ownerId: authUserId
      },
      select: { id: true, name: true }
    });
    req.socketPayload = {
      op: 'GROUP_DELETE',
      d: groupDelete
    };
    res.status(200).json(successResponse(groupDelete));
    next();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'ACTION_NOT_ALLOWED',
          message: 'Only the group owner can perform this operation.'
        })
      );
      return;
    }
    next(err);
  }
}

async function getGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.payload.userId;
  try {
    const [groups, meta] = await prisma.$transaction(async tx => {
      const total = await tx.member.count({
        where: { userId }
      });
      const { skip, take, currentPage, totalPages } = paginatedParameters(req.query.page as string, total);

      const groups = await tx.member.findMany({
        where: { userId },
        select: {
          id: true,
          group: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
              description: true
            }
          }
        },
        take,
        skip
      });
      return [
        groups,
        {
          totalRecords: total,
          currentPage,
          totalPages
        }
      ];
    });

    res.status(200).json(successResponse(groups, meta));
  } catch (err) {
    next(err);
  }
}

async function groupIconChange(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authUserId = req.payload.userId;
  const groupId = req.params.id;
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json(
        errorResponse({
          param: 'icon',
          code: 'FILE_NOT_FOUND',
          message: 'No file was provided for icon upload'
        })
      );
      return;
    }

    const url = prisma.$transaction(async tx => {
      const member = await tx.member.findFirstOrThrow({
        where: {
          groupId,
          userId: authUserId
        },
        select: {
          permissions: true
        }
      });

      if (!checkPermission(member.permissions, 'MANAGE_GROUP')) {
        throw new Error('INVALID_PERMISSION', {
          cause: "You don't have permissions required to change this resource."
        });
      }

      const secure_url = await cloudinaryUpload(file.path);
      await tx.group.update({
        where: { id: groupId },
        data: { iconUrl: secure_url }
      });
      return secure_url;
    });

    res.json(successResponse({ url }));
    req.socketPayload = {
      op: 'ICON_CHANGE',
      d: {
        url,
        id: groupId
      }
    };
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

export { getGroups, createGroup, leaveGroup, deleteGroup, groupIconChange };
