import { Router } from 'express';
import { threeDController } from './three-d.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

export const threeDRouter = Router();

// GET /api/v1/properties/3d-scene (with optional ?buildingId=...)
threeDRouter.get('/3d-scene', authenticate, threeDController.getScene);

// GET /api/v1/properties/3d-scene/:buildingId
threeDRouter.get('/3d-scene/:buildingId', authenticate, threeDController.getScene);
