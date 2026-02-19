import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { createERPProvider } from '../integrations/erp/ERPProviderFactory';
import { parseProductExpiry } from '../utils/expiryParser';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import { productSyncQueue } from './queues';
import { ERPSyncResult } from '../types/erp.types';

async function syncProducts(_job: Job): Promise<ERPSyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let productsUpserted = 0;
  let stocksUpserted = 0;
  let pricesUpserted = 0;

  const provider = createERPProvider();

  // 1. Fetch products from ERP
  logger.info('Sync: fetching products from ERP...');
  const erpProducts = await provider.getProducts();

  // 2. Fetch price groups from DB
  const priceGroups = await prisma.priceGroup.findMany();
  const priceGroupMap = new Map(
    priceGroups.map((pg: { name: string; id: string }) => [pg.name, pg.id]),
  );

  // 3. Upsert products and prices
  for (const erpProduct of erpProducts) {
    try {
      const product = await prisma.product.upsert({
        where: { externalId: erpProduct.id },
        create: {
          externalId: erpProduct.id,
          name: erpProduct.name,
          cleanName: erpProduct.name,
          description: erpProduct.description,
          category: erpProduct.category,
          unit: erpProduct.unit,
          imageUrl: erpProduct.imageUrl,
        },
        update: {
          name: erpProduct.name,
          cleanName: erpProduct.name,
          description: erpProduct.description,
          category: erpProduct.category,
          unit: erpProduct.unit,
          imageUrl: erpProduct.imageUrl,
        },
      });
      productsUpserted++;

      // Upsert prices
      for (const sp of erpProduct.salePrices) {
        const pgId = priceGroupMap.get(sp.priceTypeName);
        if (!pgId) continue;

        await prisma.price.upsert({
          where: {
            productId_priceGroupId: { productId: product.id, priceGroupId: pgId },
          },
          create: {
            productId: product.id,
            priceGroupId: pgId,
            value: sp.value,
            currency: sp.currency,
          },
          update: {
            value: sp.value,
            currency: sp.currency,
          },
        });
        pricesUpserted++;
      }
    } catch (err) {
      const msg = `Failed to upsert product ${erpProduct.id}: ${(err as Error).message}`;
      errors.push(msg);
      logger.error(msg);
    }
  }

  // 4. Fetch and upsert stock (contains expiry dates in names)
  logger.info('Sync: fetching stock from ERP...');
  const erpStocks = await provider.getStock();

  for (const stock of erpStocks) {
    try {
      const product = await prisma.product.findUnique({
        where: { externalId: stock.productExternalId },
      });
      if (!product) continue;

      // Parse expiry from stock product name, then strip ERP-specific markers
      const { cleanName: parsedCleanName, expiryDate } = parseProductExpiry(stock.productName);
      const cleanName = parsedCleanName
        .replace(/\bPET\s+KEG\b\s*/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Update product with parsed expiry and clean name from stock report
      await prisma.product.update({
        where: { id: product.id },
        data: {
          cleanName,
          ...(expiryDate && { expiryDate }),
        },
      });

      await prisma.stock.upsert({
        where: {
          productId_warehouse: {
            productId: product.id,
            warehouse: stock.warehouse ?? '',
          },
        },
        create: {
          productId: product.id,
          quantity: stock.quantity,
          warehouse: stock.warehouse ?? '',
        },
        update: {
          quantity: stock.quantity,
        },
      });
      stocksUpserted++;
    } catch (err) {
      const msg = `Failed to upsert stock for ${stock.productExternalId}: ${(err as Error).message}`;
      errors.push(msg);
      logger.error(msg);
    }
  }

  // 5. Invalidate cache
  await cacheService.delByPattern('products:*');
  await cacheService.delByPattern('categories');

  const duration = Date.now() - start;
  logger.info(
    `Sync complete: ${productsUpserted} products, ${stocksUpserted} stocks, ${pricesUpserted} prices in ${duration}ms`,
  );

  return { productsUpserted, stocksUpserted, pricesUpserted, errors, duration };
}

let worker: Worker | null = null;

export function setupProductSync(): void {
  worker = new Worker('product-sync', syncProducts, {
    connection: redis,
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.info(`Sync job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Sync job ${job?.id} failed`, { error: err.message });
  });

  // Schedule recurring sync every 15 minutes
  productSyncQueue.upsertJobScheduler(
    'product-sync-scheduler',
    { pattern: '*/15 * * * *' },
    { name: 'scheduled-sync' },
  );

  // Trigger initial sync
  productSyncQueue.add('initial-sync', {});

  logger.info('Product sync worker started (every 15 min)');
}

export async function stopProductSync(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await productSyncQueue.close();
}
