import { Router } from 'express';
import { floorsController } from './floors.controller.ts';
import { unitsController } from '../units/units.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

export const floorsRouter = Router();

floorsRouter.get(
  '/',
  authenticate,
  requirePermission('floor.read'),
  floorsController.list
);

floorsRouter.post(
  '/',
  authenticate,
  requirePermission('floor.create'),
  floorsController.create
);

floorsRouter.get(
  '/:id/units',
  authenticate,
  requirePermission('unit.read'),
  floorsController.getUnits
);

floorsRouter.post(
  '/:id/units',
  authenticate,
  requirePermission('unit.create'),
  unitsController.create
);

floorsRouter.get(
  '/:id',
  authenticate,
  requirePermission('floor.read'),
  floorsController.getById
);

floorsRouter.patch(
  '/:id',
  authenticate,
  requirePermission('floor.update'),
  floorsController.update
);

floorsRouter.put(
  '/:id',
  authenticate,
  requirePermission('floor.update'),
  floorsController.update
);

floorsRouter.delete(
  '/:id',
  authenticate,
  requirePermission('floor.delete'),
  floorsController.delete
);
