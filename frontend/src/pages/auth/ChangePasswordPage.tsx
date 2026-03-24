import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
    confirmPassword: z.string().min(8, 'Пароль должен быть не менее 8 символов'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { clearMustChangePassword } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.changePassword(data.newPassword);
      clearMustChangePassword();
      toast.success('Пароль успешно изменён');
      navigate('/products', { replace: true });
    } catch {
      toast.error('Не удалось изменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          KPOrder
        </Typography>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Смена пароля
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Необходимо задать новый пароль для продолжения
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              fullWidth
              label="Новый пароль"
              type="password"
              inputProps={{ 'aria-label': 'new-password' }}
              {...register('newPassword')}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Подтвердите пароль"
              type="password"
              inputProps={{ 'aria-label': 'confirm-password' }}
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Сохранить пароль'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
