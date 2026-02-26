import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import ordersRoutes from './orders.routes';
import stockAlertsRoutes from './stockAlerts.routes';
import usersRoutes from './users.routes';
import priceGroupsRoutes from './priceGroups.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/stock-alerts', stockAlertsRoutes);
router.use('/users', usersRoutes);
router.use('/price-groups', priceGroupsRoutes);

export default router;
