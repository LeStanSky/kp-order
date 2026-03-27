import { type FormEvent, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Skeleton,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import AddIcon from '@mui/icons-material/Add';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useResetPassword,
  usePriceGroups,
} from '@/hooks/useUsers';
import type { AdminUser, CreateUserParams, UpdateUserParams } from '@/api/users.api';

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = (err as AxiosError<{ error?: string; errors?: Record<string, string[]> }>)?.response
    ?.data;
  if (data?.errors) {
    const msgs = Object.values(data.errors).flat();
    if (msgs.length) return msgs.join('; ');
  }
  return data?.error ?? fallback;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент',
  MANAGER: 'Менеджер',
  ADMIN: 'Администратор',
};

const ROLE_COLORS = {
  CLIENT: 'default',
  MANAGER: 'primary',
  ADMIN: 'error',
} as const;

const DELIVERY_LABELS: Record<string, string> = {
  STANDARD: 'Стандартная',
  REMOTE: 'Удалённая',
};

const EMPTY_CREATE: CreateUserParams = {
  name: '',
  email: '',
  password: '',
  role: 'CLIENT',
  deliveryCategory: 'STANDARD',
  managerId: null,
  priceGroupId: null,
};

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { data: priceGroups = [] } = usePriceGroups();
  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: resetPassword } = useResetPassword();

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserParams>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserParams>(EMPTY_CREATE);
  const [createSubmitted, setCreateSubmitted] = useState(false);

  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const managers = users?.filter((u) => u.role === 'MANAGER') ?? [];

  const handleEditOpen = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({
      role: user.role,
      isActive: user.isActive,
      deliveryCategory: user.deliveryCategory,
      managerId: user.managerId,
      priceGroupId: user.priceGroupId,
    });
  };

  const handleEditClose = () => {
    setEditUser(null);
    setEditForm({});
  };

  const handleSave = () => {
    if (!editUser) return;
    updateUser(
      { id: editUser.id, params: editForm },
      {
        onSuccess: () => {
          toast.success('Пользователь обновлён');
          handleEditClose();
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Не удалось обновить пользователя')),
      },
    );
  };

  const handleCreateOpen = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateSubmitted(false);
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
  };

  const createValid =
    createForm.name.length >= 2 &&
    createForm.email.includes('@') &&
    createForm.password.length >= 8;

  const handleCreate = (e?: FormEvent) => {
    e?.preventDefault();
    setCreateSubmitted(true);
    if (!createValid) return;
    createUser(createForm, {
      onSuccess: () => {
        toast.success('Пользователь создан');
        handleCreateClose();
      },
      onError: (err) => toast.error(extractErrorMessage(err, 'Не удалось создать пользователя')),
    });
  };

  const handleResetOpen = (user: AdminUser) => {
    setResetUser(user);
    setResetPasswordValue('');
    setResetSubmitted(false);
  };

  const handleResetClose = () => {
    setResetUser(null);
    setResetPasswordValue('');
  };

  const resetValid = resetPasswordValue.length >= 8;

  const handleResetConfirm = (e?: FormEvent) => {
    e?.preventDefault();
    setResetSubmitted(true);
    if (!resetUser || !resetValid) return;
    resetPassword(
      { id: resetUser.id, password: resetPasswordValue },
      {
        onSuccess: () => {
          toast.success('Пароль сброшен');
          handleResetClose();
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Не удалось сбросить пароль')),
      },
    );
  };

  if (isLoading) {
    return <Skeleton variant="rectangular" height={400} />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Пользователи</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>
          Создать пользователя
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Менеджер</TableCell>
              <TableCell>Группа цен</TableCell>
              <TableCell>Доставка</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_LABELS[user.role] ?? user.role}
                    color={ROLE_COLORS[user.role] ?? 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Активен' : 'Неактивен'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.manager?.name ?? '—'}</TableCell>
                <TableCell>{user.priceGroup?.name ?? '—'}</TableCell>
                <TableCell>
                  {DELIVERY_LABELS[user.deliveryCategory] ?? user.deliveryCategory}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleResetOpen(user)}
                    aria-label="Сбросить пароль"
                  >
                    <LockResetIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEditOpen(user)}
                    aria-label="Редактировать"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onClose={handleEditClose} maxWidth="xs" fullWidth>
        <DialogTitle>Редактировать пользователя</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={editForm.role ?? ''}
              label="Роль"
              onChange={(e) =>
                setEditForm((f) => ({ ...f, role: e.target.value as AdminUser['role'] }))
              }
            >
              <MenuItem value="CLIENT">Клиент</MenuItem>
              <MenuItem value="MANAGER">Менеджер</MenuItem>
              <MenuItem value="ADMIN">Администратор</MenuItem>
            </Select>
          </FormControl>
          {editForm.role === 'CLIENT' && (
            <FormControl fullWidth sx={{ mb: 2 }} data-testid="manager-field">
              <InputLabel>Менеджер</InputLabel>
              <Select
                value={editForm.managerId ?? ''}
                label="Менеджер"
                onChange={(e) => setEditForm((f) => ({ ...f, managerId: e.target.value || null }))}
              >
                {managers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Группа цен</InputLabel>
            <Select
              value={editForm.priceGroupId ?? ''}
              label="Группа цен"
              onChange={(e) => setEditForm((f) => ({ ...f, priceGroupId: e.target.value || null }))}
            >
              <MenuItem value="">— не задана —</MenuItem>
              {priceGroups.map((pg) => (
                <MenuItem key={pg.id} value={pg.id}>
                  {pg.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Категория доставки</InputLabel>
            <Select
              value={editForm.deliveryCategory ?? 'STANDARD'}
              label="Категория доставки"
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  deliveryCategory: e.target.value as 'STANDARD' | 'REMOTE',
                }))
              }
            >
              <MenuItem value="STANDARD">Стандартная</MenuItem>
              <MenuItem value="REMOTE">Удалённая (мин. 30 000 ₽)</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={editForm.isActive ?? true}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            }
            label="Активен"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create user dialog */}
      <Dialog open={createOpen} onClose={handleCreateClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Новый пользователь</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Имя"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              sx={{ mb: 2, mt: 1 }}
              inputProps={{ 'data-testid': 'create-name' }}
              error={createSubmitted && createForm.name.length < 2}
              helperText={createSubmitted && createForm.name.length < 2 ? 'Минимум 2 символа' : ''}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              sx={{ mb: 2 }}
              inputProps={{ 'data-testid': 'create-email' }}
              error={createSubmitted && !createForm.email.includes('@')}
              helperText={
                createSubmitted && !createForm.email.includes('@') ? 'Введите корректный email' : ''
              }
            />
            <TextField
              fullWidth
              label="Временный пароль"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              sx={{ mb: 2 }}
              inputProps={{ 'data-testid': 'create-password' }}
              error={createSubmitted && createForm.password.length < 8}
              helperText={
                createSubmitted && createForm.password.length < 8 ? 'Минимум 8 символов' : ''
              }
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Роль</InputLabel>
              <Select
                value={createForm.role}
                label="Роль"
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, role: e.target.value as AdminUser['role'] }))
                }
              >
                <MenuItem value="CLIENT">Клиент</MenuItem>
                <MenuItem value="MANAGER">Менеджер</MenuItem>
                <MenuItem value="ADMIN">Администратор</MenuItem>
              </Select>
            </FormControl>
            {createForm.role === 'CLIENT' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Менеджер</InputLabel>
                <Select
                  value={createForm.managerId ?? ''}
                  label="Менеджер"
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, managerId: e.target.value || null }))
                  }
                >
                  {managers.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Группа цен</InputLabel>
              <Select
                value={createForm.priceGroupId ?? ''}
                label="Группа цен"
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, priceGroupId: e.target.value || null }))
                }
              >
                <MenuItem value="">— не задана —</MenuItem>
                {priceGroups.map((pg) => (
                  <MenuItem key={pg.id} value={pg.id}>
                    {pg.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Категория доставки</InputLabel>
              <Select
                value={createForm.deliveryCategory ?? 'STANDARD'}
                label="Категория доставки"
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    deliveryCategory: e.target.value as 'STANDARD' | 'REMOTE',
                  }))
                }
              >
                <MenuItem value="STANDARD">Стандартная</MenuItem>
                <MenuItem value="REMOTE">Удалённая (мин. 30 000 ₽)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCreateClose}>Отмена</Button>
            <Button variant="contained" type="submit">
              Создать
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onClose={handleResetClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleResetConfirm}>
          <DialogTitle>Сбросить пароль</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Новый временный пароль для пользователя <strong>{resetUser?.name}</strong>. При
              следующем входе пользователь будет обязан его изменить.
            </Typography>
            <TextField
              fullWidth
              label="Новый пароль"
              type="password"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              inputProps={{ 'data-testid': 'reset-password-input' }}
              error={resetSubmitted && resetPasswordValue.length < 8}
              helperText={
                resetSubmitted && resetPasswordValue.length < 8 ? 'Минимум 8 символов' : ''
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResetClose}>Отмена</Button>
            <Button variant="contained" color="warning" type="submit">
              Сбросить
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
