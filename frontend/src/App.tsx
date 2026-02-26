import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { createAppTheme } from '@/config/theme';
import { useThemeStore } from '@/store/themeStore';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { CartPage } from '@/pages/orders/CartPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage';
import { StockAlertsPage } from '@/pages/stockAlerts/StockAlertsPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (isAuthenticated) return <Navigate to="/products" replace />;
  return <>{children}</>;
}

function App() {
  const { mode } = useThemeStore();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProductsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <AppLayout>
                    <CartPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OrdersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OrderDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-alerts"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <AppLayout>
                    <StockAlertsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppLayout>
                    <UsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/products" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
