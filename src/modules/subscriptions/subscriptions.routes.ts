import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';
// Multer is missing, so we'll use a dummy middleware for now to parse multipart or just parse JSON
// since it's a demo, we can assume the frontend sends a base64 string or we skip file processing for now.
// For the sake of the project, let's just make it a basic handler:
const parseFile = (req: any, res: any, next: any) => { next(); };

export const subscriptionsRouter = Router();

// Org Owner / Manager routes
subscriptionsRouter.post(
  '/checkout',
  authenticate,
  parseFile,
  SubscriptionsController.checkout
);

// Super Admin routes
subscriptionsRouter.get(
  '/pending',
  authenticate,
  requirePermission(['MANAGE_SYSTEM']),
  SubscriptionsController.getPending
);

subscriptionsRouter.post(
  '/:id/approve',
  authenticate,
  requirePermission(['MANAGE_SYSTEM']),
  SubscriptionsController.approve
);

subscriptionsRouter.post(
  '/:id/reject',
  authenticate,
  requirePermission(['MANAGE_SYSTEM']),
  SubscriptionsController.reject
);

