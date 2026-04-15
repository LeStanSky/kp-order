import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ProductRow } from '../ProductRow';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
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
  useCartStore.getState().clearCart();
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

describe('ProductRow — canOrder flag', () => {
  it('hides cart controls for CLIENT with canOrder=false', () => {
    const viewOnlyClient: User = { ...clientUser, canOrder: false };
    useAuthStore.getState().setAuth(viewOnlyClient, tokens);
    renderRow(makeProduct());
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('shows cart controls for CLIENT with canOrder=true', () => {
    const orderClient: User = { ...clientUser, canOrder: true };
    useAuthStore.getState().setAuth(orderClient, tokens);
    renderRow(makeProduct());
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
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
    renderRow(makeProduct({ name: 'Пиво Светлое PET KEG 10 л', stock: 6, unit: 'дкл' }));
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('converts 20л keg: stock 10 дкл → 5 шт', () => {
    renderRow(makeProduct({ name: 'Пиво Тёмное PET KEG 20 л', stock: 10, unit: 'дкл' }));
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('converts 30л keg: stock 9 дкл → 3 шт', () => {
    renderRow(makeProduct({ name: 'Сидр Яблочный PET KEG 30 л', stock: 9, unit: 'дкл' }));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows шт unit for converted дкл product', () => {
    renderRow(makeProduct({ name: 'Пиво PET KEG 20 л', stock: 10, unit: 'дкл' }));
    expect(screen.getByText('шт')).toBeInTheDocument();
  });

  it('converts keg when unit is null but PET KEG in name', () => {
    renderRow(makeProduct({ name: 'Jaws Hopfenbock PET KEG 20л', stock: 10, unit: undefined }));
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('шт')).toBeInTheDocument();
  });

  it('shows дкл when no volume pattern in name', () => {
    renderRow(makeProduct({ name: 'Пиво разливное', stock: 5, unit: 'дкл' }));
    expect(screen.getByText('дкл')).toBeInTheDocument();
  });

  it('shows дкл unit when no volume found in name', () => {
    renderRow(makeProduct({ name: 'Пиво разливное', stock: 5, unit: 'дкл' }));
    expect(screen.getByText('дкл')).toBeInTheDocument();
  });
});

describe('ProductRow — скрытие слова "розлив" в названии', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(clientUser, tokens);
  });

  it('убирает слово "Розлив" из названия для дкл-товара', () => {
    renderRow(makeProduct({ name: 'Jaws Розлив 20 л', stock: 4, unit: 'дкл' }));
    expect(screen.queryByText(/розлив/i)).not.toBeInTheDocument();
    expect(screen.getByText('Jaws 20 л')).toBeInTheDocument();
  });

  it('убирает "розлив" в нижнем регистре', () => {
    renderRow(makeProduct({ name: 'Степь и Ветер розлив 30 л', stock: 3, unit: 'дкл' }));
    expect(screen.queryByText(/розлив/i)).not.toBeInTheDocument();
    expect(screen.getByText('Степь и Ветер 30 л')).toBeInTheDocument();
  });

  it('не трогает название для не-дкл товара', () => {
    renderRow(makeProduct({ name: 'Пиво Розлив бутылочный', stock: 5, unit: 'шт' }));
    expect(screen.getByText('Пиво Розлив бутылочный')).toBeInTheDocument();
  });
});

describe('ProductRow — скрытие "PET KEG" в названии', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(clientUser, tokens);
  });

  it('убирает "PET KEG" из названия для дкл-товара', () => {
    renderRow(makeProduct({ name: 'Jaws Weizen алк.5,1% PET KEG 20 л.', stock: 6, unit: 'дкл' }));
    expect(screen.queryByText(/PET KEG/i)).not.toBeInTheDocument();
    expect(screen.getByText('Jaws Weizen алк.5,1% 20 л.')).toBeInTheDocument();
  });

  it('не трогает название для не-дкл товара без PET KEG', () => {
    renderRow(makeProduct({ name: 'Пиво светлое бутылочное', stock: 5, unit: 'шт' }));
    expect(screen.getByText('Пиво светлое бутылочное')).toBeInTheDocument();
  });
});

