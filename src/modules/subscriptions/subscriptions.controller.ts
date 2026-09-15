import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { SubscriptionsService } from './subscriptions.service.ts';

export class SubscriptionsController {
  static async checkout(req: AuthRequest, res: Response) {
    try {
      const { plan, transactionCode } = req.body;
      const organizationId = req.user?.organizationId;
      const file = (req as any).file;

      if (!organizationId) return sendError(res, 401, 'Unauthorized');
      if (!file && !transactionCode) return sendError(res, 400, 'Please provide either a transaction code or a payment receipt image');
      if (!plan) return sendError(res, 400, 'Plan is required');

      const result = await SubscriptionsService.submitCheckout(
        organizationId,
        plan,
        transactionCode,
        file
      );
      
      return sendSuccess(res, result, 'Subscription payment submitted successfully. Awaiting admin verification.');
    } catch (err: any) {
      return sendError(res, 500, 'Checkout failed', [err.message]);
    }
  }

  static async getPending(req: AuthRequest, res: Response) {
    try {
      const result = await SubscriptionsService.getPendingRequests();
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch pending requests', [err.message]);
    }
  }

  static async approve(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await SubscriptionsService.approveRequest(id, req.user!.id);
      return sendSuccess(res, null, 'Subscription approved and activated.');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to approve subscription', [err.message]);
    }
  }

  static async reject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      await SubscriptionsService.rejectRequest(id, req.user!.id, notes || 'Invalid payment');
      return sendSuccess(res, null, 'Subscription rejected.');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to reject subscription', [err.message]);
    }
  }
}

