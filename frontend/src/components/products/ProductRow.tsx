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
import type { Product, Price } from '@/types/product.types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ExpiryBadge } from './ExpiryBadge';

interface ProductRowProps {
  product: Product;
}

/**
 * Для дкл-товаров (KEG) убирает "PET KEG" и "розлив" из отображаемого названия.
 */
function resolveDisplayName(name: string, unit: string | undefined): string {
  if (unit !== 'дкл') return name;
  return name
    .replace(/\bPET\s+KEG\b\s*/gi, '')
    .replace(/розлив\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Для товаров группы РОЗЛИВ (единица — дкл) вычисляет отображаемый остаток в штуках.
 * Объём тары определяется из названия: 10 л → 1 дкл, 20 л → 2 дкл, 30 л → 3 дкл.
 * Остаток в штуках = stock_в_дкл / дкл_на_штуку.
 * Если объём не найден в названии — возвращает исходные значения.
 */
function resolveStock(name: string, stock: number, unit: string | undefined) {
  if (unit === 'дкл') {
    const match = name.match(/(?<!\d)(10|20|30)\s*л/i);
    if (match) {
      const factor = parseInt(match[1], 10) / 10; // 10→1, 20→2, 30→3
      return { value: Math.floor(stock / factor), unit: 'шт' };
    }
  }
  return { value: stock, unit: unit ?? 'шт' };
}

/**
 * Для KEG-товаров (дкл) пересчитывает цену за 10л → цену за весь кег.
 * Фактор = volume_л / 10: 20л → ×2, 30л → ×3.
 * Для остальных возвращает цену без изменений.
 */
function resolvePrice(prices: Price[], name: string, unit: string | undefined): Price | null {
  const price = prices[0] ?? null;
  if (!price || unit !== 'дкл') return price;
  const match = name.match(/(?<!\d)(10|20|30)\s*л/i);
  if (!match) return price;
  const factor = parseInt(match[1], 10) / 10;
  return { ...price, value: Math.round(price.value * factor * 100) / 100 };
}

export function ProductRow({ product }: ProductRowProps) {
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
            {displayPrice.value} {displayPrice.currency}
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