describe('ProductRow — цена KEG (дкл × объём)', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(clientUser, tokens);
  });

  it('не пересчитывает цену для шт-товара', () => {
    renderRow(
      makeProduct({
        name: 'Пиво 500мл',
        unit: 'шт',
        prices: [{ value: 200, currency: 'RUB', priceGroup: 'Прайс основной' }],
      }),
    );
    expect(screen.getByText('200.00 RUB')).toBeInTheDocument();
  });

  it('умножает цену ×2 для 20л кега', () => {
    renderRow(
      makeProduct({
        name: 'Jaws Weizen PET KEG 20 л.',
        unit: 'дкл',
        stock: 6,
        prices: [{ value: 1800, currency: 'RUB', priceGroup: 'Прайс основной' }],
      }),
    );
    expect(screen.getByText('3600.00 RUB')).toBeInTheDocument();
  });

  it('умножает цену ×3 для 30л кега', () => {
    renderRow(
      makeProduct({
        name: 'Ostrovica APA PET KEG 30 л.',
        unit: 'дкл',
        stock: 6,
        prices: [{ value: 2000, currency: 'RUB', priceGroup: 'Прайс основной' }],
      }),
    );
    expect(screen.getByText('6000.00 RUB')).toBeInTheDocument();
  });

  it('умножает цену ×1 для 10л кега', () => {
    renderRow(
      makeProduct({
        name: 'Пиво Светлое PET KEG 10 л.',
        unit: 'дкл',
        stock: 4,
        prices: [{ value: 1000, currency: 'RUB', priceGroup: 'Прайс основной' }],
      }),
    );
    expect(screen.getByText('1000.00 RUB')).toBeInTheDocument();
  });

  it('показывает исходную цену для дкл без объёма в названии', () => {
    renderRow(
      makeProduct({
        name: 'Пиво разливное',
        unit: 'дкл',
        stock: 5,
        prices: [{ value: 1500, currency: 'RUB', priceGroup: 'Прайс основной' }],
      }),
    );
    expect(screen.getByText('1500.00 RUB')).toBeInTheDocument();
  });
});

describe('ProductRow — KEG ШТ (маркер "ШТ" в названии)', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(clientUser, tokens);
  });

  it('не делит остаток для позиции с маркером ШТ (unit=дкл)', () => {
    renderRow(makeProduct({ name: 'Jaws APA алк. 5,5% об. 20л ШТ', stock: 6, unit: 'дкл' }));
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('не умножает цену для позиции с маркером ШТ', () => {
    renderRow(
      makeProduct({
        name: 'Jaws APA алк. 5,5% об. 20л ШТ',
        unit: 'дкл',
        stock: 6,
        prices: [{ value: 1800, currency: 'RUB', priceGroup: 'Прайс основной' }],
      }),
    );
    expect(screen.getByText('1800.00 RUB')).toBeInTheDocument();
  });

  it('не делит остаток для позиции ШТ с PET KEG в названии', () => {
    renderRow(makeProduct({ name: 'Jaws APA PET KEG 20 л. ШТ', stock: 4, unit: 'шт' }));
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('убирает маркер "ШТ" и "PET KEG" из отображаемого названия', () => {
    renderRow(makeProduct({ name: 'Jaws APA PET KEG 20 л. ШТ', stock: 4, unit: 'шт' }));
    expect(screen.queryByText(/PET KEG/i)).not.toBeInTheDocument();
    expect(screen.getByText('Jaws APA 20 л.')).toBeInTheDocument();
  });

  it('убирает маркер "ШТ" из названия (unit=дкл)', () => {
    renderRow(makeProduct({ name: 'Jaws APA алк. 5,5% об. 20л ШТ', stock: 6, unit: 'дкл' }));
    expect(screen.getByText('Jaws APA алк. 5,5% об. 20л')).toBeInTheDocument();
  });

  it('не трогает слова, содержащие "шт" в нижнем регистре (например "штук")', () => {
    renderRow(makeProduct({ name: 'Пиво штучное', stock: 5, unit: 'шт' }));
    expect(screen.getByText('Пиво штучное')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('ProductRow — auto-add to cart (debounced)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAuthStore.getState().setAuth(clientUser, tokens);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('добавляет позицию в корзину после debounce', () => {
    renderRow(makeProduct({ stock: 10 }));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '4' } });
    act(() => {
      vi.runAllTimers();
    });
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: 'p1', quantity: 4 });
  });

  it('обновляет количество при повторном вводе', () => {
    useCartStore.getState().addItem({
      productId: 'p1',
      name: 'Тестовый товар',
      price: 500,
      currency: 'RUB',
      quantity: 2,
    });
    renderRow(makeProduct({ stock: 10 }));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '6' } });
    act(() => {
      vi.runAllTimers();
    });
    expect(useCartStore.getState().items[0].quantity).toBe(6);
  });

  it('удаляет позицию при вводе 0', () => {
    useCartStore.getState().addItem({
      productId: 'p1',
      name: 'Тестовый товар',
      price: 500,
      currency: 'RUB',
      quantity: 3,
    });
    renderRow(makeProduct({ stock: 10 }));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });
    act(() => {
      vi.runAllTimers();
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('показывает чип с количеством, когда позиция в корзине', () => {
    useCartStore.getState().addItem({
      productId: 'p1',
      name: 'Тестовый товар',
      price: 500,
      currency: 'RUB',
      quantity: 7,
    });
    renderRow(makeProduct({ stock: 10 }));
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('клампит ввод до размера остатка', () => {
    renderRow(makeProduct({ stock: 5 }));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999' } });
    act(() => {
      vi.runAllTimers();
    });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });
});
