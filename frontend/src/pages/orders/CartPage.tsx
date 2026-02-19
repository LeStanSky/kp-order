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
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { ordersApi } from '@/api/orders.api';
import { formatPrice } from '@/utils/productDisplay';

interface CommentForm {
  comment: string;
}

export function CartPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart, updateQuantity, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<CommentForm>();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items.length, navigate]);

  const handleQtyChange = (productId: string, current: number, delta: number) => {
    const next = current + delta;
    if (next <= 0) removeItem(productId);
    else updateQuantity(productId, next);
  };

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Оформление заказа</Typography>
        <Button color="error" variant="outlined" size="small" onClick={clearCart}>
          Очистить корзину
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Товар</TableCell>
              <TableCell align="right">Цена</TableCell>
              <TableCell align="center">Количество</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">
                  {formatPrice(item.price)} {item.currency}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleQtyChange(item.productId, item.quantity, -1)}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 32, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleQtyChange(item.productId, item.quantity, 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  {formatPrice(item.price * item.quantity)} {item.currency}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" color="error" onClick={() => removeItem(item.productId)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3}>
                <Typography fontWeight="bold">Итого</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">{formatPrice(totalAmount())} RUB</Typography>
              </TableCell>
              <TableCell />
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
