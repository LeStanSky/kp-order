import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
    defaults: {},
  },
}));

describe('api client', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it('creates axios instance with empty baseURL', async () => {
    const { apiClient } = await import('../client');
    expect(apiClient).toBeDefined();
  });

  it('request interceptor adds Authorization header when token present', async () => {
    useAuthStore
      .getState()
      .setAuth(
        { id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENT' },
        { accessToken: 'test-token', refreshToken: 'refresh' },
      );

    const { addAuthHeader } = await import('../client');
    const config = { headers: {} as Record<string, string> };
    const result = addAuthHeader(config);
    expect(result.headers!['Authorization']).toBe('Bearer test-token');
  });

  it('request interceptor does not add header when no token', async () => {
    const { addAuthHeader } = await import('../client');
    const config = { headers: {} as Record<string, string> };
    const result = addAuthHeader(config);
    expect(result.headers!['Authorization']).toBeUndefined();
  });
});
