import { prisma } from './lib';
import client from 'prom-client';
import type { Request, Response } from 'express';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

export async function metricHandler(_req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType);
  const logs = await Promise.all([client.register.metrics(), prisma.$metrics.prometheus()]);
  res.send(logs.join('\n'));
}

export const responseTimeMetric = new client.Histogram({
  name: 'http_response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [0, 10, 40, 60, 90, 120, 250, 500, 1000]
});
