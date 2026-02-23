import { IERPProvider } from '../IERPProvider';
import { ERPProduct, ERPSalePrice, ERPStock } from '../../../types/erp.types';
import { env } from '../../../config/env';
import { prisma } from '../../../config/database';
import { logger } from '../../../utils/logger';
import { ERPConnectionError } from '../../../utils/errors';

const LIMIT = 1000;
const MAX_RETRIES = 3;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
      const delay = retryAfter * 1000 * attempt;
      logger.warn(`MoySklad rate limited, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ERPConnectionError(`MoySklad API error ${response.status}: ${body.slice(0, 200)}`);
    }

    return response;
  }

  throw new ERPConnectionError('MoySklad API: max retries exceeded');
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.MOYSKLAD_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json;charset=utf-8',
  };
}

export class MoySkladProvider implements IERPProvider {
  private baseUrl = env.MOYSKLAD_BASE_URL;

  async getProducts(): Promise<ERPProduct[]> {
    const syncGroups = await prisma.syncGroup.findMany({
      where: { isActive: true },
    });
    const allowedGroups = new Set(syncGroups.map((g: { name: string }) => g.name));

    const products: ERPProduct[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}/entity/assortment?limit=${LIMIT}&offset=${offset}&filter=type=product&expand=uom`;
      const response = await fetchWithRetry(url, { headers: getHeaders() });
      const data = (await response.json()) as any;
      const rows = data.rows || [];

      for (const row of rows) {
        const pathName = row.pathName || '';
        // pathName can be nested like "Jaws/Подкатегория", take the top-level group
        const topGroup = pathName.split('/')[0].trim();

        if (!allowedGroups.has(topGroup)) continue;

        const salePrices: ERPSalePrice[] = (row.salePrices || []).map((sp: any) => ({
          priceTypeName: sp.priceType?.name || '',
          priceTypeExternalId: sp.priceType?.meta?.href?.split('/')?.pop(),
          value: (sp.value || 0) / 100, // kopecks → rubles
          currency: sp.currency?.isoCode || 'RUB',
        }));

        const uomName = row.uom?.name || '';
        const unit = uomName.toLowerCase().includes('дкл')
          ? 'дкл'
          : uomName.toLowerCase().includes('шт')
            ? 'шт'
            : uomName || undefined;

        products.push({
          id: row.id,
          name: row.name,
          description: row.description,
          category: topGroup,
          unit,
          imageUrl: row.images?.meta?.size > 0 ? row.images.meta.href : undefined,
          salePrices,
        });
      }

      hasMore = rows.length === LIMIT;
      offset += LIMIT;
    }

    logger.info(`MoySklad: fetched ${products.length} products from ${offset / LIMIT} page(s)`);
    return products;
  }

  async getStock(): Promise<ERPStock[]> {
    const stocks: ERPStock[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}/report/stock/all?limit=${LIMIT}&offset=${offset}`;
      const response = await fetchWithRetry(url, { headers: getHeaders() });
      const data = (await response.json()) as any;
      const rows = data.rows || [];

      for (const row of rows) {
        if (!row.meta?.href?.includes('/product/')) continue;

        const productId = row.meta.href.split('/product/').pop()?.split('?')[0];
        if (!productId) continue;

        stocks.push({
          productExternalId: productId,
          productName: row.name || '',
          quantity: row.quantity || 0,
          warehouse: row.store?.name,
        });
      }

      hasMore = rows.length === LIMIT;
      offset += LIMIT;
    }

    logger.info(`MoySklad: fetched ${stocks.length} stock entries`);
    return stocks;
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/entity/organization?limit=1`;
      await fetchWithRetry(url, { headers: getHeaders() });
      return true;
    } catch (err) {
      logger.error('MoySklad connection test failed', { error: (err as Error).message });
      return false;
    }
  }
}
