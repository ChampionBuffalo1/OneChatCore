import { Router } from 'express';
import Logger from '../../lib/Logger';
import { generateJwt, sendResponse } from '../../lib';
import { verifyUser } from '../controllers/userController';
import { InvalidCredential } from '../errors/ValidationErrors';
import { isInvalidMethod } from '../middlewares/isInvalidMethods';
import { HttpCodes, ERROR_CODES, redirectUriKey } from '../../Constants';

const loginRoute = Router();

loginRoute.post('/', async (req, res) => {
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

    if (req.payload?.data?.id)
      return res.status(HttpCodes.FORBIDDEN).send(
        sendResponse(
          {
            code: ERROR_CODES.ALREADY_LOGGEDIN,
            name: 'User is already logged in'
          },
          true
        )
      );

    const userId = await verifyUser(username, password);
    if (!userId) {
      return res.status(HttpCodes.FORBIDDEN).send(
        sendResponse(
          {
            code: ERROR_CODES.USER_DOESNT_EXISTS,
            name: 'User not found'
          },
          true
        )
      );
    }

    const token = await generateJwt({
      data: {
        id: userId
      }
    });

    const resp = {
      sucess: true,
      token
    };

    const redirectUrl = req.query[redirectUriKey];
    if (redirectUrl && typeof redirectUrl === 'string')
      return res.status(HttpCodes.OK).send(resp).redirect(redirectUrl);
    res.status(HttpCodes.OK).send(resp);
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
});

loginRoute.all('/', isInvalidMethod);
export { loginRoute };
