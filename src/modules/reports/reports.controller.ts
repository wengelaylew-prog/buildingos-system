import { Response } from 'express';
import { ReportsService } from './reports.service.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { AuthRequest } from '../../middleware/auth.ts';

export class ReportsController {
  static async getMetrics(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');
      
      // Enforce RBAC: Only management/admins can access reports
      if (req.user?.roleCode === 'TENANT') {
        return sendError(res, 403, 'Forbidden: Tenants cannot view org reports');
      }

      const metrics = await ReportsService.getMetrics(orgId);
      return sendSuccess(res, metrics);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to generate report metrics', [err.message]);
    }
  }

  static async exportReport(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      if (req.user?.roleCode === 'TENANT') {
        return sendError(res, 403, 'Forbidden');
      }

      const type = req.query.type as string || 'financial';
      const csvData = await ReportsService.exportToCSV(orgId, type);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      return res.send(csvData);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to export report', [err.message]);
    }
  }
}

