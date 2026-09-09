import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.ts';
import { TelegramService } from './telegram.service.ts';

const sendSuccess = (res: Response, data: any, message: string | null = null) => {
  return res.json({ success: true, data, message, errors: [] });
};

const sendError = (res: Response, status: number, message: string, errors: any[] = [], code?: string) => {
  return res.status(status).json({ success: false, data: null, message, errors, error: { code, message } });
};

export class TelegramController {
  static async linkAccount(req: AuthRequest, res: Response) {
    try {
      const { initData } = req.body;
      if (!initData) return sendError(res, 400, 'Missing initData');
      if (!req.user) return sendError(res, 401, 'BuildingOS Authentication required to link account');

      const account = await TelegramService.linkAccount(req.user.id, initData);
      return sendSuccess(res, account, 'Telegram account linked successfully');
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    if (!req.user) return sendError(res, 401, 'Unauthorized');
    return sendSuccess(res, req.user);
  }

  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getDashboard(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getProperty(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getProperty(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getLease(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getLease(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getBilling(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getBilling(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getInvoiceDetail(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const { id } = req.params;
      const data = await TelegramService.getInvoiceDetail(req.user.id, id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 404, err.message, [err.message]);
    }
  }

  static async getPaymentStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const { id } = req.params;
      const data = await TelegramService.getPaymentStatus(req.user.id, id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 404, err.message, [err.message]);
    }
  }

  static async getMaintenanceRequests(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getMaintenanceRequests(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async createMaintenanceRequest(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.createMaintenanceRequest(req.user.id, req.body);
      return sendSuccess(res, data, 'Maintenance request created successfully');
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async requestRenewal(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.requestRenewal(req.user.id);
      return sendSuccess(res, data, 'Renewal request submitted successfully');
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getNotifications(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async markNotificationRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const { id } = req.params;
      const data = await TelegramService.markNotificationRead(req.user.id, id);
      return sendSuccess(res, data, 'Notification marked as read');
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.getProfile(req.user.id);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }

  static async disconnectTelegram(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 401, 'Unauthorized');
      const data = await TelegramService.disconnectTelegram(req.user.id);
      return sendSuccess(res, data, 'Telegram account disconnected');
    } catch (err: any) {
      return sendError(res, 400, err.message, [err.message]);
    }
  }
}

