import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import {
  useStockAlerts,
  useCreateStockAlert,
  useUpdateStockAlert,
  useDeleteStockAlert,
} from '@/hooks/useStockAlerts';
import { useProducts } from '@/hooks/useProducts';

export function StockAlertsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newMinStock, setNewMinStock] = useState('');

  const { data, isLoading } = useStockAlerts();
  const { data: productsData } = useProducts({ limit: 100 });
  const createAlert = useCreateStockAlert();
  const updateAlert = useUpdateStockAlert();
  const deleteAlert = useDeleteStockAlert();

  const alerts = data?.data ?? [];
  const products = productsData?.data ?? [];

  const handleOpenDialog = () => {
    setNewProductId('');
    setNewMinStock('');
    setDialogOpen(true);
  };

  const handleCreate = () => {
    if (!newProductId || newMinStock === '') return;
    createAlert.mutate(
      { productId: newProductId, minStock: Number(newMinStock) },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success('Оповещение добавлено');
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { message?: string } } };
          const message = apiErr?.response?.data?.message ?? 'Ошибка при создании оповещения';
          toast.error(message);
        },
      },
    );
  };

  const handleToggle = (id: string, current: boolean) => {
    updateAlert.mutate({ id, params: { isActive: !current } });
  };

  const handleDelete = (id: string) => {
    deleteAlert.mutate(id);
  };

  if (isLoading) {
    return (
      <Box p={3} data-testid="alerts-skeleton">
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Оповещения об остатках
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Добавить оповещение
        </Button>
      </Box>

      {alerts.length === 0 ? (
        <Typography color="text.secondary">Оповещений пока нет</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Товар</TableCell>
                <TableCell align="right">Текущий остаток</TableCell>
                <TableCell align="right">Порог</TableCell>
                <TableCell align="center">Активно</TableCell>
                <TableCell>Последнее срабатывание</TableCell>
                <TableCell align="center">Удалить</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => {
                const currentStock = alert.product.stocks.reduce((sum, s) => sum + s.quantity, 0);
                const lastHistory = alert.history[0];

                return (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.product.cleanName}</TableCell>
                    <TableCell align="right">{currentStock}</TableCell>
                    <TableCell align="right">{alert.minStock}</TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={alert.isActive}
                        onChange={() => handleToggle(alert.id, alert.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {lastHistory ? new Date(lastHistory.sentAt).toLocaleString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        data-testid={`delete-alert-${alert.id}`}
                        onClick={() => handleDelete(alert.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить оповещение</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="product-select-label">Товар</InputLabel>
            <Select
              labelId="product-select-label"
              value={newProductId}
              label="Товар"
              onChange={(e) => setNewProductId(e.target.value)}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Минимальный остаток"
            type="number"
            value={newMinStock}
            onChange={(e) => setNewMinStock(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newProductId || newMinStock === '' || createAlert.isPending}
          >
            {createAlert.isPending ? 'Сохранение...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
