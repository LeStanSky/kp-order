import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CartDrawer } from '../CartDrawer';
import { useCartStore } from '@/store/cartStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  useCartStore.getState().clearCart();
  vi.clearAllMocks();
});

describe('CartDrawer', () => {
  it('displays cart items', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 2 });
    renderWithProviders(<CartDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Молоко')).toBeInTheDocument();
  });

  it('updates quantity when + button is clicked', async () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 1 });
    renderWithProviders(<CartDrawer open={true} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /\+/i }));
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('removes item when - is clicked at quantity 1', async () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 1 });
    renderWithProviders(<CartDrawer open={true} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /-/i }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('shows empty message when cart is empty', () => {
    renderWithProviders(<CartDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/пуст|empty/i)).toBeInTheDocument();
  });

  it('shows warning when cart violates minimum order rules', () => {
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'Молоко', price: 100, currency: 'RUB', quantity: 5 });
    renderWithProviders(<CartDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows no warning when cart has a KEG', () => {
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
    renderWithProviders(<CartDrawer open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
