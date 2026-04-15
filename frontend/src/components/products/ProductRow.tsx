import { useEffect, useState } from 'react';
import { TableRow, TableCell, TextField, Chip, Typography } from '@mui/material';
import type { Product } from '@/types/product.types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ExpiryBadge } from './ExpiryBadge';
import {
  isKeg,
  resolveDisplayName,
  resolveStock,
  resolvePrice,
  formatPrice,
} from '@/utils/productDisplay';

interface ProductRowProps {
  product: Product;
  onOpen?: () => void;
}

const CART_SYNC_DEBOUNCE_MS = 400;

export function ProductRow({ product, onOpen }: ProductRowProps) {
  const { hasRole, user } = useAuthStore();
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const isClient = hasRole('CLIENT');
  const canOrder = isClient && user?.canOrder !== false;
  const cartItem = items.find((i) => i.productId === product.id);

  const displayName = resolveDisplayName(product.name, product.unit);
  const displayStock = resolveStock(product.name, product.stock, product.unit);
  const displayPrice = resolvePrice(product.prices, product.name, product.unit);
  const outOfStock = displayStock.value === 0;

  const cartQty = cartItem?.quantity ?? 0;
  const [inputQty, setInputQty] = useState(cartQty);
  const [trackedCartQty, setTrackedCartQty] = useState(cartQty);
  if (cartQty !== trackedCartQty) {
    setTrackedCartQty(cartQty);
    setInputQty(cartQty);
  }

  useEffect(() => {
    if (inputQty === cartQty) return;
    const handle = setTimeout(() => {
      const target = Math.min(Math.max(0, inputQty), displayStock.value);
      if (target === cartQty) return;
      if (target === 0) {
        if (cartItem) removeItem(product.id);
      } else if (cartItem) {
        updateQuantity(product.id, target);
      } else {
        addItem({
          productId: product.id,
          name: displayName,
          price: displayPrice?.value ?? 0,
          currency: displayPrice?.currency ?? 'RUB',
          quantity: target,
          isKeg: isKeg(product.name, product.unit),
        });
      }
    }, CART_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [
    inputQty,
    cartQty,
    cartItem,
    product.id,
    product.name,
    product.unit,
    displayName,
    displayPrice?.value,
    displayPrice?.currency,
    displayStock.value,
    addItem,
    updateQuantity,
    removeItem,
  ]);

  return (
    <TableRow
      hover
      sx={{
        opacity: outOfStock ? 0.5 : 1,
        '&:last-child td': { borderBottom: 0 },
      }}
    >
      {/* Название + срок годности (только для MANAGER/ADMIN) */}
      <TableCell
        onClick={onOpen}
        sx={onOpen ? { cursor: 'pointer', '&:hover': { color: 'primary.main' } } : undefined}
      >
        <Typography variant="body2" fontWeight={500}>
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
        <Typography variant="body2">{displayStock.value}</Typography>
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

      {/* Кол-во (только для CLIENT с canOrder) */}
      {canOrder && (
        <>
          <TableCell align="center" sx={{ width: 100 }}>
            <TextField
              type="number"
              size="small"
              value={inputQty}
              onChange={(e) =>
                setInputQty(Math.min(Math.max(0, Number(e.target.value)), displayStock.value))
              }
              disabled={outOfStock}
              slotProps={{
                htmlInput: {
                  min: 0,
                  max: displayStock.value,
                  style: { textAlign: 'center', width: 60 },
                },
              }}
              variant="outlined"
            />
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
