import { Request, Response } from 'express';
import { HttpCodes } from '../../Constants';
import { sendResponse } from '../../lib';

/**
 * middleware to deny requests to routes with unsupported methods
 */
const isInvalidMethod = (req: Request, res: Response): void => {
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
};

export { isInvalidMethod };
