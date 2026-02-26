import { orderRepository } from '../order.repository';
import { prisma } from '../../config/database';

const db = prisma as jest.Mocked<typeof prisma>;

const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD-20260315-001',
  userId: 'user-1',
  status: 'PENDING' as const,
  comment: null,
  totalAmount: 5000,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 'item-1',
      orderId: 'order-1',
      productId: 'prod-1',
      quantity: 2,
      price: 2500,
      currency: 'RUB',
      product: { id: 'prod-1', cleanName: 'Beer' },
    },
  ],
  user: { id: 'user-1', name: 'Client', email: 'client@test.com' },
};

describe('orderRepository', () => {
  describe('create', () => {
    it('should create order with items in a transaction', async () => {
      (db.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
        return fn(db);
      });
      (db.order.create as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderRepository.create({
        orderNumber: 'ORD-20260315-001',
        userId: 'user-1',
        comment: undefined,
        totalAmount: 5000,
        items: [{ productId: 'prod-1', quantity: 2, price: 2500, currency: 'RUB' }],
      });

      expect(db.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findById', () => {
    it('should find order by id with items and user', async () => {
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderRepository.findById('order-1');

      expect(db.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: { include: { product: { select: { id: true, cleanName: true } } } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should return null for non-existent order', async () => {
      (db.order.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await orderRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated orders with defaults', async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (db.order.count as jest.Mock).mockResolvedValue(1);

      const result = await orderRepository.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
      });

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      await orderRepository.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
        status: 'PENDING',
      });

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('should filter by userId', async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      await orderRepository.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
        userId: 'user-1',
      });

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should filter by userIds array', async () => {
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      await orderRepository.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
        userIds: ['user-1', 'user-2'],
      });

      expect(db.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: { in: ['user-1', 'user-2'] } }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updated = { ...mockOrder, status: 'CANCELLED' };
      (db.order.update as jest.Mock).mockResolvedValue(updated);

      const result = await orderRepository.updateStatus('order-1', 'CANCELLED');

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: { select: { id: true, cleanName: true } } } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result.status).toBe('CANCELLED');
    });
  });
});
