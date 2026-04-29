import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { AgeVerificationGate } from '../AgeVerificationGate';
import { useConsentStore } from '@/store/consentStore';

function Harness() {
  return (
    <AgeVerificationGate>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/products" element={<div>Products Page</div>} />
        <Route path="/come-back-later" element={<div>Come Back Later</div>} />
        <Route path="/privacy-policy" element={<div>Privacy Policy</div>} />
      </Routes>
    </AgeVerificationGate>
  );
}

beforeEach(() => {
  useConsentStore.getState().reset();
});

describe('AgeVerificationGate', () => {
  it('shows the age modal when user has not confirmed', () => {
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/login'] } });
    expect(screen.getByRole('dialog', { name: /возраст/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /мне есть 18/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /мне нет 18/i })).toBeInTheDocument();
  });

  it('renders underlying page content behind the modal', () => {
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/login'] } });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('hides the modal once age is confirmed', () => {
    useConsentStore.getState().confirmAge();
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/login'] } });
    expect(screen.queryByRole('dialog', { name: /возраст/i })).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('confirming from the modal persists consent and hides modal', async () => {
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/login'] } });
    fireEvent.click(screen.getByRole('button', { name: /мне есть 18/i }));
    expect(useConsentStore.getState().isAgeConfirmed()).toBe(true);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /возраст/i })).not.toBeInTheDocument();
    });
  });

  it('rejecting redirects to /come-back-later WITHOUT persisting (no lock-out)', () => {
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/login'] } });
    fireEvent.click(screen.getByRole('button', { name: /мне нет 18/i }));
    expect(screen.getByText('Come Back Later')).toBeInTheDocument();
    expect(useConsentStore.getState().ageConfirmedAt).toBeNull();
  });

  it('/come-back-later is exempt — no modal shown', () => {
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/come-back-later'] } });
    expect(screen.queryByRole('dialog', { name: /возраст/i })).not.toBeInTheDocument();
    expect(screen.getByText('Come Back Later')).toBeInTheDocument();
  });

  it('/privacy-policy is exempt — no modal shown', () => {
    renderWithProviders(<Harness />, { routerProps: { initialEntries: ['/privacy-policy'] } });
    expect(screen.queryByRole('dialog', { name: /возраст/i })).not.toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});
