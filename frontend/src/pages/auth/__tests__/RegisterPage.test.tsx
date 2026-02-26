import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { RegisterPage } from '../RegisterPage';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    register: vi.fn(),
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

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it('renders name, email and password fields', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/name|имя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<RegisterPage />);
    const submitBtn = screen.getByRole('button', { name: /зарегистр|register|sign up/i });
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/обязательн|required|min/i).length).toBeGreaterThan(0);
    });
  });

  it('calls register and navigates on success', async () => {
    const { authApi } = await import('@/api/auth.api');
    vi.mocked(authApi.register).mockResolvedValueOnce({
      user: { id: '1', email: 'new@test.com', name: 'New User', role: 'CLIENT' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByLabelText(/name|имя/i), 'New User');
    await userEvent.type(screen.getByLabelText(/email/i), 'new@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /зарегистр|register|sign up/i }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith('new@test.com', 'password123', 'New User');
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });
});
