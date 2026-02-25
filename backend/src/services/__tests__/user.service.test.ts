import { userService } from '../user.service';
import { userRepository } from '../../repositories/user.repository';
import { NotFoundError } from '../../utils/errors';

jest.mock('../../repositories/user.repository');

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;

const mockUser = {
  id: 'user-1',
  email: 'client@test.com',
  name: 'Client',
  role: 'CLIENT' as const,
  password: 'hashed_password',
  isActive: true,
  priceGroupId: 'pg-1',
  managerId: null,
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
};

describe('UserService', () => {
  describe('getUsers', () => {
    it('should return all users without passwords', async () => {
      mockUserRepo.findAll.mockResolvedValue([mockUser] as any);

      const result = await userService.getUsers();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0].email).toBe('client@test.com');
    });

    it('should return empty array when no users', async () => {
      mockUserRepo.findAll.mockResolvedValue([]);

      const result = await userService.getUsers();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserById', () => {
    it('should return user without password', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);

      const result = await userService.getUserById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('client@test.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.getUserById('bad-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user role and return without password', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      const updatedUser = { ...mockUser, role: 'MANAGER' as const };
      mockUserRepo.update.mockResolvedValue(updatedUser as any);

      const result = await userService.updateUser('user-1', { role: 'MANAGER' });

      expect(result.role).toBe('MANAGER');
      expect(result).not.toHaveProperty('password');
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { role: 'MANAGER' });
    });

    it('should update isActive field', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      const updatedUser = { ...mockUser, isActive: false };
      mockUserRepo.update.mockResolvedValue(updatedUser as any);

      const result = await userService.updateUser('user-1', { isActive: false });

      expect(result.isActive).toBe(false);
      expect(result).not.toHaveProperty('password');
    });

    it('should update managerId field', async () => {
      const newManagerId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      const updatedUser = { ...mockUser, managerId: newManagerId };
      mockUserRepo.update.mockResolvedValue(updatedUser as any);

      const result = await userService.updateUser('user-1', { managerId: newManagerId });

      expect(result.managerId).toBe(newManagerId);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.updateUser('bad-id', { role: 'MANAGER' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
