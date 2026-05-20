import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { orderRepository } from '../repositories/order.repository';
import { createERPProvider } from '../integrations/erp/ERPProviderFactory';
import { parseProductExpiry } from '../utils/expiryParser';
import { toErpUnits } from '../utils/kegUnits';
import { allocateFifo, AllocatableConsignment } from '../utils/fifoAllocation';
import { ERPOrderPosition } from '../types/erp.types';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Lazily constructed so merely importing this module (e.g. from order.service)
// never opens a Redis connection — only doing so when an order is actually queued.
let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue('order-sync', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 5,
        backoff: { type: 'exponential', delay: 10000 },
      },
    });
  }
  return queue;
}

/** Queue an order for asynchronous push into the ERP. */
export async function enqueueOrderSync(orderId: string): Promise<void> {
  await getQueue().add('push', { orderId });
}

/**
 * Push a single order into the ERP as a customer order.
 * Idempotent (skips if already pushed). Permanent problems (no counterparty,
 * insufficient non-expired stock) are recorded as FAILED without throwing;
 * transient errors (network/ERP) throw so BullMQ retries.
 */
export async function pushOrder(orderId: string): Promise<void> {
  const order = await orderRepository.findForErpSync(orderId);
  if (!order) {
    logger.warn(`Order sync: order ${orderId} not found, skipping`);
    return;
  }
  if (order.erpId) {
    logger.info(`Order sync: order ${orderId} already pushed (${order.erpId}), skipping`);
    return;
  }

  const agentExternalId = order.user?.externalId;
  if (!agentExternalId) {
    await orderRepository.updateErpSync(orderId, {
      erpSyncStatus: 'FAILED',
      erpError: 'User has no linked МойСклад counterparty (externalId)',
    });
    logger.warn(`Order sync: order ${orderId} user has no counterparty link`);
    return;
  }

  const provider = createERPProvider();
  const today = startOfToday();

  try {
    const productExternalIds = order.items
      .map((i) => i.product?.externalId)
      .filter((id): id is string => Boolean(id));
    const consignmentMap = await provider.getConsignments(productExternalIds);

    const positions: ERPOrderPosition[] = [];
    const shortfalls: string[] = [];

    for (const item of order.items) {
      const product = item.product;
      const externalId = product?.externalId;
      if (!externalId) {
        shortfalls.push(`${item.productId}: product has no external id`);
        continue;
      }

      const { quantity, priceKopecks } = toErpUnits(
        item.quantity,
        item.price,
        product.cleanName ?? '',
        product.unit ?? null,
      );

      const series = consignmentMap.get(externalId);
      if (!series || series.length === 0) {
        // Product is not tracked by series — push a single product-level position.
        positions.push({
          productExternalId: externalId,
          quantity,
          priceKopecks,
          reserve: quantity,
        });
        continue;
      }

      const allocatable: AllocatableConsignment[] = series.map((s) => ({
        id: s.id,
        quantity: s.quantity,
        expiryDate: parseProductExpiry(s.name).expiryDate,
      }));
      const { allocations, shortfall } = allocateFifo(quantity, allocatable, today);

      if (shortfall > 0) {
        shortfalls.push(
          `${product.cleanName ?? externalId}: not enough non-expired stock (short ${shortfall})`,
        );
        continue;
      }

      for (const a of allocations) {
        positions.push({
          productExternalId: externalId,
          consignmentExternalId: a.consignmentId,
          quantity: a.quantity,
          priceKopecks,
          reserve: a.quantity,
        });
      }
    }

    if (shortfalls.length > 0) {
      await orderRepository.updateErpSync(orderId, {
        erpSyncStatus: 'FAILED',
        erpError: `Cannot fulfil from non-expired stock — ${shortfalls.join('; ')}`,
      });
      logger.warn(`Order sync: order ${orderId} shortfall`, { shortfalls });
      return;
    }

    const result = await provider.createOrder({
      orderNumber: order.orderNumber,
      agentExternalId,
      comment: order.comment ?? undefined,
      positions,
    });

    await orderRepository.updateErpSync(orderId, {
      erpSyncStatus: 'SYNCED',
      erpId: result.id,
      erpNumber: result.number,
      erpSyncedAt: new Date(),
      erpError: null,
    });
    logger.info(`Order sync: order ${order.orderNumber} pushed as ${result.number}`);
  } catch (err) {
    const message = (err as Error).message;
    await orderRepository.updateErpSync(orderId, {
      erpSyncStatus: 'FAILED',
      erpError: message,
      erpRetryCount: (order.erpRetryCount ?? 0) + 1,
    });
    logger.error(`Order sync: order ${orderId} failed`, { error: message });
    throw err;
  }
}

let worker: Worker | null = null;

export function setupOrderSync(): void {
  worker = new Worker('order-sync', async (job) => pushOrder(job.data.orderId), {
    connection: redis,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info(`Order sync job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Order sync job ${job?.id} failed`, { error: err.message });
  });

  logger.info('Order sync worker started');
}

export async function stopOrderSync(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
