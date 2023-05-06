import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { redis } from './createConnection';
import type { JwtPayload } from '../typings';
import { JwtSecret, maxTokenAge, redisPrefix } from '../Constants';

const generateJwt = async (payload: Omit<JwtPayload, 'key'>): Promise<string> => {
  const uuid = randomUUID().substring(0, 20);
  // Time in seconds
  await redis?.set(redisPrefix + uuid, JSON.stringify(payload), 'EX', maxTokenAge / 1000);

  const token = jwt.sign(
    {
      key: uuid,
      data: payload.data
    },
    JwtSecret,
    {
      expiresIn: maxTokenAge
    }
  );
  return token;
};

const getJwtPayload = async (token: string, getSecret: boolean = false): Promise<JwtPayload> => {
  try {
    const jwtDecoded = jwt.verify(token, JwtSecret) as JwtPayload;
    if (getSecret) {
      const key = jwtDecoded.key;
      const secretPayload = await redis?.get(redisPrefix + key);
      if (secretPayload) {
        const json = JSON.parse(secretPayload) as Omit<JwtPayload, 'key'>;
        return {
          key,
          ...json
        };
      }
    }
    return jwtDecoded;
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError')
      throw new Error('JwtError', {
        cause: 'Invalid JWT Payload'
      });
  }

  // Never reached, if JwtError is thrown, the function will exit
  return undefined as never;
};

export { generateJwt, getJwtPayload };
