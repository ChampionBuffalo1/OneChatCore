import jwt from 'jsonwebtoken';
import { Payload } from '../../typings';
import { sendResponse, Logger, redis } from '../../lib';
import type { NextFunction, Request, Response } from 'express';
import { HttpCodes, JwtSecret, redisPrefix } from '../../Constants';

const attachSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const jwtToken = req.headers.authorization;
  try {
    if (jwtToken) {
      // Throws error for invalid jwt
      const jwtPayload = jwt.verify(jwtToken, JwtSecret) as Payload;
      const payload = await redis?.get(redisPrefix + jwtPayload.key);
      if (payload) {
        const secret = (JSON.parse(payload) as Omit<Payload, 'key'>).secret;
        // JwtPayload and secret payload stored in redis only
        req.payload = {
          ...jwtPayload,
          secret
        };
      } else {
        // Only key and public data
        req.payload = jwtPayload;
      }
    }
  } catch (err) {
    Logger.error(`Session error: ${(err as Error).message}`);
    if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError') {
      res.status(HttpCodes.FORBIDDEN).send(
        sendResponse({
          code: HttpCodes.FORBIDDEN,
          message: 'Invalid JWT Payload'
        })
      );
    }
  }
  next();
};

export { attachSession };
