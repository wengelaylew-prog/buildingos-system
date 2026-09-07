import { Response } from 'express';
import { unitsService, UnitsService } from './units.service.ts';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError, ApiError } from '../common/api-response.ts';

export class UnitsController {
  constructor(private service: UnitsService = unitsService) {}

  list = async (req: AuthRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const buildingId = (req.query.buildingId as string) || (req.params.buildingId as string) || '';
      const floorId = (req.query.floorId as string) || (req.params.floorId as string) || '';
      const status = (req.query.status as string) || '';
      const unitType = (req.query.unitType as string) || (req.query.type as string) || '';
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sortBy as any) || 'unitNumber';
      const sortOrder = (req.query.sortOrder as any) || 'asc';

      const result = await this.service.listUnits(
        {
          page,
          limit,
          buildingId,
          floorId,
          status,
          unitType,
          search,
          sortBy,
          sortOrder,
        },
        req.user?.organizationId
      );

      return sendSuccess(res, result.items, 'Units retrieved successfully', result.meta);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch units');
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const unit = await this.service.getUnitById(id, req.user?.organizationId);
      return sendSuccess(res, unit, 'Unit details retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch unit details');
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const body = {
        ...req.body,
        buildingId: req.params.buildingId || req.body.buildingId || req.body.building_id,
        floorId: req.params.floorId || req.body.floorId || req.body.floor_id,
      };
      const created = await this.service.createUnit(body, req.user, req);
      return sendSuccess(res, created, 'Unit created successfully', undefined, 201);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to create unit');
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateUnit(id, req.body, req.user, req);
      return sendSuccess(res, updated, 'Unit updated successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to update unit');
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteUnit(id, req.user, req);
      return sendSuccess(res, result, 'Unit deleted successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to delete unit');
    }
  };

  private handleError(res: Response, err: any, defaultMessage: string) {
    if (err instanceof ApiError) {
      return sendError(res, err.statusCode, err.message, err.errors);
    }
    console.error(`[UnitsController] ${defaultMessage}:`, err);
    return sendError(res, 500, defaultMessage, [
      { field: 'server', code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
    ]);
  }
}

export const unitsController = new UnitsController();
