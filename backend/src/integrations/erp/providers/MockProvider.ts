import { IERPProvider } from '../IERPProvider';
import { ERPProduct, ERPStock } from '../../../types/erp.types';

const PRICE_TYPES = [
  'Прайс основной',
  'Прайс 1 уровень',
  'Прайс 2 уровень',
  'Прайс Спот',
  'Прайс Субы',
  'Прайс Градусы',
  'Прайс Пив.com',
  'Прайс beer.exe',
  'Прайс ХС',
];

function makePrices(base: number) {
  return PRICE_TYPES.map((name, i) => ({
    priceTypeName: name,
    value: Math.round(base * (1 - i * 0.03) * 100) / 100,
    currency: 'RUB',
  }));
}

const MOCK_PRODUCTS: ERPProduct[] = [
  {
    id: 'mock-001',
    name: 'Jaws Weizen алк.5,1% об. 500мл',
    category: 'Jaws',
    unit: 'шт',
    salePrices: makePrices(220),
  },
  {
    id: 'mock-002',
    name: 'Jaws Lager алк.4,8% об. 500мл',
    category: 'Jaws',
    unit: 'шт',
    salePrices: makePrices(200),
  },
  {
    id: 'mock-003',
    name: 'Jaws Blanche алк.4,5% об. 500мл',
    category: 'Jaws',
    unit: 'шт',
    salePrices: makePrices(230),
  },
  {
    id: 'mock-004',
    name: 'Jaws IPA алк.6,5% об. 330мл',
    category: 'Jaws',
    unit: 'шт',
    salePrices: makePrices(280),
  },
  {
    id: 'mock-005',
    name: 'Mjolnir Медовуха классическая алк.5,0% об. 500мл',
    category: 'Mjolnir',
    unit: 'шт',
    salePrices: makePrices(300),
  },
  {
    id: 'mock-006',
    name: 'Mjolnir Медовуха вишнёвая алк.5,0% об. 500мл',
    category: 'Mjolnir',
    unit: 'шт',
    salePrices: makePrices(320),
  },
  {
    id: 'mock-007',
    name: 'Ostrovica Pils алк.4,7% об. 500мл',
    category: 'Ostrovica',
    unit: 'шт',
    salePrices: makePrices(240),
  },
  {
    id: 'mock-008',
    name: 'Lapochka Pale Ale алк.5,3% об. 330мл',
    category: 'Lapochka',
    unit: 'шт',
    salePrices: makePrices(260),
  },
  {
    id: 'mock-009',
    name: 'Бродилка Сидр яблочный алк.4,5% об. 500мл',
    category: 'Бродилка сидры',
    unit: 'шт',
    salePrices: makePrices(250),
  },
  {
    id: 'mock-010',
    name: 'Полукультурка Сидр грушевый алк.4,0% об. 500мл',
    category: 'Полукультурка сидры',
    unit: 'шт',
    salePrices: makePrices(270),
  },
  {
    id: 'mock-011',
    name: 'Степь и Ветер Wheat Ale алк.4,9% об. 500мл',
    category: 'Степь и Ветер',
    unit: 'шт',
    salePrices: makePrices(210),
  },
  {
    id: 'mock-012',
    name: 'Jaws Stout алк.7,0% об. 330мл',
    category: 'Jaws',
    unit: 'шт',
    salePrices: makePrices(310),
  },
  {
    id: 'mock-013',
    name: 'Jaws Weizen алк.5,1% PET KEG 20 л.',
    category: 'Jaws Розлив',
    unit: 'дкл',
    salePrices: makePrices(1800),
  },
  {
    id: 'mock-014',
    name: 'Чипсы крафтовые с паприкой 100г',
    category: 'Чипсы',
    unit: 'шт',
    salePrices: makePrices(150),
  },
  {
    id: 'mock-015',
    name: 'Ostrovica APA алк.5,5% PET KEG 30 л.',
    category: 'Ostrovica розлив',
    unit: 'дкл',
    salePrices: makePrices(2000),
  },
];

const MOCK_STOCKS: ERPStock[] = [
  {
    productExternalId: 'mock-001',
    productName: 'Jaws Weizen алк.5,1% об. 500мл / 2026-08-15 ЧЗ',
    quantity: 120,
  },
  {
    productExternalId: 'mock-002',
    productName: 'Jaws Lager алк.4,8% об. 500мл / 2026-06-20 ЧЗ',
    quantity: 85,
  },
  {
    productExternalId: 'mock-003',
    productName: 'Jaws Blanche алк.4,5% об. 500мл / 2026-11-18 ЧЗ',
    quantity: 200,
  },
  {
    productExternalId: 'mock-004',
    productName: 'Jaws IPA алк.6,5% об. 330мл / 2026-04-10 ЧЗ',
    quantity: 45,
  },
  {
    productExternalId: 'mock-005',
    productName: 'Mjolnir Медовуха классическая алк.5,0% об. 500мл / 2026-12-01',
    quantity: 60,
  },
  {
    productExternalId: 'mock-006',
    productName: 'Mjolnir Медовуха вишнёвая алк.5,0% об. 500мл / 2026-09-30 ЧЗ',
    quantity: 30,
  },
  {
    productExternalId: 'mock-007',
    productName: 'Ostrovica Pils алк.4,7% об. 500мл / 2026-07-22 ЧЗ',
    quantity: 150,
  },
  {
    productExternalId: 'mock-008',
    productName: 'Lapochka Pale Ale алк.5,3% об. 330мл / 2026-05-14 ЧЗ',
    quantity: 70,
  },
  {
    productExternalId: 'mock-009',
    productName: 'Бродилка Сидр яблочный алк.4,5% об. 500мл / 2026-10-05 ЧЗ',
    quantity: 90,
  },
  {
    productExternalId: 'mock-010',
    productName: 'Полукультурка Сидр грушевый алк.4,0% об. 500мл / 2026-03-28 ЧЗ',
    quantity: 40,
  },
  {
    productExternalId: 'mock-011',
    productName: 'Степь и Ветер Wheat Ale алк.4,9% об. 500мл / 2026-08-01',
    quantity: 110,
  },
  {
    productExternalId: 'mock-012',
    productName: 'Jaws Stout алк.7,0% об. 330мл / 2026-06-15 ЧЗ',
    quantity: 55,
  },
  {
    productExternalId: 'mock-013',
    productName: 'Jaws Weizen алк.5,1% PET KEG 20 л. / 2026-08-15',
    quantity: 6,
  },
  { productExternalId: 'mock-014', productName: 'Чипсы крафтовые с паприкой 100г', quantity: 300 },
  {
    productExternalId: 'mock-015',
    productName: 'Ostrovica APA алк.5,5% PET KEG 30 л. / 2026-07-20',
    quantity: 6,
  },
];

export class MockProvider implements IERPProvider {
  async getProducts(): Promise<ERPProduct[]> {
    return MOCK_PRODUCTS;
  }

  async getStock(): Promise<ERPStock[]> {
    return MOCK_STOCKS;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
