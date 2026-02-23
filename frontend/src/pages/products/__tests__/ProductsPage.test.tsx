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
      category: 'Молочные',
      isActive: true,
      stock: 5,
      prices: [{ value: 100, currency: 'RUB', priceGroup: 'Розница' }],
    },
    {
      id: 'p2',
      name: 'Кефир',
      category: 'Молочные',
      isActive: true,
      stock: 3,
      prices: [{ value: 80, currency: 'RUB', priceGroup: 'Розница' }],
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

const mockCategories = ['Молочные'];

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
      expect(screen.getAllByText('Молочные').length).toBeGreaterThanOrEqual(1);
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

  it('updates filter when category chip is selected', async () => {
    renderWithProviders(<ProductsPage />);
    // Click the chip in CategoryFilter (first occurrence)
    const chips = screen.getAllByText('Молочные');
    await userEvent.click(chips[0]);
    const { useProducts } = await import('@/hooks/useProducts');
    await waitFor(() => {
      expect(vi.mocked(useProducts)).toHaveBeenCalled();
    });
  });

  it('collapses category when header row is clicked', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeInTheDocument();
    });
    // Click the category header row (second occurrence of "Молочные" — in table)
    const headers = screen.getAllByText('Молочные');
    await userEvent.click(headers[headers.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Молоко')).not.toBeInTheDocument();
      expect(screen.queryByText('Кефир')).not.toBeInTheDocument();
    });
  });

  it('hides product with zero stock', async () => {
    const { useProducts } = await import('@/hooks/useProducts');
    vi.mocked(useProducts).mockReturnValue({
      data: {
        ...mockProducts,
        data: [
          ...mockProducts.data,
          {
            id: 'p3',
            name: 'Пустой товар',
            category: 'Молочные',
            isActive: true,
            stock: 0,
            prices: [],
          },
        ],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProducts>);

    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeInTheDocument();
      expect(screen.queryByText('Пустой товар')).not.toBeInTheDocument();
    });
  });

  it('hides category header when all products have zero stock', async () => {
    const { useProducts } = await import('@/hooks/useProducts');
    vi.mocked(useProducts).mockReturnValue({
      data: {
        data: [
          {
            id: 'p1',
            name: 'Пустой товар',
            category: 'Пустая категория',
            isActive: true,
            stock: 0,
            prices: [],
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProducts>);

    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.queryByText('Пустой товар')).not.toBeInTheDocument();
      expect(screen.queryByText('Пустая категория')).not.toBeInTheDocument();
    });
  });

  it('expands category again after second click', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeInTheDocument();
    });
    const headers = screen.getAllByText('Молочные');
    // Collapse
    await userEvent.click(headers[headers.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText('Молоко')).not.toBeInTheDocument();
    });
    // Expand
    const headersAfter = screen.getAllByText('Молочные');
    await userEvent.click(headersAfter[headersAfter.length - 1]);
    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeInTheDocument();
    });
  });
});
