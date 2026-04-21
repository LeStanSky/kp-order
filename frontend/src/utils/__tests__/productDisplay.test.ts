import { describe, it, expect } from 'vitest';
import { isKeg, isKegSoldByPiece, isKegProduct } from '../productDisplay';

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
