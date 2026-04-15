import type { Price } from '@/types/product.types';

/** Форматирует число как цену с ровно 2 знаками после запятой. */
export function formatPrice(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

const PIECE_MARKER = /(?:^|\s)ШТ(?=\s|$|[.,])/;
const PIECE_MARKER_STRIP = /(^|\s)ШТ(?=\s|$|[.,])/g;

/** KEG-позиция в штуках: маркер "ШТ" в названии. Остаток и цена не пересчитываются. */
export function isKegSoldByPiece(name: string): boolean {
  return PIECE_MARKER.test(name);
}

function hasKegName(name: string): boolean {
  return /PET\s+KEG/i.test(name);
}

/** Определяет, является ли товар KEG-позицией в декалитрах (требует конвертации). */
export function isKeg(name: string, unit: string | undefined): boolean {
  if (isKegSoldByPiece(name)) return false;
  return unit === 'дкл' || hasKegName(name);
}

/**
 * Для KEG-товаров убирает "PET KEG", "розлив" и маркер "ШТ" из отображаемого названия.
 */
export function resolveDisplayName(name: string, unit: string | undefined): string {
  if (!hasKegName(name) && unit !== 'дкл' && !isKegSoldByPiece(name)) return name;
  return name
    .replace(/\bPET\s+KEG\b\s*/gi, '')
    .replace(/розлив\s*/gi, '')
    .replace(PIECE_MARKER_STRIP, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Для KEG-товаров вычисляет отображаемый остаток в штуках.
 * Объём тары из названия: 10 л → ÷1, 20 л → ÷2, 30 л → ÷3.
 */
export function resolveStock(
  name: string,
  stock: number,
  unit: string | undefined,
): { value: number; unit: string } {
  if (isKeg(name, unit)) {
    const match = name.match(/(?<!\d)(10|20|30)\s*л\.?/i);
    if (match) {
      const factor = parseInt(match[1], 10) / 10;
      return { value: Math.floor(stock / factor), unit: 'шт' };
    }
  }
  return { value: stock, unit: unit ?? 'шт' };
}

/**
 * Для KEG-товаров пересчитывает цену за 10л → цену за весь кег.
 * 20л → ×2, 30л → ×3.
 */
export function resolvePrice(
  prices: Price[],
  name: string,
  unit: string | undefined,
): Price | null {
  const price = prices[0] ?? null;
  if (!price || !isKeg(name, unit)) return price;
  const match = name.match(/(?<!\d)(10|20|30)\s*л\.?/i);
  if (!match) return price;
  const factor = parseInt(match[1], 10) / 10;
  return { ...price, value: Math.round(price.value * factor * 100) / 100 };
}
