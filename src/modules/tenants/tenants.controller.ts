import { Response } from 'express';
import { tenantsService, TenantsService } from './tenants.service.ts';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError, ApiError } from '../common/api-response.ts';

export class TenantsController {
  constructor(private service: TenantsService = tenantsService) {}

  list = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || '';
      const buildingId = (req.query.buildingId as string) || '';
      const floorId = (req.query.floorId as string) || '';
      const unitId = (req.query.unitId as string) || '';
      const leaseStatus = (req.query.leaseStatus as string) || (req.query.status as string) || '';
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) || 'desc';

      const result = await this.service.listTenants(
        {
          page,
          limit,
          search,
          buildingId,
          floorId,
          unitId,
          leaseStatus,
          sortBy,
          sortOrder,
        },
        req.user.organizationId
      );

      return sendSuccess(res, result.items, 'Tenants retrieved successfully', result.meta);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch tenants');
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const tenant = await this.service.getTenantById(id, req.user.organizationId);
      return sendSuccess(res, tenant, 'Tenant details retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch tenant details');
    }
  };

  getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const profile = await this.service.getMyTenantProfile(req.user);
      return sendSuccess(res, profile, 'Tenant profile retrieved successfully');
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return sendError(res, 404, err.message, [], 'TENANT_PROFILE_NOT_FOUND');
      }
      this.handleError(res, err, 'Failed to fetch your tenant profile');
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const created = await this.service.createTenant(req.body, req.user, req);
      return sendSuccess(res, created, 'Tenant created successfully', undefined, 201);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to create tenant');
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const updated = await this.service.updateTenant(id, req.body, req.user, req);
      return sendSuccess(res, updated, 'Tenant updated successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to update tenant');
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Unauthenticated', [], 'UNAUTHENTICATED');
      }
      const { id } = req.params;
      const result = await this.service.deleteTenant(id, req.user, req);
      return sendSuccess(res, result, 'Tenant deleted successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to delete tenant');
    }
  };

  private handleError(res: Response, err: any, defaultMessage: string) {
    if (err instanceof ApiError) {
      return sendError(res, err.statusCode, err.message, err.errors);
    }
    console.error(`[TenantsController] ${defaultMessage}:`, err);
    return sendError(res, 500, defaultMessage, [
      { field: 'server', code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
    ]);
  }
}

export const tenantsController = new TenantsController();
