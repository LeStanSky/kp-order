import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Pagination,
  Skeleton,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/utils/productDisplay';

export function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: ordersData, isLoading } = useOrders({ page, limit: 20 });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Мои заказы
      </Typography>

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
                    <Typography variant="h6">{order.orderNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Итого: {formatPrice(order.totalAmount)} RUB
                    </Typography>
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
