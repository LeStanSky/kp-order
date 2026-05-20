import { pushOrder } from '../orderSync.job';
import { orderRepository } from '../../repositories/order.repository';
import { createERPProvider } from '../../integrations/erp/ERPProviderFactory';
import { ERPConsignment } from '../../types/erp.types';

jest.mock('../../repositories/order.repository');
jest.mock('../../integrations/erp/ERPProviderFactory');

const mockRepo = orderRepository as jest.Mocked<typeof orderRepository>;
const mockCreateProvider = createERPProvider as jest.MockedFunction<typeof createERPProvider>;

function makeProvider(consignments: Map<string, ERPConsignment[]>) {
  const createOrder = jest.fn().mockResolvedValue({ id: 'co-1', number: 'МС-1' });
  const getConsignments = jest.fn().mockResolvedValue(consignments);
  mockCreateProvider.mockReturnValue({ createOrder, getConsignments } as any);
  return { createOrder, getConsignments };
}

const baseOrder = {
  id: 'order-1',
  orderNumber: 'ORD-1',
  comment: 'note',
  erpId: null,
  erpRetryCount: 0,
  user: { externalId: 'agent-1' },
  items: [
    {
      productId: 'p1',
      quantity: 2,
      price: 100,
      product: { externalId: 'ext1', cleanName: 'Beer 0.5л', unit: 'шт' },
    },
  ],
};

describe('pushOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.updateErpSync.mockResolvedValue({} as any);
  });

  it('allocates FIFO across non-expired series and pushes the order', async () => {
    mockRepo.findForErpSync.mockResolvedValue(structuredClone(baseOrder) as any);
    const { createOrder } = makeProvider(
      new Map([
        [
          'ext1',
          [
            { id: 'c-expired', name: 'партия / 2000-01-01', quantity: 99 },
            { id: 'c-late', name: 'партия / 2099-06-01', quantity: 5 },
            { id: 'c-early', name: 'партия / 2099-01-01', quantity: 5 },
          ],
        ],
      ]),
    );

    await pushOrder('order-1');

    expect(createOrder).toHaveBeenCalledWith({
      orderNumber: 'ORD-1',
      agentExternalId: 'agent-1',
      comment: 'note',
      positions: [
        {
          productExternalId: 'ext1',
          consignmentExternalId: 'c-early',
          quantity: 2,
          priceKopecks: 10000,
          reserve: 2,
        },
      ],
    });
    expect(mockRepo.updateErpSync).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ erpSyncStatus: 'SYNCED', erpId: 'co-1', erpNumber: 'МС-1' }),
    );
  });

  it('is idempotent — skips orders already pushed', async () => {
    mockRepo.findForErpSync.mockResolvedValue({ ...baseOrder, erpId: 'co-existing' } as any);
    const { createOrder } = makeProvider(new Map());

    await pushOrder('order-1');

    expect(createOrder).not.toHaveBeenCalled();
    expect(mockRepo.updateErpSync).not.toHaveBeenCalled();
  });

  it('fails (without pushing) when the user has no counterparty link', async () => {
    mockRepo.findForErpSync.mockResolvedValue({
      ...baseOrder,
      user: { externalId: null },
    } as any);
    const { createOrder } = makeProvider(new Map());

    await pushOrder('order-1');

    expect(createOrder).not.toHaveBeenCalled();
    expect(mockRepo.updateErpSync).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ erpSyncStatus: 'FAILED' }),
    );
  });

  it('fails on shortfall of non-expired stock instead of pushing', async () => {
    mockRepo.findForErpSync.mockResolvedValue(structuredClone(baseOrder) as any);
    const { createOrder } = makeProvider(
      new Map([['ext1', [{ id: 'c1', name: 'партия / 2099-01-01', quantity: 1 }]]]),
    );

    await pushOrder('order-1');

    expect(createOrder).not.toHaveBeenCalled();
    expect(mockRepo.updateErpSync).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({
        erpSyncStatus: 'FAILED',
        erpError: expect.stringContaining('non-expired'),
      }),
    );
  });

  it('falls back to a product-level position when there is no series tracking', async () => {
    mockRepo.findForErpSync.mockResolvedValue(structuredClone(baseOrder) as any);
    const { createOrder } = makeProvider(new Map()); // no consignments for ext1

    await pushOrder('order-1');

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [{ productExternalId: 'ext1', quantity: 2, priceKopecks: 10000, reserve: 2 }],
      }),
    );
  });

  it('converts дкл kegs to дкл units and per-дкл kopecks', async () => {
    mockRepo.findForErpSync.mockResolvedValue({
      ...structuredClone(baseOrder),
      items: [
        {
          productId: 'keg',
          quantity: 1,
          price: 8000, // per-keg price (20 л = ×2 of 4000/дкл)
          product: { externalId: 'kext', cleanName: 'APA 20 л.', unit: 'дкл' },
        },
      ],
    } as any);
    const { createOrder } = makeProvider(new Map()); // no series → product-level

    await pushOrder('order-1');

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [{ productExternalId: 'kext', quantity: 2, priceKopecks: 400000, reserve: 2 }],
      }),
    );
  });

  it('marks FAILED, increments retry count and rethrows on ERP error', async () => {
    mockRepo.findForErpSync.mockResolvedValue({
      ...structuredClone(baseOrder),
      erpRetryCount: 1,
    } as any);
    const createOrder = jest.fn().mockRejectedValue(new Error('ERP down'));
    mockCreateProvider.mockReturnValue({
      createOrder,
      getConsignments: jest.fn().mockResolvedValue(new Map()),
    } as any);

    await expect(pushOrder('order-1')).rejects.toThrow('ERP down');

    expect(mockRepo.updateErpSync).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ erpSyncStatus: 'FAILED', erpError: 'ERP down', erpRetryCount: 2 }),
    );
  });

  it('returns silently when the order no longer exists', async () => {
    mockRepo.findForErpSync.mockResolvedValue(null);

    await pushOrder('order-1');

    expect(mockCreateProvider).not.toHaveBeenCalled();
    expect(mockRepo.updateErpSync).not.toHaveBeenCalled();
  });
});
