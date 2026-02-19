import { Router } from 'express';
import { stockAlertController } from '../controllers/stockAlert.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permissions.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  createAlertSchema,
  updateAlertSchema,
  getAlertsQuerySchema,
} from '../validators/stockAlert.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('MANAGER', 'ADMIN'),
  validate(createAlertSchema, 'body'),
  stockAlertController.createAlert,
);

router.get(
  '/',
  authenticate,
  requireRole('MANAGER', 'ADMIN'),
  validate(getAlertsQuerySchema, 'query'),
  stockAlertController.getAlerts,
);

router.get(
  '/:id',
  authenticate,
  requireRole('MANAGER', 'ADMIN'),
  stockAlertController.getAlertById,
);

router.patch(
  '/:id',
  authenticate,
  requireRole('MANAGER', 'ADMIN'),
  validate(updateAlertSchema, 'body'),
  stockAlertController.updateAlert,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('MANAGER', 'ADMIN'),
  stockAlertController.deleteAlert,
);

export default router;
