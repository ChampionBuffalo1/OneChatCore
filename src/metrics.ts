import client from 'prom-client';
import type { Request, Response } from 'express';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

export async function metricHandler(_req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
}
