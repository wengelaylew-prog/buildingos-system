import { Router } from 'express';
import { TmaAuthController } from './tma-auth.controller.ts';

export const tmaAuthRouter = Router();

tmaAuthRouter.post('/telegram', TmaAuthController.loginTelegram);
tmaAuthRouter.post('/email/otp/send', TmaAuthController.sendEmailOtp);
tmaAuthRouter.post('/email/otp/verify', TmaAuthController.verifyEmailOtp);
tmaAuthRouter.post('/phone/otp/send', TmaAuthController.sendPhoneOtp);
tmaAuthRouter.post('/phone/otp/verify', TmaAuthController.verifyPhoneOtp);
tmaAuthRouter.post('/logout', TmaAuthController.logout);
