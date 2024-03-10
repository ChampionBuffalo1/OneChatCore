import client from 'prom-client';
import { prisma } from './lib';
import type { Request, Response } from 'express';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

export async function metricHandler(_req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType);
  const logs = await Promise.all([client.register.metrics(), prisma.$metrics.prometheus()]);
  res.send(logs.join('\n'));
}
