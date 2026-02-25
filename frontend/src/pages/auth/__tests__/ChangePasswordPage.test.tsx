import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ChangePasswordPage } from '../ChangePasswordPage';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    changePassword: vi.fn(),
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

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders new and confirm password fields', () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByLabelText(/new-password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm-password/i)).toBeInTheDocument();
  });

  it('shows title text', () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByText(/смена пароля/i)).toBeInTheDocument();
  });

  it('shows validation error for mismatched passwords', async () => {
    renderWithProviders(<ChangePasswordPage />);
    await userEvent.type(screen.getByLabelText(/new-password/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/confirm-password/i), 'Different123!');
    await userEvent.click(screen.getByRole('button', { name: /сохранить пароль/i }));
    await waitFor(() => {
      expect(screen.getByText(/не совпадают/i)).toBeInTheDocument();
    });
  });

  it('calls changePassword and navigates on success', async () => {
    const { authApi } = await import('@/api/auth.api');
    vi.mocked(authApi.changePassword).mockResolvedValueOnce(undefined);

    renderWithProviders(<ChangePasswordPage />);
    await userEvent.type(screen.getByLabelText(/new-password/i), 'NewPass123!');
    await userEvent.type(screen.getByLabelText(/confirm-password/i), 'NewPass123!');
    await userEvent.click(screen.getByRole('button', { name: /сохранить пароль/i }));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith('NewPass123!');
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });

  it('shows error toast on failure', async () => {
    const { authApi } = await import('@/api/auth.api');
    const toast = await import('react-hot-toast');
    vi.mocked(authApi.changePassword).mockRejectedValueOnce(new Error('Server error'));

    renderWithProviders(<ChangePasswordPage />);
    await userEvent.type(screen.getByLabelText(/new-password/i), 'NewPass123!');
    await userEvent.type(screen.getByLabelText(/confirm-password/i), 'NewPass123!');
    await userEvent.click(screen.getByRole('button', { name: /сохранить пароль/i }));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled();
    });
  });
});
