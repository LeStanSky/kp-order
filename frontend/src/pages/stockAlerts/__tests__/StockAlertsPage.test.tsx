import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { StockAlertsPage } from '../StockAlertsPage';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

vi.mock('@/hooks/useStockAlerts', () => ({
  useStockAlerts: vi.fn(),
  useCreateStockAlert: vi.fn(),
  useUpdateStockAlert: vi.fn(),
  useDeleteStockAlert: vi.fn(),
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

const managerUser: User = {
  id: 'manager-1',
  email: 'manager@test.com',
  name: 'Manager',
  role: 'MANAGER',
};
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

const mockAlert = {
  id: 'alert-1',
  productId: 'prod-1',
  minStock: 10,
  isActive: true,
  product: { id: 'prod-1', cleanName: 'Beer Lager 20 л.', stocks: [{ quantity: 5 }] },
  createdBy: { id: 'manager-1', name: 'Manager', email: 'manager@test.com' },
  history: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockAlertsData = {
  data: [mockAlert],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const mockDeleteMutation = { mutate: vi.fn(), isPending: false };
const mockCreateMutation = { mutate: vi.fn(), isPending: false };
const mockUpdateMutation = { mutate: vi.fn(), isPending: false };

beforeEach(async () => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(managerUser, tokens);
  vi.clearAllMocks();

  const { useStockAlerts, useCreateStockAlert, useUpdateStockAlert, useDeleteStockAlert } =
    await import('@/hooks/useStockAlerts');
  const { useProducts } = await import('@/hooks/useProducts');

  vi.mocked(useStockAlerts).mockReturnValue({
    data: mockAlertsData,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useStockAlerts>);

  vi.mocked(useCreateStockAlert).mockReturnValue(
    mockCreateMutation as unknown as ReturnType<typeof useCreateStockAlert>,
  );
  vi.mocked(useUpdateStockAlert).mockReturnValue(
    mockUpdateMutation as unknown as ReturnType<typeof useUpdateStockAlert>,
  );
  vi.mocked(useDeleteStockAlert).mockReturnValue(
    mockDeleteMutation as unknown as ReturnType<typeof useDeleteStockAlert>,
  );

  vi.mocked(useProducts).mockReturnValue({
    data: {
      data: [
        { id: 'prod-1', cleanName: 'Beer Lager 20 л.', category: 'Beer', stocks: [], prices: [] },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useProducts>);
});

describe('StockAlertsPage', () => {
  it('renders alert list with product name and minStock', async () => {
    renderWithProviders(<StockAlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('Beer Lager 20 л.')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton when isLoading', async () => {
    const { useStockAlerts } = await import('@/hooks/useStockAlerts');
    vi.mocked(useStockAlerts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useStockAlerts>);

    renderWithProviders(<StockAlertsPage />);
    expect(screen.getByTestId('alerts-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', async () => {
    const { useStockAlerts } = await import('@/hooks/useStockAlerts');
    vi.mocked(useStockAlerts).mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStockAlerts>);

    renderWithProviders(<StockAlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('Оповещений пока нет')).toBeInTheDocument();
    });
  });

  it('calls deleteAlert mutation on delete button click', async () => {
    renderWithProviders(<StockAlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('Beer Lager 20 л.')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-alert-alert-1');
    fireEvent.click(deleteBtn);

    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith('alert-1');
  });

  it('opens dialog on "Добавить оповещение" button click', async () => {
    renderWithProviders(<StockAlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('Добавить оповещение')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Добавить оповещение'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows current stock value for each alert', async () => {
    renderWithProviders(<StockAlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // current stock
    });
  });
});
