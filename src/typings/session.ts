export interface JwtPayload {
  data: {
    userId: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      payload: JwtPayload;
    }
  }
}
