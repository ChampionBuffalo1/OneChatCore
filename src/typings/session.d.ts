import { Express } from 'express';

export type Payload = {
  // Unique token to identify in redis
  key: string;
  // The actual payload
  data: Record<string, unknown>;
  // Must only be store in redis and not the jwt
  secret?: Record<string, unknown>;
};

declare global {
  namespace Express {
    interface Request {
      payload: Payload;
    }
  }
}
