import { useState } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import type { Product } from '@/types/product.types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ExpiryBadge } from './ExpiryBadge';
import {
  resolveDisplayName,
  resolveStock,
  resolvePrice,
  formatPrice,
} from '@/utils/productDisplay';

interface ProductRowProps {
  product: Product;
  onOpen?: () => void;
}

export function ProductRow({ product, onOpen }: ProductRowProps) {
  const { hasRole } = useAuthStore();
  const { items, addItem, updateQuantity } = useCartStore();
  const [inputQty, setInputQty] = useState(1);

  const isClient = hasRole('CLIENT');
  const cartItem = items.find((i) => i.productId === product.id);

  const displayName = resolveDisplayName(product.name, product.unit);
  const displayStock = resolveStock(product.name, product.stock, product.unit);
  const displayPrice = resolvePrice(product.prices, product.name, product.unit);
  const outOfStock = displayStock.value === 0;

  const handleAdd = () => {
    if (inputQty < 1) return;
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + inputQty);
    } else {
      addItem({
        productId: product.id,
        name: displayName,
        price: displayPrice?.value ?? 0,
        currency: displayPrice?.currency ?? 'RUB',
        quantity: inputQty,
      });
    }
  };

  return (
    <TableRow
      hover
      sx={{
        opacity: outOfStock ? 0.5 : 1,
        '&:last-child td': { borderBottom: 0 },
      }}
    >
      {/* Название + срок годности (только для MANAGER/ADMIN) */}
      <TableCell>
        <Typography
          variant="body2"
          fontWeight={500}
          onClick={onOpen}
          sx={onOpen ? { cursor: 'pointer', '&:hover': { color: 'primary.main' } } : undefined}
        >
          {displayName}
        </Typography>
        {!isClient && product.expiryStatus && <ExpiryBadge expiryStatus={product.expiryStatus} />}
      </TableCell>

      {/* Единица измерения */}
      <TableCell align="center">
        <Typography variant="body2" color="text.secondary">
          {displayStock.unit}
        </Typography>
      </TableCell>

      {/* Остаток */}
      <TableCell align="right">
        <Typography
          variant="body2"
          color={displayStock.value < 10 ? 'warning.main' : 'text.primary'}
          fontWeight={displayStock.value < 10 ? 600 : 400}
        >
          {displayStock.value}
        </Typography>
      </TableCell>

      {/* Цена */}
      <TableCell align="right">
        {displayPrice ? (
          <Typography variant="body2" fontWeight={500}>
            {formatPrice(displayPrice.value)} {displayPrice.currency}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>

      {/* Кол-во + кнопка (только для CLIENT) */}
      {isClient && (
        <>
          <TableCell align="center" sx={{ width: 100 }}>
            <TextField
              type="number"
              size="small"
              value={inputQty}
              onChange={(e) => setInputQty(Math.max(1, Number(e.target.value)))}
              disabled={outOfStock}
              slotProps={{ htmlInput: { min: 1, style: { textAlign: 'center', width: 60 } } }}
              variant="outlined"
            />
          </TableCell>

          <TableCell align="center" sx={{ width: 56 }}>
            <Tooltip title={outOfStock ? 'Нет в наличии' : 'Добавить в корзину'}>
              <span>
                <IconButton color="primary" onClick={handleAdd} disabled={outOfStock} size="small">
                  <AddShoppingCartIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </TableCell>

          {/* В корзине */}
          <TableCell align="center" sx={{ width: 80 }}>
            {cartItem ? (
              <Chip label={cartItem.quantity} size="small" color="primary" variant="outlined" />
            ) : null}
          </TableCell>
        </>
      )}
    </TableRow>
  );
}
