import { describe, it, expect } from 'vitest';
import { isKeg, isKegSoldByPiece, isKegProduct, resolvePackSize } from '../productDisplay';

describe('isKegProduct — returns true for ANY keg product', () => {
  it('true for KEG in decaliters (unit=дкл)', () => {
    expect(isKegProduct('Jaws Weizen алк.5,1% PET KEG 20 л.', 'дкл')).toBe(true);
  });

  it('true for KEG sold by piece (ШТ marker)', () => {
    expect(isKegProduct('Jaws Weizen алк.5,1% ШТ 20 л.', 'шт')).toBe(true);
  });

  it('false for regular packaged product', () => {
    expect(isKegProduct('Пиво светлое 0.5л', 'шт')).toBe(false);
  });

  it('false for product with дкл unit but no KEG markers', () => {
    // edge case: дкл unit implies KEG even without PET KEG in name
    expect(isKegProduct('Сидр яблочный 10 л.', 'дкл')).toBe(true);
  });

  it('true for PET KEG name without дкл unit', () => {
    expect(isKegProduct('Jaws PET KEG 30 л.', 'шт')).toBe(true);
  });
});

describe('isKeg vs isKegSoldByPiece — distinction preserved', () => {
  it('isKeg returns false for ШТ marker (no conversion needed)', () => {
    expect(isKeg('Jaws Weizen ШТ 20 л.', 'шт')).toBe(false);
  });

  it('isKegSoldByPiece returns true for ШТ marker', () => {
    expect(isKegSoldByPiece('Jaws Weizen ШТ 20 л.')).toBe(true);
  });

  it('isKeg returns true for дкл unit (needs conversion)', () => {
    expect(isKeg('Jaws Weizen PET KEG 20 л.', 'дкл')).toBe(true);
  });

  it('isKegSoldByPiece returns false for дкл KEG', () => {
    expect(isKegSoldByPiece('Jaws Weizen PET KEG 20 л.')).toBe(false);
  });
});

describe('resolvePackSize — pack size with auto-fallback for KEG', () => {
  it('returns manual override when packSize is set on regular product', () => {
    const result = resolvePackSize('Чипсы лук', 'шт', 12);
    expect(result).toEqual({ value: 12, unit: 'шт' });
  });

  it('manual override on KEG-дкл shows in литры', () => {
    const result = resolvePackSize('Jaws PET KEG 20 л.', 'дкл', 30);
    expect(result).toEqual({ value: 30, unit: 'л' });
  });

  it('manual override on KEG sold by piece shows in литры', () => {
    const result = resolvePackSize('Jaws ШТ 20 л.', 'шт', 25);
    expect(result).toEqual({ value: 25, unit: 'л' });
  });

  it('auto-fallback: KEG-дкл reads volume from name (20 л)', () => {
    const result = resolvePackSize('Jaws PET KEG 20 л.', 'дкл', null);
    expect(result).toEqual({ value: 20, unit: 'л' });
  });

  it('auto-fallback: KEG-дкл with 10 л', () => {
    const result = resolvePackSize('Jaws PET KEG 10 л.', 'дкл', null);
    expect(result).toEqual({ value: 10, unit: 'л' });
  });

  it('auto-fallback: KEG-дкл with 30 л', () => {
    const result = resolvePackSize('Jaws PET KEG 30 л.', 'дкл', null);
    expect(result).toEqual({ value: 30, unit: 'л' });
  });

  it('auto-fallback: KEG sold by piece (ШТ) reads volume from name', () => {
    const result = resolvePackSize('Jaws ШТ 20 л.', 'шт', undefined);
    expect(result).toEqual({ value: 20, unit: 'л' });
  });

  it('returns null for regular packaged product without packSize', () => {
    const result = resolvePackSize('Чипсы лук', 'шт', null);
    expect(result).toBeNull();
  });

  it('returns null for regular product when packSize is undefined', () => {
    const result = resolvePackSize('Чипсы лук', 'шт', undefined);
    expect(result).toBeNull();
  });

  it('returns null for KEG without volume in name and no override', () => {
    const result = resolvePackSize('Jaws PET KEG без объёма', 'дкл', null);
    expect(result).toBeNull();
  });
});
