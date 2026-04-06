import { orderService } from '../order.service';
import { orderRepository } from '../../repositories/order.repository';
import { userRepository } from '../../repositories/user.repository';
import { prisma } from '../../config/database';
import { generateOrderNumber } from '../../utils/orderNumberGenerator';
import { emailService } from '../email.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

jest.mock('../../repositories/order.repository');
jest.mock('../../repositories/user.repository');
jest.mock('../../utils/orderNumberGenerator');
jest.mock('../email.service');

const mockOrderRepo = orderRepository as jest.Mocked<typeof orderRepository>;
const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockGenerateOrderNumber = generateOrderNumber as jest.MockedFunction<
  typeof generateOrderNumber
>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const db = prisma as jest.Mocked<typeof prisma>;

const mockUser = {
  id: 'user-1',
  email: 'client@test.com',
  name: 'Test Client',
  role: 'CLIENT' as const,
  priceGroupId: 'pg-1',
  password: 'hashed',
  isActive: true,
  canOrder: true,
  managerId: 'manager-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  priceGroup: {
    id: 'pg-1',
    name: 'Retail',
    externalId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  clients: [],
  manager: { id: 'manager-1', email: 'manager@test.com', name: 'Manager' },
};

const mockManager = {
  ...mockUser,
  id: 'manager-1',
  email: 'manager@test.com',
  name: 'Manager',
  role: 'MANAGER' as const,
  clients: [{ id: 'user-1' }, { id: 'user-2' }],
};

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
  user: { id: 'user-1', name: 'Test Client', email: 'client@test.com' },
};

