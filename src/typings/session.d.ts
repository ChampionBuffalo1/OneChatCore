import { Express } from 'express';

interface KeyPayload {
  // Unique token to identify in redis
  key: string;
}

export interface JwtPayload extends KeyPayload {
  data: {
    userId?: string;
  };  
  secret?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      payload: JwtPayload;
    }
  }
}
