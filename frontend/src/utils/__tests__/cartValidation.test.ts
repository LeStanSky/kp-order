import { describe, it, expect } from 'vitest';
import { validateCart } from '../cartValidation';
import type { CartItem } from '@/store/cartStore';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    name: 'Тестовый товар',
    price: 100,
    currency: 'RUB',
    quantity: 3,
    isKeg: false,
    ...overrides,
  };
}

describe('validateCart — order minimum', () => {
  it('no violation when order has 1 KEG', () => {
    const violations = validateCart([makeItem({ isKeg: true, quantity: 1 })]);
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(0);
  });

  it('no violation when packaged total === 40', () => {
    const violations = validateCart([makeItem({ quantity: 40 })]);
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(0);
  });

  it('no violation when packaged total > 40 across multiple items', () => {
    const violations = validateCart([
      makeItem({ productId: 'p1', quantity: 20 }),
      makeItem({ productId: 'p2', quantity: 21 }),
    ]);
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(0);
  });

  it('violation when no KEG and packaged total < 40', () => {
    const violations = validateCart([makeItem({ quantity: 10 })]);
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(1);
  });

  it('violation message mentions current count and minimum', () => {
    const violations = validateCart([makeItem({ quantity: 5 })]);
    const v = violations.find((v) => v.type === 'order_min')!;
    expect(v.message).toMatch(/5/);
    expect(v.message).toMatch(/40/);
  });

  it('no order_min violation when has KEG even if packaged < 40', () => {
    const violations = validateCart([
      makeItem({ productId: 'keg', isKeg: true, quantity: 1 }),
      makeItem({ productId: 'pkg', quantity: 5 }),
    ]);
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(0);
  });

  it('KEG items are not counted toward packaged total', () => {
    // 1 KEG of qty 50 should NOT count as 50 packaged units
    const violations = validateCart([makeItem({ isKeg: true, quantity: 50 })]);
    // packaged = 0, but kegCount = 50 >= 1 → no order_min violation
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(0);
  });
});

describe('validateCart — per-item minimum', () => {
  it('violation when non-KEG item quantity < 3', () => {
    const violations = validateCart([makeItem({ quantity: 2 })]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(1);
  });

  it('violation when non-KEG item quantity === 1', () => {
    const violations = validateCart([makeItem({ quantity: 1 })]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(1);
  });

  it('violation references correct productId', () => {
    const violations = validateCart([makeItem({ productId: 'abc', quantity: 2 })]);
    const v = violations.find((vio) => vio.type === 'item_min_qty')!;
    expect(v.productId).toBe('abc');
  });

  it('no per-item violation when quantity === 3', () => {
    const violations = validateCart([makeItem({ quantity: 3 })]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(0);
  });

  it('no per-item violation when quantity > 3', () => {
    const violations = validateCart([makeItem({ quantity: 10 })]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(0);
  });

  it('no per-item violation for KEG item with qty 1', () => {
    const violations = validateCart([makeItem({ isKeg: true, quantity: 1 })]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(0);
  });

  it('multiple per-item violations for multiple items < 3', () => {
    const violations = validateCart([
      makeItem({ productId: 'p1', quantity: 1 }),
      makeItem({ productId: 'p2', quantity: 2 }),
    ]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(2);
  });

  it('only non-KEG items get per-item violation, KEG does not', () => {
    const violations = validateCart([
      makeItem({ productId: 'keg', isKeg: true, quantity: 1 }),
      makeItem({ productId: 'pkg', isKeg: false, quantity: 2 }),
    ]);
    const itemViolations = violations.filter((v) => v.type === 'item_min_qty');
    expect(itemViolations).toHaveLength(1);
    expect(itemViolations[0].productId).toBe('pkg');
  });
});

describe('validateCart — REMOTE delivery category', () => {
  it('no violation when total >= 30000', () => {
    const violations = validateCart([makeItem({ price: 1000, quantity: 30 })], 'REMOTE');
    expect(violations).toHaveLength(0);
  });

  it('violation when total < 30000', () => {
    const violations = validateCart([makeItem({ price: 100, quantity: 10 })], 'REMOTE');
    expect(violations.filter((v) => v.type === 'order_min')).toHaveLength(1);
  });

  it('violation message mentions 30 000 and current amount', () => {
    const violations = validateCart([makeItem({ price: 500, quantity: 5 })], 'REMOTE');
    const v = violations.find((v) => v.type === 'order_min')!;
    expect(v.message).toMatch(/30\s?000/);
    expect(v.message).toMatch(/2\s?500/);
  });

  it('no per-item minimum for REMOTE', () => {
    const violations = validateCart([makeItem({ price: 15000, quantity: 2 })], 'REMOTE');
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(0);
  });

  it('STANDARD rules apply when deliveryCategory is STANDARD', () => {
    const violations = validateCart([makeItem({ quantity: 2 })], 'STANDARD');
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(1);
  });

  it('STANDARD rules apply when deliveryCategory is undefined', () => {
    const violations = validateCart([makeItem({ quantity: 2 })]);
    expect(violations.filter((v) => v.type === 'item_min_qty')).toHaveLength(1);
  });
});

describe('validateCart — valid carts', () => {
  it('returns empty array for KEG-only cart', () => {
    expect(validateCart([makeItem({ isKeg: true, quantity: 2 })])).toHaveLength(0);
  });

  it('returns empty array when packaged >= 40 and all items >= 3', () => {
    expect(validateCart([makeItem({ quantity: 40 })])).toHaveLength(0);
  });

  it('returns empty array for mixed valid cart', () => {
    const violations = validateCart([
      makeItem({ productId: 'keg', isKeg: true, quantity: 1 }),
      makeItem({ productId: 'pkg', quantity: 5 }),
    ]);
    expect(violations).toHaveLength(0);
  });
});
