import { Router } from 'express';
import * as client from 'prom-client';

// Collect default metrics and create some custom counters
client.collectDefaultMetrics();

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'] as const,
});

export const agentTradeCounter = new client.Counter({
  name: 'agent_trades_total',
  help: 'Total trades executed by agents',
  labelNames: ['symbol', 'type'] as const,
});

// Express router to expose /metrics
export const metricsRouter = Router();
metricsRouter.get('/', async (_req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err instanceof Error ? err.message : 'error');
  }
}); 