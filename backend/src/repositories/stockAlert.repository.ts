import { prisma } from '../config/database';

const alertInclude = {
  product: {
    select: {
      id: true,
      cleanName: true,
      stocks: { select: { quantity: true } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
  history: { orderBy: { sentAt: 'desc' as const }, take: 1 },
} as const;

interface CreateAlertData {
  productId: string;
  createdById: string;
  minStock: number;
}

interface FindAllOptions {
  page: number;
  limit: number;
  createdById?: string;
}

interface UpdateAlertData {
  minStock?: number;
  isActive?: boolean;
}

export const stockAlertRepository = {
  async create(data: CreateAlertData) {
    return prisma.stockAlert.create({
      data,
      include: alertInclude,
    });
  },

  async findAll(options: FindAllOptions) {
    const { page, limit, createdById } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (createdById) where.createdById = createdById;

    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        include: alertInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockAlert.count({ where }),
    ]);

    return { alerts, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.stockAlert.findUnique({
      where: { id },
      include: alertInclude,
    });
  },

  async findActiveAlerts() {
    return prisma.stockAlert.findMany({
      where: { isActive: true },
      include: alertInclude,
    });
  },

  async update(id: string, data: UpdateAlertData) {
    return prisma.stockAlert.update({
      where: { id },
      data,
      include: alertInclude,
    });
  },

  async delete(id: string) {
    return prisma.stockAlert.delete({ where: { id } });
  },

  async createHistory(stockAlertId: string, stockValue: number) {
    return prisma.stockAlertHistory.create({
      data: { stockAlertId, stockValue },
    });
  },
};
