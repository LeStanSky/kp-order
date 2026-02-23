import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CartPage } from '../CartPage';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

vi.mock('@/api/orders.api', () => ({
  ordersApi: {
    createOrder: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(clientUser, tokens);
  useCartStore.getState().clearCart();
  vi.clearAllMocks();
});

describe('CartPage', () => {
  it('shows order minimum warning when packaged total < 40', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 5 });
    renderWithProviders(<CartPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/40/)).toBeInTheDocument();
  });

  it('shows per-item warning when non-KEG item qty < 3', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 2 });
    renderWithProviders(<CartPage />);
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/минимум 3/i)).toBeInTheDocument();
  });

  it('disables submit button when there are violations', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 2 });
    renderWithProviders(<CartPage />);
    expect(screen.getByRole('button', { name: /подтвердить/i })).toBeDisabled();
  });

  it('enables submit button when cart is valid (KEG present)', () => {
    useCartStore
      .getState()
      .addItem({
        productId: 'k1',
        name: 'Jaws PET KEG 20л',
        price: 3600,
        currency: 'RUB',
        quantity: 1,
        isKeg: true,
      });
    renderWithProviders(<CartPage />);
    expect(screen.getByRole('button', { name: /подтвердить/i })).not.toBeDisabled();
  });

  it('enables submit button when packaged total >= 40', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 40 });
    renderWithProviders(<CartPage />);
    expect(screen.getByRole('button', { name: /подтвердить/i })).not.toBeDisabled();
  });

  it('redirects to /products when cart is empty', () => {
    renderWithProviders(<CartPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('displays cart items', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 40 });
    renderWithProviders(<CartPage />);
    expect(screen.getByText('Молоко')).toBeInTheDocument();
  });

  it('submits order and clears cart on success', async () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 40 });
    const { ordersApi } = await import('@/api/orders.api');
    vi.mocked(ordersApi.createOrder).mockResolvedValueOnce({
      id: 'order-1',
      orderNumber: 'ORD-001',
      userId: '1',
      status: 'PENDING',
      totalAmount: 200,
      user: { id: '1', name: 'Client', email: 'c@c.com' },
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderWithProviders(<CartPage />);
    await userEvent.click(screen.getByRole('button', { name: /подтвердить|confirm|order/i }));

    await waitFor(() => {
      expect(ordersApi.createOrder).toHaveBeenCalled();
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });
});
