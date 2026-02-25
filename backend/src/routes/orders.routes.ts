import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permissions.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createOrderSchema, getOrdersQuerySchema } from '../validators/order.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('CLIENT'),
  validate(createOrderSchema, 'body'),
  orderController.createOrder,
);

router.get('/', authenticate, validate(getOrdersQuerySchema, 'query'), orderController.getOrders);

router.get('/:id', authenticate, orderController.getOrderById);

router.patch(
  '/:id/cancel',
  authenticate,
  requireRole('CLIENT', 'ADMIN'),
  orderController.cancelOrder,
);

router.post('/:id/repeat', authenticate, requireRole('CLIENT'), orderController.repeatOrder);

router.delete('/:id', authenticate, requireRole('ADMIN'), orderController.deleteOrder);

export default router;
