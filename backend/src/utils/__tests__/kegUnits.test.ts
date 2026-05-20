import { isKegSoldByPiece, isKeg, kegVolumeFactor, resolveKegPrice, toErpUnits } from '../kegUnits';

describe('kegUnits', () => {
  describe('isKegSoldByPiece', () => {
    it('detects the ШТ marker', () => {
      expect(isKegSoldByPiece('Jaws APA 20л ШТ')).toBe(true);
      expect(isKegSoldByPiece('Jaws APA PET KEG 20 л.')).toBe(false);
    });
  });

  describe('isKeg', () => {
    it('treats дкл unit as keg', () => {
      expect(isKeg('APA 20 л.', 'дкл')).toBe(true);
    });
    it('treats PET KEG name as keg even when unit is null', () => {
      expect(isKeg('Jaws APA PET KEG 20л', null)).toBe(true);
    });
    it('is false for piece-sold kegs', () => {
      expect(isKeg('Jaws APA 20л ШТ', 'дкл')).toBe(false);
    });
    it('is false for ordinary packaged goods', () => {
      expect(isKeg('Beer 0.5л', 'шт')).toBe(false);
    });
  });

  describe('kegVolumeFactor', () => {
    it.each([
      ['APA 10 л.', 1],
      ['APA 20 л.', 2],
      ['Сидр PET KEG 30л', 3],
    ])('parses %s → %d', (name, factor) => {
      expect(kegVolumeFactor(name)).toBe(factor);
    });
    it('returns null when no volume present', () => {
      expect(kegVolumeFactor('Beer 0.5л')).toBeNull();
    });
  });

  describe('resolveKegPrice (дкл → keg)', () => {
    it('multiplies per-дкл price by volume factor', () => {
      expect(resolveKegPrice(4000, 'APA 20 л.', 'дкл')).toBe(8000);
      expect(resolveKegPrice(3000, 'Сидр PET KEG 30л', null)).toBe(9000);
    });
    it('leaves non-keg and ШТ-keg prices unchanged', () => {
      expect(resolveKegPrice(2500, 'Beer 0.5л', 'шт')).toBe(2500);
      expect(resolveKegPrice(1800, 'APA 20л ШТ', 'дкл')).toBe(1800);
    });
  });

  describe('toErpUnits (keg → дкл, inverse)', () => {
    it('splits a дкл keg into дкл quantity and per-дкл kopecks', () => {
      // 1 keg of 20 л at 8000 ₽/keg → 2 дкл at 4000 ₽/дкл = 400000 kopecks
      expect(toErpUnits(1, 8000, 'APA 20 л.', 'дкл')).toEqual({
        quantity: 2,
        priceKopecks: 400000,
      });
    });
    it('handles 30 л kegs and multiple quantity', () => {
      // 2 kegs of 30 л at 9000 ₽/keg → 6 дкл at 3000 ₽/дкл = 300000 kopecks
      expect(toErpUnits(2, 9000, 'Сидр PET KEG 30л', null)).toEqual({
        quantity: 6,
        priceKopecks: 300000,
      });
    });
    it('does not convert ШТ-kegs', () => {
      expect(toErpUnits(2, 1800, 'APA 20л ШТ', 'дкл')).toEqual({
        quantity: 2,
        priceKopecks: 180000,
      });
    });
    it('does not convert ordinary packaged goods', () => {
      expect(toErpUnits(3, 2500, 'Beer 0.5л', 'шт')).toEqual({
        quantity: 3,
        priceKopecks: 250000,
      });
    });
  });
});
