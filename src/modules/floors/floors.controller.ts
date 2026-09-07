import { Response } from 'express';
import { floorsService, FloorsService } from './floors.service.ts';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError, ApiError } from '../common/api-response.ts';

export class FloorsController {
  constructor(private service: FloorsService = floorsService) {}

  list = async (req: AuthRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const buildingId = (req.query.buildingId as string) || (req.params.buildingId as string) || '';
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sortBy as any) || 'floorNumber';
      const sortOrder = (req.query.sortOrder as any) || 'asc';

      const result = await this.service.listFloors(
        {
          page,
          limit,
          buildingId,
          search,
          sortBy,
          sortOrder,
        },
        req.user?.organizationId
      );

      return sendSuccess(res, result.items, 'Floors retrieved successfully', result.meta);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch floors');
    }
  };

  getById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const floor = await this.service.getFloorById(id, req.user?.organizationId);
      return sendSuccess(res, floor, 'Floor details retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch floor details');
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      // If buildingId is in URL route params (e.g. POST /buildings/:buildingId/floors), merge it
      const body = {
        ...req.body,
        buildingId: req.params.buildingId || req.body.buildingId || req.body.building_id,
      };
      const created = await this.service.createFloor(body, req.user, req);
      return sendSuccess(res, created, 'Floor created successfully', undefined, 201);
    } catch (err: any) {
      this.handleError(res, err, 'Failed to create floor');
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await this.service.updateFloor(id, req.body, req.user, req);
      return sendSuccess(res, updated, 'Floor updated successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to update floor');
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteFloor(id, req.user, req);
      return sendSuccess(res, result, 'Floor deleted successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to delete floor');
    }
  };

  getUnits = async (req: AuthRequest, res: Response) => {
    try {
      const floorId = req.params.floorId || req.params.id;
      const units = await this.service.getUnitsForFloor(floorId, req.user?.organizationId);
      return sendSuccess(res, units, 'Floor units retrieved successfully');
    } catch (err: any) {
      this.handleError(res, err, 'Failed to fetch floor units');
    }
  };

  private handleError(res: Response, err: any, defaultMessage: string) {
    if (err instanceof ApiError) {
      return sendError(res, err.statusCode, err.message, err.errors);
    }
    console.error(`[FloorsController] ${defaultMessage}:`, err);
    return sendError(res, 500, defaultMessage, [
      { field: 'server', code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
    ]);
  }
}

export const floorsController = new FloorsController();
