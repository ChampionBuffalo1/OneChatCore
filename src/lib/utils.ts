import { promisify } from 'node:util';

const sleep = promisify(setTimeout);

/**
 * Whether or not the username chars are allowed or not
 * A username should not contain a `@`, `=`, `+`, ` (backtick)
 * @param username The username to check
 * @returns boolean
 */
const isValidUsername = (username: string): boolean => !username?.includes('@=+`');

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

export { sleep, range, isValidUsername, expBackOff };
