import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { OrderDetailPage } from '../OrderDetailPage';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

vi.mock('@/hooks/useOrders', () => ({
  useOrder: vi.fn(),
  useCancelOrder: vi.fn(),
  useRepeatOrder: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'order-1' }),
    useNavigate: () => vi.fn(),
  };
});

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  userId: '1',
  status: 'PENDING' as const,
  totalAmount: 200,
  user: { id: '1', name: 'Client', email: 'c@c.com' },
  items: [
    {
      id: 'item-1',
      productId: 'p1',
      quantity: 2,
      price: 100,
      currency: 'RUB',
      product: { id: 'p1', name: 'Молоко' },
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(async () => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(clientUser, tokens);
  vi.clearAllMocks();

  const { useOrder, useCancelOrder, useRepeatOrder } = await import('@/hooks/useOrders');
  vi.mocked(useOrder).mockReturnValue({
    data: mockOrder,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useOrder>);
  vi.mocked(useCancelOrder).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCancelOrder>);
  vi.mocked(useRepeatOrder).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useRepeatOrder>);
});

describe('OrderDetailPage', () => {
  it('renders order details', async () => {
    renderWithProviders(<OrderDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Молоко')).toBeInTheDocument();
    });
  });

  it('shows cancel button for PENDING order (CLIENT)', async () => {
    renderWithProviders(<OrderDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /отменить|cancel/i })).toBeInTheDocument();
    });
  });

  it('hides cancel button for CANCELLED order', async () => {
    const { useOrder } = await import('@/hooks/useOrders');
    vi.mocked(useOrder).mockReturnValue({
      data: { ...mockOrder, status: 'CANCELLED' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrder>);

    renderWithProviders(<OrderDetailPage />);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /отменить|cancel/i })).not.toBeInTheDocument();
    });
  });

  it('shows repeat button', async () => {
    renderWithProviders(<OrderDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /повторить|repeat/i })).toBeInTheDocument();
    });
  });

  it('calls cancelOrder mutation when cancel button clicked', async () => {
    const { useCancelOrder } = await import('@/hooks/useOrders');
    const mockMutate = vi.fn();
    vi.mocked(useCancelOrder).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCancelOrder>);

    renderWithProviders(<OrderDetailPage />);
    await userEvent.click(screen.getByRole('button', { name: /отменить|cancel/i }));
    expect(mockMutate).toHaveBeenCalledWith('order-1', expect.any(Object));
  });
});
