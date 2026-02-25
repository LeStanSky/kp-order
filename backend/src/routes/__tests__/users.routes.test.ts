import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../../app';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const db = prisma as jest.Mocked<typeof prisma>;

function makeToken(
  overrides: Partial<{ id: string; email: string; role: string; priceGroupId: string | null }> = {},
) {
  return jwt.sign(
    { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN', priceGroupId: null, ...overrides },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const mockUser = {
  id: 'user-1',
  email: 'client@test.com',
  name: 'Client',
  role: 'CLIENT',
  password: 'hashed',
  isActive: true,
  mustChangePassword: false,
  priceGroupId: 'pg-1',
  managerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  priceGroup: { id: 'pg-1', name: 'Retail' },
  clients: [],
};

describe('Users Routes', () => {
  describe('GET /api/users', () => {
    it('should return user list for ADMIN (200)', async () => {
      const token = makeToken();
      (db.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].email).toBe('client@test.com');
      expect(res.body[0]).not.toHaveProperty('password');
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken({ id: 'user-1', role: 'CLIENT', priceGroupId: 'pg-1' });

      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 for MANAGER role', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user for ADMIN (200)', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-1');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/users/bad-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken({ id: 'user-1', role: 'CLIENT', priceGroupId: 'pg-1' });

      const res = await request(app)
        .get('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user role for ADMIN (200)', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({ ...mockUser, role: 'MANAGER' });

      const res = await request(app)
        .patch('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'MANAGER' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('MANAGER');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should update isActive for ADMIN', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      const res = await request(app)
        .patch('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken({ id: 'user-1', role: 'CLIENT', priceGroupId: 'pg-1' });

      const res = await request(app)
        .patch('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'MANAGER' });

      expect(res.status).toBe(403);
    });

    it('should return 422 for invalid role value', async () => {
      const token = makeToken();

      const res = await request(app)
        .patch('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SUPERUSER' });

      expect(res.status).toBe(422);
    });

    it('should return 404 for non-existent user', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'MANAGER' });

      expect(res.status).toBe(404);
    });

    it('should update managerId for ADMIN', async () => {
      const token = makeToken();
      const newManagerId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({ ...mockUser, managerId: newManagerId });

      const res = await request(app)
        .patch('/api/users/user-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ managerId: newManagerId });

      expect(res.status).toBe(200);
      expect(res.body.managerId).toBe(newManagerId);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).patch('/api/users/user-1').send({ role: 'MANAGER' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user for ADMIN (201)', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(null); // no existing email
      (db.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'new-user',
        email: 'newclient@test.com',
        mustChangePassword: true,
      });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Client',
          email: 'newclient@test.com',
          password: 'TempPass123!',
          role: 'CLIENT',
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('newclient@test.com');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body.mustChangePassword).toBe(true);
    });

    it('should return 409 for duplicate email', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Dup',
          email: 'client@test.com',
          password: 'TempPass123!',
          role: 'CLIENT',
        });

      expect(res.status).toBe(409);
    });

    it('should return 422 for missing required fields', async () => {
      const token = makeToken();

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'x@test.com' });

      expect(res.status).toBe(422);
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken({ role: 'CLIENT', priceGroupId: 'pg-1' });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New',
          email: 'new@test.com',
          password: 'TempPass123!',
          role: 'CLIENT',
        });

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'New', email: 'new@test.com', password: 'TempPass123!', role: 'CLIENT' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/:id/reset-password', () => {
    it('should reset password for ADMIN (200)', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'new_hashed',
        mustChangePassword: true,
      });

      const res = await request(app)
        .post('/api/users/user-1/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewTemp123!' });

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent user', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/users/bad-id/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewTemp123!' });

      expect(res.status).toBe(404);
    });

    it('should return 422 for short password', async () => {
      const token = makeToken();

      const res = await request(app)
        .post('/api/users/user-1/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'short' });

      expect(res.status).toBe(422);
    });

    it('should return 403 for non-ADMIN role', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app)
        .post('/api/users/user-1/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewTemp123!' });

      expect(res.status).toBe(403);
    });
  });
});
