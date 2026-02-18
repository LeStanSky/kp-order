import type { Pagination } from './api.types';

export type ExpiryStatus = 'green' | 'blue' | 'yellow' | 'orange' | 'red';

export interface Price {
  value: number;
  currency: string;
  priceGroup: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: Category;
  unit?: string;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  prices: Price[];
  expiryDate?: string;
  expiryStatus?: ExpiryStatus;
  characteristics?: Record<string, string>;
}

export interface ProductsResponse {
  data: Product[];
  pagination: Pagination;
}
