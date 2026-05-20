/**
 * KEG unit helpers — shared between order pricing (DB) and ERP order push.
 *
 * МойСклад sells kegs in дкл (decalitres) priced per 10 L, while the app shows
 * and stores prices per whole keg. `resolveKegPrice` converts дкл→keg for the DB
 * order; `toErpUnits` does the inverse (keg→дкл) when pushing to the ERP.
 *
 * Kegs explicitly marked "ШТ" are sold by the piece — no conversion applies.
 */

const PIECE_MARKER = /(?:^|\s)ШТ(?=\s|$|[.,])/;
const VOLUME_RE = /(?<!\d)(10|20|30)\s*л\.?/i;

export function isKegSoldByPiece(name: string): boolean {
  return PIECE_MARKER.test(name);
}

export function isKeg(name: string, unit: string | null): boolean {
  if (isKegSoldByPiece(name)) return false;
  return unit === 'дкл' || /PET\s+KEG/i.test(name);
}

/** Volume multiplier from the name (20 л → 2, 30 л → 3); null when absent. */
export function kegVolumeFactor(name: string): number | null {
  const match = name.match(VOLUME_RE);
  if (!match) return null;
  return parseInt(match[1], 10) / 10;
}

/** Per-дкл price → per-keg price (дкл order pricing for the DB / emails). */
export function resolveKegPrice(price: number, name: string, unit: string | null): number {
  if (!isKeg(name, unit)) return price;
  const factor = kegVolumeFactor(name);
  if (!factor) return price;
  return Math.round(price * factor * 100) / 100;
}

export interface ErpUnits {
  /** Quantity in the product's ERP unit (дкл for kegs, шт otherwise). */
  quantity: number;
  /** Unit price in kopecks for that ERP unit. */
  priceKopecks: number;
}

/**
 * Inverse of `resolveKegPrice`: convert a stored per-keg quantity/price into the
 * units МойСклад expects on a customerorder position.
 * - дкл keg: quantity × factor (дкл), price ÷ factor (per дкл), in kopecks.
 * - ШТ keg / non-keg: quantity unchanged, price as-is, in kopecks.
 */
export function toErpUnits(
  quantity: number,
  kegPrice: number,
  name: string,
  unit: string | null,
): ErpUnits {
  if (isKeg(name, unit)) {
    const factor = kegVolumeFactor(name);
    if (factor) {
      return {
        quantity: quantity * factor,
        priceKopecks: Math.round((kegPrice / factor) * 100),
      };
    }
  }
  return { quantity, priceKopecks: Math.round(kegPrice * 100) };
}
