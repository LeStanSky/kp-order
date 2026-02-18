import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';

const item1 = {
  productId: 'prod-1',
  name: 'Product One',
  price: 100,
  currency: 'RUB',
  quantity: 1,
};

const item2 = {
  productId: 'prod-2',
  name: 'Product Two',
  price: 200,
  currency: 'RUB',
  quantity: 1,
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('initial state has empty items', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('addItem adds a new product', () => {
    useCartStore.getState().addItem(item1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]).toMatchObject(item1);
  });

  it('addItem increments quantity for existing product', () => {
    useCartStore.getState().addItem(item1);
    useCartStore.getState().addItem(item1);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removeItem removes product from cart', () => {
    useCartStore.getState().addItem(item1);
    useCartStore.getState().addItem(item2);
    useCartStore.getState().removeItem('prod-1');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-2');
  });

  it('updateQuantity changes item quantity', () => {
    useCartStore.getState().addItem(item1);
    useCartStore.getState().updateQuantity('prod-1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('clearCart empties all items', () => {
    useCartStore.getState().addItem(item1);
    useCartStore.getState().addItem(item2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('totalAmount calculates correctly', () => {
    useCartStore.getState().addItem({ ...item1, quantity: 2 });
    useCartStore.getState().addItem({ ...item2, quantity: 3 });
    // 100*2 + 200*3 = 800
    expect(useCartStore.getState().totalAmount()).toBe(800);
  });

  it('totalItems counts total quantity', () => {
    useCartStore.getState().addItem({ ...item1, quantity: 2 });
    useCartStore.getState().addItem({ ...item2, quantity: 3 });
    expect(useCartStore.getState().totalItems()).toBe(5);
  });
});
