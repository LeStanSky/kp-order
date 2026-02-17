import { Router } from 'express';
import { productsController } from '../controllers/products.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permissions.middleware';
import {
  getProductsQuerySchema,
  updateProductSchema,
  productIdParamSchema,
} from '../validators/product.validator';
import { upload } from '../services/upload.service';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(getProductsQuerySchema, 'query'),
  productsController.getProducts,
);
router.get('/categories', authenticate, productsController.getCategories);
router.get(
  '/:id',
  authenticate,
  validate(productIdParamSchema, 'params'),
  productsController.getProductById,
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  productsController.updateProduct,
);

router.post(
  '/:id/image',
  authenticate,
  requireRole('ADMIN'),
  validate(productIdParamSchema, 'params'),
  upload.single('image'),
  productsController.uploadImage,
);

router.delete(
  '/:id/image',
  authenticate,
  requireRole('ADMIN'),
  validate(productIdParamSchema, 'params'),
  productsController.deleteImage,
);

export default router;
