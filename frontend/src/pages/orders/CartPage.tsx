import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { ordersApi } from '@/api/orders.api';

interface CommentForm {
  comment: string;
}

export function CartPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<CommentForm>();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items.length, navigate]);

  const onSubmit = async (data: CommentForm) => {
    setLoading(true);
    try {
      await ordersApi.createOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        comment: data.comment || undefined,
      });
      clearCart();
      toast.success('Заказ успешно создан!');
      navigate('/orders');
    } catch {
      toast.error('Ошибка при создании заказа');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Оформление заказа
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Товар</TableCell>
              <TableCell align="right">Цена</TableCell>
              <TableCell align="right">Количество</TableCell>
              <TableCell align="right">Сумма</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">
                  {item.price} {item.currency}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">
                  {item.price * item.quantity} {item.currency}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3}>
                <Typography fontWeight="bold">Итого</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">{totalAmount()} RUB</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Комментарий к заказу"
          multiline
          rows={3}
          fullWidth
          {...register('comment')}
          sx={{ mb: 3 }}
        />

        <Stack direction="row" spacing={2}>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Подтвердить заказ'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/products')}>
            Продолжить покупки
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
