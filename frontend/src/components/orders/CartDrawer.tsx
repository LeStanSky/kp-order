import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  List,
  ListItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { useCartStore } from '@/store/cartStore';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalAmount } = useCartStore();

  const handleCheckout = () => {
    onClose();
    navigate('/cart');
  };

  const handleQuantityChange = (productId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQty);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Корзина</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {items.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Корзина пуста</Typography>
          </Box>
        ) : (
          <>
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {items.map((item) => (
                <ListItem
                  key={item.productId}
                  sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}
                >
                  <Typography variant="body1">{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.price} {item.currency}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <IconButton
                      size="small"
                      aria-label="-"
                      onClick={() => handleQuantityChange(item.productId, item.quantity, -1)}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography>{item.quantity}</Typography>
                    <IconButton
                      size="small"
                      aria-label="+"
                      onClick={() => handleQuantityChange(item.productId, item.quantity, 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => removeItem(item.productId)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>

            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Итого: {totalAmount()} RUB
              </Typography>
              <Button variant="contained" fullWidth onClick={handleCheckout}>
                Оформить заказ
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
