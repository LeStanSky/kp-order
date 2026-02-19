import { apiClient } from './client';
import type { Product, ProductsResponse } from '@/types/product.types';

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

  getCategories: async (): Promise<string[]> => {
    const { data } = await apiClient.get<{ data: string[] }>('/api/products/categories');
    return data.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/api/products/${id}`);
    return data;
  },

  uploadImage: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<Product>(`/api/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/products/${id}/image`);
  },
};
