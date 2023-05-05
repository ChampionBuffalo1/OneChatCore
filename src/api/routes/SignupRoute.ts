import bcrypt from 'bcrypt';
import { Router } from 'express';
import Logger from '../../lib/Logger';
import { isInvalidMethod } from '../middlewares';
import { DatabaseError, InvalidUsername } from '../errors';
import { PasswordSchema, generateJwt, sendResponse } from '../../lib';
import { createUser, hasUsername } from '../controllers/userController';
import { ERROR_CODES, HttpCodes, redirectUriKey, bcryptSaltRounds } from '../../Constants';

const singupRoute = Router();

singupRoute.post('/', async (req, res) => {
  const username = req.body['username'];
  const password = req.body['password'];
  try {
    if (!username || !password)
      return res.status(HttpCodes.BAD_REQUEST).send(
        sendResponse(
          {
            code: ERROR_CODES.INCOMPLETE_FORM,
            name: 'username or password missing'
          },
          true
        )
      );

    if (await hasUsername(username))
      return res.status(HttpCodes.NOT_ACCEPTABLE).send(
        sendResponse(
          {
            code: ERROR_CODES.USERNAME_ALREADY_TAKEN,
            name: 'Username already taken'
          },
          true
        )
      );

    const passmatch = await PasswordSchema.safeParseAsync(password);
    if (!passmatch.success) {
      res.status(HttpCodes.NOT_ACCEPTABLE).send(
        sendResponse(
          {
            code: ERROR_CODES.INVALID_CRED,
            name: passmatch.error
          },
          true
        )
      );
    }
    const hashPass = await bcrypt.hash(password, bcryptSaltRounds);
    const id = await createUser(username, hashPass);

    const token = await generateJwt({
      data: {
        id
      }
    });
    const resp = {
      success: true,
      token
    };
    const redirectUrl = req.query[redirectUriKey];
    if (redirectUrl && typeof redirectUrl === 'string')
      return res.status(HttpCodes.OK).send(resp).redirect(redirectUrl);
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
