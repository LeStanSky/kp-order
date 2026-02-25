import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { UsersPage } from '../UsersPage';

vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
  useUpdateUser: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mockUsers = [
  {
    id: 'user-1',
    name: 'Иван Клиент',
    email: 'client@test.com',
    role: 'CLIENT' as const,
    isActive: true,
    priceGroupId: 'pg-1',
    managerId: null,
    priceGroup: { id: 'pg-1', name: 'Розница' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Мария Менеджер',
    email: 'manager@test.com',
    role: 'MANAGER' as const,
    isActive: false,
    priceGroupId: null,
    managerId: null,
    priceGroup: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

beforeEach(async () => {
  vi.clearAllMocks();

  const { useUsers, useUpdateUser } = await import('@/hooks/useUsers');
  vi.mocked(useUsers).mockReturnValue({
    data: mockUsers,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useUsers>);
  vi.mocked(useUpdateUser).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateUser>);
});

describe('UsersPage', () => {
  it('renders list of users', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
      expect(screen.getByText('Мария Менеджер')).toBeInTheDocument();
      expect(screen.getByText('client@test.com')).toBeInTheDocument();
    });
  });

  it('shows role labels', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Клиент')).toBeInTheDocument();
      expect(screen.getByText('Менеджер')).toBeInTheDocument();
    });
  });

  it('shows active and inactive status chips', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Активен')).toBeInTheDocument();
      expect(screen.getByText('Неактивен')).toBeInTheDocument();
    });
  });

  it('opens edit dialog when edit button clicked', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Редактировать пользователя')).toBeInTheDocument();
  });

  it('calls updateUser mutate when save clicked', async () => {
    const mockMutate = vi.fn();
    const { useUpdateUser } = await import('@/hooks/useUsers');
    vi.mocked(useUpdateUser).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUser>);

    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[0]);

    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      expect.any(Object),
    );
  });

  it('closes dialog when cancel clicked', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^отмена$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', async () => {
    const { useUsers } = await import('@/hooks/useUsers');
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithProviders(<UsersPage />);
    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });
});
