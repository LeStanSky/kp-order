import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Header } from '../Header';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { User } from '@/types/user.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/auth.api', () => ({
  authApi: { logout: vi.fn() },
}));

const clientUser: User = { id: '1', email: 'client@test.com', name: 'Client User', role: 'CLIENT' };
const adminUser: User = { id: '2', email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' };
const tokens = { accessToken: 'token', refreshToken: 'refresh' };

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useCartStore.getState().clearCart();
  vi.clearAllMocks();
});

describe('Header', () => {
  it('displays the user name', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<Header />);
    expect(screen.getByText('Client User')).toBeInTheDocument();
  });

  it('calls clearAuth and navigates to /login on logout', async () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<Header />);
    await userEvent.click(screen.getByRole('button', { name: /выйти|logout|exit/i }));
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows cart icon only for CLIENT role', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<Header />);
    expect(screen.getByTestId('cart-icon-btn')).toBeInTheDocument();
  });

  it('does not show cart icon for ADMIN role', () => {
    useAuthStore.getState().setAuth(adminUser, tokens);
    renderWithProviders(<Header />);
    expect(screen.queryByTestId('cart-icon-btn')).not.toBeInTheDocument();
  });

  it('shows Пользователи nav for ADMIN', () => {
    useAuthStore.getState().setAuth(adminUser, tokens);
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /пользователи/i })).toBeInTheDocument();
  });

  it('does not show Пользователи nav for CLIENT', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<Header />);
    expect(screen.queryByRole('button', { name: /пользователи/i })).not.toBeInTheDocument();
  });

  it('does not show cart icon for CLIENT with canOrder=false', () => {
    const viewOnlyClient: User = { ...clientUser, canOrder: false };
    useAuthStore.getState().setAuth(viewOnlyClient, tokens);
    renderWithProviders(<Header />);
    expect(screen.queryByTestId('cart-icon-btn')).not.toBeInTheDocument();
  });

  it('shows manager tooltip on user name hover', async () => {
    const clientWithManager: User = {
      ...clientUser,
      manager: { id: 'mgr-1', name: 'Manager One', email: 'mgr@example.com' },
    };
    useAuthStore.getState().setAuth(clientWithManager, tokens);
    renderWithProviders(<Header />);

    await userEvent.hover(screen.getByText('Client User'));
    expect(await screen.findByText('Ваш менеджер')).toBeInTheDocument();
    expect(screen.getByText('Manager One')).toBeInTheDocument();
    expect(screen.getByText('mgr@example.com')).toBeInTheDocument();
  });

  it('does not show manager tooltip when no manager', async () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    renderWithProviders(<Header />);

    await userEvent.hover(screen.getByText('Client User'));
    expect(screen.queryByText(/ваш менеджер/i)).not.toBeInTheDocument();
  });

  it('shows cart badge with item count', () => {
    useAuthStore.getState().setAuth(clientUser, tokens);
    useCartStore
      .getState()
      .addItem({ productId: 'p1', name: 'P1', price: 100, currency: 'RUB', quantity: 3 });
    renderWithProviders(<Header />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
