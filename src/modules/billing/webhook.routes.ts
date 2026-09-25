import { Router } from 'express';
import { WebhookController } from './webhook.controller';

const router = Router();

// These routes must be PUBLIC (no authentication middleware) 
// because they are called by external payment gateways.
// Security is handled via HMAC signatures inside the controller.

router.post('/chapa', WebhookController.chapaCallback);
router.post('/telebirr', WebhookController.telebirrCallback);

export const webhookRouter = router;

