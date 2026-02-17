import { prisma } from '../config/database';
import { Prisma } from '../generated/prisma/client';
import { GetProductsOptions } from '../types/erp.types';

export const productRepository = {
  async findAll(options: GetProductsOptions, priceGroupId?: string | null) {
    const { page, limit, search, category, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        cleanName: { contains: search, mode: 'insensitive' as const },
      }),
      ...(category && { category }),
    };

    const include: Prisma.ProductInclude = {
      stocks: true,
      ...(priceGroupId && {
        prices: {
          where: { priceGroupId },
          include: { priceGroup: true },
        },
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string, priceGroupId?: string | null) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        stocks: true,
        ...(priceGroupId && {
          prices: {
            where: { priceGroupId },
            include: { priceGroup: true },
          },
        }),
      },
    });
  },

  async findByExternalId(externalId: string) {
    return prisma.product.findUnique({
      where: { externalId },
    });
  },

  async upsertFromERP(data: {
    externalId: string;
    name: string;
    cleanName: string;
    description?: string;
    category?: string;
    unit?: string;
    imageUrl?: string;
    expiryDate?: Date | null;
  }) {
    return prisma.product.upsert({
      where: { externalId: data.externalId },
      create: data,
      update: {
        name: data.name,
        cleanName: data.cleanName,
        description: data.description,
        category: data.category,
        unit: data.unit,
        imageUrl: data.imageUrl,
        expiryDate: data.expiryDate,
      },
    });
  },

  async upsertStock(productId: string, quantity: number, warehouse?: string) {
    return prisma.stock.upsert({
      where: {
        productId_warehouse: {
          productId,
          warehouse: warehouse ?? '',
        },
      },
      create: {
        productId,
        quantity,
        warehouse: warehouse ?? '',
      },
      update: { quantity },
    });
  },

  async upsertPrice(productId: string, priceGroupId: string, value: number, currency = 'RUB') {
    return prisma.price.upsert({
      where: {
        productId_priceGroupId: {
          productId,
          priceGroupId,
        },
      },
      create: { productId, priceGroupId, value, currency },
      update: { value, currency },
    });
  },

  async updateById(
    id: string,
    data: {
      description?: string | null;
      characteristics?: Record<string, string>;
      imageUrl?: string | null;
    },
  ) {
    return prisma.product.update({
      where: { id },
      data,
    });
  },

  async getCategories() {
    const categories = await prisma.product.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories
      .map((c: { category: string | null }) => c.category)
      .filter(Boolean) as string[];
  },

  async count(where?: Prisma.ProductWhereInput) {
    return prisma.product.count({ where });
  },
};
