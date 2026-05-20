jest.mock('../../../../config/env', () => ({
  env: {
    MOYSKLAD_BASE_URL: 'https://api.example.test/remap/1.2',
    MOYSKLAD_TOKEN: 'test-token',
    MOYSKLAD_ORGANIZATION_ID: 'org-1',
    MOYSKLAD_STORE_ID: 'store-1',
  },
}));

import { MoySkladProvider } from '../MoySkladProvider';
import { env } from '../../../../config/env';
import { ERPConnectionError } from '../../../../utils/errors';

const BASE = 'https://api.example.test/remap/1.2';

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: { get: () => null },
  } as unknown as Response;
}

describe('MoySkladProvider (order automation)', () => {
  const provider = new MoySkladProvider();
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    env.MOYSKLAD_ORGANIZATION_ID = 'org-1';
    env.MOYSKLAD_STORE_ID = 'store-1';
  });

  describe('createOrder', () => {
    it('POSTs a customerorder with org/agent/store meta and positions', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 'co-123', name: 'МС-42' }));

      const result = await provider.createOrder({
        orderNumber: 'ORD-1',
        agentExternalId: 'cp-9',
        comment: 'hurry',
        positions: [
          {
            productExternalId: 'p-1',
            consignmentExternalId: 's-1',
            quantity: 2,
            priceKopecks: 400000,
            reserve: 2,
          },
          { productExternalId: 'p-2', quantity: 3, priceKopecks: 25000, reserve: 3 },
        ],
      });

      expect(result).toEqual({ id: 'co-123', number: 'МС-42' });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/entity/customerorder`);
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.name).toBe('ORD-1');
      expect(body.organization.meta.href).toBe(`${BASE}/entity/organization/org-1`);
      expect(body.agent.meta.href).toBe(`${BASE}/entity/counterparty/cp-9`);
      expect(body.store.meta.href).toBe(`${BASE}/entity/store/store-1`);
      expect(body.description).toBe('hurry');

      // position with consignment → assortment is a consignment
      expect(body.positions[0]).toMatchObject({ quantity: 2, price: 400000, reserve: 2 });
      expect(body.positions[0].assortment.meta.href).toBe(`${BASE}/entity/consignment/s-1`);
      // position without consignment → assortment is the product
      expect(body.positions[1].assortment.meta.href).toBe(`${BASE}/entity/product/p-2`);
    });

    it('throws when organization/store are not configured', async () => {
      env.MOYSKLAD_ORGANIZATION_ID = '';
      await expect(
        provider.createOrder({
          orderNumber: 'ORD-2',
          agentExternalId: 'cp-9',
          positions: [],
        }),
      ).rejects.toThrow(ERPConnectionError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('getCounterparties', () => {
    it('maps counterparty rows and forwards the search term', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ rows: [{ id: 'cp-1', name: 'ООО Тест', inn: '7700000000' }] }),
      );

      const list = await provider.getCounterparties('тест');

      expect(list).toEqual([{ id: 'cp-1', name: 'ООО Тест', inn: '7700000000' }]);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/entity/counterparty?');
      expect(url).toContain('search=');
    });
  });

  describe('getConsignments', () => {
    it('returns an empty map for no products without calling the API', async () => {
      const map = await provider.getConsignments([]);
      expect(map.size).toBe(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('groups consignment stock rows by product external id', async () => {
      fetchMock
        // pass 1: product-level stock (code → product id)
        .mockResolvedValueOnce(
          jsonResponse({
            rows: [{ meta: { href: `${BASE}/entity/product/p-1` }, code: 'C1' }],
          }),
        )
        // pass 2: consignment-level stock
        .mockResolvedValueOnce(
          jsonResponse({
            rows: [
              {
                meta: { href: `${BASE}/entity/consignment/s-1` },
                code: 'C1',
                name: 'партия / 2026-09-01',
                quantity: 7,
              },
            ],
          }),
        );

      const map = await provider.getConsignments(['p-1']);
      expect(map.get('p-1')).toEqual([{ id: 's-1', name: 'партия / 2026-09-01', quantity: 7 }]);
    });
  });
});
