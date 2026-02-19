import { apiClient } from './client';
import type { StockAlert, StockAlertsResponse } from '@/types/stockAlert.types';

export interface CreateStockAlertParams {
  productId: string;
  minStock: number;
}

export interface UpdateStockAlertParams {
  minStock?: number;
  isActive?: boolean;
}

export interface GetStockAlertsParams {
  page?: number;
  limit?: number;
}

export const stockAlertsApi = {
  createAlert: async (params: CreateStockAlertParams): Promise<StockAlert> => {
    const { data } = await apiClient.post<StockAlert>('/api/stock-alerts', params);
    return data;
  },

  getAlerts: async (params?: GetStockAlertsParams): Promise<StockAlertsResponse> => {
    const { data } = await apiClient.get<StockAlertsResponse>('/api/stock-alerts', { params });
    return data;
  },

  getAlert: async (id: string): Promise<StockAlert> => {
    const { data } = await apiClient.get<StockAlert>(`/api/stock-alerts/${id}`);
    return data;
  },

  updateAlert: async (id: string, params: UpdateStockAlertParams): Promise<StockAlert> => {
    const { data } = await apiClient.patch<StockAlert>(`/api/stock-alerts/${id}`, params);
    return data;
  },

  deleteAlert: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/stock-alerts/${id}`);
  },
};
