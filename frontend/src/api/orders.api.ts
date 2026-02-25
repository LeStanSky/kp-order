import { apiClient } from './client';
import type { Order, OrdersResponse } from '@/types/order.types';

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderParams {
  items: CreateOrderItem[];
  comment?: string;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const ordersApi = {
  createOrder: async (params: CreateOrderParams): Promise<Order> => {
    const { data } = await apiClient.post<Order>('/api/orders', params);
    return data;
  },

  getOrders: async (params?: GetOrdersParams): Promise<OrdersResponse> => {
    const { data } = await apiClient.get<OrdersResponse>('/api/orders', { params });
    return data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/api/orders/${id}`);
    return data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/api/orders/${id}/cancel`);
    return data;
  },

  repeatOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.post<Order>(`/api/orders/${id}/repeat`);
    return data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/orders/${id}`);
  },
};
