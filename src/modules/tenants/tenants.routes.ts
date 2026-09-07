import { Router, Response, NextFunction } from 'express';
import { tenantsController } from './tenants.controller.ts';
import { authenticate, requirePermission, AuthRequest } from '../../middleware/auth.ts';
import { sendError } from '../common/api-response.ts';

const router = Router();

// Guard to prevent TENANT role from listing all tenants or accessing arbitrary tenant IDs
const restrictTenantRoleFromGlobal = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.roleCode === 'TENANT') {
    return sendError(
      res,
      403,
      'Access forbidden: Tenant users cannot access global tenant management',
      [],
      'FORBIDDEN'
    );
  }
  next();
};

// GET /api/v1/me/tenant - Current authenticated tenant profile
router.get(
  '/me/tenant',
  authenticate,
  tenantsController.getMyProfile
);

// GET /api/v1/tenants
router.get(
  '/tenants',
  authenticate,
  restrictTenantRoleFromGlobal,
  requirePermission('tenant.read'),
  tenantsController.list
);

// POST /api/v1/tenants
router.post(
  '/tenants',
  authenticate,
  restrictTenantRoleFromGlobal,
  requirePermission('tenant.create'),
  tenantsController.create
);

// GET /api/v1/tenants/:id
router.get(
  '/tenants/:id',
  authenticate,
  restrictTenantRoleFromGlobal,
  requirePermission('tenant.read'),
  tenantsController.getById
);

// PATCH /api/v1/tenants/:id
router.patch(
  '/tenants/:id',
  authenticate,
  restrictTenantRoleFromGlobal,
  requirePermission('tenant.update'),
  tenantsController.update
);

// PUT /api/v1/tenants/:id (for backwards compatibility)
router.put(
  '/tenants/:id',
  authenticate,
  restrictTenantRoleFromGlobal,
  requirePermission('tenant.update'),
  tenantsController.update
);

// DELETE /api/v1/tenants/:id
router.delete(
  '/tenants/:id',
  authenticate,
  restrictTenantRoleFromGlobal,
  requirePermission('tenant.delete'),
  tenantsController.delete
);

export default router;
