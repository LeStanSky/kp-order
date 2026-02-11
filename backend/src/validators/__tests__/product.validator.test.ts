import { getProductsQuerySchema } from '../product.validator';

describe('getProductsQuerySchema', () => {
  it('should set defaults when empty object provided', () => {
    const result = getProductsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        page: 1,
        limit: 20,
        sortBy: 'cleanName',
        sortOrder: 'asc',
      });
    }
  });

  it('should coerce string numbers to numbers', () => {
    const result = getProductsQuerySchema.safeParse({
      page: '2',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject page = 0', () => {
    const result = getProductsQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit > 100', () => {
    const result = getProductsQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortBy', () => {
    const result = getProductsQuerySchema.safeParse({ sortBy: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortOrder', () => {
    const result = getProductsQuerySchema.safeParse({ sortOrder: 'up' });
    expect(result.success).toBe(false);
  });

  it('should accept optional search', () => {
    const result = getProductsQuerySchema.safeParse({ search: 'beer' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('beer');
    }
  });

  it('should accept optional category', () => {
    const result = getProductsQuerySchema.safeParse({ category: 'Drinks' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('Drinks');
    }
  });

  it('should accept all valid sortBy values', () => {
    for (const sortBy of ['name', 'cleanName', 'category', 'expiryDate', 'createdAt']) {
      const result = getProductsQuerySchema.safeParse({ sortBy });
      expect(result.success).toBe(true);
    }
  });
});
