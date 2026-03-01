import { stockAlertService } from '../../services/stockAlert.service';
import { stockAlertRepository } from '../../repositories/stockAlert.repository';
import { emailService } from '../../services/email.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';

jest.mock('../../repositories/stockAlert.repository');
jest.mock('../../services/email.service');

const mockRepo = stockAlertRepository as jest.Mocked<typeof stockAlertRepository>;
const mockEmail = emailService as jest.Mocked<typeof emailService>;

const mockManager = { id: 'manager-1', role: 'MANAGER' as const };
const mockAdmin = { id: 'admin-1', role: 'ADMIN' as const };

const now = new Date();
const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);

const mockAlert = {
  id: 'alert-1',
  productId: 'prod-1',
  createdById: 'manager-1',
  minStock: 10,
  isActive: true,
  createdAt: now,
  updatedAt: now,
  product: {
    id: 'prod-1',
    cleanName: 'Beer',
    stocks: [{ quantity: 5 }],
  },
  createdBy: { id: 'manager-1', name: 'Manager', email: 'manager@test.com' },
  history: [],
};

describe('stockAlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create an alert', async () => {
      (mockRepo.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await stockAlertService.createAlert('manager-1', {
        productId: 'prod-1',
        minStock: 10,
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        productId: 'prod-1',
        createdById: 'manager-1',
        minStock: 10,
      });
      expect(result.id).toBe('alert-1');
    });

    it('should throw BadRequestError on duplicate (P2002)', async () => {
      const prismaError = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockRepo.create.mockRejectedValue(prismaError);

      await expect(
        stockAlertService.createAlert('manager-1', { productId: 'prod-1', minStock: 10 }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getAlerts', () => {
    const query = { page: 1, limit: 20 };

    it('should return all alerts for ADMIN', async () => {
      (mockRepo.findAll as jest.Mock).mockResolvedValue({
        alerts: [mockAlert],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await stockAlertService.getAlerts(mockAdmin, query);

      expect(mockRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by createdById for MANAGER', async () => {
      (mockRepo.findAll as jest.Mock).mockResolvedValue({
        alerts: [mockAlert],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await stockAlertService.getAlerts(mockManager, query);

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        createdById: 'manager-1',
      });
    });

    it('should return pagination info', async () => {
      (mockRepo.findAll as jest.Mock).mockResolvedValue({
        alerts: [],
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      });

      const result = await stockAlertService.getAlerts(mockAdmin, { page: 2, limit: 10 });

      expect(result.pagination).toEqual({ page: 2, limit: 10, total: 50, totalPages: 5 });
    });
  });

  describe('getAlertById', () => {
    it('should return alert for ADMIN', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);

      const result = await stockAlertService.getAlertById('alert-1', mockAdmin);

      expect(result.id).toBe('alert-1');
    });

    it('should return own alert for MANAGER', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);

      const result = await stockAlertService.getAlertById('alert-1', mockManager);

      expect(result.id).toBe('alert-1');
    });

    it('should throw NotFoundError if not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(stockAlertService.getAlertById('bad-id', mockAdmin)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ForbiddenError for another manager', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);

      await expect(
        stockAlertService.getAlertById('alert-1', { id: 'manager-2', role: 'MANAGER' }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateAlert', () => {
    it('should update alert', async () => {
      const updated = { ...mockAlert, minStock: 20 };
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);
      (mockRepo.update as jest.Mock).mockResolvedValue(updated);

      const result = await stockAlertService.updateAlert('alert-1', { minStock: 20 }, mockManager);

      expect(mockRepo.update).toHaveBeenCalledWith('alert-1', { minStock: 20 });
      expect(result.minStock).toBe(20);
    });

    it('should throw ForbiddenError for wrong manager', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);

      await expect(
        stockAlertService.updateAlert('alert-1', { minStock: 5 }, { id: 'other', role: 'MANAGER' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        stockAlertService.updateAlert('bad', { minStock: 5 }, mockAdmin),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);
      (mockRepo.delete as jest.Mock).mockResolvedValue(mockAlert);

      await stockAlertService.deleteAlert('alert-1', mockManager);

      expect(mockRepo.delete).toHaveBeenCalledWith('alert-1');
    });

    it('should throw ForbiddenError for wrong manager', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(mockAlert);

      await expect(
        stockAlertService.deleteAlert('alert-1', { id: 'other', role: 'MANAGER' }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('evaluateAlerts', () => {
    it('should send email and create history when stock <= minStock and cooldown passed', async () => {
      const alertWithLowStock = {
        ...mockAlert,
        product: { id: 'prod-1', cleanName: 'Beer', stocks: [{ quantity: 5 }] },
        history: [],
      };
      (mockRepo.findActiveAlerts as jest.Mock).mockResolvedValue([alertWithLowStock]);
      mockEmail.sendStockAlertNotification.mockResolvedValue();
      (mockRepo.createHistory as jest.Mock).mockResolvedValue({});

      await stockAlertService.evaluateAlerts();

      expect(mockEmail.sendStockAlertNotification).toHaveBeenCalledWith({
        recipientEmail: 'manager@test.com',
        productName: 'Beer',
        currentStock: 5,
        minStock: 10,
      });
      expect(mockRepo.createHistory).toHaveBeenCalledWith('alert-1', 5);
    });

    it('should NOT send email when stock > minStock', async () => {
      const alertWithHighStock = {
        ...mockAlert,
        product: { id: 'prod-1', cleanName: 'Beer', stocks: [{ quantity: 15 }] },
        history: [],
      };
      (mockRepo.findActiveAlerts as jest.Mock).mockResolvedValue([alertWithHighStock]);

      await stockAlertService.evaluateAlerts();

      expect(mockEmail.sendStockAlertNotification).not.toHaveBeenCalled();
    });

    it('should NOT send email within 24h cooldown', async () => {
      const recentlySent = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
      const alertWithCooldown = {
        ...mockAlert,
        product: { id: 'prod-1', cleanName: 'Beer', stocks: [{ quantity: 5 }] },
        history: [{ stockValue: 5, sentAt: recentlySent }],
      };
      (mockRepo.findActiveAlerts as jest.Mock).mockResolvedValue([alertWithCooldown]);

      await stockAlertService.evaluateAlerts();

      expect(mockEmail.sendStockAlertNotification).not.toHaveBeenCalled();
    });

    it('should send email after 24h cooldown has passed', async () => {
      const alertWithOldHistory = {
        ...mockAlert,
        product: { id: 'prod-1', cleanName: 'Beer', stocks: [{ quantity: 5 }] },
        history: [{ stockValue: 5, sentAt: yesterday }],
      };
      (mockRepo.findActiveAlerts as jest.Mock).mockResolvedValue([alertWithOldHistory]);
      mockEmail.sendStockAlertNotification.mockResolvedValue();
      (mockRepo.createHistory as jest.Mock).mockResolvedValue({});

      await stockAlertService.evaluateAlerts();

      expect(mockEmail.sendStockAlertNotification).toHaveBeenCalled();
    });

    it('should sum stock across multiple warehouses', async () => {
      const alertMultiWarehouse = {
        ...mockAlert,
        minStock: 10,
        product: {
          id: 'prod-1',
          cleanName: 'Beer',
          stocks: [{ quantity: 3 }, { quantity: 4 }], // total=7 <= 10
        },
        history: [],
      };
      (mockRepo.findActiveAlerts as jest.Mock).mockResolvedValue([alertMultiWarehouse]);
      mockEmail.sendStockAlertNotification.mockResolvedValue();
      (mockRepo.createHistory as jest.Mock).mockResolvedValue({});

      await stockAlertService.evaluateAlerts();

      expect(mockEmail.sendStockAlertNotification).toHaveBeenCalledWith(
        expect.objectContaining({ currentStock: 7 }),
      );
    });
  });
});
