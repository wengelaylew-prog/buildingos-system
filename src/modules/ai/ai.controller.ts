import { Response } from 'express';
import { AIService } from './ai.service.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { AuthRequest } from '../../middleware/auth.ts';

export class AIController {

  static async scanIdCard(req: AuthRequest, res: Response) {
    try {
      const { image } = req.body;
      if (!image) return sendError(res, 400, 'Image is required');
      
      const data = await AIService.scanIdCard(image);
      return sendSuccess(res, data, 'ID scanned successfully');
    } catch (err: any) {
      return sendError(res, 500, err.message);
    }
  }

  static async getPaymentInsights(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) return sendError(res, 400, 'Organization ID is missing');

      const insights = await AIService.getPaymentInsights(organizationId);
      return sendSuccess(res, insights);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to generate payment insights', [err.message]);
    }
  }

  static async getSecurityInsights(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) return sendError(res, 400, 'Organization ID is missing');

      const insights = await AIService.getSecurityInsights(organizationId);
      return sendSuccess(res, insights);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to generate security insights', [err.message]);
    }
  }

  static async handleChat(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) return sendError(res, 400, 'Organization ID is missing');
      
      const { query } = req.body;
      if (!query) return sendError(res, 400, 'Query is required');

      const response = await AIService.handleAdminQuery(organizationId, query);
      return sendSuccess(res, response);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to handle AI chat', [err.message]);
    }
  }
}

