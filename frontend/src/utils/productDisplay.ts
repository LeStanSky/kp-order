import type { Price } from '@/types/product.types';

/**
 * Для дкл-товаров (KEG) убирает "PET KEG" и "розлив" из отображаемого названия.
 */
export function resolveDisplayName(name: string, unit: string | undefined): string {
  if (unit !== 'дкл') return name;
  return name
    .replace(/\bPET\s+KEG\b\s*/gi, '')
    .replace(/розлив\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Для KEG-товаров (дкл) вычисляет отображаемый остаток в штуках.
 * Объём тары из названия: 10 л → ÷1, 20 л → ÷2, 30 л → ÷3.
 */
export function resolveStock(
  name: string,
  stock: number,
  unit: string | undefined,
): { value: number; unit: string } {
  if (unit === 'дкл') {
    const match = name.match(/(?<!\d)(10|20|30)\s*л/i);
    if (match) {
      const factor = parseInt(match[1], 10) / 10;
      return { value: Math.floor(stock / factor), unit: 'шт' };
    }
  }
  return { value: stock, unit: unit ?? 'шт' };
}

/**
 * Для KEG-товаров (дкл) пересчитывает цену за 10л → цену за весь кег.
 * 20л → ×2, 30л → ×3.
 */
export function resolvePrice(
  prices: Price[],
  name: string,
  unit: string | undefined,
): Price | null {
  const price = prices[0] ?? null;
  if (!price || unit !== 'дкл') return price;
  const match = name.match(/(?<!\d)(10|20|30)\s*л/i);
  if (!match) return price;
  const factor = parseInt(match[1], 10) / 10;
  return { ...price, value: Math.round(price.value * factor * 100) / 100 };
}
