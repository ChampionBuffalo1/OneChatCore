import { HttpCodes } from '../../Constants';
import { sendResponse } from '../../lib';
import type { Request, Response, NextFunction } from 'express';

const authKey = 'authorization' as const;

/**
 * middleware to make sure the user is logged in
 */
function isAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers[authKey];
  if (!authHeader) {
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
}

function isntAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers[authKey];
  if (authHeader) {
    res.redirect('/');
    return;
  };
  next();
}

/**
 * middleware to deny requests to routes with unsupported methods
 */
function isInvalidMethod(req: Request, res: Response): void {
  res.status(HttpCodes.METHOD_NOT_ALLOWED).send(
    sendResponse(
      {
        code: HttpCodes.NOT_IMPLEMENTED,
        name: 'Method not supported',
        message: `${req.method} method is not supported on this route.`
      },
      true
    )
  );
}

export { isAuth, isntAuth, isInvalidMethod };
