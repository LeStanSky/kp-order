import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { LoginPage } from '../LoginPage';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<LoginPage />);
    const submitBtn = screen.getByRole('button', { name: /войти|sign in|login/i });
    await userEvent.click(submitBtn);
    await waitFor(() => {
      // expect at least one helperText error to appear
      const errors = screen.getAllByText(/корректный|обязательн|символ/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('calls login and navigates on success', async () => {
    const { authApi } = await import('@/api/auth.api');
    vi.mocked(authApi.login).mockResolvedValueOnce({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENT' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /войти|sign in|login/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });

  it('shows toast error on failed login', async () => {
    const { authApi } = await import('@/api/auth.api');
    const toast = await import('react-hot-toast');
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /войти|sign in|login/i }));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled();
    });
  });

  it('does not show register link', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.queryByText(/зарегистрироваться/i)).not.toBeInTheDocument();
  });

  it('redirects to /change-password when mustChangePassword is true', async () => {
    const { authApi } = await import('@/api/auth.api');
    vi.mocked(authApi.login).mockResolvedValueOnce({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENT' },
      accessToken: 'token',
      refreshToken: 'refresh',
      mustChangePassword: true,
    });

    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /войти|sign in|login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/change-password');
    });
  });
});
