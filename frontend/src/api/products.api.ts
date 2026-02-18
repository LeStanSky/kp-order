import { apiClient } from './client';
import type { Product, ProductsResponse, Category } from '@/types/product.types';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const productsApi = {
  getProducts: async (params?: GetProductsParams): Promise<ProductsResponse> => {
    const { data } = await apiClient.get<ProductsResponse>('/api/products', { params });
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/api/categories');
    return data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/api/products/${id}`);
    return data;
  },
};
