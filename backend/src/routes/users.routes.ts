import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permissions.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updateUserSchema } from '../validators/user.validator';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), userController.getUsers);

router.get('/:id', authenticate, requireRole('ADMIN'), userController.getUserById);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(updateUserSchema, 'body'),
  userController.updateUser,
);

export default router;
