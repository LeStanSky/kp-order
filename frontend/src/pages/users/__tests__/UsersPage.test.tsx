import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { UsersPage } from '../UsersPage';

vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
  useCreateUser: vi.fn(),
  useUpdateUser: vi.fn(),
  useResetPassword: vi.fn(),
  usePriceGroups: vi.fn(),
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
    canOrder: true,
    mustChangePassword: false,
    priceGroupId: 'pg-1',
    managerId: 'user-2',
    priceGroup: { id: 'pg-1', name: 'Розница' },
    manager: { id: 'user-2', name: 'Мария Менеджер' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Мария Менеджер',
    email: 'manager@test.com',
    role: 'MANAGER' as const,
    isActive: false,
    canOrder: true,
    mustChangePassword: false,
    priceGroupId: null,
    managerId: null,
    priceGroup: null,
    manager: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

beforeEach(async () => {
  vi.clearAllMocks();

  const { useUsers, useCreateUser, useUpdateUser, useResetPassword, usePriceGroups } =
    await import('@/hooks/useUsers');
  vi.mocked(useUsers).mockReturnValue({
    data: mockUsers,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useUsers>);
  vi.mocked(usePriceGroups).mockReturnValue({
    data: [
      { id: 'pg-1', name: 'Прайс основной' },
      { id: 'pg-2', name: 'Прайс Спот' },
    ],
    isLoading: false,
    error: null,
  } as ReturnType<typeof usePriceGroups>);
  vi.mocked(useCreateUser).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateUser>);
  vi.mocked(useUpdateUser).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateUser>);
  vi.mocked(useResetPassword).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useResetPassword>);
});

describe('UsersPage', () => {
  it('renders list of users', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
      expect(screen.getByText('client@test.com')).toBeInTheDocument();
      expect(screen.getAllByText('Мария Менеджер').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows manager name in table', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });
    // "Мария Менеджер" appears twice: as her own row name + as manager of Ivan
    expect(screen.getAllByText('Мария Менеджер')).toHaveLength(2);
    // Manager without a manager/priceGroup shows "—" (at least once)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows role labels', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Клиент')).toBeInTheDocument();
      // "Менеджер" appears as column header + role chip
      expect(screen.getAllByText('Менеджер').length).toBeGreaterThanOrEqual(1);
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

  it('shows manager select in dialog when editing a CLIENT', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[0]); // Иван Клиент (CLIENT)

    expect(screen.getByTestId('manager-field')).toBeInTheDocument();
  });

  it('does not show manager select when editing a MANAGER', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[1]); // Мария Менеджер (MANAGER)

    expect(screen.queryByTestId('manager-field')).not.toBeInTheDocument();
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

  it('shows "Создать пользователя" button', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /создать пользователя/i })).toBeInTheDocument();
    });
  });

  it('opens create user dialog when create button clicked', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Иван Клиент')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /создать пользователя/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/новый пользователь/i)).toBeInTheDocument();
  });

  it('calls createUser mutate on submit in create dialog', async () => {
    const mockMutate = vi.fn();
    const { useCreateUser } = await import('@/hooks/useUsers');
    vi.mocked(useCreateUser).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateUser>);

    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /создать пользователя/i }));

    // Fill form
    fireEvent.change(screen.getByTestId('create-name'), { target: { value: 'Новый Клиент' } });
    fireEvent.change(screen.getByTestId('create-email'), {
      target: { value: 'new@test.com' },
    });
    fireEvent.change(screen.getByTestId('create-password'), {
      target: { value: 'TempPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^создать$/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@test.com', name: 'Новый Клиент' }),
      expect.any(Object),
    );
  });

  it('shows reset password button for each user', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    const resetButtons = screen.getAllByRole('button', { name: /сбросить пароль/i });
    expect(resetButtons.length).toBe(2);
  });

  it('shows "Может заказывать" switch when editing a CLIENT', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[0]); // CLIENT

    expect(screen.getByLabelText(/может заказывать/i)).toBeInTheDocument();
  });

  it('does not show "Может заказывать" switch when editing a MANAGER', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[1]); // MANAGER

    expect(screen.queryByLabelText(/может заказывать/i)).not.toBeInTheDocument();
  });

  it('shows "Может заказывать" switch in create dialog for CLIENT role', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /создать пользователя/i }));

    // Default role is CLIENT, so the switch should be visible
    expect(screen.getByLabelText(/может заказывать/i)).toBeInTheDocument();
  });

  it('toggles canOrder switch in edit dialog', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    const editButtons = screen.getAllByRole('button', { name: /редактировать/i });
    fireEvent.click(editButtons[0]);

    const canOrderSwitch = screen.getByLabelText(/может заказывать/i);
    expect(canOrderSwitch).toBeChecked();
    fireEvent.click(canOrderSwitch);
    expect(canOrderSwitch).not.toBeChecked();
  });

  it('toggles canOrder switch in create dialog', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /создать пользователя/i }));

    const canOrderSwitch = screen.getByLabelText(/может заказывать/i);
    expect(canOrderSwitch).toBeChecked();
    fireEvent.click(canOrderSwitch);
    expect(canOrderSwitch).not.toBeChecked();
  });

  it('calls resetPassword mutate when confirmed', async () => {
    const mockMutate = vi.fn();
    const { useResetPassword } = await import('@/hooks/useUsers');
    vi.mocked(useResetPassword).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useResetPassword>);

    renderWithProviders(<UsersPage />);
    await waitFor(() => expect(screen.getByText('Иван Клиент')).toBeInTheDocument());

    const resetButtons = screen.getAllByRole('button', { name: /сбросить пароль/i });
    fireEvent.click(resetButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('reset-password-input'), {
      target: { value: 'NewTemp123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^сбросить$/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', password: 'NewTemp123!' }),
      expect.any(Object),
    );
  });
});
