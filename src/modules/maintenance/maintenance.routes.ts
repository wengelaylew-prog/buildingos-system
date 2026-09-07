import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

const router = Router();

// Tenants can create and read their own.
// Managers can read all and update all.
router.get('/', authenticate, requirePermission('maintenance.read'), MaintenanceController.list);
router.post('/', authenticate, requirePermission('maintenance.create'), MaintenanceController.create);
router.patch('/:id', authenticate, requirePermission('maintenance.write'), MaintenanceController.update);

export const maintenanceRouter = router;

