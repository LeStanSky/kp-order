import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { ConflictError, NotFoundError } from '../utils/errors';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';

export const userService = {
  async getUsers() {
    const users = await userRepository.findAll();
    return users.map(({ password: _pw, ...u }) => u);
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const { password: _pw, ...u } = user;
    return u;
  },

  async updateUser(id: string, data: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const updated = await userRepository.update(id, data);
    const { password: _pw, ...u } = updated;
    return u;
  },

  async createUser(data: CreateUserInput) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new ConflictError('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const created = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      managerId: data.managerId ?? null,
      priceGroupId: data.priceGroupId ?? null,
      canOrder: data.canOrder,
      mustChangePassword: true,
    });
    const { password: _pw, ...u } = created;
    return u;
  },

  async resetPassword(id: string, newPassword: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userRepository.update(id, { password: hashedPassword, mustChangePassword: true });
  },
};
