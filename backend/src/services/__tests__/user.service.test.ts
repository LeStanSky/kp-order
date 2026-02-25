import { userService } from '../user.service';
import { userRepository } from '../../repositories/user.repository';
import { NotFoundError, ConflictError } from '../../utils/errors';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

jest.mock('../../repositories/user.repository');

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUser = {
  id: 'user-1',
  email: 'client@test.com',
  name: 'Client',
  role: 'CLIENT' as const,
  password: 'hashed_password',
  isActive: true,
  mustChangePassword: false,
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

  describe('createUser', () => {
    beforeEach(() => {
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_temp_password');
    });

    it('should create a user with mustChangePassword=true', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      const createdUser = {
        ...mockUser,
        id: 'new-user',
        email: 'new@test.com',
        mustChangePassword: true,
      };
      mockUserRepo.create.mockResolvedValue(createdUser as any);

      const result = await userService.createUser({
        name: 'New Client',
        email: 'new@test.com',
        password: 'temppass1',
        role: 'CLIENT',
      });

      expect(result).not.toHaveProperty('password');
      expect(result.mustChangePassword).toBe(true);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mustChangePassword: true }),
      );
    });

    it('should hash the provided password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({ ...mockUser, mustChangePassword: true } as any);

      await userService.createUser({
        name: 'Client',
        email: 'x@test.com',
        password: 'rawpass123',
        role: 'CLIENT',
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('rawpass123', 12);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed_temp_password' }),
      );
    });

    it('should throw ConflictError for duplicate email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        userService.createUser({
          name: 'Dup',
          email: 'client@test.com',
          password: 'pass1234',
          role: 'CLIENT',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
    });

    it('should hash new password and set mustChangePassword=true', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockUserRepo.update.mockResolvedValue({
        ...mockUser,
        password: 'hashed_new_password',
        mustChangePassword: true,
      } as any);

      await userService.resetPassword('user-1', 'newpass123');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpass123', 12);
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        password: 'hashed_new_password',
        mustChangePassword: true,
      });
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.resetPassword('bad-id', 'newpass123')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
