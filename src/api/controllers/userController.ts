import bcrypt from 'bcrypt';
import Logger from '../../lib/Logger';
import { Request, Response } from 'express';
import { verifyUser } from '../../lib/helpers/userHelper';
import { InvalidCredential } from '../errors/ValidationErrors';
import { PasswordSchema, generateJwt, sendResponse } from '../../lib';
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

      res.status(HttpCodes.OK).send(
        sendResponse({
          sucess: true,
          token
        })
      );
    } catch (err) {
      if (err instanceof InvalidCredential) {
        res.status(HttpCodes.FORBIDDEN).send(
          sendResponse(
            {
              code: ERROR_CODES.INVALID_CRED,
              name: err.message
            },
            true
          )
        );
      }
      // Jwt.sign can throw error
      if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError') {
        res.status(HttpCodes.INTERNAL_ERROR).send(
          sendResponse(
            {
              code: HttpCodes.INTERNAL_ERROR,
              name: 'Token Signing Error'
            },
            true
          )
        );
      }
      Logger.error(`Login Error: ${(err as Error).message}`);
    }
  } else {
    res.status(HttpCodes.BAD_REQUEST).send(sendResponse(bodyParse.error.flatten().fieldErrors, true));
  }
}

async function signupUser(req: Request, res: Response) {
  const bodyParse = await authBody.spa(req.body);
  if (bodyParse.success) {
    const { username, password } = bodyParse.data;
    try {
      if (await hasUsername(username)) {
        res.status(HttpCodes.NOT_ACCEPTABLE).send(
          sendResponse(
            {
              code: ERROR_CODES.USERNAME_ALREADY_TAKEN,
              name: 'Username already taken'
            },
            true
          )
        );
        return;
      }

      const passmatch = await PasswordSchema.spa(password);
      if (!passmatch.success) {
        res.status(HttpCodes.NOT_ACCEPTABLE).send(
          sendResponse(
            {
              code: ERROR_CODES.ZOD_ERROR,
              name: passmatch.error
            },
            true
          )
        );
        return;
      }

      const hashPass = await bcrypt.hash(password, bcryptSaltRounds);
      const userId = await createUser(username, hashPass);

      res.status(HttpCodes.OK).send(
        sendResponse({
          success: true,
          token: await generateJwt({
            data: {
              userId
            }
          })
        })
      );
    } catch (err) {
      if (err instanceof InvalidUsername) {
        res.status(HttpCodes.BAD_REQUEST).send(
          sendResponse(
            {
              code: ERROR_CODES.INVALID_USERNAME,
              name: 'Invalid username',
              message: `${username} is not a valid username`
            },
            true
          )
        );
      } else if (err instanceof DatabaseError) {
        Logger.error(`Database error at Signup route: ${(err as Error).message}`);
        res.status(HttpCodes.INTERNAL_ERROR).send(
          sendResponse(
            {
              code: HttpCodes.INTERNAL_ERROR,
              name: 'Internal error',
              message: 'The server was unable to process the request.'
            },
            true
          )
        );
      } else if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError') {
        res.status(HttpCodes.INTERNAL_ERROR).send(
          sendResponse(
            {
              code: HttpCodes.INTERNAL_ERROR,
              name: 'Token Signing Error'
            },
            true
          )
        );
      } else {
        Logger.error(`Singup Route error: ${(err as Error).message}`);
      }
    }
  } else {
    res.status(HttpCodes.BAD_REQUEST).send(sendResponse(bodyParse.error.flatten().fieldErrors, true));
  }
}

export { loginUser, signupUser };
