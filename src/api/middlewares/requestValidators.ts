import { HttpCodes } from '../../Constants';
import { sendResponse } from '../../utils';
import { RequestBody } from '../../typings';
import type { Request, Response, NextFunction } from 'express';

/**
 * Makes sure that the request has an body and at least 1 key
 */
const hasReqBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(HttpCodes.FORBIDDEN).send(
      sendResponse(
        {
          code: HttpCodes.FORBIDDEN,
          name: 'Request Body Missing',
          message: 'This path requires the request body to be present.'
        },
        true
      )
    );
    return;
  }
  next();
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
        res.status(HttpCodes.FORBIDDEN).send(
          sendResponse(
            {
              code: HttpCodes.FORBIDDEN,
              name: 'Request body is missing some data.',
              // Send a better error message
              message: `Request Body is missing key: ${key}`
            },
            true
          )
        );
        return;
      }
    }
    next();
  };

export { hasReqBody, reqBodyHasKeys };
