import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/permissions.middleware';
import { createERPProvider } from '../integrations/erp/ERPProviderFactory';

const router = Router();

// Search ERP counterparties (контрагенты) for linking to users. ADMIN only.
router.get('/counterparties', authenticate, requireRole('ADMIN'), async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const provider = createERPProvider();
  const counterparties = await provider.getCounterparties(search);
  res.json({ data: counterparties });
});

export default router;
