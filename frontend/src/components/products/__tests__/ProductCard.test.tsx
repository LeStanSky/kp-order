import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ProductCard } from '../ProductCard';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types/product.types';
import type { User } from '@/types/user.types';

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Test Product',
  isActive: true,
  stock: 10,
  prices: [{ value: 500, currency: 'RUB', priceGroup: 'Розница' }],
};

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useCartStore.getState().clearCart();
  vi.clearAllMocks();
});

describe('ProductCard', () => {
  it('displays product name', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('displays price', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('add to cart button calls cartStore.addItem', async () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<ProductCard product={mockProduct} />);
    const btn = screen.getByRole('button', { name: /корзину|cart/i });
    await userEvent.click(btn);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe('prod-1');
  });

  it('cart button is disabled when stock is 0', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    const outOfStock = { ...mockProduct, stock: 0 };
    renderWithProviders(<ProductCard product={outOfStock} />);
    expect(screen.getByRole('button', { name: /корзину|cart/i })).toBeDisabled();
  });

  it('does not show cart button for ADMIN role', () => {
    useAuthStore.getState().setAuth({ ...clientUser, role: 'ADMIN' }, tokens);
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.queryByRole('button', { name: /корзину|cart/i })).not.toBeInTheDocument();
  });

  it('shows ExpiryBadge when expiryStatus is present', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    const product = { ...mockProduct, expiryStatus: 'red' as const };
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
