import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { env } from '../../config/env';
import { createERPProvider } from '../../integrations/erp/ERPProviderFactory';

jest.mock('../../integrations/erp/ERPProviderFactory');

const mockCreateProvider = createERPProvider as jest.MockedFunction<typeof createERPProvider>;

function makeToken(role = 'ADMIN') {
  return jwt.sign(
    { id: 'admin-1', email: 'admin@test.com', role, priceGroupId: null },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

describe('ERP Routes', () => {
  describe('GET /api/erp/counterparties', () => {
    it('returns counterparties for ADMIN and forwards the search term', async () => {
      const getCounterparties = jest
        .fn()
        .mockResolvedValue([{ id: 'cp-1', name: 'ООО Тест', inn: '7700000000' }]);
      mockCreateProvider.mockReturnValue({ getCounterparties } as any);

      const res = await request(app)
        .get('/api/erp/counterparties?search=тест')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toEqual({ id: 'cp-1', name: 'ООО Тест', inn: '7700000000' });
      expect(getCounterparties).toHaveBeenCalledWith('тест');
    });

    it('returns 403 for CLIENT role', async () => {
      const res = await request(app)
        .get('/api/erp/counterparties')
        .set('Authorization', `Bearer ${makeToken('CLIENT')}`);

      expect(res.status).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/erp/counterparties');
      expect(res.status).toBe(401);
    });
  });
});
