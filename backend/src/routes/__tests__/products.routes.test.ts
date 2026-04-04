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
      email: 'test@example.com',
      role: 'CLIENT',
      priceGroupId: 'pg-1',
      ...overrides,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const sampleProduct = {
  id: VALID_UUID,
  externalId: 'ext-1',
  name: 'Beer / 2026-06-01',
  cleanName: 'Beer',
  description: 'Tasty beer',
  category: 'Drinks',
  unit: 'шт',
  imageUrl: null,
  characteristics: null,
  isActive: true,
  expiryDate: new Date('2026-06-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
  stocks: [{ quantity: 10, warehouse: 'Main' }],
  prices: [{ value: 100, currency: 'RUB', priceGroup: { name: 'Retail' } }],
};

describe('Products Routes', () => {
  describe('GET /api/products', () => {
    it('should return paginated products (cache miss)', async () => {
      const token = makeToken();

      // cache miss
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue({ allowedCategories: [] });

      (db.product.findMany as jest.Mock).mockResolvedValue([sampleProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Beer');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should return cached products (cache hit)', async () => {
      const token = makeToken();
      const cached = {
        data: [{ id: 'prod-1', name: 'Beer' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cached));

      const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].name).toBe('Beer');
      // Should NOT have called the DB
      expect(db.product.findMany).not.toHaveBeenCalled();
    });

    it('should pass search query parameter', async () => {
      const token = makeToken();
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue({ allowedCategories: [] });
      (db.product.findMany as jest.Mock).mockResolvedValue([]);
      (db.product.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .get('/api/products?search=cola&page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
    });

    it('should return 422 for invalid query params', async () => {
      const token = makeToken();

      const res = await request(app)
        .get('/api/products?page=0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', async () => {
      const token = makeToken();
      (db.product.findUnique as jest.Mock).mockResolvedValue(sampleProduct);

      const res = await request(app)
        .get(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(VALID_UUID);
      expect(res.body.name).toBe('Beer');
    });

    it('should return 404 for non-existent product', async () => {
      const token = makeToken();
      (db.product.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 422 for invalid id format', async () => {
      const token = makeToken();

      const res = await request(app)
        .get('/api/products/not-a-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(422);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get(`/api/products/${VALID_UUID}`);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/products/categories', () => {
    it('should return list of categories', async () => {
      const token = makeToken();
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue({ allowedCategories: [] });
      (db.product.findMany as jest.Mock).mockResolvedValue([
        { category: 'Drinks' },
        { category: 'Snacks' },
      ]);

      const res = await request(app)
        .get('/api/products/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(['Drinks', 'Snacks']);
    });

    it('should filter categories by allowedCategories for restricted price group', async () => {
      const token = makeToken({ priceGroupId: 'pg-suby' });
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue({
        allowedCategories: ['Jaws', 'Jaws розлив'],
      });
      (db.product.findMany as jest.Mock).mockResolvedValue([{ category: 'Jaws' }]);

      const res = await request(app)
        .get('/api/products/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(['Jaws']);
      // Verify the category filter was applied
      const where = (db.product.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.category).toEqual({ in: ['Jaws', 'Jaws розлив'] });
    });
  });

  describe('Role-based expiryDate visibility', () => {
    it('should NOT include expiryDate for CLIENT role', async () => {
      const token = makeToken({ role: 'CLIENT' });
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue({ allowedCategories: [] });
      (db.product.findMany as jest.Mock).mockResolvedValue([sampleProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0]).not.toHaveProperty('expiryDate');
      expect(res.body.data[0]).not.toHaveProperty('expiryStatus');
    });

    it('should include expiryDate for MANAGER role', async () => {
      const token = makeToken({ role: 'MANAGER' });
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue(null);
      (db.product.findMany as jest.Mock).mockResolvedValue([sampleProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toHaveProperty('expiryDate');
      expect(res.body.data[0]).toHaveProperty('expiryStatus');
    });

    it('should include expiryDate for ADMIN role', async () => {
      const token = makeToken({ role: 'ADMIN' });
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      (db.priceGroup.findUnique as jest.Mock).mockResolvedValue(null);
      (db.product.findMany as jest.Mock).mockResolvedValue([sampleProduct]);
      (db.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toHaveProperty('expiryDate');
      expect(res.body.data[0]).toHaveProperty('expiryStatus');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product description (ADMIN)', async () => {
      const token = makeToken({ role: 'ADMIN' });
      (db.product.findUnique as jest.Mock).mockResolvedValue(sampleProduct);
      (db.product.update as jest.Mock).mockResolvedValue({
        ...sampleProduct,
        description: 'Updated desc',
      });
      (mockRedis.keys as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .patch(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated desc' });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated desc');
    });

    it('should update product characteristics (ADMIN)', async () => {
      const token = makeToken({ role: 'ADMIN' });
      const chars = { volume: '500мл', abv: '4.5%' };
      (db.product.findUnique as jest.Mock).mockResolvedValue(sampleProduct);
      (db.product.update as jest.Mock).mockResolvedValue({
        ...sampleProduct,
        characteristics: chars,
      });
      (mockRedis.keys as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .patch(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ characteristics: chars });

      expect(res.status).toBe(200);
      expect(res.body.characteristics).toEqual(chars);
    });

    it('should return 403 for non-ADMIN roles', async () => {
      const token = makeToken({ role: 'CLIENT' });

      const res = await request(app)
        .patch(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'test' });

      expect(res.status).toBe(403);
    });

    it('should return 422 for invalid UUID', async () => {
      const token = makeToken({ role: 'ADMIN' });

      const res = await request(app)
        .patch('/api/products/not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'test' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for empty body', async () => {
      const token = makeToken({ role: 'ADMIN' });

      const res = await request(app)
        .patch(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('should return 404 for non-existent product', async () => {
      const token = makeToken({ role: 'ADMIN' });
      (db.product.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/products/${VALID_UUID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'test' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .patch(`/api/products/${VALID_UUID}`)
        .send({ description: 'test' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/products/:id/image', () => {
    it('should return 403 for non-ADMIN roles', async () => {
      const token = makeToken({ role: 'CLIENT' });

      const res = await request(app)
        .post(`/api/products/${VALID_UUID}/image`)
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('fake-image'), 'test.jpg');

      expect(res.status).toBe(403);
    });

    it('should return 422 for invalid UUID', async () => {
      const token = makeToken({ role: 'ADMIN' });

      const res = await request(app)
        .post('/api/products/not-a-uuid/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('fake-image'), 'test.jpg');

      expect(res.status).toBe(422);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post(`/api/products/${VALID_UUID}/image`)
        .attach('image', Buffer.from('fake-image'), 'test.jpg');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/products/:id/image', () => {
    it('should delete image and return updated product (ADMIN)', async () => {
      const token = makeToken({ role: 'ADMIN' });
      const productWithImage = { ...sampleProduct, imageUrl: '/uploads/old.jpg' };
      (db.product.findUnique as jest.Mock).mockResolvedValue(productWithImage);
      (db.product.update as jest.Mock).mockResolvedValue({
        ...sampleProduct,
        imageUrl: null,
      });
      (mockRedis.keys as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .delete(`/api/products/${VALID_UUID}/image`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.imageUrl).toBeNull();
    });

    it('should return 403 for non-ADMIN roles', async () => {
      const token = makeToken({ role: 'MANAGER' });

      const res = await request(app)
        .delete(`/api/products/${VALID_UUID}/image`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 422 for invalid UUID', async () => {
      const token = makeToken({ role: 'ADMIN' });

      const res = await request(app)
        .delete('/api/products/not-a-uuid/image')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(422);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete(`/api/products/${VALID_UUID}/image`);

      expect(res.status).toBe(401);
    });
  });
});
