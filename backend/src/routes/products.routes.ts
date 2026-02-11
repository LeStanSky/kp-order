import { Router } from 'express';
import { productsController } from '../controllers/products.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { getProductsQuerySchema } from '../validators/product.validator';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(getProductsQuerySchema, 'query'),
  productsController.getProducts,
);
router.get('/categories', authenticate, productsController.getCategories);
router.get('/:id', authenticate, productsController.getProductById);

export default router;
