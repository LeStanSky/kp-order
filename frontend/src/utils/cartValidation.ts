import type { CartItem } from '@/store/cartStore';
import type { DeliveryCategory } from '@/types/user.types';

export interface CartViolation {
  type: 'item_min_qty' | 'order_min';
  productId?: string;
  message: string;
}

const PACKAGED_MIN_PER_ITEM = 3;
const PACKAGED_ORDER_MIN = 40;
const REMOTE_ORDER_MIN_AMOUNT = 30000;

export function validateCart(
  items: CartItem[],
  deliveryCategory: DeliveryCategory = 'STANDARD',
): CartViolation[] {
  const violations: CartViolation[] = [];

  if (deliveryCategory === 'REMOTE') {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (total < REMOTE_ORDER_MIN_AMOUNT) {
      violations.push({
        type: 'order_min',
        message: `Минимальная сумма заказа для удалённой доставки: ${REMOTE_ORDER_MIN_AMOUNT.toLocaleString('ru-RU')} ₽ (сейчас ${Math.round(total).toLocaleString('ru-RU')} ₽)`,
      });
    }
    return violations;
  }

  // STANDARD: per-item minimum for non-KEG items
  for (const item of items) {
    if (!item.isKeg && item.quantity < PACKAGED_MIN_PER_ITEM) {
      violations.push({
        type: 'item_min_qty',
        productId: item.productId,
        message: `«${item.name}»: минимум ${PACKAGED_MIN_PER_ITEM} шт (сейчас ${item.quantity})`,
      });
    }
  }

  // STANDARD: total order minimum — ≥1 KEG or ≥40 packaged units
  const kegCount = items.filter((i) => i.isKeg).reduce((sum, i) => sum + i.quantity, 0);
  const packagedCount = items.filter((i) => !i.isKeg).reduce((sum, i) => sum + i.quantity, 0);

  if (kegCount === 0 && packagedCount < PACKAGED_ORDER_MIN) {
    violations.push({
      type: 'order_min',
      message: `Минимальный заказ: 1 кег или ${PACKAGED_ORDER_MIN} шт фасованной продукции (сейчас ${packagedCount} шт)`,
    });
  }

  return violations;
}
