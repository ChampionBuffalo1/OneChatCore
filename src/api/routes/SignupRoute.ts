import bcrypt from 'bcrypt';
import { Router } from 'express';
import { sendResponse } from '../../utils';
import { isInvalidMethod } from '../middlewares';
import { DatabaseError, InvalidUsername } from '../errors';
import { createUser, hasUsername } from '../controllers/userController';
import { ERROR_CODES, HttpCodes, redirectUriKey, bcrpytSaltRounds } from '../../Constants';

const singupRoute = Router();

singupRoute.put('/', async (req, res) => {
  const username = req.body['username'];
  const password = req.body['password'];
  try {
    if (!username || !password) {
      res
        .status(HttpCodes.BAD_REQUEST)
        .send(sendResponse({ code: ERROR_CODES.INCOMPLETE_FORM, name: 'username or password missing' }, true));
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
    const hashPass = await bcrypt.hash(password, bcrpytSaltRounds);
    const id = await createUser(username, hashPass);
    req.session.userId = id;
    const redirectUrl = req.query[redirectUriKey];
    if (redirectUrl && typeof redirectUrl === 'string') {
      res.status(HttpCodes.OK).redirect(redirectUrl);
      return;
    }
    res.status(HttpCodes.OK).send(sendResponse({ success: true }));
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
    }
  }
});

singupRoute.all('/', isInvalidMethod);

export { singupRoute };