describe('orderService', () => {
  describe('createOrder', () => {
    const createInput = {
      items: [{ productId: 'prod-1', quantity: 2 }],
      comment: 'Test order',
    };

    beforeEach(() => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-1', cleanName: 'Beer', unit: 'шт' },
      ]);
    });

    it('should create an order successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-001');
      mockOrderRepo.create.mockResolvedValue(mockOrder as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      const result = await orderService.createOrder('user-1', createInput);

      expect(result.orderNumber).toBe('ORD-20260315-001');
      expect(mockOrderRepo.create).toHaveBeenCalledWith({
        orderNumber: 'ORD-20260315-001',
        userId: 'user-1',
        comment: 'Test order',
        totalAmount: 5000,
        items: [{ productId: 'prod-1', quantity: 2, price: 2500, currency: 'RUB' }],
      });
    });

    it('should apply KEG price multiplier for дкл products', async () => {
      const kegInput = {
        items: [{ productId: 'keg-1', quantity: 1 }],
      };
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'keg-1', cleanName: 'APA алк.5% 20 л.', unit: 'дкл' },
      ]);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'keg-1', value: 4000, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-005');
      mockOrderRepo.create.mockResolvedValue({ ...mockOrder, id: 'order-keg' } as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.createOrder('user-1', kegInput);

      // 4000 per дкл × 2 (20л / 10) = 8000 per keg
      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 8000,
          items: [{ productId: 'keg-1', quantity: 1, price: 8000, currency: 'RUB' }],
        }),
      );
    });

    it('should apply KEG price multiplier for 30л keg', async () => {
      const kegInput = {
        items: [{ productId: 'keg-2', quantity: 2 }],
      };
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'keg-2', cleanName: 'Lager 30 л.', unit: 'дкл' },
      ]);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'keg-2', value: 3000, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-006');
      mockOrderRepo.create.mockResolvedValue({ ...mockOrder, id: 'order-keg2' } as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.createOrder('user-1', kegInput);

      // 3000 per дкл × 3 (30л / 10) = 9000 per keg, × 2 qty = 18000
      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 18000,
          items: [{ productId: 'keg-2', quantity: 2, price: 9000, currency: 'RUB' }],
        }),
      );
    });

    it('should not apply KEG multiplier for non-дкл products', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-007');
      mockOrderRepo.create.mockResolvedValue(mockOrder as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.createOrder('user-1', createInput);

      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ productId: 'prod-1', quantity: 2, price: 2500, currency: 'RUB' }],
        }),
      );
    });

    it('should throw NotFoundError if user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(orderService.createOrder('bad-user', createInput)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw BadRequestError if product has no price for user price group', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([]);

      await expect(orderService.createOrder('user-1', createInput)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should throw BadRequestError if user has no price group', async () => {
      const noPriceGroupUser = { ...mockUser, priceGroupId: null, priceGroup: null };
      mockUserRepo.findById.mockResolvedValue(noPriceGroupUser as any);

      await expect(orderService.createOrder('user-1', createInput)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should throw ForbiddenError if user canOrder is false', async () => {
      const viewOnlyUser = { ...mockUser, canOrder: false };
      mockUserRepo.findById.mockResolvedValue(viewOnlyUser as any);

      await expect(orderService.createOrder('user-1', createInput)).rejects.toThrow(ForbiddenError);
    });

    it('should send email notifications after creating order', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-001');
      mockOrderRepo.create.mockResolvedValue(mockOrder as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.createOrder('user-1', createInput);

      expect(mockEmailService.sendOrderNotificationToManager).toHaveBeenCalledWith(
        expect.objectContaining({ managerEmail: 'manager@test.com' }),
      );
      expect(mockEmailService.sendOrderConfirmationToClient).toHaveBeenCalled();
    });

    it('should skip manager notification when user has no manager', async () => {
      const userWithoutManager = { ...mockUser, manager: null };
      mockUserRepo.findById.mockResolvedValue(userWithoutManager as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-001');
      mockOrderRepo.create.mockResolvedValue(mockOrder as any);
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.createOrder('user-1', createInput);

      expect(mockEmailService.sendOrderNotificationToManager).not.toHaveBeenCalled();
      expect(mockEmailService.sendOrderConfirmationToClient).toHaveBeenCalled();
    });

    it('should compute totalAmount from prices × quantities', async () => {
      const multiItemInput = {
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 3 },
        ],
      };
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-1', cleanName: 'Beer', unit: 'шт' },
        { id: 'prod-2', cleanName: 'Wine', unit: 'шт' },
      ]);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 100, currency: 'RUB' },
        { productId: 'prod-2', value: 200, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-002');
      mockOrderRepo.create.mockResolvedValue({ ...mockOrder, totalAmount: 800 } as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.createOrder('user-1', multiItemInput);

      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 800 }),
      );
    });
  });

  describe('getOrders', () => {
    const query = { page: 1, limit: 20, sortOrder: 'desc' as const };

    it('should return own orders for CLIENT', async () => {
      mockOrderRepo.findAll.mockResolvedValue({
        orders: [mockOrder],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as any);

      const result = await orderService.getOrders({ id: 'user-1', role: 'CLIENT' as const }, query);

      expect(mockOrderRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should return assigned clients orders for MANAGER', async () => {
      mockUserRepo.findById.mockResolvedValue(mockManager as any);
      mockOrderRepo.findAll.mockResolvedValue({
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      } as any);

      await orderService.getOrders({ id: 'manager-1', role: 'MANAGER' as const }, query);

      expect(mockOrderRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ userIds: ['user-1', 'user-2'] }),
      );
    });

    it('should return all orders for ADMIN', async () => {
      mockOrderRepo.findAll.mockResolvedValue({
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      } as any);

      await orderService.getOrders({ id: 'admin-1', role: 'ADMIN' as const }, query);

      expect(mockOrderRepo.findAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ userId: expect.anything() }),
      );
    });

    it('should pass status filter', async () => {
      mockOrderRepo.findAll.mockResolvedValue({
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      } as any);

      await orderService.getOrders(
        { id: 'user-1', role: 'CLIENT' as const },
        { ...query, status: 'PENDING' },
      );

      expect(mockOrderRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' }),
      );
    });

    it('should return pagination info', async () => {
      mockOrderRepo.findAll.mockResolvedValue({
        orders: [mockOrder],
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      } as any);

      const result = await orderService.getOrders(
        { id: 'user-1', role: 'CLIENT' as const },
        { page: 2, limit: 10, sortOrder: 'desc' },
      );

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order for its owner', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);

      const result = await orderService.getOrderById('order-1', {
        id: 'user-1',
        role: 'CLIENT' as const,
      });

      expect(result.id).toBe('order-1');
    });

    it('should return order for ADMIN', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);

      const result = await orderService.getOrderById('order-1', {
        id: 'admin-1',
        role: 'ADMIN' as const,
      });

      expect(result.id).toBe('order-1');
    });

    it('should return order for assigned MANAGER', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      mockUserRepo.findById.mockResolvedValue(mockManager as any);

      const result = await orderService.getOrderById('order-1', {
        id: 'manager-1',
        role: 'MANAGER' as const,
      });

      expect(result.id).toBe('order-1');
    });

    it('should throw NotFoundError for non-existent order', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        orderService.getOrderById('bad-id', { id: 'user-1', role: 'CLIENT' as const }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for another client', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);

      await expect(
        orderService.getOrderById('order-1', { id: 'user-2', role: 'CLIENT' as const }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for unassigned MANAGER', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      const unassignedManager = { ...mockManager, id: 'manager-2', clients: [{ id: 'user-3' }] };
      mockUserRepo.findById.mockResolvedValue(unassignedManager as any);

      await expect(
        orderService.getOrderById('order-1', { id: 'manager-2', role: 'MANAGER' as const }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a PENDING order by owner', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      const cancelled = { ...mockOrder, status: 'CANCELLED' as const };
      mockOrderRepo.updateStatus.mockResolvedValue(cancelled as any);

      const result = await orderService.cancelOrder('order-1', {
        id: 'user-1',
        role: 'CLIENT' as const,
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('should allow ADMIN to cancel any order', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      const cancelled = { ...mockOrder, status: 'CANCELLED' as const };
      mockOrderRepo.updateStatus.mockResolvedValue(cancelled as any);

      const result = await orderService.cancelOrder('order-1', {
        id: 'admin-1',
        role: 'ADMIN' as const,
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundError for non-existent order', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        orderService.cancelOrder('bad-id', { id: 'user-1', role: 'CLIENT' as const }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if CLIENT is not the owner', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);

      await expect(
        orderService.cancelOrder('order-1', { id: 'user-2', role: 'CLIENT' as const }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError if order is not PENDING', async () => {
      const confirmed = { ...mockOrder, status: 'CONFIRMED' as const };
      mockOrderRepo.findById.mockResolvedValue(confirmed as any);

      await expect(
        orderService.cancelOrder('order-1', { id: 'user-1', role: 'CLIENT' as const }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order for ADMIN', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      (mockOrderRepo as any).deleteById = jest.fn().mockResolvedValue(undefined);

      await orderService.deleteOrder('order-1', { id: 'admin-1', role: 'ADMIN' as const });

      expect((mockOrderRepo as any).deleteById).toHaveBeenCalledWith('order-1');
    });

    it('should throw NotFoundError for non-existent order', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        orderService.deleteOrder('bad-id', { id: 'admin-1', role: 'ADMIN' as const }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for CLIENT role', async () => {
      await expect(
        orderService.deleteOrder('order-1', { id: 'user-1', role: 'CLIENT' as const }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for MANAGER role', async () => {
      await expect(
        orderService.deleteOrder('order-1', { id: 'manager-1', role: 'MANAGER' as const }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('repeatOrder', () => {
    beforeEach(() => {
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-1', cleanName: 'Beer', unit: 'шт' },
      ]);
    });

    it('should create a new order with items from original order', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 3000, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-002');
      const newOrder = {
        ...mockOrder,
        id: 'order-2',
        orderNumber: 'ORD-20260315-002',
        totalAmount: 6000,
      };
      mockOrderRepo.create.mockResolvedValue(newOrder as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      const result = await orderService.repeatOrder('order-1', {
        id: 'user-1',
        role: 'CLIENT' as const,
      });

      expect(result.orderNumber).toBe('ORD-20260315-002');
    });

    it('should throw NotFoundError for non-existent order', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        orderService.repeatOrder('bad-id', { id: 'user-1', role: 'CLIENT' as const }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if not the order owner', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);

      await expect(
        orderService.repeatOrder('order-1', { id: 'user-2', role: 'CLIENT' as const }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should pass comment to createOrder when provided', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-004');
      mockOrderRepo.create.mockResolvedValue(mockOrder as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.repeatOrder(
        'order-1',
        { id: 'user-1', role: 'CLIENT' as const },
        'Доставить до 15:00',
      );

      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ comment: 'Доставить до 15:00' }),
      );
    });

    it('should use current prices, not original prices', async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder as any);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 9999, currency: 'RUB' },
      ]);
      mockGenerateOrderNumber.mockResolvedValue('ORD-20260315-003');
      mockOrderRepo.create.mockResolvedValue({ ...mockOrder, totalAmount: 19998 } as any);
      mockEmailService.sendOrderNotificationToManager.mockResolvedValue();
      mockEmailService.sendOrderConfirmationToClient.mockResolvedValue();

      await orderService.repeatOrder('order-1', { id: 'user-1', role: 'CLIENT' as const });

      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ productId: 'prod-1', quantity: 2, price: 9999, currency: 'RUB' }],
          totalAmount: 19998,
        }),
      );
    });
  });
});
