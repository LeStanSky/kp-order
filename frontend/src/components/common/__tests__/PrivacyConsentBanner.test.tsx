import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { PrivacyConsentBanner } from '../PrivacyConsentBanner';
import { useConsentStore } from '@/store/consentStore';

beforeEach(() => {
  useConsentStore.getState().reset();
});

describe('PrivacyConsentBanner', () => {
  it('renders when privacy is not yet accepted', () => {
    renderWithProviders(<PrivacyConsentBanner />);
    expect(screen.getByRole('button', { name: /согласен/i })).toBeInTheDocument();
  });

  it('contains a link to /privacy-policy', () => {
    renderWithProviders(<PrivacyConsentBanner />);
    const link = screen.getByRole('link', { name: /политик/i });
    expect(link).toHaveAttribute('href', '/privacy-policy');
  });

  it('does not render when privacy already accepted', () => {
    useConsentStore.getState().acceptPrivacy();
    renderWithProviders(<PrivacyConsentBanner />);
    expect(screen.queryByRole('button', { name: /согласен/i })).not.toBeInTheDocument();
  });

  it('clicking "Согласен" persists consent and hides the banner', () => {
    renderWithProviders(<PrivacyConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: /согласен/i }));
    expect(useConsentStore.getState().privacyAccepted).toBe(true);
    expect(screen.queryByRole('button', { name: /согласен/i })).not.toBeInTheDocument();
  });
});
