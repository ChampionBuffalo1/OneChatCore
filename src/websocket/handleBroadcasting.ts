import type { Request } from 'express';

export default function handleBroadcasting(req: Request, _: unknown) {
  console.log(req.socketPayload);
}
