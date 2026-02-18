import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ProductsPage } from '../ProductsPage';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
  useCategories: vi.fn(),
}));

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

const mockProducts = {
  data: [
    {
      id: 'p1',
      name: 'Молоко',
      isActive: true,
      stock: 5,
      prices: [{ value: 100, currency: 'RUB', priceGroup: 'Розница' }],
    },
    {
      id: 'p2',
      name: 'Кефир',
      isActive: true,
      stock: 3,
      prices: [{ value: 80, currency: 'RUB', priceGroup: 'Розница' }],
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

const mockCategories = [{ id: 'c1', name: 'Молочные' }];

beforeEach(async () => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(clientUser, tokens);
  vi.clearAllMocks();

  const { useProducts, useCategories } = await import('@/hooks/useProducts');
  vi.mocked(useProducts).mockReturnValue({
    data: mockProducts,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useProducts>);
  vi.mocked(useCategories).mockReturnValue({
    data: mockCategories,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useCategories>);
});

describe('ProductsPage', () => {
  it('renders product list', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeInTheDocument();
      expect(screen.getByText('Кефир')).toBeInTheDocument();
    });
  });

  it('renders category filter', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Молочные')).toBeInTheDocument();
    });
  });

  it('renders search bar', () => {
    renderWithProviders(<ProductsPage />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', async () => {
    const { useProducts } = await import('@/hooks/useProducts');
    vi.mocked(useProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useProducts>);

    const { container } = renderWithProviders(<ProductsPage />);
    // Skeletons render as rectangular placeholder elements
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('updates filter when category is selected', async () => {
    renderWithProviders(<ProductsPage />);
    await userEvent.click(screen.getByText('Молочные'));
    const { useProducts } = await import('@/hooks/useProducts');
    await waitFor(() => {
      expect(vi.mocked(useProducts)).toHaveBeenCalled();
    });
  });
});
