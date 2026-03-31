import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';

const db = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

function makeToken(
  overrides: Partial<{ id: string; email: string; role: string; priceGroupId: string | null }> = {},
) {
  return jwt.sign(
    {
      id: 'user-1',
      email: 'client@test.com',
      role: 'CLIENT',
      priceGroupId: 'pg-1',
      ...overrides,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const mockUser = {
  id: 'user-1',
  email: 'client@test.com',
  name: 'Test Client',
  role: 'CLIENT',
  priceGroupId: 'pg-1',
  managerId: null,
  password: 'hashed',
  isActive: true,
  canOrder: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  priceGroup: { id: 'pg-1', name: 'Retail' },
  clients: [],
};

const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD-20260315-001',
  userId: 'user-1',
  status: 'PENDING',
  comment: 'Test',
  totalAmount: 5000,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 'item-1',
      orderId: 'order-1',
      productId: 'prod-1',
      quantity: 2,
      price: 2500,
      currency: 'RUB',
      product: { id: 'prod-1', cleanName: 'Beer' },
    },
  ],
  user: { id: 'user-1', name: 'Test Client', email: 'client@test.com' },
};

describe('Orders Routes', () => {
  describe('POST /api/orders', () => {
    it('should create order for CLIENT (201)', async () => {
      const token = makeToken();
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      (db.product.findMany as jest.Mock).mockResolvedValue([{ id: 'prod-1', cleanName: 'Beer' }]);
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);
      (db.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(db));
      (db.order.create as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ productId: 'prod-1', quantity: 2 }], comment: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('orderNumber');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [{ productId: 'prod-1', quantity: 2 }] });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-CLIENT role', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ productId: 'prod-1', quantity: 2 }] });

      expect(res.status).toBe(403);
    });

    it('should return 422 for invalid body', async () => {
      const token = makeToken();

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/orders', () => {
    it('should return paginated orders for CLIENT', async () => {
      const token = makeToken();
      (db.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);
      (db.order.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(1);
    });

    it('should return orders for ADMIN', async () => {
      const token = makeToken({ id: 'admin-1', role: 'ADMIN', priceGroupId: null });
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should filter by status query param', async () => {
      const token = makeToken();
      (db.order.findMany as jest.Mock).mockResolvedValue([]);
      (db.order.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .get('/api/orders?status=PENDING')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order for its owner', async () => {
      const token = makeToken();
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .get('/api/orders/order-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('order-1');
    });

    it('should return 404 for non-existent order', async () => {
      const token = makeToken();
      (db.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/orders/bad-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for another client', async () => {
      const token = makeToken({ id: 'user-2' });
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .get('/api/orders/order-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    it('should cancel a PENDING order', async () => {
      const token = makeToken();
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      const cancelled = { ...mockOrder, status: 'CANCELLED' };
      (db.order.update as jest.Mock).mockResolvedValue(cancelled);

      const res = await request(app)
        .patch('/api/orders/order-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');
    });

    it('should return 400 for non-PENDING order', async () => {
      const token = makeToken();
      const confirmed = { ...mockOrder, status: 'CONFIRMED' };
      (db.order.findUnique as jest.Mock).mockResolvedValue(confirmed);

      const res = await request(app)
        .patch('/api/orders/order-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should return 403 for MANAGER role', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app)
        .patch('/api/orders/order-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete order for ADMIN (204)', async () => {
      const token = makeToken({ id: 'admin-1', role: 'ADMIN', priceGroupId: null });
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (db.order.delete as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .delete('/api/orders/order-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken();

      const res = await request(app)
        .delete('/api/orders/order-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 for MANAGER role', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app)
        .delete('/api/orders/order-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/orders/order-1');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent order', async () => {
      const token = makeToken({ id: 'admin-1', role: 'ADMIN', priceGroupId: null });
      (db.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/orders/bad-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/orders/:id/repeat', () => {
    it('should repeat an order (201)', async () => {
      const token = makeToken();
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (db.price.findMany as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', value: 2500, currency: 'RUB' },
      ]);
      (db.product.findMany as jest.Mock).mockResolvedValue([{ id: 'prod-1', cleanName: 'Beer' }]);
      (mockRedis.incr as jest.Mock).mockResolvedValue(2);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);
      (db.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(db));
      const newOrder = { ...mockOrder, id: 'order-2', orderNumber: 'ORD-20260315-002' };
      (db.order.create as jest.Mock).mockResolvedValue(newOrder);

      const res = await request(app)
        .post('/api/orders/order-1/repeat')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
    });

    it('should return 403 for MANAGER role', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app)
        .post('/api/orders/order-1/repeat')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 for non-owner', async () => {
      const token = makeToken({ id: 'user-2' });
      (db.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/orders/order-1/repeat')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
