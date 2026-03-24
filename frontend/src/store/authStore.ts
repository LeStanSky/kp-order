import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types/user.types';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  mustChangePassword: boolean;
  setAuth: (user: User, tokens: Tokens, mustChangePassword?: boolean) => void;
  clearMustChangePassword: () => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      mustChangePassword: false,
      setAuth: (user, tokens, mustChangePassword = false) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          mustChangePassword,
        }),
      clearMustChangePassword: () => set({ mustChangePassword: false }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, mustChangePassword: false }),
      isAuthenticated: () => get().accessToken !== null,
      hasRole: (role) => get().user?.role === role,
    }),
    {
      name: 'auth-storage',
    },
  ),
);
