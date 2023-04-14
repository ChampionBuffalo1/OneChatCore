import { z } from 'zod';
import { promisify } from 'node:util';
import { maxPassLen } from '../Constants';

const sleep = promisify(setTimeout);

/**
 * Whether or not the username chars are allowed or not
 * A username should not contain a `@`, `=`, `+`, ` (backtick)
 * @param username The username to check
 * @returns boolean
 */
const isValidUsername = (username: string): boolean => !username?.includes('@=+`');

/**
 * Makes sure the plain text password has some properties
 * @param plainPassword The password to check
 * @returns error message
 */
const minPasswordCriteria = (plainPassword: string): Promise<z.SafeParseReturnType<string, string>> => {
  const passwordSchema = z
    .string()
    .min(8, 'Password length should be greater than 8')
    .max(maxPassLen, `Password length should be less than ${maxPassLen}`)
    .regex(/[~`'!@#$%^&*()-_+={}[]|;:"<>,\.\/?]/g, 'Password must contain a special character')
    .refine(
      val => /[a-z]/g.test(val) && /[A-Z]/g.test(val) && /[0-9]/g.test(val),
      'Password must contain a lowercase, uppercase, and a numerical digit'
    );

  return passwordSchema.safeParseAsync(plainPassword);
};

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

export { sleep, range, isValidUsername, minPasswordCriteria, expBackOff };
