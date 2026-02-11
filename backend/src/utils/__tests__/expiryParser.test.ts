import { parseProductExpiry } from '../expiryParser';

describe('parseProductExpiry', () => {
  describe('ISO format with " / " separator', () => {
    it('should parse "name / YYYY-MM-DD"', () => {
      const result = parseProductExpiry('Jaws Blanche алк.4,5% / 2026-11-18');
      expect(result.cleanName).toBe('Jaws Blanche алк.4,5%');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });

    it('should parse "name / YYYY-MM-DD ЧЗ"', () => {
      const result = parseProductExpiry('Пиво светлое / 2026-03-15 ЧЗ');
      expect(result.cleanName).toBe('Пиво светлое');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 2, 15)));
    });
  });

  describe('DD.MM.YYYY format with " / " separator', () => {
    it('should parse "name / DD.MM.YYYY"', () => {
      const result = parseProductExpiry('Product / 18.11.2026');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });

    it('should parse "name / СГ 18.11.2026"', () => {
      const result = parseProductExpiry('Product / СГ 18.11.2026');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });

    it('should parse "name / до 18.11.2026"', () => {
      const result = parseProductExpiry('Product / до 18.11.2026');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });
  });

  describe('no separator — date at end of name', () => {
    it('should parse "name YYYY-MM-DD"', () => {
      const result = parseProductExpiry('Product 2026-11-18');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });

    it('should parse "name YYYY-MM-DD ЧЗ"', () => {
      const result = parseProductExpiry('Product 2026-11-18 ЧЗ');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });

    it('should parse "name DD.MM.YYYY"', () => {
      const result = parseProductExpiry('Product 18.11.2026');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });
  });

  describe('no date', () => {
    it('should return null expiryDate for plain name', () => {
      const result = parseProductExpiry('Coca-Cola 0.5L');
      expect(result.cleanName).toBe('Coca-Cola 0.5L');
      expect(result.expiryDate).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseProductExpiry('');
      expect(result.cleanName).toBe('');
      expect(result.expiryDate).toBeNull();
    });

    it('should trim whitespace', () => {
      const result = parseProductExpiry('  Some Product  ');
      expect(result.cleanName).toBe('Some Product');
      expect(result.expiryDate).toBeNull();
    });
  });

  describe('invalid dates', () => {
    it('should return null for Feb 31', () => {
      const result = parseProductExpiry('Product / 2026-02-31');
      expect(result.cleanName).toBe('Product / 2026-02-31');
      expect(result.expiryDate).toBeNull();
    });

    it('should return null for DD.MM.YYYY Feb 30', () => {
      const result = parseProductExpiry('Product / 30.02.2026');
      expect(result.cleanName).toBe('Product / 30.02.2026');
      expect(result.expiryDate).toBeNull();
    });
  });

  describe('DD/MM/YYYY format', () => {
    it('should parse "name / 18/11/2026"', () => {
      const result = parseProductExpiry('Product / 18/11/2026');
      expect(result.cleanName).toBe('Product');
      expect(result.expiryDate).toEqual(new Date(Date.UTC(2026, 10, 18)));
    });
  });
});
