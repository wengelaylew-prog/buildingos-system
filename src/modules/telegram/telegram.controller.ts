import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.ts';
import { TelegramService } from './telegram.service.ts';
import { visitors } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';

const sendSuccess = (res: Response, data: any, message: string | null = null) => {
  return res.json({ success: true, data, message, errors: [] });
};

const sendError = (res: Response, status: number, message: string, errors: any[] = [], code?: string) => {
  return res.status(status).json({ success: false, data: null, message, errors, error: { code, message } });
};

export class TelegramController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const update: any = req.body;
      
      if (update.callback_query) {
        const queryId = update.callback_query.id;
        const data = update.callback_query.data; // e.g. "visitor_approve_UUID"
        const chatId = update.callback_query.message.chat.id;
        const messageId = update.callback_query.message.message_id;

        if (data.startsWith('visitor_')) {
          const parts = data.split('_');
          const action = parts[1];
          const visitorId = parts.slice(2).join('_');
          
          let newStatus = action === 'approve' ? 'APPROVED' : 'DENIED';
          
          await db.update(visitors).set({ status: newStatus }).where(eq(visitors.id, visitorId));

          // Answer callback query
          if (process.env.TELEGRAM_BOT_TOKEN) {
             const botToken = process.env.TELEGRAM_BOT_TOKEN;
             await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ callback_query_id: queryId, text: `Visitor ${newStatus}` })
             });

             // Edit the original message to remove buttons
             const text = update.callback_query.message.text + `\n\nStatus: ${newStatus} ✅`;
             await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ chat_id: chatId, message_id: messageId, text })
             });
          }
        }
      }

      res.status(200).send('OK');
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(200).send('OK'); // Always return 200 to Telegram
    }
  }

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

  
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) throw new Error('Unauthenticated');
      const { emergencyContactName, emergencyContactPhone } = (req.body as any) || {};
      const data = await TelegramService.updateProfile(user.id, emergencyContactName, emergencyContactPhone);
      return sendSuccess(res, data, 'Profile updated');
    } catch (err: any) {
      return sendError(res, 400, err.message);
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

