import { Request } from 'express';
import { unitsRepository, UnitsRepository } from './units.repository.ts';
import { buildingsRepository } from '../buildings/buildings.repository.ts';
import { floorsRepository } from '../floors/floors.repository.ts';
import {
  UnitListQuery,
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitEntity,
  UnitDetailResponse,
} from './units.types.ts';
import { ApiError } from '../common/api-response.ts';
import { validateCreateUnit, validateUpdateUnit } from './units.schema.ts';
import { logAudit, AuthenticatedUser } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { buildings, floors, units } from '../../db/schema.ts';
import { eq, sql, and } from 'drizzle-orm';

export class UnitsService {
  constructor(private repo: UnitsRepository = unitsRepository) {}

  async listUnits(query: UnitListQuery, organizationId?: string) {
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

  async getUnitById(id: string, organizationId?: string): Promise<UnitDetailResponse> {
    const unit = await this.repo.findById(id, organizationId);
    if (!unit) {
      throw ApiError.notFound(`Unit with ID '${id}' not found`);
    }

    const [building, floor, details] = await Promise.all([
      buildingsRepository.findById(unit.buildingId, organizationId),
      floorsRepository.findById(unit.floorId, organizationId),
      this.repo.getDetailEntities(id),
    ]);

    return {
      unit,
      building: building || null,
      floor: floor || null,
      tenant: details.tenant,
      contract: details.contract,
      contracts: details.contracts,
      payments: details.payments,
      receipts: details.receipts,
      maintenance: details.maintenance,
      documents: details.documents,
      activity: details.activity,
    };
  }

  async createUnit(
    rawBody: any,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<UnitEntity> {
    const { isValid, errors, validatedData } = validateCreateUnit(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for unit creation', errors);
    }

    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';

    // 1. Verify building exists in organization
    const building = await buildingsRepository.findById(validatedData.buildingId, organizationId);
    if (!building) {
      throw ApiError.notFound(`Building with ID '${validatedData.buildingId}' not found in your organization`);
    }

    // 2. Verify floor exists in organization
    const floor = await floorsRepository.findById(validatedData.floorId, organizationId);
    if (!floor) {
      throw ApiError.notFound(`Floor with ID '${validatedData.floorId}' not found in your organization`);
    }

    // 3. Verify floor belongs to building
    if (floor.buildingId !== validatedData.buildingId) {
      throw ApiError.badRequest('Floor does not belong to the selected building', [
        {
          field: 'floorId',
          code: 'FLOOR_MISMATCH',
          message: `Floor '${floor.floorName}' does not belong to building '${building.name}'`,
        },
      ]);
    }

    // 4. Verify unit number is not duplicated within the building
    const existing = await this.repo.findByBuildingAndNumber(
      validatedData.buildingId,
      validatedData.unitNumber,
      organizationId
    );
    if (existing) {
      throw ApiError.conflict('Unit number already exists in this building', [
        {
          field: 'unitNumber',
          code: 'DUPLICATE_UNIT',
          message: `Unit '${validatedData.unitNumber}' already exists in building '${building.name}'`,
        },
      ]);
    }

    const created = await this.repo.create(validatedData, organizationId);

    // 5. Update building & floor total_units count
    await Promise.all([
      db
        .update(buildings)
        .set({
          totalUnits: sql<number>`(select count(*)::int from units where building_id = ${building.id} and is_deleted = false)`,
          updatedAt: new Date(),
        })
        .where(eq(buildings.id, building.id)),
      db
        .update(floors)
        .set({
          totalUnits: sql<number>`(select count(*)::int from units where floor_id = ${floor.id} and is_deleted = false)`,
          updatedAt: new Date(),
        })
        .where(eq(floors.id, floor.id)),
    ]);

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'UNIT_CREATED',
      entityType: 'unit',
      entityId: created.id,
      newValues: {
        id: created.id,
        organizationId,
        buildingId: created.buildingId,
        floorId: created.floorId,
        unitNumber: created.unitNumber,
        unitType: created.unitType,
        status: created.status,
        monthlyRent: created.monthlyRent,
      },
      req,
    });

    return created;
  }

