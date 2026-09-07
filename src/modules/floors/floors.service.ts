import { Request } from 'express';
import { floorsRepository, FloorsRepository } from './floors.repository.ts';
import { buildingsRepository } from '../buildings/buildings.repository.ts';
import {
  FloorListQuery,
  CreateFloorDTO,
  UpdateFloorDTO,
  FloorEntity,
} from './floors.types.ts';
import { ApiError } from '../common/api-response.ts';
import { validateCreateFloor, validateUpdateFloor } from './floors.schema.ts';
import { logAudit, AuthenticatedUser } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { buildings } from '../../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

export class FloorsService {
  constructor(private repo: FloorsRepository = floorsRepository) {}

  async listFloors(query: FloorListQuery, organizationId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const { items, total } = await this.repo.findMany(query, organizationId);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getFloorById(id: string, organizationId?: string): Promise<FloorEntity> {
    const floor = await this.repo.findById(id, organizationId);
    if (!floor) {
      throw ApiError.notFound(`Floor with ID '${id}' not found`);
    }
    return floor;
  }

  async createFloor(
    rawBody: any,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<FloorEntity> {
    const { isValid, errors, validatedData } = validateCreateFloor(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for floor creation', errors);
    }

    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';

    // 1. Verify building exists within the user's organization
    const building = await buildingsRepository.findById(validatedData.buildingId, organizationId);
    if (!building) {
      throw ApiError.notFound(`Building with ID '${validatedData.buildingId}' does not exist in your organization`);
    }

    // 2. Verify floor_number does not already exist within that building and organization
    const existing = await this.repo.findByBuildingAndNumber(
      validatedData.buildingId,
      validatedData.floorNumber,
      organizationId
    );
    if (existing) {
      throw ApiError.conflict('Floor number already exists in this building', [
        {
          field: 'floorNumber',
          code: 'DUPLICATE_FLOOR',
          message: `Floor ${validatedData.floorNumber} already exists in building '${building.name}'`,
        },
      ]);
    }

    const created = await this.repo.create(validatedData, organizationId);

    // Optionally update building numberOfFloors if created floor exceeds current
    if (validatedData.floorNumber > building.numberOfFloors) {
      await db
        .update(buildings)
        .set({ numberOfFloors: validatedData.floorNumber, updatedAt: new Date() })
        .where(eq(buildings.id, building.id));
    }

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'FLOOR_CREATED',
      entityType: 'floor',
      entityId: created.id,
      newValues: {
        id: created.id,
        organizationId,
        buildingId: created.buildingId,
        floorNumber: created.floorNumber,
        floorName: created.floorName,
      },
      req,
    });

    return created;
  }

  async updateFloor(
    id: string,
    rawBody: any,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<FloorEntity> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const existing = await this.repo.findById(id, organizationId);
    if (!existing) {
      throw ApiError.notFound(`Floor with ID '${id}' not found`);
    }

    const { isValid, errors, validatedData } = validateUpdateFloor(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for floor update', errors);
    }

    // If floor_number changed: revalidate uniqueness within building and organization
    if (
      validatedData.floorNumber !== undefined &&
      validatedData.floorNumber !== existing.floorNumber
    ) {
      const duplicate = await this.repo.findByBuildingAndNumber(
        existing.buildingId,
        validatedData.floorNumber,
        organizationId,
        id
      );
      if (duplicate) {
        throw ApiError.conflict('Floor number already exists in this building', [
          {
            field: 'floorNumber',
            code: 'DUPLICATE_FLOOR',
            message: `Floor ${validatedData.floorNumber} already exists in this building`,
          },
        ]);
      }
    }

    const updated = await this.repo.update(id, organizationId, validatedData);
    if (!updated) {
      throw ApiError.internal('Failed to update floor record');
    }

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'FLOOR_UPDATED',
      entityType: 'floor',
      entityId: id,
      oldValues: {
        floorNumber: existing.floorNumber,
        floorName: existing.floorName,
        description: existing.description,
      },
      newValues: {
        floorNumber: updated.floorNumber,
        floorName: updated.floorName,
        description: updated.description,
      },
      req,
    });

    return updated;
  }

  async deleteFloor(
    id: string,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<{ id: string; floorName: string }> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const existing = await this.repo.findById(id, organizationId);
    if (!existing) {
      throw ApiError.notFound(`Floor with ID '${id}' not found`);
    }

    // Do not delete a floor containing units
    const unitCount = await this.repo.countActiveUnits(id, organizationId);
    if (unitCount > 0) {
      throw ApiError.conflict('Floor cannot be deleted because it contains units.', [
        {
          field: 'id',
          code: 'HAS_DEPENDENCIES',
          message: `Floor contains ${unitCount} active unit(s). Reassign or remove them before deleting.`,
        },
      ]);
    }

    await this.repo.softDelete(id, organizationId);

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'FLOOR_DELETED',
      entityType: 'floor',
      entityId: id,
      oldValues: {
        id: existing.id,
        buildingId: existing.buildingId,
        floorNumber: existing.floorNumber,
        floorName: existing.floorName,
      },
      req,
    });

    return { id: existing.id, floorName: existing.floorName };
  }

  async getUnitsForFloor(floorId: string, organizationId?: string) {
    const floor = await this.repo.findById(floorId, organizationId);
    if (!floor) {
      throw ApiError.notFound(`Floor with ID '${floorId}' not found`);
    }
    return await this.repo.getUnitsForFloor(floorId, organizationId);
  }
}

export const floorsService = new FloorsService();
