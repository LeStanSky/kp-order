import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

const mockUser: User = {
  id: '1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'CLIENT',
};

const mockTokens = { accessToken: 'token', refreshToken: 'refresh' };

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('ProtectedRoute', () => {
  it('redirects unauthenticated user to /login', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { routerProps: { initialEntries: ['/protected'] } },
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated user', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when authenticated but wrong role', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    renderWithProviders(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>Admin Content</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated user with correct role', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    renderWithProviders(
      <ProtectedRoute allowedRoles={['CLIENT']}>
        <div>Client Content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Client Content')).toBeInTheDocument();
  });

  it('redirects to /change-password when mustChangePassword is true', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens, true);
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { routerProps: { initialEntries: ['/protected'] } },
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
