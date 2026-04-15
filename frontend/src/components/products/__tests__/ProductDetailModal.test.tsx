import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ProductDetailModal } from '../ProductDetailModal';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';
import type { Product } from '@/types/product.types';

vi.mock('@/api/products.api', () => ({
  productsApi: {
    getProducts: vi.fn(),
    getCategories: vi.fn(),
    getProduct: vi.fn(),
    uploadImage: vi.fn().mockResolvedValue({}),
    deleteImage: vi.fn().mockResolvedValue(undefined),
  },
}));

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const managerUser: User = { id: '2', email: 'm@m.com', name: 'Manager', role: 'MANAGER' };
const adminUser: User = { id: '3', email: 'a@a.com', name: 'Admin', role: 'ADMIN' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

const onClose = vi.fn();

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Тестовый товар',
    isActive: true,
    stock: 10,
    prices: [{ value: 500, currency: 'RUB', priceGroup: 'Прайс основной' }],
    ...overrides,
  };
}

function renderModal(product: Product | null) {
  return renderWithProviders(<ProductDetailModal product={product} onClose={onClose} />);
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  onClose.mockClear();
});

describe('ProductDetailModal — renders', () => {
  it('renders nothing when product is null', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    const { container } = renderModal(null);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders product name', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct());
    expect(screen.getByText('Тестовый товар')).toBeInTheDocument();
  });

  it('strips PET KEG from дкл product name', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct({ name: 'Jaws Weizen PET KEG 20 л.', unit: 'дкл', stock: 6 }));
    expect(screen.queryByText(/PET KEG/i)).not.toBeInTheDocument();
    // displayName appears in dialog title
    expect(screen.getAllByText('Jaws Weizen 20 л.').length).toBeGreaterThanOrEqual(1);
  });

  it('renders description when present', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct({ description: 'Освежающий светлый эль' }));
    expect(screen.getByText('Освежающий светлый эль')).toBeInTheDocument();
  });

  it('does not show description text when absent', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct());
    expect(screen.queryByText('Освежающий светлый эль')).not.toBeInTheDocument();
  });

  it('renders characteristics as key-value rows', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct({ characteristics: { Алк: '5.1%', Объём: '500мл' } }));
    expect(screen.getByText('Алк')).toBeInTheDocument();
    expect(screen.getByText('5.1%')).toBeInTheDocument();
    expect(screen.getByText('Объём')).toBeInTheDocument();
    expect(screen.getByText('500мл')).toBeInTheDocument();
  });

  it('shows image when imageUrl is provided', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct({ imageUrl: '/uploads/test.jpg' }));
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/uploads/test.jpg');
  });

  it('shows placeholder text when no imageUrl', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct());
    expect(screen.getByText('Нет фото')).toBeInTheDocument();
  });

  it('calls onClose when "Закрыть" button is clicked', async () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct());
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close icon button is clicked', async () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct());
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть диалог' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ProductDetailModal — роли', () => {
  it('CLIENT: shows quantity input when in stock', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct({ stock: 5 }));
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('CLIENT: no quantity input when out of stock', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct({ stock: 0 }));
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('CLIENT with canOrder=false: no quantity input', () => {
    const viewOnlyClient: User = { ...clientUser, canOrder: false };
    useAuthStore.getState().setAuth(viewOnlyClient, tokens);
    renderModal(makeProduct({ stock: 5 }));
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('MANAGER: no quantity input', () => {
    useAuthStore.getState().setAuth(managerUser, tokens);
    renderModal(makeProduct({ stock: 5 }));
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('ADMIN: shows "Загрузить фото" button', () => {
    useAuthStore.getState().setAuth(adminUser, tokens);
    renderModal(makeProduct());
    expect(screen.getByRole('button', { name: /загрузить фото/i })).toBeInTheDocument();
  });

  it('ADMIN: shows "Удалить фото" when imageUrl present', () => {
    useAuthStore.getState().setAuth(adminUser, tokens);
    renderModal(makeProduct({ imageUrl: '/uploads/test.jpg' }));
    expect(screen.getByRole('button', { name: /удалить фото/i })).toBeInTheDocument();
  });

  it('ADMIN: no "Удалить фото" when no imageUrl', () => {
    useAuthStore.getState().setAuth(adminUser, tokens);
    renderModal(makeProduct());
    expect(screen.queryByRole('button', { name: /удалить фото/i })).not.toBeInTheDocument();
  });

  it('CLIENT: no "Загрузить фото" button', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderModal(makeProduct());
    expect(screen.queryByRole('button', { name: /загрузить фото/i })).not.toBeInTheDocument();
  });
});
