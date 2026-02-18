import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Divider,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useOrder, useCancelOrder, useRepeatOrder } from '@/hooks/useOrders';
import { OrderStatusChip } from '@/components/orders/OrderStatusChip';
import { useAuthStore } from '@/store/authStore';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();

  const { data: order, isLoading } = useOrder(id ?? '');
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder();
  const { mutate: repeatOrder, isPending: repeating } = useRepeatOrder();

  const isClient = hasRole('CLIENT');

  const handleCancel = () => {
    if (!order) return;
    cancelOrder(order.id, {
      onSuccess: () => toast.success('Заказ отменён'),
      onError: () => toast.error('Не удалось отменить заказ'),
    });
  };

  const handleRepeat = () => {
    if (!order) return;
    repeatOrder(order.id, {
      onSuccess: () => {
        toast.success('Заказ повторён');
        navigate('/orders');
      },
      onError: () => toast.error('Не удалось повторить заказ'),
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!order) {
    return <Typography>Заказ не найден</Typography>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 2 }}>
        Назад к заказам
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">{order.orderNumber}</Typography>
        <OrderStatusChip status={order.status} />
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Дата: {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Клиент: {order.user.name} ({order.user.email})
        </Typography>
        {order.comment && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Комментарий: {order.comment}
          </Typography>
        )}
      </Paper>

      <Divider sx={{ mb: 3 }} />

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
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product.name}</TableCell>
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
                <Typography fontWeight="bold">{order.totalAmount} RUB</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {isClient && (
        <Stack direction="row" spacing={2}>
          {order.status === 'PENDING' && (
            <Button variant="outlined" color="error" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <CircularProgress size={20} /> : 'Отменить заказ'}
            </Button>
          )}
          <Button variant="contained" onClick={handleRepeat} disabled={repeating}>
            {repeating ? <CircularProgress size={20} /> : 'Повторить заказ'}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
