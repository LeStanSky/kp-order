import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  Box,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useThemeStore } from '@/store/themeStore';
import type { ReactElement } from 'react';

interface NavItem {
  label: string;
  icon: ReactElement;
  path: string;
  active: boolean;
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, hasRole } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const { mode, toggleMode } = useThemeStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.clear();
    clearAuth();
    navigate('/login');
  };

  const isClient = hasRole('CLIENT');
  const isAdmin = hasRole('ADMIN');
  const onProducts = location.pathname === '/products';
  const onOrders = location.pathname.startsWith('/orders');
  const onAlerts = location.pathname === '/stock-alerts';
  const onUsers = location.pathname === '/users';

  const navItems: NavItem[] = [
    { label: 'Товары', icon: <InventoryIcon />, path: '/products', active: onProducts },
    { label: 'Заказы', icon: <ListAltIcon />, path: '/orders', active: onOrders },
    ...(isAdmin
      ? [{ label: 'Пользователи', icon: <PeopleIcon />, path: '/users', active: onUsers }]
      : []),
    ...(!isClient
      ? [
          {
            label: 'Оповещения',
            icon: <NotificationsIcon />,
            path: '/stock-alerts',
            active: onAlerts,
          },
        ]
      : []),
  ];

  const activeSx = (active: boolean) => ({
    borderBottom: active ? '2px solid #E42127' : '2px solid transparent',
    borderRadius: 0,
    pb: 0.5,
  });

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 0.5, minHeight: { xs: 48 }, px: { xs: 1, md: 2 } }}>
        <Box
          component="img"
          src="/logo-white.png"
          alt="Красный Пропеллер"
          sx={{
            height: { xs: 28, md: 36 },
            mr: { xs: 1, md: 2 },
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/products')}
        />

        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderColor: 'rgba(255,255,255,0.3)', mx: 1, display: { xs: 'none', md: 'flex' } }}
        />

        {navItems.map((item) =>
          isMobile ? (
            <Tooltip key={item.path} title={item.label}>
              <IconButton
                color="inherit"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                sx={activeSx(item.active)}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{ fontWeight: item.active ? 700 : 400, ...activeSx(item.active) }}
            >
              {item.label}
            </Button>
          ),
        )}

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

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

        <Typography variant="body2" sx={{ mx: 1, display: { xs: 'none', md: 'block' } }}>
          {user?.name}
        </Typography>

        <IconButton
          color="inherit"
          onClick={toggleMode}
          title={mode === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>

        {isMobile ? (
          <Tooltip title="Выйти">
            <IconButton color="inherit" onClick={handleLogout} aria-label="Выйти">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            color="inherit"
            onClick={handleLogout}
            aria-label="Выйти"
            startIcon={<LogoutIcon />}
            size="small"
          >
            Выйти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
