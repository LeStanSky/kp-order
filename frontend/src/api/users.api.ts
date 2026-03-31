import { apiClient } from './client';
import type { UserRole, DeliveryCategory } from '@/types/user.types';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  canOrder: boolean;
  mustChangePassword: boolean;
  deliveryCategory: DeliveryCategory;
  priceGroupId: string | null;
  managerId: string | null;
  priceGroup?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  deliveryCategory?: DeliveryCategory;
  canOrder?: boolean;
  managerId?: string | null;
  priceGroupId?: string | null;
}

export interface UpdateUserParams {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  canOrder?: boolean;
  deliveryCategory?: DeliveryCategory;
  managerId?: string | null;
  priceGroupId?: string | null;
}

export interface PriceGroup {
  id: string;
  name: string;
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

  createUser: async (params: CreateUserParams): Promise<AdminUser> => {
    const { data } = await apiClient.post<AdminUser>('/api/users', params);
    return data;
  },

  updateUser: async (id: string, params: UpdateUserParams): Promise<AdminUser> => {
    const { data } = await apiClient.patch<AdminUser>(`/api/users/${id}`, params);
    return data;
  },

  resetPassword: async (id: string, password: string): Promise<void> => {
    await apiClient.post(`/api/users/${id}/reset-password`, { password });
  },

  getPriceGroups: async (): Promise<PriceGroup[]> => {
    const { data } = await apiClient.get<PriceGroup[]>('/api/price-groups');
    return data;
  },
};
