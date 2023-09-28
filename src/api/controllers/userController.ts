import bcrypt from 'bcrypt';
import Logger from '../../lib/Logger';
import { Request, Response } from 'express';
import { PasswordSchema, generateJwt } from '../../lib';
import { verifyUser } from '../../lib/helpers/userHelper';
import { IntegrityFailure, InvalidCredential } from '../errors/ValidationErrors';
import { HttpCodes, ERROR_CODES, bcryptSaltRounds } from '../../Constants';

import { authBody } from '../../lib/validators/auth';
import { DatabaseError, InvalidUsername } from '../errors';
import { createUser, hasUsername } from '../../lib/helpers/userHelper';

async function loginUser(req: Request, res: Response) {
  const bodyParse = await authBody.spa(req.body);
  if (bodyParse.success) {
    const { username, password } = bodyParse.data;
    try {
      const userId = await verifyUser(username, password);

      const token = await generateJwt({
        data: {
          userId
        }
      });

      res.status(HttpCodes.OK).send({
        token
      });
    } catch (err) {
      if (err instanceof InvalidCredential || err instanceof IntegrityFailure) {
        res.status(HttpCodes.FORBIDDEN).send({
          code: ERROR_CODES.INVALID_CRED,
          message: err.message
        });
      }
      // Jwt.sign can throw error
      if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError') {
        res.status(HttpCodes.INTERNAL_ERROR).send({
          code: HttpCodes.INTERNAL_ERROR,
          message: 'Token Signing Error'
        });
      }
      Logger.error(`Login Error: ${(err as Error).message}`);
    }
  } else {
    res.status(HttpCodes.BAD_REQUEST).send({
      code: ERROR_CODES.ZOD_ERROR,
      message: bodyParse.error.flatten().fieldErrors
    });
  }
}

async function signupUser(req: Request, res: Response) {
  const bodyParse = await authBody.spa(req.body);
  if (bodyParse.success) {
    const { username, password } = bodyParse.data;
    try {
      if (await hasUsername(username)) {
        res.status(HttpCodes.NOT_ACCEPTABLE).send({
          code: ERROR_CODES.USERNAME_ALREADY_TAKEN,
          message: 'Username already taken'
        });
        return;
      }

      const passmatch = await PasswordSchema.spa(password);
      if (!passmatch.success) {
        res.status(HttpCodes.NOT_ACCEPTABLE).send({
          code: ERROR_CODES.ZOD_ERROR,
          message: passmatch.error
        });
        return;
      }

      const hashPass = await bcrypt.hash(password, bcryptSaltRounds);
      const userId = await createUser(username, hashPass);

      res.status(HttpCodes.OK).send({
        token: await generateJwt({
          data: {
            userId
          }
        })
      });
    } catch (err) {
      if (err instanceof InvalidUsername) {
        res.status(HttpCodes.BAD_REQUEST).send({
          code: ERROR_CODES.INVALID_USERNAME,
          name: 'Invalid username',
          message: `${username} is not a valid username`
        });
      } else if (err instanceof DatabaseError) {
        Logger.error(`Database error at Signup route: ${(err as Error).message}`);
        res.status(HttpCodes.INTERNAL_ERROR).send({
          code: HttpCodes.INTERNAL_ERROR,
          name: 'Internal error',
          message: 'The server was unable to process the request.'
        });
      } else if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError') {
        res.status(HttpCodes.INTERNAL_ERROR).send({
          code: HttpCodes.INTERNAL_ERROR,
          name: 'Token Signing Error'
        });
      } else {
        Logger.error(`Singup Route error: ${(err as Error).message}`);
      }
    }
  } else {
    res.status(HttpCodes.BAD_REQUEST).send({
      code: ERROR_CODES.ZOD_ERROR,
      message: bodyParse.error.flatten().fieldErrors
    });
  }
}

export { loginUser, signupUser };
