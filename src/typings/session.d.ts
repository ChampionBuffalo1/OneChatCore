import { Express } from 'express';

export type Payload<
  T extends Record<string, unknown> = Record<string, unknown>,
  V extends Record<string, unknown> = Record<string, unknown>
> = {
  // Unique token to identify in redis
  key: string;
  // The actual payload
  data: T;
  // Must only be store in redis and not the jwt
  secret?: V;
};

declare global {
  namespace Express {
    interface Request {
      payload: Payload;
    }
  }
}
