import { Logger, getJwtPayload } from '../../lib';
import type { NextFunction, Request, Response } from 'express';
import { HttpCodes } from '../../Constants';

const attachSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const jwtToken = req.headers.authorization?.replace('Bearer ', '');
  try {
    // FIXME: Add true as second parameter if we ever use redis to store secret along with jwt
    // For now its planned to remove Redis from the stack in order to reduce complexity
    if (jwtToken) req.payload = await getJwtPayload(jwtToken);
  } catch (err) {
    Logger.error(`Session error: ${(err as Error).message}`);
    if ((err as Error).name === 'JwtError') {
      res.status(HttpCodes.FORBIDDEN).send({
        code: HttpCodes.FORBIDDEN,
        message: (err as Error).cause
      });
    }
  }
  next();
};

export { attachSession };
