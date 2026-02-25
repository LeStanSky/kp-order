import { prisma } from '../config/database';
import { UserRole } from '../generated/prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  priceGroupId?: string | null;
  managerId?: string | null;
  mustChangePassword?: boolean;
}

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        priceGroup: true,
        clients: { select: { id: true } },
        manager: { select: { id: true, email: true, name: true } },
      },
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

  async update(
    id: string,
    data: Partial<
      CreateUserData & { isActive: boolean; managerId: string | null; mustChangePassword: boolean }
    >,
  ) {
    return prisma.user.update({
      where: { id },
      data,
      include: { priceGroup: true },
    });
  },

  async findAll() {
    return prisma.user.findMany({
      include: {
        priceGroup: true,
        manager: { select: { id: true, name: true } },
      },
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
