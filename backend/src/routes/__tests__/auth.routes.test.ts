import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../../app';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

// Cast mocked prisma for typed access
const db = prisma as jest.Mocked<typeof prisma>;

// Helper to generate a valid access token
function makeToken(
  overrides: Partial<{ id: string; email: string; role: string; priceGroupId: string | null }> = {},
) {
  return jwt.sign(
    {
      id: 'user-1',
      email: 'test@example.com',
      role: 'CLIENT',
      priceGroupId: null,
      ...overrides,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user (201)', async () => {
      const newUser = {
        id: 'user-1',
        email: 'new@example.com',
        name: 'New User',
        password: 'hashed',
        role: 'CLIENT',
        priceGroupId: null,
        priceGroup: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.user.findUnique as jest.Mock).mockResolvedValue(null);
      (db.user.create as jest.Mock).mockResolvedValue(newUser);
      (db.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-1' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('new@example.com');
    });

    it('should return 409 for duplicate email', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing',
        email: 'dup@example.com',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'password123', name: 'Dup User' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it('should return 422 for validation error', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-email', password: 'short', name: 'A' });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    const storedUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      password: '', // will be set in beforeEach
      role: 'CLIENT',
      priceGroupId: null,
      priceGroup: null,
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      storedUser.password = await bcrypt.hash('password123', 4); // low rounds for speed
    });

    it('should login successfully (200) and include mustChangePassword', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(storedUser);
      (db.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-1' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.mustChangePassword).toBe(false);
    });

    it('should return 401 for wrong password', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(storedUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should return 401 for inactive user', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue({ ...storedUser, isActive: false });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should include manager info when user has a manager', async () => {
      const userWithManager = {
        ...storedUser,
        manager: { id: 'mgr-1', name: 'Manager One', email: 'mgr@example.com' },
      };
      (db.user.findUnique as jest.Mock).mockResolvedValue(userWithManager);
      (db.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-1' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user.manager).toEqual({
        id: 'mgr-1',
        name: 'Manager One',
        email: 'mgr@example.com',
      });
    });

    it('should return 401 for non-existent user', async () => {
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = jwt.sign({ id: 'user-1' }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

      (db.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: refreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CLIENT',
          priceGroupId: null,
          isActive: true,
        },
      });
      (db.refreshToken.delete as jest.Mock).mockResolvedValue({});
      (db.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-2' });

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should include manager info in refreshed tokens', async () => {
      const refreshToken = jwt.sign({ id: 'user-1' }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

      (db.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: refreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CLIENT',
          priceGroupId: null,
          isActive: true,
          manager: { id: 'mgr-1', name: 'Manager One', email: 'mgr@example.com' },
        },
      });
      (db.refreshToken.delete as jest.Mock).mockResolvedValue({});
      (db.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-2' });

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.user.manager).toEqual({
        id: 'mgr-1',
        name: 'Manager One',
        email: 'mgr@example.com',
      });
    });

    it('should return 401 for inactive user on refresh', async () => {
      const refreshToken = jwt.sign({ id: 'user-1' }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

      (db.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: refreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CLIENT',
          priceGroupId: null,
          isActive: false,
        },
      });
      (db.refreshToken.delete as jest.Mock).mockResolvedValue({});

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/deactivated/i);
    });

    it('should return 401 for expired refresh token', async () => {
      (db.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: 'old-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
        user: { id: 'user-1', email: 'test@example.com', role: 'CLIENT', isActive: true },
      });
      (db.refreshToken.delete as jest.Mock).mockResolvedValue({});

      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'old-token' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent refresh token', async () => {
      (db.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'does-not-exist' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully (200)', async () => {
      (db.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      const token = makeToken();

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken: 'some-rt' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });

    it('should return 401 without auth header', async () => {
      const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'some-rt' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const token = makeToken({ id: 'user-1' });

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        priceGroupId: null,
        priceGroup: null,
        isActive: true,
      });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('user-1');
      expect(res.body.email).toBe('test@example.com');
    });

    it('should return user profile with price group', async () => {
      const token = makeToken({ id: 'user-1' });

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        priceGroupId: 'pg-1',
        priceGroup: { id: 'pg-1', name: 'Retail' },
        isActive: true,
      });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.priceGroup).toEqual({ id: 'pg-1', name: 'Retail' });
    });

    it('should return 401 when user not found', async () => {
      const token = makeToken({ id: 'deleted-user' });
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it('should return user profile with manager', async () => {
      const token = makeToken({ id: 'user-1' });

      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
        priceGroupId: null,
        priceGroup: null,
        isActive: true,
        manager: { id: 'mgr-1', name: 'Manager One', email: 'mgr@example.com' },
      });

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.manager).toEqual({
        id: 'mgr-1',
        name: 'Manager One',
        email: 'mgr@example.com',
      });
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password for authenticated user (200)', async () => {
      const token = makeToken({ id: 'user-1' });
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        password: 'old_hashed',
        role: 'CLIENT',
        priceGroupId: null,
        isActive: true,
        mustChangePassword: true,
        clients: [],
        manager: null,
        priceGroup: null,
      });
      (db.user.update as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'NewPass123!' });

      expect(res.status).toBe(200);
    });

    it('should return 401 when user not found', async () => {
      const token = makeToken({ id: 'deleted-user' });
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'NewPass123!' });

      expect(res.status).toBe(401);
    });

    it('should return 422 for short password', async () => {
      const token = makeToken({ id: 'user-1' });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'short' });

      expect(res.status).toBe(422);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ newPassword: 'NewPass123!' });

      expect(res.status).toBe(401);
    });
  });
});
