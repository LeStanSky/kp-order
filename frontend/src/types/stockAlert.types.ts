import type { Pagination } from '@/types/api.types';

export interface StockAlertHistory {
  id: string;
  stockAlertId: string;
  stockValue: number;
  sentAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  minStock: number;
  isActive: boolean;
  product: {
    id: string;
    cleanName: string;
    stocks: { quantity: number }[];
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  history: StockAlertHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface StockAlertsResponse {
  data: StockAlert[];
  pagination: Pagination;
}
