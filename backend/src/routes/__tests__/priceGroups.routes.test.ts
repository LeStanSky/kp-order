import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const db = prisma as jest.Mocked<typeof prisma>;

function makeToken(role = 'ADMIN') {
  return jwt.sign(
    { id: 'admin-1', email: 'admin@test.com', role, priceGroupId: null },
    env.JWT_SECRET,
    {
      expiresIn: '1h',
    },
  );
}

const mockPriceGroups = [
  { id: 'pg-1', name: 'Прайс 1 уровень' },
  { id: 'pg-2', name: 'Прайс основной' },
];

describe('Price Groups Routes', () => {
  describe('GET /api/price-groups', () => {
    it('should return price groups for ADMIN (200)', async () => {
      const token = makeToken('ADMIN');
      (db.priceGroup.findMany as jest.Mock).mockResolvedValue(mockPriceGroups);

      const res = await request(app)
        .get('/api/price-groups')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toEqual({ id: 'pg-1', name: 'Прайс 1 уровень' });
    });

    it('should return 403 for CLIENT role', async () => {
      const token = makeToken('CLIENT');

      const res = await request(app)
        .get('/api/price-groups')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 for MANAGER role', async () => {
      const token = makeToken('MANAGER');

      const res = await request(app)
        .get('/api/price-groups')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/price-groups');

      expect(res.status).toBe(401);
    });
  });
});
