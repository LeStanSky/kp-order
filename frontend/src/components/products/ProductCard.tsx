import { Card, CardContent, CardActions, Typography, Button, Box, Chip } from '@mui/material';
import type { Product } from '@/types/product.types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ExpiryBadge } from './ExpiryBadge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { hasRole } = useAuthStore();
  const { addItem } = useCartStore();
  const isClient = hasRole('CLIENT');

  const price = product.prices[0];

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: price?.value ?? 0,
      currency: price?.currency ?? 'RUB',
      quantity: 1,
    });
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {product.name}
        </Typography>

        {product.category && <Chip label={product.category.name} size="small" sx={{ mb: 1 }} />}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Остаток: {product.stock} {product.unit ?? 'шт'}
        </Typography>

        {price && (
          <Typography variant="h6" color="primary">
            {price.value} {price.currency}
          </Typography>
        )}

        <Box sx={{ mt: 1 }}>
          <ExpiryBadge expiryStatus={product.expiryStatus} />
        </Box>
      </CardContent>

      {isClient && (
        <CardActions>
          <Button
            size="small"
            variant="contained"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            В корзину
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
