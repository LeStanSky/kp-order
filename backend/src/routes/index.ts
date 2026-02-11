import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);

export default router;
