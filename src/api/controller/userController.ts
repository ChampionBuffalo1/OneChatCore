import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { bcryptSaltRounds } from '../../Constants';
import type { NextFunction, Request, Response } from 'express';
import { prisma, generateJwt, errorResponse, successResponse, cloudinaryUpload } from '../../lib';

const responseStruct = {
  id: true,
  username: true,
  createdAt: true,
  avatarUrl: true
};

async function loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { username, password } = req.body;
  try {
    const userInfo = await prisma.user.findFirstOrThrow({
      where: {
        username
      },
      select: { ...responseStruct, passwordHash: true }
    });

    const { passwordHash, ...data } = userInfo;

    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS', {
        cause: 'Invalid username or password'
      });
    }
    const access_token = generateJwt({
      userId: data.id
    });
    res.status(200).json(successResponse(data, { access_token }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          param: 'username',
          code: 'INVALID_USERNAME',
          message: 'Username not found.'
        })
      );
      return;
    } else if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
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

async function signupUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { username, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, bcryptSaltRounds);
    const data = await prisma.user.create({
      data: {
        username,
        passwordHash
      },
      select: responseStruct
    });
    const access_token = generateJwt({ userId: data.id });
    res.status(200).json(successResponse(data, { access_token }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(400).json(
        errorResponse({
          param: 'username',
          code: 'RESOURCE_EXISTS',
          message: 'Username already taken.'
        })
      );
      return;
    }
    next(err);
  }
}

async function getSelf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findFirstOrThrow({
      where: {
        id: req.payload.userId
      },
      select: responseStruct
    });

    res.status(200).jsonp(successResponse(user));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(400).json(
        errorResponse({
          code: 'INVALID_CREDENTIALS',
          message: 'Your account was not found.'
        })
      );
      return;
    }
    next(err);
  }
}

type updateKeys = 'passwordHash' | 'username';
async function userEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const keys = Object.keys(req.body);
  try {
    if (keys.length === 0) throw new Error('NO_KEYS');
    const updatedUser: Partial<Record<updateKeys, string>> = {};
    if (keys.includes('username')) {
      updatedUser['username'] = req.body.username;
    }
    if (keys.includes('password')) {
      updatedUser['passwordHash'] = await bcrypt.hash(req.body.password, bcryptSaltRounds);
    }
    const data = await prisma.user.update({
      where: { id: req.payload.userId },
      data: updatedUser,
      select: responseStruct
    });
    res.status(200).json(successResponse(data));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        res.status(400).json(
          errorResponse({
            code: 'INVALID_CREDENTIALS',
            message: 'Your account was not found.'
          })
        );
        return;
      } else if (err.code === 'P2002') {
        res.status(400).json(
          errorResponse({
            param: 'username',
            code: 'RESOURCE_EXISTS',
            message: 'Username already taken.'
          })
        );
        return;
      }
    } else if (err instanceof Error && err.message === 'NO_KEYS') {
      res.status(400).json(
        errorResponse({
          code: 'NO_DATA',
          message: 'Request body must have either name or description keys'
        })
      );
      return;
    }
    next(err);
  }
}

async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.delete({
      where: {
        id: req.payload.userId
      },
      select: responseStruct
    });
    res.status(200).json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

async function userAvatarUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authUserId = req.payload.userId;
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json(
        errorResponse({
          param: 'avatar',
          code: 'FILE_NOT_FOUND',
          message: 'No file was provided for avatar upload'
        })
      );
      return;
    }
    const secure_url = await cloudinaryUpload(file.path);

    await prisma.user.update({
      where: { id: authUserId },
      data: { avatarUrl: secure_url }
    });

    res.json(successResponse({ url: secure_url }));
  } catch (err) {
    next(err);
  }
}

export { loginUser, signupUser, getSelf, userEdit, deleteUser, userAvatarUpload };
