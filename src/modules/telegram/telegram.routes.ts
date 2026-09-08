import { Router } from 'express';
import { TelegramController } from './telegram.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

export const telegramRouter = Router();

// Endpoint to link a telegram account. User must be authenticated with BuildingOS (Bearer).
telegramRouter.post('/auth', authenticate, TelegramController.linkAccount);

// The rest of the endpoints will be accessed by the Mini App via TMA header.
telegramRouter.get('/me', authenticate, TelegramController.getMe);
telegramRouter.get('/dashboard', authenticate, TelegramController.getDashboard);
telegramRouter.get('/property', authenticate, TelegramController.getProperty);
telegramRouter.get('/lease', authenticate, TelegramController.getLease);
telegramRouter.get('/billing', authenticate, TelegramController.getBilling);
telegramRouter.get('/maintenance', authenticate, TelegramController.getMaintenanceRequests);
telegramRouter.post('/maintenance', authenticate, TelegramController.createMaintenanceRequest);
telegramRouter.get('/notifications', authenticate, TelegramController.getNotifications);
