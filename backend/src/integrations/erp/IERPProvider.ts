import {
  ERPProduct,
  ERPStock,
  ERPOrderInput,
  ERPOrderResult,
  ERPConsignment,
  ERPCounterparty,
} from '../../types/erp.types';

export interface IERPProvider {
  getProducts(): Promise<ERPProduct[]>;
  getStock(): Promise<ERPStock[]>;
  testConnection(): Promise<boolean>;

  // --- Order automation (Phase 6) ---

  /** Create a customer order in the ERP and return its id/number. */
  createOrder(input: ERPOrderInput): Promise<ERPOrderResult>;

  /**
   * Batched live per-series availability for the given products.
   * Returns a map keyed by product external id. Products without series
   * tracking are absent from the map (caller falls back to product-level).
   */
  getConsignments(productExternalIds: string[]): Promise<Map<string, ERPConsignment[]>>;

  /** Search counterparties (контрагенты) for linking to users. */
  getCounterparties(search?: string): Promise<ERPCounterparty[]>;
}
