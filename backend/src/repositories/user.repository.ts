import { prisma } from '../config/database';
import { UserRole } from '../generated/prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  priceGroupId?: string;
}

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { priceGroup: true },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { priceGroup: true },
    });
  },

  async create(data: CreateUserData) {
    return prisma.user.create({
      data,
      include: { priceGroup: true },
    });
  },

  async update(id: string, data: Partial<CreateUserData & { isActive: boolean }>) {
    return prisma.user.update({
      where: { id },
      data,
      include: { priceGroup: true },
    });
  },

  async findAll() {
    return prisma.user.findMany({
      include: { priceGroup: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deactivate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
