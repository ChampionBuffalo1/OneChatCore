import { sendResponse, Logger, getJwtPayload } from '../../lib';
import type { NextFunction, Request, Response } from 'express';
import { HttpCodes } from '../../Constants';

const attachSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const jwtToken = req.headers.authorization?.replace('Bearer ', '');
  try {
    if (jwtToken) req.payload = await getJwtPayload(jwtToken, true);
  } catch (err) {
    Logger.error(`Session error: ${(err as Error).message}`);
    if ((err as Error).name === 'JwtError') {
      res.status(HttpCodes.FORBIDDEN).send(
        sendResponse({
          code: HttpCodes.FORBIDDEN,
          message: (err as Error).cause
        })
      );
    }
  }
  next();
};

export { attachSession };
