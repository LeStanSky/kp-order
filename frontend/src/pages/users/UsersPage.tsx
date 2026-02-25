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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import toast from 'react-hot-toast';
import { useUsers, useUpdateUser } from '@/hooks/useUsers';
import type { AdminUser, UpdateUserParams } from '@/api/users.api';

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

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { mutate: updateUser } = useUpdateUser();

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserParams>({});

  const handleEditOpen = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({ role: user.role, isActive: user.isActive });
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

  if (isLoading) {
    return <Skeleton variant="rectangular" height={400} />;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Пользователи
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
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
                <TableCell align="right">
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
    </Box>
  );
}
