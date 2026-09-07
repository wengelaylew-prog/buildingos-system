import { Response } from 'express';
import { buildingsService, BuildingsService } from './buildings.service.ts';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError, ApiError } from '../common/api-response.ts';

export class BuildingsController {
  constructor(private service: BuildingsService = buildingsService) {}

  list = async (req: AuthRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || '';
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortOrder = (req.query.sortOrder as any) || 'desc';

      const result = await this.service.listBuildings(
        {
          page,
          limit,
          search,
          status,
          sortBy,
          sortOrder,
        },
        req.user?.organizationId
      );

      return sendSuccess(res, result.items, 'Buildings retrieved successfully', result.meta);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch buildings');
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const building = await this.service.getBuildingById(id, req.user?.organizationId);
      return sendSuccess(res, building, 'Building details retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch building details');
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const created = await this.service.createBuilding(req.body, req.user, req);
      return sendSuccess(res, created, 'Building created successfully', undefined, 201);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to create building');
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateBuilding(id, req.body, req.user, req);
      return sendSuccess(res, updated, 'Building updated successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to update building');
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteBuilding(id, req.user, req);
      return sendSuccess(res, result, 'Building deleted successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to delete building');
    }
  };

  getFloors = async (req: AuthRequest, res: Response) => {
    try {
      const buildingId = req.params.buildingId || req.params.id;
      const floors = await this.service.getFloorsForBuilding(buildingId, req.user?.organizationId);
      return sendSuccess(res, floors, 'Building floors retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch building floors');
    }
  };

  getUnits = async (req: AuthRequest, res: Response) => {
    try {
      const buildingId = req.params.buildingId || req.params.id;
      const units = await this.service.getUnitsForBuilding(buildingId, req.user?.organizationId);
      return sendSuccess(res, units, 'Building units retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch building units');
    }
  };

  private handleError(res: Response, err: any, defaultMessage: string) {
    if (err instanceof ApiError) {
      return sendError(res, err.statusCode, err.message, err.errors);
    }
    console.error(`[BuildingsController] ${defaultMessage}:`, err);
    return sendError(res, 500, defaultMessage, [
      { field: 'server', code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
    ]);
  }
}

export const buildingsController = new BuildingsController();
