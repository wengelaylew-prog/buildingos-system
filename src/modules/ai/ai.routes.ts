import { Router } from 'express';
import { AIController } from './ai.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

export const aiRouter = Router();

// AI routes for authorized users in their organization
aiRouter.get('/payment-insights', authenticate, AIController.getPaymentInsights);
aiRouter.get('/security-insights', authenticate, AIController.getSecurityInsights);
