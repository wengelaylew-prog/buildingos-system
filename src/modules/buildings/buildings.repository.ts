import { db } from '../../db/index.ts';
import {
  buildings,
  floors,
  units,
  tenants,
  tenantUnits,
  contracts,
  documents,
  maintenanceRequests,
  payments,
} from '../../db/schema.ts';
import { eq, and, or, ilike, sql, desc, asc, SQL } from 'drizzle-orm';
import { BuildingEntity, BuildingStatistics, BuildingListQuery, CreateBuildingDTO, UpdateBuildingDTO } from './buildings.types.ts';

export class BuildingsRepository {
  async findById(id: string, organizationId?: string, includeDeleted = false): Promise<BuildingEntity | null> {
    const conditions = [eq(buildings.id, id)];
    if (organizationId) {
      conditions.push(eq(buildings.organizationId, organizationId));
    }
    if (!includeDeleted) {
      conditions.push(eq(buildings.isDeleted, false));
    }

    const result = await db
      .select()
      .from(buildings)
      .where(and(...conditions))
      .limit(1);

    return (result[0] as BuildingEntity) || null;
  }

  async findByCode(code: string, organizationId?: string, excludeId?: string): Promise<BuildingEntity | null> {
    const conditions = [
      sql`UPPER(${buildings.code}) = UPPER(${code})`,
      eq(buildings.isDeleted, false),
    ];
    if (organizationId) {
      conditions.push(eq(buildings.organizationId, organizationId));
    }
    if (excludeId) {
      conditions.push(sql`${buildings.id} != ${excludeId}`);
    }

    const result = await db
      .select()
      .from(buildings)
      .where(and(...conditions))
      .limit(1);

    return (result[0] as BuildingEntity) || null;
  }

