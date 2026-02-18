import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  Box,
  Divider,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, hasRole } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isClient = hasRole('CLIENT');
  const onProducts = location.pathname === '/products';
  const onOrders = location.pathname.startsWith('/orders');

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 0.5 }}>
        <Typography variant="h6" component="div" sx={{ mr: 2, fontWeight: 700, letterSpacing: 1 }}>
          ERPStock
        </Typography>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: 'rgba(255,255,255,0.3)', mx: 1 }}
        />

        <Button
          color="inherit"
          startIcon={<InventoryIcon />}
          onClick={() => navigate('/products')}
          sx={{
            fontWeight: onProducts ? 700 : 400,
            borderBottom: onProducts ? '2px solid white' : '2px solid transparent',
            borderRadius: 0,
            pb: 0.5,
          }}
        >
          Товары
        </Button>

        <Button
          color="inherit"
          startIcon={<ListAltIcon />}
          onClick={() => navigate('/orders')}
          sx={{
            fontWeight: onOrders ? 700 : 400,
            borderBottom: onOrders ? '2px solid white' : '2px solid transparent',
            borderRadius: 0,
            pb: 0.5,
          }}
        >
          Заказы
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {isClient && (
          <IconButton
            color="inherit"
            onClick={() => navigate('/cart')}
            data-testid="cart-icon-btn"
            title="Корзина"
          >
            <Badge badgeContent={totalItems} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}

        <Typography variant="body2" sx={{ mx: 1 }}>
          {user?.name}
        </Typography>

        <Button
          color="inherit"
          onClick={handleLogout}
          aria-label="Выйти"
          startIcon={<LogoutIcon />}
          size="small"
        >
          Выйти
        </Button>
      </Toolbar>
    </AppBar>
  );
}
