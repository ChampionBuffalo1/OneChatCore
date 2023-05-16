import { redis } from '../lib';
import { defaultDelay } from '../Constants';

const prefix = 'group:';
const delay = <T>(fn: Function, args: unknown[], ms: number): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(fn(...args)), ms));

async function setGroupTokens(group: string, token: string): Promise<number> {
  const result = await redis?.sadd(prefix + group, token);
  if (!result) return delay(setGroupTokens, [group, token], defaultDelay);
  return result;
}

function getGroupTokens(group: string): Promise<string[]> {
  const result = redis?.smembers(prefix + group);
  if (!result) return delay(getGroupTokens, [group], defaultDelay);
  return result;
}

export { setGroupTokens, getGroupTokens };
