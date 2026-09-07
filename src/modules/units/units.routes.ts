import { Router } from 'express';
import { unitsController } from './units.controller.ts';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

export const unitsRouter = Router();

unitsRouter.get(
  '/',
  authenticate,
  requirePermission('unit.read'),
  unitsController.list
);

unitsRouter.post(
  '/',
  authenticate,
  requirePermission('unit.create'),
  unitsController.create
);

unitsRouter.get(
  '/:id',
  authenticate,
  requirePermission('unit.read'),
  unitsController.getById
);

unitsRouter.patch(
  '/:id',
  authenticate,
  requirePermission('unit.update'),
  unitsController.update
);

unitsRouter.put(
  '/:id',
  authenticate,
  requirePermission('unit.update'),
  unitsController.update
);

unitsRouter.delete(
  '/:id',
  authenticate,
  requirePermission('unit.delete'),
  unitsController.delete
);
