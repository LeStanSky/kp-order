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
      const { cleanName: parsedName, expiryDate: parsedExpiry } = parseProductExpiry(
        erpProduct.name,
      );
      const productCleanName = parsedName.replace(/\s{2,}/g, ' ').trim();

      const product = await prisma.product.upsert({
        where: { externalId: erpProduct.id },
        create: {
          externalId: erpProduct.id,
          name: erpProduct.name,
          cleanName: productCleanName,
          description: erpProduct.description,
          category: erpProduct.category,
          unit: erpProduct.unit,
          imageUrl: erpProduct.imageUrl,
          expiryDate: parsedExpiry,
        },
        update: {
          name: erpProduct.name,
          cleanName: productCleanName,
          description: erpProduct.description,
          category: erpProduct.category,
          unit: erpProduct.unit,
          imageUrl: erpProduct.imageUrl,
          expiryDate: parsedExpiry,
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

  // 4. Fetch stock (consignment-level with expiry dates in names)
  logger.info('Sync: fetching stock from ERP...');
  const erpStocks = await provider.getStock();

  // Group stock entries by product (multiple consignments per product)
  const stockByProduct = new Map<string, typeof erpStocks>();
  for (const stock of erpStocks) {
    const existing = stockByProduct.get(stock.productExternalId) || [];
    existing.push(stock);
    stockByProduct.set(stock.productExternalId, existing);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const [productExtId, entries] of stockByProduct) {
    try {
      const product = await prisma.product.findUnique({
        where: { externalId: productExtId },
      });
      if (!product) continue;

      // Parse dates, separate expired vs non-expired stock
      let activeQty = 0;
      let expiredQty = 0;
      let earliestActiveExpiry: Date | null = null;
      let latestExpiredDate: Date | null = null;
      let cleanName: string | null = null;

      for (const entry of entries) {
        const { cleanName: cn, expiryDate } = parseProductExpiry(entry.productName);
        if (!cleanName) cleanName = cn;

        if (expiryDate && expiryDate < today) {
          // Expired consignment
          expiredQty += entry.quantity;
          if (!latestExpiredDate || expiryDate > latestExpiredDate) {
            latestExpiredDate = expiryDate;
          }
        } else {
          // Active consignment
          activeQty += entry.quantity;
          if (expiryDate && (!earliestActiveExpiry || expiryDate < earliestActiveExpiry)) {
            earliestActiveExpiry = expiryDate;
          }
        }
      }

      // If has active stock: show in normal view (expiryDate = earliest active)
      // If all expired: show in "Просрочка" (expiryDate = latest expired, stock = expired qty)
      const totalQty = activeQty > 0 ? activeQty : expiredQty;
      const earliestExpiry = activeQty > 0 ? earliestActiveExpiry : latestExpiredDate;

      const parsedCleanName = (cleanName || entries[0].productName).replace(/\s{2,}/g, ' ').trim();

      await prisma.product.update({
        where: { id: product.id },
        data: {
          cleanName: parsedCleanName,
          expiryDate: earliestExpiry,
        },
      });

      await prisma.stock.upsert({
        where: {
          productId_warehouse: {
            productId: product.id,
            warehouse: '',
          },
        },
        create: {
          productId: product.id,
          quantity: totalQty,
          warehouse: '',
        },
        update: {
          quantity: totalQty,
        },
      });
      stocksUpserted++;
    } catch (err) {
      const msg = `Failed to upsert stock for ${productExtId}: ${(err as Error).message}`;
      errors.push(msg);
      logger.error(msg);
    }
  }

  // 5. Zero out stock for products not in ERP stock report
  const syncedProductIds = new Set<string>();
  for (const productExtId of stockByProduct.keys()) {
    const product = await prisma.product.findUnique({
      where: { externalId: productExtId },
      select: { id: true },
    });
    if (product) syncedProductIds.add(product.id);
  }

  const staleStocks = await prisma.stock.findMany({
    where: {
      quantity: { gt: 0 },
      productId: { notIn: [...syncedProductIds] },
    },
    select: { id: true },
  });

  if (staleStocks.length > 0) {
    await prisma.stock.updateMany({
      where: { id: { in: staleStocks.map((s: { id: string }) => s.id) } },
      data: { quantity: 0 },
    });
    logger.info(`Sync: zeroed ${staleStocks.length} stale stock entries`);
  }

  // 6. Invalidate cache
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
