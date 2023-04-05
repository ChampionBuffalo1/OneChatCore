import { Router } from 'express';
import { sendResponse } from '../../utils';
import { HttpCodes, ERROR_CODES, redirectUriKey } from '../../Constants';
import { verifyUser } from '../controllers/userController';
import { InvalidCredential } from '../errors/ValidationErrors';
import { isInvalidMethod } from '../middlewares/isInvalidMethods';

const loginRoute = Router();

loginRoute.post('/', async (req, res) => {
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
    // Incase we already have a session
    if (req.session.userId) {
      res.status(HttpCodes.FORBIDDEN).send(
        sendResponse(
          {
            code: ERROR_CODES.ALREADY_LOGGEDIN,
            name: 'User is already logged in'
          },
          true
        )
      );
      return;
    }
    const userId = await verifyUser(username, password);
    if (!userId) {
      res.status(HttpCodes.FORBIDDEN).send(
        sendResponse(
          {
            code: ERROR_CODES.USER_DOESNT_EXISTS,
            name: 'User not found'
          },
          true
        )
      );
      return;
    }
    req.session.userId = userId;
    const redirectUrl = req.query[redirectUriKey];
    if (redirectUrl && typeof redirectUrl === 'string') {
      res.status(HttpCodes.OK).redirect(redirectUrl);
      return;
    }
    res.status(HttpCodes.OK).send();
  } catch (err) {
    if (err instanceof InvalidCredential) {
      res.status(HttpCodes.FORBIDDEN).send(
        sendResponse(
          {
            code: ERROR_CODES.INVALID_CRED,
            name: 'Invalid Credentials'
          },
          true
        )
      );
    }
  }
});

loginRoute.all('/', isInvalidMethod);
export { loginRoute };
