import { apiClient } from './client';
import type { UserRole } from '@/types/user.types';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  priceGroupId: string | null;
  managerId: string | null;
  priceGroup?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  managerId?: string | null;
}

export const usersApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await apiClient.get<AdminUser[]>('/api/users');
    return data;
  },

  getUser: async (id: string): Promise<AdminUser> => {
    const { data } = await apiClient.get<AdminUser>(`/api/users/${id}`);
    return data;
  },

  updateUser: async (id: string, params: UpdateUserParams): Promise<AdminUser> => {
    const { data } = await apiClient.patch<AdminUser>(`/api/users/${id}`, params);
    return data;
  },
};
