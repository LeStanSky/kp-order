import { stockAlertRepository } from '../repositories/stockAlert.repository';
import { emailService } from './email.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import {
  CreateAlertInput,
  UpdateAlertInput,
  GetAlertsQuery,
} from '../validators/stockAlert.validator';

interface RequestUser {
  id: string;
  role: 'CLIENT' | 'MANAGER' | 'ADMIN';
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const stockAlertService = {
  async createAlert(userId: string, input: CreateAlertInput) {
    try {
      return await stockAlertRepository.create({
        productId: input.productId,
        createdById: userId,
        minStock: input.minStock,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestError('Stock alert for this product already exists');
      }
      throw err;
    }
  },

  async getAlerts(reqUser: RequestUser, query: GetAlertsQuery) {
    const options: any = { page: query.page, limit: query.limit };
    if (reqUser.role === 'MANAGER') {
      options.createdById = reqUser.id;
    }

    const result = await stockAlertRepository.findAll(options);

    return {
      data: result.alerts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  },

  async getAlertById(id: string, reqUser: RequestUser) {
    const alert = await stockAlertRepository.findById(id);
    if (!alert) throw new NotFoundError('Stock alert not found');

    this.checkAccess(alert, reqUser);

    return alert;
  },

  async updateAlert(id: string, data: UpdateAlertInput, reqUser: RequestUser) {
    const alert = await stockAlertRepository.findById(id);
    if (!alert) throw new NotFoundError('Stock alert not found');

    this.checkAccess(alert, reqUser);

    return stockAlertRepository.update(id, data);
  },

  async deleteAlert(id: string, reqUser: RequestUser) {
    const alert = await stockAlertRepository.findById(id);
    if (!alert) throw new NotFoundError('Stock alert not found');

    this.checkAccess(alert, reqUser);

    return stockAlertRepository.delete(id);
  },

  checkAccess(alert: any, reqUser: RequestUser) {
    if (reqUser.role === 'ADMIN') return;
    if (alert.createdById === reqUser.id) return;
    throw new ForbiddenError('Access denied');
  },

  async evaluateAlerts() {
    const alerts = await stockAlertRepository.findActiveAlerts();
    const now = Date.now();

    for (const alert of alerts) {
      const stock = (alert as any).product.stocks.reduce(
        (sum: number, s: { quantity: number }) => sum + s.quantity,
        0,
      );

      const lastHistory = (alert as any).history[0];
      const lastSent = lastHistory?.sentAt ? new Date(lastHistory.sentAt).getTime() : null;
      const cooldownPassed = !lastSent || now - lastSent >= COOLDOWN_MS;

      if (stock <= alert.minStock && cooldownPassed) {
        emailService.sendStockAlertNotification({
          recipientEmail: (alert as any).createdBy.email,
          productName: (alert as any).product.cleanName,
          currentStock: stock,
          minStock: alert.minStock,
        });
        await stockAlertRepository.createHistory(alert.id, stock);
      }
    }
  },
};
