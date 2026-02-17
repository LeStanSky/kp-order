import { createOrderSchema, getOrdersQuerySchema } from '../order.validator';

describe('createOrderSchema', () => {
  it('should validate a valid order with items', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod-1', quantity: 5 }],
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional comment', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod-1', quantity: 1 }],
      comment: 'Urgent order',
    });
    expect(result.success).toBe(true);
    expect(result.data!.comment).toBe('Urgent order');
  });

  it('should reject empty items array', () => {
    const result = createOrderSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('should reject items without productId', () => {
    const result = createOrderSchema.safeParse({
      items: [{ quantity: 5 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject items with quantity < 1', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod-1', quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer quantity', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod-1', quantity: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing items', () => {
    const result = createOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject items with empty productId', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: '', quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('getOrdersQuerySchema', () => {
  it('should provide defaults for empty query', () => {
    const result = getOrdersQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      page: 1,
      limit: 20,
      sortOrder: 'desc',
    });
  });

  it('should parse page and limit', () => {
    const result = getOrdersQuerySchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    expect(result.data!.page).toBe(2);
    expect(result.data!.limit).toBe(10);
  });

  it('should accept valid status filter', () => {
    const result = getOrdersQuerySchema.safeParse({ status: 'PENDING' });
    expect(result.success).toBe(true);
    expect(result.data!.status).toBe('PENDING');
  });

  it('should reject invalid status', () => {
    const result = getOrdersQuerySchema.safeParse({ status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should accept sortOrder asc/desc', () => {
    const asc = getOrdersQuerySchema.safeParse({ sortOrder: 'asc' });
    expect(asc.success).toBe(true);
    const desc = getOrdersQuerySchema.safeParse({ sortOrder: 'desc' });
    expect(desc.success).toBe(true);
  });

  it('should reject page < 1', () => {
    const result = getOrdersQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('should reject limit > 100', () => {
    const result = getOrdersQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });
});
