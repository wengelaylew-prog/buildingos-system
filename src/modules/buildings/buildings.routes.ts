import { Router } from 'express';
import { buildingsController } from './buildings.controller.ts';
import { floorsController } from '../floors/floors.controller.ts';
import { unitsController } from '../units/units.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

export const buildingsRouter = Router();

// Building Collection
buildingsRouter.get(
  '/',
  authenticate,
  requirePermission('building.read'),
  buildingsController.list
);

buildingsRouter.post(
  '/',
  authenticate,
  requirePermission('building.create'),
  buildingsController.create
);

// Nested Building sub-resources
buildingsRouter.get(
  '/:buildingId/floors',
  authenticate,
  requirePermission('floor.read'),
  buildingsController.getFloors
);

buildingsRouter.post(
  '/:buildingId/floors',
  authenticate,
  requirePermission('floor.create'),
  floorsController.create
);

buildingsRouter.get(
  '/:buildingId/units',
  authenticate,
  requirePermission('unit.read'),
  buildingsController.getUnits
);

buildingsRouter.post(
  '/:buildingId/units',
  authenticate,
  requirePermission('unit.create'),
  unitsController.create
);

// Single Building operations
buildingsRouter.get(
  '/:id',
  authenticate,
  requirePermission('building.read'),
  buildingsController.getById
);

buildingsRouter.patch(
  '/:id',
  authenticate,
  requirePermission('building.update'),
  buildingsController.update
);

buildingsRouter.put(
  '/:id',
  authenticate,
  requirePermission('building.update'),
  buildingsController.update
);

buildingsRouter.delete(
  '/:id',
  authenticate,
  requirePermission('building.delete'),
  buildingsController.delete
);
