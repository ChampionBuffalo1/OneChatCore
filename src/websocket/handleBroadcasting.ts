import store from './Store';
import type { Request, NextFunction } from 'express';

export default function handleBroadcasting(req: Request, _: unknown, next: NextFunction) {
  if (!req.socketPayload) {
    next();
    return;
  }
  const members = store.getGroupConnections(req.socketPayload.d.group.id);
  if (!members) return;
  for (const socketKey of members) {
    const socket = store.getConnection(socketKey);
    // { op: EVENT, d: PAYLOAD } = req.socketPayload
    socket?.send(JSON.stringify(req.socketPayload));
  }
}
