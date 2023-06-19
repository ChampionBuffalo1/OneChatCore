import bcrypt from 'bcrypt';
import { Router } from 'express';
import Logger from '../../lib/Logger';
import { isInvalidMethod } from '../middlewares';
import { DatabaseError, InvalidUsername } from '../errors';
import { PasswordSchema, generateJwt, sendResponse } from '../../lib';
import { createUser, hasUsername } from '../controllers/userController';
import { ERROR_CODES, HttpCodes, bcryptSaltRounds } from '../../Constants';

const singupRoute = Router();

singupRoute.post('/', async (req, res): Promise<void> => {
  const username = req.body['username'];
  const password = req.body['password'];
  try {
    if (!username || !password) {
      res.status(HttpCodes.BAD_REQUEST).send(
        sendResponse(
          {
            code: ERROR_CODES.INCOMPLETE_FORM,
            name: 'username or password missing'
          },
          true
        )
      );
      return;
    }

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

    const passmatch = await PasswordSchema.safeParseAsync(password);
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

    const token = await generateJwt({
      data: {
        userId
      }
    });
    const resp = sendResponse({
      success: true,
      token
    });
    res.status(HttpCodes.OK).send(resp);
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
});

singupRoute.all('/', isInvalidMethod);

export { singupRoute };
