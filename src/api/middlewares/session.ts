import jwt from 'jsonwebtoken';
import { Payload } from '../../typings';
import { sendResponse, Logger } from '../../lib';
import { HttpCodes, JwtSecret } from '../../Constants';
import { NextFunction, Request, Response } from 'express';

const attachSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const jwtToken = req.headers.authorization;
  try {
    if (jwtToken) {
      // Throws error for invalid jwt
      const payload = jwt.verify(jwtToken, JwtSecret) as Payload;
      // get extra information from redis and add that to req
      req.payload = payload;
    }
  } catch (err) {
    Logger.error(err);
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
