import { Request } from 'express';
import { buildingsRepository, BuildingsRepository } from './buildings.repository.ts';
import {
  BuildingListQuery,
  CreateBuildingDTO,
  UpdateBuildingDTO,
  BuildingEntity,
  BuildingDetailResponse,
} from './buildings.types.ts';
import { ApiError } from '../common/api-response.ts';
import { validateCreateBuilding, validateUpdateBuilding } from './buildings.schema.ts';
import { logAudit, AuthenticatedUser } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { floors, units } from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export class BuildingsService {
  constructor(private repo: BuildingsRepository = buildingsRepository) {}

  async listBuildings(query: BuildingListQuery, organizationId?: string) {
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

  async getBuildingById(id: string, organizationId?: string): Promise<BuildingDetailResponse> {
    const building = await this.repo.findById(id, organizationId);
    if (!building) {
      throw ApiError.notFound(`Building with ID '${id}' not found`);
    }

    const [stats, related] = await Promise.all([
      this.repo.getStatistics(id, organizationId),
      this.repo.getRelatedEntities(id),
    ]);

    return {
      ...building,
      statistics: stats,
      building: { ...building },
      floors: related.floors,
      units: related.units,
      tenants: related.tenants,
      contracts: related.contracts,
      maintenance: related.maintenance,
      documents: related.documents,
      payments: related.payments,
    };
  }

  async createBuilding(
    rawBody: any,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<BuildingEntity> {
    const { isValid, errors, validatedData } = validateCreateBuilding(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for building creation', errors);
    }

    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';

    // Check duplicate code scoped to organization
    const existing = await this.repo.findByCode(validatedData.code, organizationId);
    if (existing) {
      throw ApiError.conflict('Building code already exists in your organization', [
        { field: 'code', code: 'DUPLICATE', message: `Building with code '${validatedData.code}' already exists` },
      ]);
    }

    const created = await this.repo.create(validatedData, organizationId);

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'BUILDING_CREATED',
      entityType: 'building',
      entityId: created.id,
      newValues: {
        id: created.id,
        organizationId,
        name: created.name,
        code: created.code,
        address: created.address,
        city: created.city,
        status: created.status,
        numberOfFloors: created.numberOfFloors,
      },
      req,
    });

    return created;
  }

  async updateBuilding(
    id: string,
    rawBody: any,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<BuildingEntity> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const existing = await this.repo.findById(id, organizationId);
    if (!existing) {
      throw ApiError.notFound(`Building with ID '${id}' not found`);
    }

    const { isValid, errors, validatedData } = validateUpdateBuilding(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for building update', errors);
    }

    // If code is being updated, verify uniqueness scoped to organization
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicateCode = await this.repo.findByCode(validatedData.code, organizationId, id);
      if (duplicateCode) {
        throw ApiError.conflict('Building code already exists in your organization', [
          { field: 'code', code: 'DUPLICATE', message: `Building with code '${validatedData.code}' already exists` },
        ]);
      }
    }

    const updated = await this.repo.update(id, organizationId, validatedData);
    if (!updated) {
      throw ApiError.internal('Failed to update building record');
    }

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'BUILDING_UPDATED',
      entityType: 'building',
      entityId: id,
      oldValues: {
        name: existing.name,
        code: existing.code,
        address: existing.address,
        city: existing.city,
        description: existing.description,
        status: existing.status,
        numberOfFloors: existing.numberOfFloors,
      },
      newValues: {
        name: updated.name,
        code: updated.code,
        address: updated.address,
        city: updated.city,
        description: updated.description,
        status: updated.status,
        numberOfFloors: updated.numberOfFloors,
      },
      req,
    });

    return updated;
  }

  async deleteBuilding(
    id: string,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<{ id: string; name: string }> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const existing = await this.repo.findById(id, organizationId);
    if (!existing) {
      throw ApiError.notFound(`Building with ID '${id}' not found`);
    }

    // Check if building contains active floors or units
    const { floorCount, unitCount } = await this.repo.hasFloorsOrUnits(id, organizationId);
    if (floorCount > 0 || unitCount > 0) {
      throw ApiError.conflict(
        'Building cannot be deleted because it contains floors or units.',
        [
          {
            field: 'id',
            code: 'HAS_DEPENDENCIES',
            message: `Building currently contains ${floorCount} floor(s) and ${unitCount} unit(s). Remove or reassign them first.`,
          },
        ]
      );
    }

    await this.repo.softDelete(id, organizationId);

    // Audit trail
    await logAudit({
      userId: user?.id,
      userEmail: user?.email,
      organizationId,
      action: 'BUILDING_DELETED',
      entityType: 'building',
      entityId: id,
      oldValues: {
        id: existing.id,
        name: existing.name,
        code: existing.code,
        status: existing.status,
      },
      req,
    });

    return { id: existing.id, name: existing.name };
  }

  async getFloorsForBuilding(buildingId: string, organizationId?: string) {
    const building = await this.repo.findById(buildingId, organizationId);
    if (!building) {
      throw ApiError.notFound(`Building with ID '${buildingId}' not found`);
    }

    const conditions = [eq(floors.buildingId, buildingId), eq(floors.isDeleted, false)];
    if (organizationId) {
      conditions.push(eq(floors.organizationId, organizationId));
    }

    return await db
      .select()
      .from(floors)
      .where(and(...conditions))
      .orderBy(floors.floorNumber);
  }

  async getUnitsForBuilding(buildingId: string, organizationId?: string) {
    const building = await this.repo.findById(buildingId, organizationId);
    if (!building) {
      throw ApiError.notFound(`Building with ID '${buildingId}' not found`);
    }

    const conditions = [eq(units.buildingId, buildingId), eq(units.isDeleted, false)];
    if (organizationId) {
      conditions.push(eq(units.organizationId, organizationId));
    }

    return await db
      .select()
      .from(units)
      .where(and(...conditions))
      .orderBy(units.unitNumber);
  }
}

export const buildingsService = new BuildingsService();
