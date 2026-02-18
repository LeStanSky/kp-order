import { Chip } from '@mui/material';
import type { ExpiryStatus } from '@/types/product.types';

interface ExpiryBadgeProps {
  expiryStatus: ExpiryStatus | undefined;
}

const statusConfig: Record<
  ExpiryStatus,
  { label: string; color: 'success' | 'info' | 'warning' | 'error' }
> = {
  green: { label: 'Свежий', color: 'success' },
  blue: { label: 'Хороший', color: 'info' },
  yellow: { label: 'Скоро истечёт', color: 'warning' },
  orange: { label: 'Истекает', color: 'warning' },
  red: { label: 'Просрочен', color: 'error' },
};

export function ExpiryBadge({ expiryStatus }: ExpiryBadgeProps) {
  if (!expiryStatus) return null;
  const { label, color } = statusConfig[expiryStatus];
  return <Chip role="status" label={label} color={color} size="small" />;
}
