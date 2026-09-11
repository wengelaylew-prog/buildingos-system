import { Request, Response } from 'express';
import { TmaAuthService } from './tma-auth.service.ts';

const sendSuccess = (res: Response, data: any, message: string | null = null) =>
  res.json({ success: true, data, message, errors: [] });

const sendError = (res: Response, status: number, message: string, code?: string) =>
  res.status(status).json({ success: false, data: null, message, errors: [message], error: { code, message } });

export class TmaAuthController {
  static async loginTelegram(req: Request, res: Response) {
    try {
      const { initData } = req.body || {};
      const result = await TmaAuthService.loginWithTelegram(initData);
      return sendSuccess(res, result, 'Signed in successfully');
    } catch (err: any) {
      const code = err.code || 'UNAUTHENTICATED';
      const status = code === 'CONFIG_ERROR' ? 401 : code === 'ACCOUNT_DISABLED' ? 403 : 401;
      return sendError(res, status, err.message || 'Telegram authentication failed', code);
    }
  }

  static async sendEmailOtp(req: Request, res: Response) {
    try {
      const { email } = req.body || {};
      const result = await TmaAuthService.sendEmailOtp(email, req.ip);
      return sendSuccess(res, result, 'If this email is registered, a verification code has been sent.');
    } catch (err: any) {
      const message = err.message || 'Unable to send verification code';
      const status = /wait|Too many/i.test(message) ? 429 : 400;
      return sendError(res, status, message);
    }
  }

  static async verifyEmailOtp(req: Request, res: Response) {
    try {
      const { email, code } = req.body || {};
      const result = await TmaAuthService.verifyEmailOtp(email, code);
      return sendSuccess(res, result, 'Signed in successfully');
    } catch (err: any) {
      return sendError(res, 401, err.message || 'Invalid or expired verification code', 'INVALID_OTP');
    }
  }

  static async sendPhoneOtp(req: Request, res: Response) {
    try {
      const { phone } = req.body || {};
      const result = await TmaAuthService.sendPhoneOtp(phone, req.ip);
      return sendSuccess(res, result, 'If this phone number is registered, a verification code has been sent.');
    } catch (err: any) {
      const message = err.message || 'Unable to send verification code';
      const status = /wait|Too many/i.test(message) ? 429 : 400;
      return sendError(res, status, message);
    }
  }

  static async verifyPhoneOtp(req: Request, res: Response) {
    try {
      const { phone, code } = req.body || {};
      const result = await TmaAuthService.verifyPhoneOtp(phone, code);
      return sendSuccess(res, result, 'Signed in successfully');
    } catch (err: any) {
      return sendError(res, 401, err.message || 'Invalid or expired verification code', 'INVALID_OTP');
    }
  }

  static async logout(req: Request, res: Response) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.toUpperCase().startsWith('TMASESSION ') ? authHeader.slice('TMASESSION '.length).trim() : null;
    if (token) {
      await TmaAuthService.logout(token).catch(() => {});
    }
    return sendSuccess(res, { loggedOut: true }, 'Signed out');
  }
}
