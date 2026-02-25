import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';
import { UpdateUserInput } from '../validators/user.validator';

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
};
