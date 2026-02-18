import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Badge, Button, Box } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export function Header() {
  const navigate = useNavigate();
  const { user, clearAuth, hasRole } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isClient = hasRole('CLIENT');

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer', flexGrow: 0, mr: 2 }}
          onClick={() => navigate('/products')}
        >
          ERPStock
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton color="inherit" onClick={() => navigate('/orders')} title="Заказы">
          <ListAltIcon />
        </IconButton>

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

        <Typography variant="body2" sx={{ mx: 2 }}>
          {user?.name}
        </Typography>

        <Button
          color="inherit"
          onClick={handleLogout}
          aria-label="Выйти"
          startIcon={<LogoutIcon />}
        >
          Выйти
        </Button>
      </Toolbar>
    </AppBar>
  );
}
