import {
  getProductsQuerySchema,
  updateProductSchema,
  productIdParamSchema,
} from '../product.validator';

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

describe('updateProductSchema', () => {
  it('should accept valid description', () => {
    const result = updateProductSchema.safeParse({ description: 'A fine IPA' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A fine IPA');
    }
  });

  it('should accept valid characteristics', () => {
    const result = updateProductSchema.safeParse({
      characteristics: { volume: '500мл', abv: '4.5%' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characteristics).toEqual({ volume: '500мл', abv: '4.5%' });
    }
  });

  it('should accept empty characteristics object', () => {
    const result = updateProductSchema.safeParse({ characteristics: {} });
    expect(result.success).toBe(true);
  });

  it('should reject non-string values in characteristics', () => {
    const result = updateProductSchema.safeParse({
      characteristics: { volume: 500 },
    });
    expect(result.success).toBe(false);
  });

  it('should accept both description and characteristics together', () => {
    const result = updateProductSchema.safeParse({
      description: 'Updated desc',
      characteristics: { style: 'IPA' },
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty body (at least one field required)', () => {
    const result = updateProductSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject unknown fields', () => {
    const result = updateProductSchema.safeParse({
      description: 'test',
      unknownField: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('should accept null description to clear it', () => {
    const result = updateProductSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });
});

describe('productIdParamSchema', () => {
  it('should accept a valid UUID', () => {
    const result = productIdParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('should reject a non-UUID string', () => {
    const result = productIdParamSchema.safeParse({ id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject missing id', () => {
    const result = productIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
