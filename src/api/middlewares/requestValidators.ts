import { RequestBody } from '../../typings';
import { errorResponse } from '../../lib/response';
import type { Request, Response, NextFunction } from 'express';

/**
 * Makes sure that the request has body and at least 1 key
 */
const hasReqBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json(
      errorResponse({
        code: 'BAD_REQUEST',
        message: 'Request Body Missing'
      })
    );
  } else {
    next();
  }
};

const reqBodyHasKeys =
  <T extends Record<string, unknown>>(
    ...keys: string[]
  ): ((req: RequestBody<T>, res: Response, next: NextFunction) => void) =>
  (req, res, next) => {
    for (const key in keys) {
      if (
        !Object.hasOwn(req.body, key) || ['number', 'boolean'].includes(typeof req.body.key) ? false : !req.body.key
      ) {
        res.status(400).json(
          errorResponse({
            code: 'BAD_REQUEST',
            message: `Request Body is missing key: ${key}`
          })
        );
        return;
      }
    }
    next();
  };

export { hasReqBody, reqBodyHasKeys };
