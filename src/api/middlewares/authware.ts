import { errorResponse } from '../../lib/response';
import type { Request, Response, NextFunction } from 'express';

/**
 * middleware to make sure the user is logged in
 */
function isAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.payload) {
    next();
  } else {
    res.status(400).json(
      errorResponse({
        code: 'INVALID_SESSION',
        message: 'You must be logged in'
      })
    );
  }
  next();
}

function isntAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.payload) {
    res.redirect('/');
  } else {
    next();
  }
}

export { isAuth, isntAuth };
