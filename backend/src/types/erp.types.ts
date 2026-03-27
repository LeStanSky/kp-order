export interface ERPProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  imageUrl?: string;
  salePrices: ERPSalePrice[];
}

export interface ERPSalePrice {
  priceTypeName: string;
  value: number; // in rubles
  currency: string;
}

export interface ERPStock {
  productExternalId: string;
  productName: string;
  quantity: number;
  warehouse?: string;
}

export interface ERPSyncResult {
  productsUpserted: number;
  stocksUpserted: number;
  pricesUpserted: number;
  errors: string[];
  duration: number;
}

export interface GetProductsOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  expired?: boolean;
}

export interface IERPProvider {
  getProducts(): Promise<ERPProduct[]>;
  getStock(): Promise<ERPStock[]>;
  testConnection(): Promise<boolean>;
}
