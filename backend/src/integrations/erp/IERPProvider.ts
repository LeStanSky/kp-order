import { ERPProduct, ERPStock } from '../../types/erp.types';

export interface IERPProvider {
  getProducts(): Promise<ERPProduct[]>;
  getStock(): Promise<ERPStock[]>;
  testConnection(): Promise<boolean>;
}
