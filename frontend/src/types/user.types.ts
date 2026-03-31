export type UserRole = 'CLIENT' | 'MANAGER' | 'ADMIN';
export type DeliveryCategory = 'STANDARD' | 'REMOTE';

export interface PriceGroup {
  id: string;
  name: string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  deliveryCategory?: DeliveryCategory;
  canOrder?: boolean;
  priceGroup?: PriceGroup;
  manager?: Manager | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
}
