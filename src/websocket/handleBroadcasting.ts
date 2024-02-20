import type { Request, NextFunction } from 'express';

export default function handleBroadcasting(req: Request, _: unknown, next: NextFunction) {
  if (!req.socketPayload) {
    next();
  }
  console.log(req.socketPayload);
}
