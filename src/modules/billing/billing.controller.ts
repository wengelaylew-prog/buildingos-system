import { Request, Response } from 'express';
import { BillingService } from './billing.service.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { AuthRequest } from '../../middleware/auth.ts';

export class BillingController {
  static async generateInvoices(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const result = await BillingService.generateRecurringInvoices(orgId);
      return sendSuccess(res, result, 'Invoices generated successfully');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to generate invoices', [err.message]);
    }
  }

  static async applyLateFees(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const result = await BillingService.applyLateFees(orgId);
      return sendSuccess(res, result, 'Late fees applied successfully');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to apply late fees', [err.message]);
    }
  }

  static async getInvoices(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const invoices = await BillingService.getInvoices(orgId);
      return sendSuccess(res, invoices, 'Invoices retrieved');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch invoices', [err.message]);
    }
  }
}
