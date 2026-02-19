import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const db = prisma as jest.Mocked<typeof prisma>;

function makeToken(
  overrides: Partial<{ id: string; email: string; role: string; priceGroupId: string | null }> = {},
) {
  return jwt.sign(
    {
      id: 'manager-1',
      email: 'manager@test.com',
      role: 'MANAGER',
      priceGroupId: null,
      ...overrides,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const mockAlert = {
  id: 'alert-1',
  productId: 'prod-1',
  createdById: 'manager-1',
  minStock: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  product: { id: 'prod-1', cleanName: 'Beer', stocks: [{ quantity: 5 }] },
  createdBy: { id: 'manager-1', name: 'Manager', email: 'manager@test.com' },
  history: [],
};

describe('Stock Alerts Routes', () => {
  describe('POST /api/stock-alerts', () => {
    it('should create an alert for MANAGER (201)', async () => {
      const token = makeToken();
      (db.stockAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .post('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'prod-1', minStock: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 'alert-1');
    });

    it('should create an alert for ADMIN (201)', async () => {
      const token = makeToken({ id: 'admin-1', role: 'ADMIN' });
      (db.stockAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .post('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'prod-1', minStock: 10 });

      expect(res.status).toBe(201);
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken({ role: 'CLIENT' });

      const res = await request(app)
        .post('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'prod-1', minStock: 10 });

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/stock-alerts')
        .send({ productId: 'prod-1', minStock: 10 });

      expect(res.status).toBe(401);
    });

    it('should return 422 for invalid body', async () => {
      const token = makeToken();

      const res = await request(app)
        .post('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ minStock: -1 }); // missing productId, negative minStock

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/stock-alerts', () => {
    it('should return paginated alerts for MANAGER (200)', async () => {
      const token = makeToken();
      (db.stockAlert.findMany as jest.Mock).mockResolvedValue([mockAlert]);
      (db.stockAlert.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should return alerts for ADMIN (200)', async () => {
      const token = makeToken({ id: 'admin-1', role: 'ADMIN' });
      (db.stockAlert.findMany as jest.Mock).mockResolvedValue([]);
      (db.stockAlert.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .get('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 for CLIENT', async () => {
      const token = makeToken({ role: 'CLIENT' });

      const res = await request(app)
        .get('/api/stock-alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/stock-alerts');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stock-alerts/:id', () => {
    it('should return alert for its creator (200)', async () => {
      const token = makeToken();
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .get('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('alert-1');
    });

    it('should return 404 for non-existent alert', async () => {
      const token = makeToken();
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/stock-alerts/bad-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for another manager', async () => {
      const token = makeToken({ id: 'manager-2' });
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .get('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/stock-alerts/:id', () => {
    it('should update alert (200)', async () => {
      const token = makeToken();
      const updated = { ...mockAlert, minStock: 20 };
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);
      (db.stockAlert.update as jest.Mock).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ minStock: 20 });

      expect(res.status).toBe(200);
      expect(res.body.minStock).toBe(20);
    });

    it('should return 422 for empty body (no fields)', async () => {
      const token = makeToken();

      const res = await request(app)
        .patch('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('should return 403 for wrong manager', async () => {
      const token = makeToken({ id: 'manager-2' });
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .patch('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ minStock: 5 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/stock-alerts/:id', () => {
    it('should delete alert (204)', async () => {
      const token = makeToken();
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);
      (db.stockAlert.delete as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .delete('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should return 403 for wrong manager', async () => {
      const token = makeToken({ id: 'manager-2' });
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const res = await request(app)
        .delete('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 for CLIENT', async () => {
      const token = makeToken({ role: 'CLIENT' });

      const res = await request(app)
        .delete('/api/stock-alerts/alert-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
