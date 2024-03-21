import store from './Store';
import type { Request, NextFunction } from 'express';

export default function handleBroadcasting(req: Request, _: unknown, next: NextFunction) {
  if (!req.socketPayload) {
    next();
    return;
  }
  const members = store.getGroupConnections(req.socketPayload.d.group.id);
  if (!members) return;

  if (req.socketPayload.op === 'GROUP_JOIN' || req.socketPayload.op === 'GROUP_LEAVE') {
    // Addding/Removing user to/from socket group on join/leave
    const func = req.socketPayload.op === 'GROUP_JOIN' ? store.setGroupConnection : store.removeGroupConnection;
    func(req.socketPayload.d.group.id, (req.socketPayload.d as { user: { id: string } }).user.id);
  }
  if (req.socketPayload.op === 'PERM_EDIT') {
    const socket = store.getConnection((req.socketPayload.d as { userId: string }).userId);
    // Unicast
    socket?.send(JSON.stringify(req.socketPayload));
    return;
  }

  for (const socketKey of members) {
    const socket = store.getConnection(socketKey);
    // { op: EVENT, d: PAYLOAD } = req.socketPayload
    socket?.send(JSON.stringify(req.socketPayload));
  }
  if (req.socketPayload.op === 'GROUP_DELETE') {
    // Remove sockets once group delete event has been broadcasted
    store.removeGroup(req.socketPayload.d.group.id);
  }
}
