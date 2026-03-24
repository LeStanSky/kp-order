import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

export function addAuthHeader(config: AxiosRequestConfig): AxiosRequestConfig {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    const headers = config.headers as Record<string, string>;
    headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as {
      response?: { status: number };
      config?: InternalAxiosRequestConfig & { _retry?: boolean };
    };

    if (axiosError.response?.status === 401 && !axiosError.config?._retry) {
      const originalRequest = axiosError.config;
      if (!originalRequest) return Promise.reject(error);
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      try {
        const { authApi } = await import('./auth.api');
        const currentMustChange = useAuthStore.getState().mustChangePassword;
        const response = await authApi.refresh(refreshToken);
        useAuthStore
          .getState()
          .setAuth(
            response.user,
            { accessToken: response.accessToken, refreshToken: response.refreshToken },
            currentMustChange,
          );
        originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
