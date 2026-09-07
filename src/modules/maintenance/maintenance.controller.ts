import { Response } from 'express';
import { MaintenanceService } from './maintenance.service.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { AuthRequest } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { tenants } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

export class MaintenanceController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      let tenantId = req.body.tenantId;
      if (req.user?.roleCode === 'TENANT') {
        const t = await db.select().from(tenants).where(eq(tenants.userId, req.user.id));
        if (t.length > 0) tenantId = t[0].id;
      }

      const result = await MaintenanceService.createRequest({
        ...req.body,
        organizationId: orgId,
        tenantId,
        reportedBy: req.user?.fullName || req.user?.email || 'Unknown',
      });
      return sendSuccess(res, result, 'Maintenance request created');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to create maintenance request', [err.message]);
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      let tenantId;
      if (req.user?.roleCode === 'TENANT') {
        const t = await db.select().from(tenants).where(eq(tenants.userId, req.user.id));
        if (t.length > 0) tenantId = t[0].id;
      }

      const requests = await MaintenanceService.getRequests(orgId, tenantId);
      return sendSuccess(res, requests);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to list maintenance requests', [err.message]);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const result = await MaintenanceService.updateRequest(orgId, req.params.id, req.body);
      return sendSuccess(res, result, 'Maintenance request updated');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to update maintenance request', [err.message]);
    }
  }
}
