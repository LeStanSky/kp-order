import type { CartItem } from '@/store/cartStore';

export interface CartViolation {
  type: 'item_min_qty' | 'order_min';
  productId?: string;
  message: string;
}

const PACKAGED_MIN_PER_ITEM = 3;
const PACKAGED_ORDER_MIN = 40;

export function validateCart(items: CartItem[]): CartViolation[] {
  const violations: CartViolation[] = [];

  // Per-item: non-KEG items must have qty >= 3
  for (const item of items) {
    if (!item.isKeg && item.quantity < PACKAGED_MIN_PER_ITEM) {
      violations.push({
        type: 'item_min_qty',
        productId: item.productId,
        message: `«${item.name}»: минимум ${PACKAGED_MIN_PER_ITEM} шт (сейчас ${item.quantity})`,
      });
    }
  }

  // Total order minimum: ≥1 KEG or ≥40 packaged units
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
