import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { redis } from './createConnection';
import type { Payload } from '../typings';
import { JwtSecret, maxTokenAge, redisPrefix } from '../Constants';

const generateJwt = async (payload: Omit<Payload, 'key'>): Promise<string> => {
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

const getJwtPayload = async <T extends { key: string } = Payload>(
  token: string,
  getSecret: boolean = false
): Promise<T> => {
  try {
    const jwtDecoded = jwt.verify(token, JwtSecret) as T;
    if (getSecret) {
      const key = jwtDecoded.key;
      const secretPayload = await redis?.get(redisPrefix + key);
      if (secretPayload) return JSON.parse(secretPayload) as T;
    }
    return jwtDecoded;
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError' || (err as Error).name === 'JsonWebTokenError')
      throw new Error('JwtError', {
        cause: 'Invalid JWT Payload'
      });
  }
  // Never reached
  // if JwtError is thrown, the function will exit
  return undefined as unknown as T;
};

export { generateJwt, getJwtPayload };
