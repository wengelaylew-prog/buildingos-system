import { Response } from 'express';
import { leasesService, LeasesService } from './leases.service.ts';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError, ApiError } from '../common/api-response.ts';

export class LeasesController {
  constructor(private service: LeasesService = leasesService) {}

  list = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || (req.query.contractStatus as string) || '';
      const buildingId = (req.query.buildingId as string) || '';
      const floorId = (req.query.floorId as string) || '';
      const unitId = (req.query.unitId as string) || '';
      const tenantId = (req.query.tenantId as string) || '';
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) || 'desc';

      const result = await this.service.listLeases(
        {
          page,
          limit,
          search,
          status,
          buildingId,
          floorId,
          unitId,
          tenantId,
          sortBy,
          sortOrder,
        },
        req.user.organizationId
      );

      return sendSuccess(res, result.items, 'Leases retrieved successfully', result.pagination);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch leases');
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const lease = await this.service.getLeaseById(id, req.user.organizationId);
      return sendSuccess(res, lease, 'Lease details retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch lease details');
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const created = await this.service.createLease(req.body, req.user, req);
      return sendSuccess(res, created, 'Lease created successfully', undefined, 201);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to create lease');
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const updated = await this.service.updateLease(id, req.body, req.user, req);
      return sendSuccess(res, updated, 'Lease updated successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to update lease');
    }
  };

  terminate = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const notes = req.body?.notes || req.body?.reason;
      const result = await this.service.terminateLease(id, notes, req.user, req);
      return sendSuccess(res, result, 'Lease terminated successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to terminate lease');
    }
  };

  renew = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const result = await this.service.renewLease(id, req.body, req.user, req);
      return sendSuccess(res, result, 'Lease renewed successfully', undefined, 201);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to renew lease');
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const result = await this.service.deleteLease(id, req.user, req);
      return sendSuccess(res, result, 'Lease deleted successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to delete lease');
    }
  };

  private handleError(res: Response, err: any, defaultMessage: string) {
    if (err instanceof ApiError) {
      return sendError(res, err.statusCode, err.message, err.errors);
    }
    console.error(`[LeasesController] ${defaultMessage}:`, err);
    return sendError(res, 500, defaultMessage, [
      { field: 'server', code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
    ]);
  }
}

export const leasesController = new LeasesController();