  async findMany(query: BuildingListQuery, organizationId?: string): Promise<{ items: BuildingEntity[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(buildings.isDeleted, false)];

    if (organizationId) {
      conditions.push(eq(buildings.organizationId, organizationId));
    }

    if (query.status && query.status !== 'ALL') {
      conditions.push(sql`UPPER(${buildings.status}) = UPPER(${query.status})`);
    }

    if (query.search && query.search.trim().length > 0) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(buildings.name, searchPattern),
          ilike(buildings.code, searchPattern),
          ilike(buildings.address, searchPattern),
          ilike(buildings.city, searchPattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Count total matching
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(buildings)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // Sorting
    let orderColumn: any = buildings.createdAt;
    if (query.sortBy === 'name') orderColumn = buildings.name;
    else if (query.sortBy === 'code') orderColumn = buildings.code;
    else if (query.sortBy === 'numberOfFloors') orderColumn = buildings.numberOfFloors;
    else if (query.sortBy === 'totalUnits') orderColumn = buildings.totalUnits;
    else if (query.sortBy === 'status') orderColumn = buildings.status;

    const orderDirection = query.sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const items = await db
      .select()
      .from(buildings)
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    return { items: items as BuildingEntity[], total };
  }

  async create(data: CreateBuildingDTO, organizationId: string): Promise<BuildingEntity> {
    const result = await db
      .insert(buildings)
      .values({
        organizationId,
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        description: data.description || null,
        numberOfFloors: data.numberOfFloors || 1,
        totalUnits: 0,
        status: data.status || 'ACTIVE',
        isDeleted: false,
      })
      .returning();

    return result[0] as BuildingEntity;
  }

  async update(id: string, organizationId: string, data: UpdateBuildingDTO): Promise<BuildingEntity | null> {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.numberOfFloors !== undefined) updatePayload.numberOfFloors = data.numberOfFloors;
    if (data.status !== undefined) updatePayload.status = data.status;

    const result = await db
      .update(buildings)
      .set(updatePayload)
      .where(and(eq(buildings.id, id), eq(buildings.organizationId, organizationId)))
      .returning();

    return (result[0] as BuildingEntity) || null;
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .update(buildings)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(buildings.id, id), eq(buildings.organizationId, organizationId)))
      .returning();

    return result.length > 0;
  }

  async getStatistics(buildingId: string, organizationId?: string): Promise<BuildingStatistics> {
    const floorConditions = [eq(floors.buildingId, buildingId), eq(floors.isDeleted, false)];
    const unitConditions = [eq(units.buildingId, buildingId), eq(units.isDeleted, false)];

    if (organizationId) {
      floorConditions.push(eq(floors.organizationId, organizationId));
      unitConditions.push(eq(units.organizationId, organizationId));
    }

    const floorCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(floors)
      .where(and(...floorConditions));

    const unitStatsRes = await db
      .select({
        total: sql<number>`count(*)::int`,
        occupied: sql<number>`count(case when UPPER(status) = 'OCCUPIED' then 1 end)::int`,
        vacant: sql<number>`count(case when UPPER(status) = 'VACANT' then 1 end)::int`,
        maintenance: sql<number>`count(case when UPPER(status) = 'MAINTENANCE' then 1 end)::int`,
        reserved: sql<number>`count(case when UPPER(status) = 'RESERVED' then 1 end)::int`,
      })
      .from(units)
      .where(and(...unitConditions));

    const floorCount = floorCountRes[0]?.count || 0;
    const stats = unitStatsRes[0] || { total: 0, occupied: 0, vacant: 0, maintenance: 0, reserved: 0 };

    return {
      floors: floorCount,
      units: stats.total,
      occupied: stats.occupied,
      vacant: stats.vacant,
      maintenance: stats.maintenance,
      reserved: stats.reserved,
    };
  }

  async hasFloorsOrUnits(buildingId: string, organizationId?: string): Promise<{ floorCount: number; unitCount: number }> {
    const floorConditions = [eq(floors.buildingId, buildingId), eq(floors.isDeleted, false)];
    const unitConditions = [eq(units.buildingId, buildingId), eq(units.isDeleted, false)];

    if (organizationId) {
      floorConditions.push(eq(floors.organizationId, organizationId));
      unitConditions.push(eq(units.organizationId, organizationId));
    }

    const floorCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(floors)
      .where(and(...floorConditions));

    const unitCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(and(...unitConditions));

    return {
      floorCount: floorCountRes[0]?.count || 0,
      unitCount: unitCountRes[0]?.count || 0,
    };
  }

  async getRelatedEntities(buildingId: string) {
    const [
      buildingFloors,
      buildingUnits,
      buildingMaintenance,
      buildingDocs,
    ] = await Promise.all([
      db.select().from(floors).where(and(eq(floors.buildingId, buildingId), eq(floors.isDeleted, false))),
      db.select().from(units).where(and(eq(units.buildingId, buildingId), eq(units.isDeleted, false))),
      db.select().from(maintenanceRequests).where(eq(maintenanceRequests.buildingId, buildingId)),
      db.select().from(documents).where(and(eq(documents.entityType, 'building'), eq(documents.entityId, buildingId))),
    ]);

    // Active tenants linked through units
    const unitIds = buildingUnits.map((u) => u.id);
    let buildingTenants: any[] = [];
    let buildingContracts: any[] = [];
    let buildingPayments: any[] = [];

    if (unitIds.length > 0) {
      const activeTenantUnits = await db
        .select({
          tenantId: tenantUnits.tenantId,
        })
        .from(tenantUnits)
        .where(
          and(
            sql`${tenantUnits.unitId} in ${unitIds}`,
            eq(tenantUnits.isCurrent, true)
          )
        );

      const tenantIds = activeTenantUnits.map((tu) => tu.tenantId);
      if (tenantIds.length > 0) {
        buildingTenants = await db
          .select()
          .from(tenants)
          .where(and(sql`${tenants.id} in ${tenantIds}`, eq(tenants.isDeleted, false)));
      }

      buildingContracts = await db
        .select()
        .from(contracts)
        .where(and(sql`${contracts.unitId} in ${unitIds}`, eq(contracts.isDeleted, false)));

      buildingPayments = await db
        .select()
        .from(payments)
        .where(sql`${payments.unitId} in ${unitIds}`);
    }

    return {
      floors: buildingFloors,
      units: buildingUnits,
      tenants: buildingTenants,
      contracts: buildingContracts,
      maintenance: buildingMaintenance,
      documents: buildingDocs,
      payments: buildingPayments,
    };
  }
}

export const buildingsRepository = new BuildingsRepository();
