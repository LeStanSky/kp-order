import { Chip } from '@mui/material';
import type { OrderStatus } from '@/types/order.types';

interface OrderStatusChipProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; color: 'info' | 'success' | 'default' }> =
  {
    PENDING: { label: 'Ожидает', color: 'info' },
    CONFIRMED: { label: 'Подтверждён', color: 'success' },
    CANCELLED: { label: 'Отменён', color: 'default' },
  };

export function OrderStatusChip({ status }: OrderStatusChipProps) {
  const { label, color } = statusConfig[status];
  return <Chip label={label} color={color} size="small" />;
}
