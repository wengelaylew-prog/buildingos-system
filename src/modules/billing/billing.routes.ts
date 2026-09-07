import { Router } from 'express';
import { BillingController } from './billing.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

const router = Router();

router.get('/invoices', authenticate, requirePermission('payment.read'), BillingController.getInvoices);
router.post('/invoices/generate', authenticate, requirePermission('payment.write'), BillingController.generateInvoices);
router.post('/invoices/late-fees', authenticate, requirePermission('payment.write'), BillingController.applyLateFees);

export const billingRouter = router;

