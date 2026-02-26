import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permissions.middleware';
import { prisma } from '../config/database';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), async (_req, res) => {
  const priceGroups = await prisma.priceGroup.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json(priceGroups);
});

export default router;
