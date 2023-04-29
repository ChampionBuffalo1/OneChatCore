import { NextFunction, Request, Response } from 'express';
import { HttpCodes, JwtSecret } from '../../Constants';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../../lib';

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
    console.error(err)
    if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === "JsonWebTokenError") {
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

export type Payload = {
  key: string;
};
export { attachSession };
