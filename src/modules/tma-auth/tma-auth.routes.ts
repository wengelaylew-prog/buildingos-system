import { Router } from 'express';
import { TmaAuthController } from './tma-auth.controller.ts';
import { authRateLimiter } from '../../middleware/security.ts';

// Public (unauthenticated) endpoints — these ARE the login flow for the Tenant TMA.
export const tmaAuthRouter = Router();

tmaAuthRouter.use(authRateLimiter);

tmaAuthRouter.post('/email/login', TmaAuthController.loginEmail);
tmaAuthRouter.post('/phone/otp/send', TmaAuthController.sendOtp);
tmaAuthRouter.post('/phone/otp/verify', TmaAuthController.verifyOtp);
tmaAuthRouter.post('/logout', TmaAuthController.logout);
