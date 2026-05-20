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

// --- Order automation (Phase 6) ---

export interface ERPOrderPosition {
  productExternalId: string;
  /** FIFO-chosen consignment (series); omitted for products without series tracking */
  consignmentExternalId?: string;
  /** Quantity in the product's own unit (дкл for kegs, шт otherwise) */
  quantity: number;
  /** Unit price in kopecks (МойСклад stores money as integer kopecks) */
  priceKopecks: number;
  /** Quantity to reserve for this position */
  reserve: number;
}

export interface ERPOrderInput {
  orderNumber: string;
  /** МойСклад counterparty (контрагент) UUID — User.externalId */
  agentExternalId: string;
  comment?: string;
  positions: ERPOrderPosition[];
}

export interface ERPOrderResult {
  id: string;
  number: string;
}

export interface ERPConsignment {
  id: string;
  /** Series label; expiry date is encoded here and parsed by parseProductExpiry */
  name: string;
  quantity: number;
}

export interface ERPCounterparty {
  id: string;
  name: string;
  inn?: string;
}
