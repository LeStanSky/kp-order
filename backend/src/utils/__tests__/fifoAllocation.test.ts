import { allocateFifo, AllocatableConsignment } from '../fifoAllocation';

const today = new Date('2026-05-20T00:00:00.000Z');
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('allocateFifo', () => {
  it('allocates from a single consignment when it covers the quantity', () => {
    const cons: AllocatableConsignment[] = [{ id: 'a', expiryDate: d('2026-08-01'), quantity: 10 }];
    expect(allocateFifo(4, cons, today)).toEqual({
      allocations: [{ consignmentId: 'a', quantity: 4 }],
      shortfall: 0,
    });
  });

  it('picks the earliest expiry first (FIFO)', () => {
    const cons: AllocatableConsignment[] = [
      { id: 'late', expiryDate: d('2026-12-01'), quantity: 10 },
      { id: 'early', expiryDate: d('2026-06-01'), quantity: 10 },
    ];
    const res = allocateFifo(3, cons, today);
    expect(res.allocations).toEqual([{ consignmentId: 'early', quantity: 3 }]);
    expect(res.shortfall).toBe(0);
  });

  it('splits across multiple consignments oldest-first', () => {
    const cons: AllocatableConsignment[] = [
      { id: 'early', expiryDate: d('2026-06-01'), quantity: 5 },
      { id: 'mid', expiryDate: d('2026-07-01'), quantity: 5 },
    ];
    const res = allocateFifo(8, cons, today);
    expect(res.allocations).toEqual([
      { consignmentId: 'early', quantity: 5 },
      { consignmentId: 'mid', quantity: 3 },
    ]);
    expect(res.shortfall).toBe(0);
  });

  it('excludes expired consignments entirely', () => {
    const cons: AllocatableConsignment[] = [
      { id: 'expired', expiryDate: d('2026-05-19'), quantity: 100 },
      { id: 'active', expiryDate: d('2026-09-01'), quantity: 4 },
    ];
    const res = allocateFifo(6, cons, today);
    expect(res.allocations).toEqual([{ consignmentId: 'active', quantity: 4 }]);
    expect(res.shortfall).toBe(2);
  });

  it('keeps consignments expiring exactly today (not yet expired)', () => {
    const cons: AllocatableConsignment[] = [{ id: 'today', expiryDate: today, quantity: 5 }];
    const res = allocateFifo(2, cons, today);
    expect(res.allocations).toEqual([{ consignmentId: 'today', quantity: 2 }]);
  });

  it('reports a shortfall when non-expired stock is insufficient', () => {
    const cons: AllocatableConsignment[] = [{ id: 'a', expiryDate: d('2026-08-01'), quantity: 3 }];
    expect(allocateFifo(10, cons, today)).toEqual({
      allocations: [{ consignmentId: 'a', quantity: 3 }],
      shortfall: 7,
    });
  });

  it('skips zero-stock consignments', () => {
    const cons: AllocatableConsignment[] = [
      { id: 'empty', expiryDate: d('2026-06-01'), quantity: 0 },
      { id: 'stocked', expiryDate: d('2026-07-01'), quantity: 5 },
    ];
    const res = allocateFifo(4, cons, today);
    expect(res.allocations).toEqual([{ consignmentId: 'stocked', quantity: 4 }]);
  });

  it('sorts undated consignments last', () => {
    const cons: AllocatableConsignment[] = [
      { id: 'undated', expiryDate: null, quantity: 5 },
      { id: 'dated', expiryDate: d('2026-06-01'), quantity: 3 },
    ];
    const res = allocateFifo(5, cons, today);
    expect(res.allocations).toEqual([
      { consignmentId: 'dated', quantity: 3 },
      { consignmentId: 'undated', quantity: 2 },
    ]);
  });

  it('returns full shortfall when there are no consignments', () => {
    expect(allocateFifo(5, [], today)).toEqual({ allocations: [], shortfall: 5 });
  });
});
