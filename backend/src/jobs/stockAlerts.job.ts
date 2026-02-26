import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { stockAlertService } from '../services/stockAlert.service';
import { logger } from '../utils/logger';
import { stockAlertsQueue } from './queues';

async function evaluateStockAlerts(): Promise<void> {
  logger.info('Stock alerts: evaluating...');
  await stockAlertService.evaluateAlerts();
  logger.info('Stock alerts: evaluation complete');
}

let worker: Worker | null = null;

export function setupStockAlerts(): void {
  worker = new Worker('stock-alerts', evaluateStockAlerts, {
    connection: redis,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info(`Stock alerts job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Stock alerts job ${job?.id} failed`, { error: err.message });
  });

  // Schedule every hour
  stockAlertsQueue.upsertJobScheduler(
    'stock-alerts-scheduler',
    { pattern: '0 * * * *' },
    { name: 'scheduled-stock-alerts' },
  );

  logger.info('Stock alerts worker started (every hour)');
}

export async function stopStockAlerts(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await stockAlertsQueue.close();
}
