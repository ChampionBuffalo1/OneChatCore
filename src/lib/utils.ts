import jwt from 'jsonwebtoken';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { redis } from './createConnection';
import type { Payload } from '../typings';
import { JwtSecret, maxTokenAge, redisPrefix } from '../Constants';

const sleep = promisify(setTimeout);

/**
 * Whether or not the username chars are allowed or not
 * A username should not contain a `@`, `=`, `+`, ` (backtick)
 * @param username The username to check
 * @returns boolean
 */
const invalidChar = ['@', '=', '+', '`'];
const isValidUsername = (username: string): boolean => !invalidChar.includes(username);

const range = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min) + min);
};

const tp = 1000 * 15;
// Max is 450K ms (7.5 minute)
const expBackOff = (k: number): number => {
  const r = range(0, 2 ** k + 1);
  return Math.max(tp * 2, r * tp);
};

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

export { sleep, range, isValidUsername, expBackOff, generateJwt };
