import { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useOrder, useRepeatOrder, useDeleteOrder } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/utils/productDisplay';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useOrder(id ?? '');
  const { mutate: repeatOrder, isPending: repeating } = useRepeatOrder();
  const { mutate: deleteOrder, isPending: deleting } = useDeleteOrder();
  const isAdmin = useAuthStore((s) => s.hasRole('ADMIN'));
  const canOrder = useAuthStore((s) => s.hasRole('CLIENT') && s.user?.canOrder !== false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleRepeatClick = () => setConfirmOpen(true);

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (!order) return;
    repeatOrder(order.id, {
      onSuccess: () => {
        toast.success('Заказ повторён');
        navigate('/orders');
      },
      onError: () => toast.error('Не удалось повторить заказ'),
    });
  };

  const handleCancelConfirm = () => setConfirmOpen(false);

  const handleDeleteClick = () => setDeleteConfirmOpen(true);

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    if (!order) return;
    deleteOrder(order.id, {
      onSuccess: () => {
        toast.success('Заказ удалён');
        navigate('/orders');
      },
      onError: () => toast.error('Не удалось удалить заказ'),
    });
  };

  const handleDeleteCancel = () => setDeleteConfirmOpen(false);

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

      <Typography variant="h5" sx={{ mb: 3 }}>
        {order.orderNumber}
      </Typography>

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
                <TableCell>{item.product.cleanName}</TableCell>
                <TableCell align="right">
                  {formatPrice(item.price)} {item.currency}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">
                  {formatPrice(item.price * item.quantity)} {item.currency}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3}>
                <Typography fontWeight="bold">Итого</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">{formatPrice(order.totalAmount)} RUB</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2}>
        {canOrder && (
          <Button variant="contained" onClick={handleRepeatClick} disabled={repeating}>
            {repeating ? <CircularProgress size={20} /> : 'Повторить заказ'}
          </Button>
        )}
        {isAdmin && (
          <Button variant="outlined" color="error" onClick={handleDeleteClick} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Удалить заказ'}
          </Button>
        )}
      </Stack>

      <Dialog open={confirmOpen} onClose={handleCancelConfirm}>
        <DialogTitle>Повторить заказ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Будет создан новый заказ с текущими ценами. Продолжить?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm}>Отмена</Button>
          <Button variant="contained" onClick={handleConfirm} autoFocus>
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Удалить заказ?</DialogTitle>
        <DialogContent>
          <DialogContentText>Заказ будет удалён безвозвратно. Продолжить?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} autoFocus>
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
