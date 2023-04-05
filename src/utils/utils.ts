import { promisify } from "node:util";
import { maxPassLen } from "../Constants";

const sleep = promisify(setTimeout);

/**
 * Whether or not the username chars are allowed or not
 * A username should not contain a `@`, `=`, `+`, ` (backtick)
 * @param username The username to check
 * @returns boolean
 */
const isValidUsername = (username: string): boolean =>
  !username?.includes("@=+`");

const specialChars = /[~`'!@#$%^&*()-_+={}[]|;:"<>,\.\/?]/;
/**
 * Makes sure the plain text password has some properties
 * @param plainPassword The password to check
 * @returns error message
 */
const minPasswordCriteria = (plainPassword: string): string | undefined => {
  if (plainPassword.length < 8 || plainPassword.length > maxPassLen)
    return `Password length should be greater than 8 and less than ${maxPassLen}`;
  if (
    !/[A-Z]/.test(plainPassword) ||
    !/[a-z]/.test(plainPassword) ||
    !/[0-9]/.test(plainPassword)
  )
    return "Password must contain a lowercase, uppercase, and a numerical digit";
  if (!specialChars.test(plainPassword))
    return "Password must contain a special character";
  // Just to make TS shutup
  return;
};

const range = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min) + min);
};

const expBackOff = (k: number): number => {
  let r = range(0, 2 ** k + 1);
  let tp = 2000;
  return Math.max(tp * 2, r * tp);
};

export { sleep, range, isValidUsername, minPasswordCriteria, expBackOff };
