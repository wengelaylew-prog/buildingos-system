import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.ts';
import { sendSuccess, sendError, ApiError } from '../common/api-response.ts';
import { threeDService, ThreeDService } from './three-d.service.ts';

export class ThreeDController {
  constructor(private service: ThreeDService = threeDService) {}

  getScene = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Authentication required');
      }

      const buildingId = (req.query.buildingId as string) || (req.params.buildingId as string) || undefined;
      const scene = await this.service.getScene(req.user, buildingId);

      return sendSuccess(res, scene, '3D Scene data retrieved successfully');
    } catch (err: any) {
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          success: false,
          data: null,
          message: err.message,
          errors: err.errors,
        });
      }
      return sendError(res, 500, 'Failed to fetch 3D scene data', [err.message]);
    }
  };
}

export const threeDController = new ThreeDController();
