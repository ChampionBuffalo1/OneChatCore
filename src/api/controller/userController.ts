import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { bcryptSaltRounds } from '../../Constants';
import { Logger, prisma, generateJwt, errorResponse, successResponse } from '../../lib';

const responseStruct = {
  id: true,
  username: true,
  createdAt: true,
  avatarUrl: true
};

async function loginUser(req: Request, res: Response): Promise<void> {
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
      res.status(400).json(
        errorResponse({
          message: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        })
      );
      return;
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
    }
    Logger.error(err);
    res.status(500).json(
      errorResponse({
        code: 'SERVICE_ERROR',
        message: 'Internal Service Error'
      })
    );
  }
}

async function signupUser(req: Request, res: Response): Promise<void> {
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
    Logger.error(err);
    res.status(500).json(
      errorResponse({
        code: 'SERVICE_ERROR',
        message: 'Internal Service Error'
      })
    );
  }
}

async function getSelf(req: Request, res: Response) {
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
    Logger.error(err);
    res.status(500).json(
      errorResponse({
        code: 'SERVICE_ERROR',
        message: 'Internal Service Error'
      })
    );
  }
}

type updateKeys = 'avatarUrl' | 'passwordHash' | 'username';
async function userEdit(req: Request, res: Response): Promise<void> {
  const keys = Object.keys(req.body);
  try {
    await prisma.user.findFirstOrThrow({
      where: {
        id: req.payload.userId
      }
    });
    const updatedUser: Partial<Record<updateKeys, string>> = {};
    for (const key of keys) {
      switch (key) {
        case 'avatarUrl': {
          updatedUser['avatarUrl'] = req.body.avatarUrl;
          break;
        }
        case 'username': {
          const username: string = req.body.username;
          const otherUser = await prisma.user.count({ where: { username } });
          if (otherUser !== 0) {
            res.status(400).json(
              errorResponse({
                param: 'username',
                code: 'RESOURCE_EXISTS',
                message: 'Username already taken.'
              })
            );
            return;
          } else {
            updatedUser['username'] = username;
          }
          break;
        }
        case 'password': {
          const passwordHash = await bcrypt.hash(req.body.password, bcryptSaltRounds);
          updatedUser['passwordHash'] = passwordHash;
          break;
        }
      }
    }

    const data = await prisma.user.update({
      where: {
        id: req.payload.userId
      },
      data: updatedUser,
      select: responseStruct
    });
    res.status(200).json(successResponse(data));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return;
    }
    Logger.error(err);
    res.status(500).json(
      errorResponse({
        code: 'SERVICE_ERROR',
        message: 'Internal Service Error'
      })
    );
  }
}

async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.delete({
      where: {
        id: req.payload.userId
      },
      select: responseStruct
    });
    res.status(200).json(successResponse(user));
  } catch (err) {
    Logger.error(err);
    res.status(500).json(
      errorResponse({
        code: 'SERVICE_ERROR',
        message: 'Internal Service Error'
      })
    );
  }
}

export { loginUser, signupUser, getSelf, userEdit, deleteUser };
