import { Response } from 'express';
import { AdminService } from './admin.service.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { AuthRequest } from '../../middleware/auth.ts';

export class AdminController {
  static async getSystemStats(req: AuthRequest, res: Response) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return sendError(res, 403, 'Forbidden: Super Administrator access required');
      }
      const stats = await AdminService.getSystemStats();
      return sendSuccess(res, stats);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch system stats', [err.message]);
    }
  }

  static async getOrganizations(req: AuthRequest, res: Response) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return sendError(res, 403, 'Forbidden');
      }
      const orgs = await AdminService.getOrganizations();
      return sendSuccess(res, orgs);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch organizations', [err.message]);
    }
  }

  static async updateOrganizationStatus(req: AuthRequest, res: Response) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return sendError(res, 403, 'Forbidden');
      }
      const result = await AdminService.updateOrganizationStatus(req.params.id, req.body.status);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to update organization status', [err.message]);
    }
  }

  static async getUsers(req: AuthRequest, res: Response) {
    try {
      if (req.user?.roleCode === 'TENANT') {
        return sendError(res, 403, 'Forbidden');
      }
      // Super admins get all users. Property managers get only their org's users.
      const orgId = req.user?.roleCode === 'SUPER_ADMIN' ? undefined : req.user?.organizationId;
      const users = await AdminService.getUsers(orgId);
      return sendSuccess(res, users);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch users', [err.message]);
    }
  }

  static async getGlobalAuditLogs(req: AuthRequest, res: Response) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return sendError(res, 403, 'Forbidden');
      }
      const logs = await AdminService.getAuditLogs();
      return sendSuccess(res, logs);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch audit logs', [err.message]);
    }
  }
}

