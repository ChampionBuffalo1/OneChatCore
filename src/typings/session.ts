export interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      payload: JwtPayload;
    }
  }
}
