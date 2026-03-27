import type { Pagination } from './api.types';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface OrderItemProduct {
  id: string;
  cleanName: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  currency: string;
  product: OrderItemProduct;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  comment?: string;
  totalAmount: number;
  user: OrderUser;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  data: Order[];
  pagination: Pagination;
}
