import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConsentStore, AGE_TTL_MS } from '../consentStore';

describe('consentStore', () => {
  beforeEach(() => {
    useConsentStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('age confirmation', () => {
    it('initial state: not confirmed', () => {
      expect(useConsentStore.getState().isAgeConfirmed()).toBe(false);
    });

    it('confirmAge marks confirmation valid', () => {
      useConsentStore.getState().confirmAge();
      expect(useConsentStore.getState().isAgeConfirmed()).toBe(true);
    });

    it('confirmation expires after TTL (30 days)', () => {
      const start = new Date('2026-04-22T10:00:00Z').getTime();
      vi.useFakeTimers();
      vi.setSystemTime(start);

      useConsentStore.getState().confirmAge();
      expect(useConsentStore.getState().isAgeConfirmed()).toBe(true);

      vi.setSystemTime(start + AGE_TTL_MS - 1000);
      expect(useConsentStore.getState().isAgeConfirmed()).toBe(true);

      vi.setSystemTime(start + AGE_TTL_MS + 1000);
      expect(useConsentStore.getState().isAgeConfirmed()).toBe(false);
    });

    it('TTL is 30 days in milliseconds', () => {
      expect(AGE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('privacy acceptance', () => {
    it('initial state: not accepted', () => {
      expect(useConsentStore.getState().privacyAccepted).toBe(false);
    });

    it('acceptPrivacy sets flag to true', () => {
      useConsentStore.getState().acceptPrivacy();
      expect(useConsentStore.getState().privacyAccepted).toBe(true);
    });

    it('privacyAccepted persists without TTL', () => {
      const start = new Date('2026-04-22T10:00:00Z').getTime();
      vi.useFakeTimers();
      vi.setSystemTime(start);

      useConsentStore.getState().acceptPrivacy();

      vi.setSystemTime(start + 365 * 24 * 60 * 60 * 1000);
      expect(useConsentStore.getState().privacyAccepted).toBe(true);
    });
  });

  describe('reset', () => {
    it('reset clears all consent state', () => {
      useConsentStore.getState().confirmAge();
      useConsentStore.getState().acceptPrivacy();
      useConsentStore.getState().reset();
      expect(useConsentStore.getState().isAgeConfirmed()).toBe(false);
      expect(useConsentStore.getState().privacyAccepted).toBe(false);
    });
  });
});
