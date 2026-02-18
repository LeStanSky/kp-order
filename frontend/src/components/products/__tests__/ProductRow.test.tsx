import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ProductRow } from '../ProductRow';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';
import type { Product } from '@/types/product.types';

const clientUser: User = { id: '1', email: 'c@c.com', name: 'Client', role: 'CLIENT' };
const managerUser: User = { id: '2', email: 'm@m.com', name: 'Manager', role: 'MANAGER' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

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

function renderRow(product: Product) {
  return renderWithProviders(
    <table>
      <tbody>
        <ProductRow product={product} />
      </tbody>
    </table>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('ProductRow — expiry badge', () => {
  it('does not show ExpiryBadge for CLIENT even if expiryStatus provided', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderRow(makeProduct({ expiryStatus: 'red' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows ExpiryBadge for MANAGER', () => {
    useAuthStore.getState().setAuth(managerUser, tokens);
    renderRow(makeProduct({ expiryStatus: 'red' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not show ExpiryBadge when expiryStatus is absent', () => {
    useAuthStore.getState().setAuth(managerUser, tokens);
    renderRow(makeProduct());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('ProductRow — РОЗЛИВ stock display (дкл → штуки)', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(clientUser, tokens);
  });

  it('shows raw stock when unit is not дкл', () => {
    renderRow(makeProduct({ stock: 12, unit: 'шт' }));
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('converts 10л keg: stock 6 дкл → 6 шт', () => {
    renderRow(makeProduct({ name: 'Пиво Светлое 10 л', stock: 6, unit: 'дкл' }));
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('converts 20л keg: stock 10 дкл → 5 шт', () => {
    renderRow(makeProduct({ name: 'Пиво Тёмное 20 л', stock: 10, unit: 'дкл' }));
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('converts 30л keg: stock 9 дкл → 3 шт', () => {
    renderRow(makeProduct({ name: 'Сидр Яблочный 30 л', stock: 9, unit: 'дкл' }));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows шт unit for converted дкл product', () => {
    renderRow(makeProduct({ name: 'Пиво 20 л', stock: 10, unit: 'дкл' }));
    expect(screen.getByText('шт')).toBeInTheDocument();
  });

  it('shows дкл unit when no volume found in name', () => {
    renderRow(makeProduct({ name: 'Пиво разливное', stock: 5, unit: 'дкл' }));
    expect(screen.getByText('дкл')).toBeInTheDocument();
  });
});
