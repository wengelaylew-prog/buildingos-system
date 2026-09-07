import { Router } from 'express';
import { ReportsController } from './reports.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, ReportsController.getMetrics);
router.get('/export', authenticate, ReportsController.exportReport);

export const reportsRouter = router;

