import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { OrdersPage } from '../OrdersPage';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

vi.mock('@/hooks/useOrders', () => ({
  useOrders: vi.fn(),
}));

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

const mockOrders = {
  data: [
    {
      id: 'o1',
      orderNumber: 'ORD-001',
      userId: '1',
      status: 'PENDING' as const,
      totalAmount: 500,
      user: { id: '1', name: 'Client', email: 'c@c.com' },
      items: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

beforeEach(async () => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(clientUser, tokens);
  vi.clearAllMocks();

  const { useOrders } = await import('@/hooks/useOrders');
  vi.mocked(useOrders).mockReturnValue({
    data: mockOrders,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useOrders>);
});

describe('OrdersPage', () => {
  it('renders order list', async () => {
    renderWithProviders(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  });

  it('shows order status chip', async () => {
    renderWithProviders(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText('Ожидает')).toBeInTheDocument();
    });
  });

  it('shows empty message when no orders', async () => {
    const { useOrders } = await import('@/hooks/useOrders');
    vi.mocked(useOrders).mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrders>);

    renderWithProviders(<OrdersPage />);
    await waitFor(() => {
      expect(screen.getByText('Заказов пока нет')).toBeInTheDocument();
    });
  });
});