  async updateUnit(
    id: string,
    rawBody: any,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<UnitEntity> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const existing = await this.repo.findById(id, organizationId);
    if (!existing) {
      throw ApiError.notFound(`Unit with ID '${id}' not found`);
    }

    const { isValid, errors, validatedData } = validateUpdateUnit(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for unit update', errors);
    }

    const targetBuildingId = validatedData.buildingId || existing.buildingId;
    const targetFloorId = validatedData.floorId || existing.floorId;

    // Verify building and floor integrity if either changed
    if (validatedData.buildingId || validatedData.floorId) {
      const floor = await floorsRepository.findById(targetFloorId, organizationId);
      if (!floor) {
        throw ApiError.notFound(`Target floor '${targetFloorId}' does not exist in your organization`);
      }
      if (floor.buildingId !== targetBuildingId) {
        throw ApiError.badRequest('Target floor does not belong to the building', [
          {
            field: 'floorId',
            code: 'FLOOR_MISMATCH',
            message: 'The selected floor does not belong to the selected building',
          },
        ]);
      }
    }

    // Verify unitNumber uniqueness within building if changed
    if (validatedData.unitNumber && validatedData.unitNumber !== existing.unitNumber) {
      const duplicate = await this.repo.findByBuildingAndNumber(
        targetBuildingId,
        validatedData.unitNumber,
        organizationId,
        id
      );
      if (duplicate) {
        throw ApiError.conflict('Unit number already exists in this building', [
          {
            field: 'unitNumber',
            code: 'DUPLICATE_UNIT',
            message: `Unit '${validatedData.unitNumber}' already exists in this building`,
          },
        ]);
      }
    }

    const updated = await this.repo.update(id, organizationId, validatedData);
    if (!updated) {
      throw ApiError.internal('Failed to update unit record');
    }

    // Audit trail for update
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'UNIT_UPDATED',
      entityType: 'unit',
      entityId: id,
      oldValues: {
        unitNumber: existing.unitNumber,
        unitType: existing.unitType,
        status: existing.status,
        monthlyRent: existing.monthlyRent,
        area: existing.area,
        bedrooms: existing.bedrooms,
        bathrooms: existing.bathrooms,
      },
      newValues: {
        unitNumber: updated.unitNumber,
        unitType: updated.unitType,
        status: updated.status,
        monthlyRent: updated.monthlyRent,
        area: updated.area,
        bedrooms: updated.bedrooms,
        bathrooms: updated.bathrooms,
      },
      req,
    });

    // If status changed: log dedicated UNIT_STATUS_CHANGED audit
    if (validatedData.status && validatedData.status !== existing.status) {
      await logAudit({
        userId: user?.id,
        userEmail: user?.email,
        organizationId,
        action: 'UNIT_STATUS_CHANGED',
        entityType: 'unit',
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: updated.status },
        req,
      });
    }

    return updated;
  }

  async deleteUnit(
    id: string,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<{ id: string; unitNumber: string }> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const existing = await this.repo.findById(id, organizationId);
    if (!existing) {
      throw ApiError.notFound(`Unit with ID '${id}' not found`);
    }

    // Check active dependencies
    const deps = await this.repo.hasActiveDependencies(id);
    if (deps.activeCount > 0) {
      const messages: string[] = [];
      if (deps.hasTenants) messages.push('active tenant');
      if (deps.hasContracts) messages.push('active contract');
      if (deps.hasPayments) messages.push('payment records');
      if (deps.hasMaintenance) messages.push('open maintenance requests');
      if (deps.hasDocuments) messages.push('attached documents');

      throw ApiError.conflict(
        `Unit cannot be deleted because it is linked to: ${messages.join(', ')}.`,
        [
          {
            field: 'id',
            code: 'HAS_DEPENDENCIES',
            message: `Unit ${existing.unitNumber} has existing dependencies (${messages.join(', ')}).`,
          },
        ]
      );
    }

    await this.repo.softDelete(id, organizationId);

    // Update counts on building and floor
    await Promise.all([
      db
        .update(buildings)
        .set({
          totalUnits: sql<number>`(select count(*)::int from units where building_id = ${existing.buildingId} and is_deleted = false)`,
          updatedAt: new Date(),
        })
        .where(eq(buildings.id, existing.buildingId)),
      db
        .update(floors)
        .set({
          totalUnits: sql<number>`(select count(*)::int from units where floor_id = ${existing.floorId} and is_deleted = false)`,
          updatedAt: new Date(),
        })
        .where(eq(floors.id, existing.floorId)),
    ]);

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'UNIT_DELETED',
      entityType: 'unit',
      entityId: id,
      oldValues: {
        id: existing.id,
        buildingId: existing.buildingId,
        floorId: existing.floorId,
        unitNumber: existing.unitNumber,
        status: existing.status,
      },
      req,
    });

    return { id: existing.id, unitNumber: existing.unitNumber };
  }
}

export const unitsService = new UnitsService();
