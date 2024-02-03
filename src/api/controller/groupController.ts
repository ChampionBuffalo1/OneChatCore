import { Prisma, member } from '@prisma/client';
import { setPermission } from '../../lib/permissions';
import type { NextFunction, Request, Response } from 'express';
import { errorResponse, prisma, successResponse } from '../../lib';

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
              userId: authUserId
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

      // Creating the admin role giving it to the first member (aka the person who created it)
      await tx.role.create({
        data: {
          name: 'Administrator',
          permissions: setPermission(0, 'ADMINISTRATOR'),
          member: {
            connect: {
              id: members[0].id
            }
          }
        }
      });

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

const BasicInfo = {
  id: true,
  name: true,
  owner: {
    select: {
      id: true,
      username: true,
      avatarUrl: true
    }
  },
  description: true
};
export { createGroup, leaveGroup, deleteGroup };
