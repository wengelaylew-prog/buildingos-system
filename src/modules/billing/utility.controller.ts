import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { UtilityService } from './utility.service.ts';

export class UtilityController {

  // ── POST /utilities/readings ────────────────────────────────
  static async createReading(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const {
        unitId, buildingId, utilityType, billingPeriod,
        previousReading, currentReading, unitPrice,
        unit, readingDate, notes, dueDaysFromNow,
      } = req.body;

      if (!unitId || !buildingId || !utilityType || !billingPeriod)
        return sendError(res, 400, 'unitId, buildingId, utilityType and billingPeriod are required');
      if (currentReading === undefined || unitPrice === undefined)
        return sendError(res, 400, 'currentReading and unitPrice are required');

      const validTypes = ['ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'PARKING', 'OTHER'];
      if (!validTypes.includes(utilityType))
        return sendError(res, 400, `utilityType must be one of: ${validTypes.join(', ')}`);

      const result = await UtilityService.createReading({
        organizationId: orgId,
        unitId,
        buildingId,
        utilityType,
        billingPeriod,
        previousReading: Number(previousReading ?? 0),
        currentReading: Number(currentReading),
        unitPrice: Number(unitPrice),
        unit,
        readingDate: readingDate ?? new Date().toISOString().slice(0, 10),
        enteredBy: req.user?.id,
        notes,
        dueDaysFromNow: dueDaysFromNow ? Number(dueDaysFromNow) : 10,
      });

      return sendSuccess(res, result, 'Utility reading recorded and bill generated.', undefined, 201);
    } catch (err: any) {
      if (err.code === '23505') return sendError(res, 409, 'A reading already exists for this unit, period and utility type.');
      return sendError(res, 500, 'Failed to create utility reading.', [err.message]);
    }
  }

  // ── POST /utilities/readings/bulk ───────────────────────────
  static async createBulkReadings(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const { buildingId, utilityType, billingPeriod, unitPrice, unit, readingDate, readings, dueDaysFromNow } = req.body;
      if (!buildingId || !utilityType || !billingPeriod || !unitPrice || !Array.isArray(readings) || readings.length === 0)
        return sendError(res, 400, 'buildingId, utilityType, billingPeriod, unitPrice, and readings[] are required');

      const result = await UtilityService.createBulkReadings({
        organizationId: orgId,
        buildingId,
        utilityType,
        billingPeriod,
        unitPrice: Number(unitPrice),
        unit,
        readingDate: readingDate ?? new Date().toISOString().slice(0, 10),
        enteredBy: req.user?.id,
        readings,
        dueDaysFromNow: dueDaysFromNow ? Number(dueDaysFromNow) : 10,
      });

      return sendSuccess(res, result, `Bulk readings processed: ${result.created} created, ${result.failed} failed.`);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to process bulk readings.', [err.message]);
    }
  }

  // ── POST /utilities/split ───────────────────────────────────
  static async splitSharedUtility(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const { buildingId, utilityType, billingPeriod, totalAmount, splitMethod, notes, dueDaysFromNow } = req.body;
      if (!buildingId || !utilityType || !billingPeriod || totalAmount === undefined || !splitMethod)
        return sendError(res, 400, 'buildingId, utilityType, billingPeriod, totalAmount, and splitMethod are required');
      if (!['EQUAL', 'BY_AREA'].includes(splitMethod))
        return sendError(res, 400, 'splitMethod must be EQUAL or BY_AREA');

      const result = await UtilityService.splitSharedUtility({
        organizationId: orgId,
        buildingId,
        utilityType,
        billingPeriod,
        totalAmount: Number(totalAmount),
        splitMethod,
        enteredBy: req.user?.id,
        dueDaysFromNow: dueDaysFromNow ? Number(dueDaysFromNow) : 10,
        notes,
      });

      return sendSuccess(res, result, `Shared ${utilityType} bill split among ${result.created} units.`, undefined, 201);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to split utility bill.', [err.message]);
    }
  }

  // ── POST /utilities/bills/:id/pay ───────────────────────────
  static async recordPayment(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const { id } = req.params;
      const { amount, paymentMethod, paymentReference, notes } = req.body;
      if (!amount || !paymentMethod) return sendError(res, 400, 'amount and paymentMethod are required');

      const updated = await UtilityService.recordPayment({
        billId: id,
        amount: Number(amount),
        paymentMethod,
        paymentReference,
        paidBy: req.user?.id,
        notes,
      });

      return sendSuccess(res, updated, `Payment recorded. Bill status: ${updated.status}`);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to record payment.', [err.message]);
    }
  }

  // ── GET /utilities/bills ────────────────────────────────────
  static async getBills(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const { buildingId, unitId, tenantId, status, utilityType, billingPeriod } = req.query as Record<string, string>;

      const bills = await UtilityService.getBills(orgId, {
        buildingId, unitId, tenantId, status, utilityType, billingPeriod,
      });

      return sendSuccess(res, bills, 'Utility bills retrieved.');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch utility bills.', [err.message]);
    }
  }

  // ── GET /utilities/bills/:id ────────────────────────────────
  static async getBillById(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');
      const bill = await UtilityService.getBillById(req.params.id, orgId);
      return sendSuccess(res, bill, 'Utility bill retrieved.');
    } catch (err: any) {
      if (err.message === 'Utility bill not found.') return sendError(res, 404, err.message);
      return sendError(res, 500, 'Failed to fetch bill.', [err.message]);
    }
  }

  // ── GET /utilities/readings ─────────────────────────────────
  static async getReadings(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const { buildingId, unitId, utilityType, billingPeriod } = req.query as Record<string, string>;
      const readings = await UtilityService.getReadings(orgId, { buildingId, unitId, utilityType, billingPeriod });
      return sendSuccess(res, readings, 'Utility readings retrieved.');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch readings.', [err.message]);
    }
  }

  // ── GET /utilities/summary ──────────────────────────────────
  static async getSummary(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');
      const { buildingId } = req.query as Record<string, string>;
      const summary = await UtilityService.getSummary(orgId, buildingId);
      return sendSuccess(res, summary, 'Utility summary retrieved.');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to fetch summary.', [err.message]);
    }
  }

  // ── POST /utilities/mark-overdue ────────────────────────────
  static async markOverdue(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');
      const result = await UtilityService.markOverdueBills(orgId);
      return sendSuccess(res, result, `${result.markedOverdue} bills marked as overdue.`);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to mark overdue bills.', [err.message]);
    }
  }

  // ── DELETE /utilities/bills/:id ─────────────────────────────
  static async cancelBill(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');
      const updated = await UtilityService.cancelBill(req.params.id, orgId);
      return sendSuccess(res, updated, 'Utility bill cancelled.');
    } catch (err: any) {
      if (err.message.includes('not found')) return sendError(res, 404, err.message);
      if (err.message.includes('paid')) return sendError(res, 409, err.message);
      return sendError(res, 500, 'Failed to cancel bill.', [err.message]);
    }
  }
}

