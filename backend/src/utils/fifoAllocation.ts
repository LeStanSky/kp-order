/**
 * FIFO consignment allocation for ERP order positions.
 *
 * Picks the oldest non-expired series first. Consignments whose expiry is before
 * `today` are excluded entirely (never ship expired goods); consignments without
 * a parsed expiry date sort last (used only after all dated ones).
 */

export interface AllocatableConsignment {
  id: string;
  expiryDate: Date | null;
  quantity: number;
}

export interface Allocation {
  consignmentId: string;
  quantity: number;
}

export interface FifoResult {
  allocations: Allocation[];
  /** How much of the required quantity could not be covered by non-expired stock. */
  shortfall: number;
}

export function allocateFifo(
  requiredQty: number,
  consignments: AllocatableConsignment[],
  today: Date,
): FifoResult {
  const active = consignments
    .filter((c) => c.quantity > 0 && (c.expiryDate === null || c.expiryDate >= today))
    .sort((a, b) => {
      if (a.expiryDate === null && b.expiryDate === null) return 0;
      if (a.expiryDate === null) return 1; // undated last
      if (b.expiryDate === null) return -1;
      return a.expiryDate.getTime() - b.expiryDate.getTime(); // earliest first
    });

  const allocations: Allocation[] = [];
  let remaining = requiredQty;

  for (const c of active) {
    if (remaining <= 0) break;
    const take = Math.min(c.quantity, remaining);
    allocations.push({ consignmentId: c.id, quantity: take });
    remaining -= take;
  }

  return { allocations, shortfall: remaining > 0 ? remaining : 0 };
}
