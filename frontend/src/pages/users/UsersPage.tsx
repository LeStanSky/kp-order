import { useState } from 'react';
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
import toast from 'react-hot-toast';
import { useUsers, useCreateUser, useUpdateUser, useResetPassword } from '@/hooks/useUsers';
import type { AdminUser, CreateUserParams, UpdateUserParams } from '@/api/users.api';

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

const EMPTY_CREATE: CreateUserParams = {
  name: '',
  email: '',
  password: '',
  role: 'CLIENT',
  managerId: null,
};

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: resetPassword } = useResetPassword();

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserParams>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserParams>(EMPTY_CREATE);

  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const managers = users?.filter((u) => u.role === 'MANAGER') ?? [];

  const handleEditOpen = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({ role: user.role, isActive: user.isActive, managerId: user.managerId });
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
        onError: () => toast.error('Не удалось обновить пользователя'),
      },
    );
  };

  const handleCreateOpen = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
  };

  const handleCreate = () => {
    createUser(createForm, {
      onSuccess: () => {
        toast.success('Пользователь создан');
        handleCreateClose();
      },
      onError: () => toast.error('Не удалось создать пользователя'),
    });
  };

  const handleResetOpen = (user: AdminUser) => {
    setResetUser(user);
    setResetPasswordValue('');
  };

  const handleResetClose = () => {
    setResetUser(null);
    setResetPasswordValue('');
  };

  const handleResetConfirm = () => {
    if (!resetUser) return;
    resetPassword(
      { id: resetUser.id, password: resetPasswordValue },
      {
        onSuccess: () => {
          toast.success('Пароль сброшен');
          handleResetClose();
        },
        onError: () => toast.error('Не удалось сбросить пароль'),
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
        <DialogTitle>Новый пользователь</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Имя"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
            inputProps={{ 'data-testid': 'create-name' }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            sx={{ mb: 2 }}
            inputProps={{ 'data-testid': 'create-email' }}
          />
          <TextField
            fullWidth
            label="Временный пароль"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            sx={{ mb: 2 }}
            inputProps={{ 'data-testid': 'create-password' }}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>Отмена</Button>
          <Button variant="contained" onClick={handleCreate}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetUser} onClose={handleResetClose} maxWidth="xs" fullWidth>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetClose}>Отмена</Button>
          <Button variant="contained" color="warning" onClick={handleResetConfirm}>
            Сбросить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
