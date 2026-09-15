import { Router } from 'express';
import { UtilityController } from './utility.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Readings ───────────────────────────────────────────────────
// POST /api/v1/utilities/readings          - Enter single meter reading + auto-generate bill
router.post('/readings',
  requirePermission('payment.write'),
  UtilityController.createReading
);

// POST /api/v1/utilities/readings/bulk    - Bulk enter readings for entire building
router.post('/readings/bulk',
  requirePermission('payment.write'),
  UtilityController.createBulkReadings
);

// GET /api/v1/utilities/readings          - List readings (filter: buildingId, unitId, utilityType, billingPeriod)
router.get('/readings',
  requirePermission('payment.read'),
  UtilityController.getReadings
);

// ── Bills ──────────────────────────────────────────────────────
// GET /api/v1/utilities/bills             - List bills (filter: buildingId, unitId, tenantId, status, utilityType, billingPeriod)
router.get('/bills',
  requirePermission('payment.read'),
  UtilityController.getBills
);

// GET /api/v1/utilities/bills/:id         - Get single bill
router.get('/bills/:id',
  requirePermission('payment.read'),
  UtilityController.getBillById
);

// POST /api/v1/utilities/bills/:id/pay   - Record payment for a bill
router.post('/bills/:id/pay',
  requirePermission('payment.write'),
  UtilityController.recordPayment
);

// DELETE /api/v1/utilities/bills/:id     - Cancel a bill
router.delete('/bills/:id',
  requirePermission('payment.write'),
  UtilityController.cancelBill
);

// ── Split shared utility ───────────────────────────────────────
// POST /api/v1/utilities/split           - Split a building-level bill among occupied units
router.post('/split',
  requirePermission('payment.write'),
  UtilityController.splitSharedUtility
);

// ── Summary & Overdue ──────────────────────────────────────────
// GET  /api/v1/utilities/summary         - Summary stats (totalBilled, paid, pending, overdue)
router.get('/summary',
  requirePermission('payment.read'),
  UtilityController.getSummary
);

// POST /api/v1/utilities/mark-overdue    - Mark past-due PENDING bills as OVERDUE
router.post('/mark-overdue',
  requirePermission('payment.write'),
  UtilityController.markOverdue
);

export const utilityRouter = router;
