import { HttpCodes } from '../../Constants';
import { sendResponse } from '../../lib';
import type { Request, Response, NextFunction } from 'express';

/**
 * middleware to make sure the user is logged in
 */
const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    res.status(HttpCodes.UNAUTHORIZED).send(
      sendResponse(
        {
          code: HttpCodes.UNAUTHORIZED,
          name: 'User not authorized',
          message: 'You must be logged in to perform this action'
        },
        true
      )
    );
    return;
  }
  next();
};
export { isAuth };
