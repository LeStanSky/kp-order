import { stockAlertRepository } from '../../repositories/stockAlert.repository';
import { prisma } from '../../config/database';

const db = prisma as jest.Mocked<typeof prisma>;

const mockAlert = {
  id: 'alert-1',
  productId: 'prod-1',
  createdById: 'user-1',
  minStock: 10,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  product: {
    id: 'prod-1',
    cleanName: 'Beer',
    stocks: [{ quantity: 5 }],
  },
  createdBy: { id: 'user-1', name: 'Manager', email: 'manager@test.com' },
  history: [],
};

describe('stockAlertRepository', () => {
  describe('create', () => {
    it('should create a stock alert', async () => {
      (db.stockAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await stockAlertRepository.create({
        productId: 'prod-1',
        createdById: 'user-1',
        minStock: 10,
      });

      expect(db.stockAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { productId: 'prod-1', createdById: 'user-1', minStock: 10 },
        }),
      );
      expect(result).toEqual(mockAlert);
    });
  });

  describe('findAll', () => {
    it('should return paginated alerts', async () => {
      (db.stockAlert.findMany as jest.Mock).mockResolvedValue([mockAlert]);
      (db.stockAlert.count as jest.Mock).mockResolvedValue(1);

      const result = await stockAlertRepository.findAll({ page: 1, limit: 20 });

      expect(result.alerts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by createdById when provided', async () => {
      (db.stockAlert.findMany as jest.Mock).mockResolvedValue([]);
      (db.stockAlert.count as jest.Mock).mockResolvedValue(0);

      await stockAlertRepository.findAll({ page: 1, limit: 20, createdById: 'user-1' });

      expect(db.stockAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ createdById: 'user-1' }),
        }),
      );
    });

    it('should not filter by createdById when not provided', async () => {
      (db.stockAlert.findMany as jest.Mock).mockResolvedValue([]);
      (db.stockAlert.count as jest.Mock).mockResolvedValue(0);

      await stockAlertRepository.findAll({ page: 1, limit: 20 });

      expect(db.stockAlert.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('findById', () => {
    it('should return alert by id', async () => {
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(mockAlert);

      const result = await stockAlertRepository.findById('alert-1');

      expect(db.stockAlert.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'alert-1' } }),
      );
      expect(result).toEqual(mockAlert);
    });

    it('should return null for non-existent alert', async () => {
      (db.stockAlert.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await stockAlertRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveAlerts', () => {
    it('should return all active alerts with stocks and last history', async () => {
      (db.stockAlert.findMany as jest.Mock).mockResolvedValue([mockAlert]);

      const result = await stockAlertRepository.findActiveAlerts();

      expect(db.stockAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update an alert', async () => {
      const updated = { ...mockAlert, minStock: 20, isActive: false };
      (db.stockAlert.update as jest.Mock).mockResolvedValue(updated);

      const result = await stockAlertRepository.update('alert-1', {
        minStock: 20,
        isActive: false,
      });

      expect(db.stockAlert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'alert-1' },
          data: { minStock: 20, isActive: false },
        }),
      );
      expect(result.minStock).toBe(20);
    });
  });

  describe('delete', () => {
    it('should delete an alert', async () => {
      (db.stockAlert.delete as jest.Mock).mockResolvedValue(mockAlert);

      await stockAlertRepository.delete('alert-1');

      expect(db.stockAlert.delete).toHaveBeenCalledWith({ where: { id: 'alert-1' } });
    });
  });

  describe('createHistory', () => {
    it('should create a history entry', async () => {
      const mockHistory = {
        id: 'hist-1',
        stockAlertId: 'alert-1',
        stockValue: 5,
        sentAt: new Date(),
      };
      (db.stockAlertHistory.create as jest.Mock).mockResolvedValue(mockHistory);

      const result = await stockAlertRepository.createHistory('alert-1', 5);

      expect(db.stockAlertHistory.create).toHaveBeenCalledWith({
        data: { stockAlertId: 'alert-1', stockValue: 5 },
      });
      expect(result).toEqual(mockHistory);
    });
  });
});
