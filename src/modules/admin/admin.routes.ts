import { Router } from 'express';
import { AdminController } from './admin.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

const router = Router();

// Super Admin only routes
router.get('/stats', authenticate, AdminController.getSystemStats);
router.get('/organizations', authenticate, AdminController.getOrganizations);
router.patch('/organizations/:id/status', authenticate, AdminController.updateOrganizationStatus);
router.patch('/organizations/:id', authenticate, AdminController.updateOrganization);
router.get('/audit', authenticate, AdminController.getGlobalAuditLogs);

// Global User Management (Shared with org admins but scoped internally)
router.get('/users', authenticate, AdminController.getUsers);
router.post('/users', authenticate, AdminController.createUser);

export const adminRouter = router;

