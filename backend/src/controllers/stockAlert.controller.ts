import { Request, Response } from 'express';
import { stockAlertService } from '../services/stockAlert.service';
import {
  CreateAlertInput,
  UpdateAlertInput,
  GetAlertsQuery,
} from '../validators/stockAlert.validator';

export const stockAlertController = {
  async createAlert(req: Request, res: Response) {
    const input = req.body as CreateAlertInput;
    const alert = await stockAlertService.createAlert(req.user!.id, input);
    res.status(201).json(alert);
  },

  async getAlerts(req: Request, res: Response) {
    const query = res.locals.query as GetAlertsQuery;
    const result = await stockAlertService.getAlerts(
      { id: req.user!.id, role: req.user!.role },
      query,
    );
    res.json(result);
  },

  async getAlertById(req: Request, res: Response) {
    const alert = await stockAlertService.getAlertById(req.params.id as string, {
      id: req.user!.id,
      role: req.user!.role,
    });
    res.json(alert);
  },

  async updateAlert(req: Request, res: Response) {
    const input = req.body as UpdateAlertInput;
    const alert = await stockAlertService.updateAlert(req.params.id as string, input, {
      id: req.user!.id,
      role: req.user!.role,
    });
    res.json(alert);
  },

  async deleteAlert(req: Request, res: Response) {
    await stockAlertService.deleteAlert(req.params.id as string, {
      id: req.user!.id,
      role: req.user!.role,
    });
    res.status(204).send();
  },
};
