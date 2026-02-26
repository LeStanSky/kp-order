import { orderRepository } from '../repositories/order.repository';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../config/database';
import { generateOrderNumber } from '../utils/orderNumberGenerator';
import { emailService } from './email.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateOrderInput, GetOrdersQuery } from '../validators/order.validator';

interface RequestUser {
  id: string;
  role: 'CLIENT' | 'MANAGER' | 'ADMIN';
}

export const orderService = {
  async createOrder(userId: string, input: CreateOrderInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (!user.priceGroupId) throw new BadRequestError('User has no price group assigned');

    const productIds = input.items.map((i) => i.productId);
    const prices = await prisma.price.findMany({
      where: { productId: { in: productIds }, priceGroupId: user.priceGroupId },
    });

    const priceMap = new Map(prices.map((p: any) => [p.productId, p]));

    const missingPrices = productIds.filter((id) => !priceMap.has(id));
    if (missingPrices.length > 0) {
      throw new BadRequestError(`No prices found for products: ${missingPrices.join(', ')}`);
    }

    const items = input.items.map((item) => {
      const price = priceMap.get(item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: price.value,
        currency: price.currency,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = await generateOrderNumber();

    const order = await orderRepository.create({
      orderNumber,
      userId,
      comment: input.comment,
      totalAmount,
      items,
    });

    const emailData = {
      orderNumber,
      customerName: user.name,
      customerEmail: user.email,
      totalAmount,
      itemCount: items.length,
    };
    const manager = (user as any).manager;
    if (manager?.email) {
      emailService.sendOrderNotificationToManager({
        ...emailData,
        managerEmail: manager.email,
        managerName: manager.name,
      });
    }
    emailService.sendOrderConfirmationToClient(emailData);

    return order;
  },

  async getOrders(reqUser: RequestUser, query: GetOrdersQuery) {
    const options: any = {
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      status: query.status,
    };

    if (reqUser.role === 'CLIENT') {
      options.userId = reqUser.id;
    } else if (reqUser.role === 'MANAGER') {
      const manager = await userRepository.findById(reqUser.id);
      const clientIds = (manager as any)?.clients?.map((c: any) => c.id) ?? [];
      options.userIds = clientIds;
    }
    // ADMIN: no filter — sees all

    const result = await orderRepository.findAll(options);

    return {
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  },

  async getOrderById(orderId: string, reqUser: RequestUser) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    await this.checkOrderAccess(order, reqUser);

    return order;
  },

  async cancelOrder(orderId: string, reqUser: RequestUser) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (reqUser.role === 'CLIENT' && order.userId !== reqUser.id) {
      throw new ForbiddenError('Access denied');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestError('Only PENDING orders can be cancelled');
    }

    return orderRepository.updateStatus(orderId, 'CANCELLED');
  },

  async deleteOrder(orderId: string, reqUser: RequestUser) {
    if (reqUser.role !== 'ADMIN') throw new ForbiddenError('Access denied');

    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    await orderRepository.deleteById(orderId);
  },

  async repeatOrder(orderId: string, reqUser: RequestUser) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (order.userId !== reqUser.id) {
      throw new ForbiddenError('Access denied');
    }

    const items = (order as any).items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    return this.createOrder(reqUser.id, { items });
  },

  async checkOrderAccess(order: any, reqUser: RequestUser) {
    if (reqUser.role === 'ADMIN') return;
    if (order.userId === reqUser.id) return;

    if (reqUser.role === 'MANAGER') {
      const manager = await userRepository.findById(reqUser.id);
      const clientIds = (manager as any)?.clients?.map((c: any) => c.id) ?? [];
      if (clientIds.includes(order.userId)) return;
    }

    throw new ForbiddenError('Access denied');
  },
};
