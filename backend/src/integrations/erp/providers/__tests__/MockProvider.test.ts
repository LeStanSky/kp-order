import { MockProvider } from '../MockProvider';

describe('MockProvider (order automation)', () => {
  const provider = new MockProvider();

  describe('createOrder', () => {
    it('returns a deterministic id and number from the order number', async () => {
      const result = await provider.createOrder({
        orderNumber: 'ORD-20260520-0001',
        agentExternalId: 'cp-001',
        positions: [
          { productExternalId: 'mock-001', quantity: 3, priceKopecks: 22000, reserve: 3 },
        ],
      });
      expect(result).toEqual({
        id: 'mock-co-ORD-20260520-0001',
        number: 'МС-ORD-20260520-0001',
      });
    });
  });

  describe('getConsignments', () => {
    it('returns a series list per requested product', async () => {
      const map = await provider.getConsignments(['mock-001', 'mock-013']);
      expect(map.size).toBe(2);
      expect(map.get('mock-001')).toHaveLength(3);
      expect(map.get('mock-013')?.[0].name).toMatch(/партия/);
    });

    it('returns an empty map for no products', async () => {
      const map = await provider.getConsignments([]);
      expect(map.size).toBe(0);
    });
  });

  describe('getCounterparties', () => {
    it('returns all counterparties without a search term', async () => {
      const list = await provider.getCounterparties();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('name');
    });

    it('filters by name (case-insensitive)', async () => {
      const list = await provider.getCounterparties('иванов');
      expect(list).toHaveLength(1);
      expect(list[0].name).toContain('Иванов');
    });

    it('filters by INN', async () => {
      const list = await provider.getCounterparties('7701234567');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('cp-001');
    });
  });
});
