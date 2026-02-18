export type UserRole = 'CLIENT' | 'MANAGER' | 'ADMIN';

export interface PriceGroup {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  priceGroup?: PriceGroup;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
