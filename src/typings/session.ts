export interface JwtPayload {
  userId: string;
}

interface SocketPayload {
  d: Record<string, unknown>;
  op: string;
}

declare global {
  namespace Express {
    interface Request {
      payload: JwtPayload;
      socketPayload: SocketPayload;
    }
  }
}
