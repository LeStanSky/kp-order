import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const AGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface ConsentState {
  ageConfirmedAt: number | null;
  privacyAccepted: boolean;
  confirmAge: () => void;
  acceptPrivacy: () => void;
  isAgeConfirmed: () => boolean;
  reset: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set, get) => ({
      ageConfirmedAt: null,
      privacyAccepted: false,
      confirmAge: () => set({ ageConfirmedAt: Date.now() }),
      acceptPrivacy: () => set({ privacyAccepted: true }),
      isAgeConfirmed: () => {
        const ts = get().ageConfirmedAt;
        return ts !== null && Date.now() - ts < AGE_TTL_MS;
      },
      reset: () => set({ ageConfirmedAt: null, privacyAccepted: false }),
    }),
    { name: 'consent-storage' },
  ),
);
