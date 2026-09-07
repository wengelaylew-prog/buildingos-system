import { Response } from 'express';
import { MessagingService } from './messaging.service.ts';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { AuthRequest } from '../../middleware/auth.ts';

export class MessagingController {
  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const result = await MessagingService.sendMessage({
        ...req.body,
        organizationId: orgId,
        senderId: req.user!.id,
      });
      return sendSuccess(res, result, 'Message sent successfully');
    } catch (err: any) {
      return sendError(res, 500, 'Failed to send message', [err.message]);
    }
  }

  static async getMessages(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const messages = await MessagingService.getMessages(orgId, req.user!.id);
      return sendSuccess(res, messages);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to retrieve messages', [err.message]);
    }
  }

  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const notifications = await MessagingService.getUserNotifications(orgId, req.user!.id);
      return sendSuccess(res, notifications);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to retrieve notifications', [err.message]);
    }
  }

  static async markNotificationRead(req: AuthRequest, res: Response) {
    try {
      const result = await MessagingService.markNotificationRead(req.params.id, req.user!.id);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, 500, 'Failed to mark notification read', [err.message]);
    }
  }
}

