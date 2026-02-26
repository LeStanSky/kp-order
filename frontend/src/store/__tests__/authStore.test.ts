import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '@/types/user.types';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CLIENT',
};

const mockTokens = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initial state is empty', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('setAuth saves user and tokens', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(mockTokens.accessToken);
    expect(state.refreshToken).toBe(mockTokens.refreshToken);
  });

  it('clearAuth resets state to null', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('isAuthenticated returns true when accessToken is set', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when not logged in', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('hasRole returns true for correct role', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    expect(useAuthStore.getState().hasRole('CLIENT')).toBe(true);
  });

  it('hasRole returns false for wrong role', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    expect(useAuthStore.getState().hasRole('ADMIN')).toBe(false);
  });

  it('hasRole returns false when not authenticated', () => {
    expect(useAuthStore.getState().hasRole('CLIENT')).toBe(false);
  });
});
