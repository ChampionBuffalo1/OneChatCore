import { errorResponse } from '../../lib/response';
import type { Request, Response, NextFunction } from 'express';

/**
 * middleware to make sure only the authorized user can access protected route
 */
function isAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.payload?.userId) {
    next();
  } else {
    res.status(400).json(
      errorResponse({
        code: 'INVALID_SESSION',
        message: 'You must be logged in'
      })
    );
  }
}

export { isAuth };
