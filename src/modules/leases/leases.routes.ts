import { Router } from 'express';
import { leasesController } from './leases.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

const router = Router();

// GET /api/v1/leases and /api/v1/contracts
router.get(
  ['/leases', '/contracts'],
  authenticate,
  requirePermission(['lease.read', 'contract.read']),
  leasesController.list
);

// POST /api/v1/leases and /api/v1/contracts
router.post(
  ['/leases', '/contracts'],
  authenticate,
  requirePermission(['lease.create', 'contract.create']),
  leasesController.create
);

// GET /api/v1/leases/:id and /api/v1/contracts/:id
router.get(
  ['/leases/:id', '/contracts/:id'],
  authenticate,
  requirePermission(['lease.read', 'contract.read']),
  leasesController.getById
);

// PATCH /api/v1/leases/:id and /api/v1/contracts/:id
router.patch(
  ['/leases/:id', '/contracts/:id'],
  authenticate,
  requirePermission(['lease.update', 'contract.update']),
  leasesController.update
);

// PUT /api/v1/leases/:id and /api/v1/contracts/:id (for backwards compatibility)
router.put(
  ['/leases/:id', '/contracts/:id'],
  authenticate,
  requirePermission(['lease.update', 'contract.update']),
  leasesController.update
);

// POST /api/v1/leases/:id/terminate and /api/v1/contracts/:id/terminate
router.post(
  ['/leases/:id/terminate', '/contracts/:id/terminate'],
  authenticate,
  requirePermission(['lease.terminate', 'contract.terminate']),
  leasesController.terminate
);

// POST /api/v1/leases/:id/renew and /api/v1/contracts/:id/renew
router.post(
  ['/leases/:id/renew', '/contracts/:id/renew'],
  authenticate,
  requirePermission(['lease.renew', 'lease.create', 'contract.create']),
  leasesController.renew
);

// DELETE /api/v1/leases/:id and /api/v1/contracts/:id
router.delete(
  ['/leases/:id', '/contracts/:id'],
  authenticate,
  requirePermission(['lease.delete', 'lease.update', 'contract.update']),
  leasesController.delete
);

export default router;
