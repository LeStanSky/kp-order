import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatusChip } from '@/components/orders/OrderStatusChip';
import { useAuthStore } from '@/store/authStore';
import type { OrderStatus } from '@/types/order.types';

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const { data: ordersData, isLoading } = useOrders({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Мои заказы</Typography>
        {isManager && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={statusFilter}
              label="Статус"
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | '');
                setPage(1);
              }}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="PENDING">Ожидает</MenuItem>
              <MenuItem value="CONFIRMED">Подтверждён</MenuItem>
              <MenuItem value="CANCELLED">Отменён</MenuItem>
            </Select>
          </FormControl>
        )}
      </Stack>

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
      ) : ordersData?.data.length === 0 ? (
        <Typography color="text.secondary">Заказов пока нет</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {ordersData?.data.map((order) => (
              <Grid key={order.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{order.orderNumber}</Typography>
                      <OrderStatusChip status={order.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Итого: {order.totalAmount} RUB
                    </Typography>
                    {isManager && (
                      <Typography variant="body2" color="text.secondary">
                        {order.user.name}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/orders/${order.id}`)}>
                      Детали
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {ordersData && ordersData.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={ordersData.pagination.totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
