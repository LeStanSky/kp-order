import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import ordersRoutes from './orders.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);

export default router;
