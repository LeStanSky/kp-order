import { prisma } from '../config/database';
import { OrderStatus } from '../generated/prisma/client';

interface CreateOrderData {
  orderNumber: string;
  userId: string;
  comment?: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    currency: string;
  }>;
}

interface FindAllOptions {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  status?: string;
  userId?: string;
  userIds?: string[];
}

const orderInclude = {
  items: { include: { product: { select: { id: true, cleanName: true } } } },
  user: { select: { id: true, name: true, email: true } },
} as const;

export const orderRepository = {
  async create(data: CreateOrderData) {
    return prisma.$transaction(async (tx: any) => {
      return tx.order.create({
        data: {
          orderNumber: data.orderNumber,
          userId: data.userId,
          comment: data.comment,
          totalAmount: data.totalAmount,
          items: {
            create: data.items,
          },
        },
        include: orderInclude,
      });
    });
  },

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  },

  async findAll(options: FindAllOptions) {
    const { page, limit, sortOrder, status, userId, userIds } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (userIds) where.userId = { in: userIds };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  },

  async deleteById(id: string) {
    await prisma.order.delete({ where: { id } });
  },
};
