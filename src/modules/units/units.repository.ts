import { db } from '../../db/index.ts';
import {
  units,
  buildings,
  floors,
  tenants,
  tenantUnits,
  contracts,
  payments,
  receipts,
  maintenanceRequests,
  documents,
  auditLogs,
} from '../../db/schema.ts';
import { eq, and, sql, desc, asc, SQL, or, ilike, inArray } from 'drizzle-orm';
import { UnitEntity, UnitListQuery, CreateUnitDTO, UpdateUnitDTO } from './units.types.ts';

export class UnitsRepository {
  async findById(id: string, organizationId?: string, includeDeleted = false): Promise<UnitEntity | null> {
    const conditions: SQL[] = [eq(units.id, id)];
    if (organizationId) {
      conditions.push(eq(units.organizationId, organizationId));
    }
    if (!includeDeleted) {
      conditions.push(eq(units.isDeleted, false));
    }

    const result = await db
      .select({
        id: units.id,
        organizationId: units.organizationId,
        buildingId: units.buildingId,
        floorId: units.floorId,
        unitNumber: units.unitNumber,
        unitType: units.unitType,
        area: units.area,
        bedrooms: units.bedrooms,
        bathrooms: units.bathrooms,
        monthlyRent: units.monthlyRent,
        depositAmount: units.depositAmount,
        status: units.status,
        description: units.description,
        meshId: units.meshId,
        isDeleted: units.isDeleted,
        deletedAt: units.deletedAt,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
        buildingName: buildings.name,
        buildingCode: buildings.code,
        floorNumber: floors.floorNumber,
        floorName: floors.floorName,
      })
      .from(units)
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .leftJoin(floors, eq(units.floorId, floors.id))
      .where(and(...conditions))
      .limit(1);

    return (result[0] as UnitEntity) || null;
  }

  async findByBuildingAndNumber(
    buildingId: string,
    unitNumber: string,
    organizationId?: string,
    excludeId?: string
  ): Promise<UnitEntity | null> {
    const conditions = [
      eq(units.buildingId, buildingId),
      sql`UPPER(${units.unitNumber}) = UPPER(${unitNumber})`,
      eq(units.isDeleted, false),
    ];
    if (organizationId) {
      conditions.push(eq(units.organizationId, organizationId));
    }
    if (excludeId) {
      conditions.push(sql`${units.id} != ${excludeId}`);
    }

    const result = await db
      .select()
      .from(units)
      .where(and(...conditions))
      .limit(1);

    return (result[0] as UnitEntity) || null;
  }

  async findMany(query: UnitListQuery, organizationId?: string): Promise<{ items: UnitEntity[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(units.isDeleted, false)];

    if (organizationId) {
      conditions.push(eq(units.organizationId, organizationId));
    }

    if (query.buildingId && query.buildingId !== 'ALL') {
      conditions.push(eq(units.buildingId, query.buildingId));
    }

    if (query.floorId && query.floorId !== 'ALL') {
      conditions.push(eq(units.floorId, query.floorId));
    }

    if (query.status && query.status !== 'ALL') {
      conditions.push(sql`UPPER(${units.status}) = UPPER(${query.status})`);
    }

    if (query.unitType && query.unitType !== 'ALL') {
      conditions.push(sql`UPPER(${units.unitType}) = UPPER(${query.unitType})`);
    }

    if (query.search && query.search.trim().length > 0) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(units.unitNumber, searchPattern),
          ilike(buildings.name, searchPattern),
          ilike(buildings.code, searchPattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Count total matching
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    let orderColumn = units.createdAt;
    if (query.sortBy === 'unitNumber') orderColumn = units.unitNumber as any;
    else if (query.sortBy === 'monthlyRent') orderColumn = units.monthlyRent as any;
    else if (query.sortBy === 'area') orderColumn = units.area as any;
    else if (query.sortBy === 'status') orderColumn = units.status as any;
    else if (query.sortBy === 'unitType') orderColumn = units.unitType as any;

    const orderDirection = query.sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const items = await db
      .select({
        id: units.id,
        organizationId: units.organizationId,
        buildingId: units.buildingId,
        floorId: units.floorId,
        unitNumber: units.unitNumber,
        unitType: units.unitType,
        area: units.area,
        bedrooms: units.bedrooms,
        bathrooms: units.bathrooms,
        monthlyRent: units.monthlyRent,
        depositAmount: units.depositAmount,
        status: units.status,
        description: units.description,
        meshId: units.meshId,
        isDeleted: units.isDeleted,
        deletedAt: units.deletedAt,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
        buildingName: buildings.name,
        buildingCode: buildings.code,
        floorNumber: floors.floorNumber,
        floorName: floors.floorName,
      })
      .from(units)
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .leftJoin(floors, eq(units.floorId, floors.id))
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    return { items: items as UnitEntity[], total };
  }

  async create(data: CreateUnitDTO, organizationId: string): Promise<UnitEntity> {
    const result = await db
      .insert(units)
      .values({
        organizationId,
        buildingId: data.buildingId,
        floorId: data.floorId,
        unitNumber: data.unitNumber,
        unitType: data.unitType,
        status: data.status,
        monthlyRent: data.monthlyRent,
        area: data.area || '0',
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 1,
        depositAmount: data.depositAmount || '0',
        description: data.description || null,
        isDeleted: false,
      })
      .returning();

    const created = result[0];
    return (await this.findById(created.id, organizationId)) || (created as unknown as UnitEntity);
  }

  async update(id: string, organizationId: string, data: UpdateUnitDTO): Promise<UnitEntity | null> {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.buildingId !== undefined) updatePayload.buildingId = data.buildingId;
    if (data.floorId !== undefined) updatePayload.floorId = data.floorId;
    if (data.unitNumber !== undefined) updatePayload.unitNumber = data.unitNumber;
    if (data.unitType !== undefined) updatePayload.unitType = data.unitType;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.monthlyRent !== undefined) updatePayload.monthlyRent = data.monthlyRent;
    if (data.area !== undefined) updatePayload.area = data.area;
    if (data.bedrooms !== undefined) updatePayload.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) updatePayload.bathrooms = data.bathrooms;
    if (data.depositAmount !== undefined) updatePayload.depositAmount = data.depositAmount;
    if (data.description !== undefined) updatePayload.description = data.description;

    await db
      .update(units)
      .set(updatePayload)
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)));

    return await this.findById(id, organizationId);
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .update(units)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))
      .returning();

    return result.length > 0;
  }

  async hasActiveDependencies(unitId: string): Promise<{
    hasTenants: boolean;
    hasContracts: boolean;
    hasPayments: boolean;
    hasMaintenance: boolean;
    hasDocuments: boolean;
    activeCount: number;
  }> {
    const [
      activeTenantCountRes,
      activeContractCountRes,
      paymentCountRes,
      maintenanceCountRes,
      documentCountRes,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tenantUnits)
        .where(and(eq(tenantUnits.unitId, unitId), eq(tenantUnits.isCurrent, true))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contracts)
        .where(
          and(
            eq(contracts.unitId, unitId),
            eq(contracts.isDeleted, false),
            or(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.contractStatus, 'PENDING_APPROVAL'))!
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(eq(payments.unitId, unitId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(maintenanceRequests)
        .where(
          and(
            eq(maintenanceRequests.unitId, unitId),
            or(
              eq(maintenanceRequests.status, 'OPEN'),
              eq(maintenanceRequests.status, 'IN_PROGRESS'),
              eq(maintenanceRequests.status, 'PENDING')
            )!
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(and(eq(documents.entityType, 'unit'), eq(documents.entityId, unitId))),
    ]);

    const tenantCount = activeTenantCountRes[0]?.count || 0;
    const contractCount = activeContractCountRes[0]?.count || 0;
    const paymentCount = paymentCountRes[0]?.count || 0;
    const maintenanceCount = maintenanceCountRes[0]?.count || 0;
    const docCount = documentCountRes[0]?.count || 0;

    return {
      hasTenants: tenantCount > 0,
      hasContracts: contractCount > 0,
      hasPayments: paymentCount > 0,
      hasMaintenance: maintenanceCount > 0,
      hasDocuments: docCount > 0,
      activeCount: tenantCount + contractCount + paymentCount + maintenanceCount + docCount,
    };
  }

  async getDetailEntities(unitId: string) {
    const [
      contractsList,
      paymentsList,
      maintenanceList,
      documentsList,
      activityList,
    ] = await Promise.all([
      db.select().from(contracts).where(and(eq(contracts.unitId, unitId), eq(contracts.isDeleted, false))),
      db.select().from(payments).where(eq(payments.unitId, unitId)),
      db.select().from(maintenanceRequests).where(eq(maintenanceRequests.unitId, unitId)),
      db.select().from(documents).where(and(eq(documents.entityType, 'unit'), eq(documents.entityId, unitId))),
      db
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.entityType, 'unit'), eq(auditLogs.entityId, unitId)))
        .orderBy(desc(auditLogs.createdAt))
        .limit(20),
    ]);

    // Check current tenant
    let currentTenant = null;
    const activeTenantUnit = await db
      .select({ tenantId: tenantUnits.tenantId })
      .from(tenantUnits)
      .where(and(eq(tenantUnits.unitId, unitId), eq(tenantUnits.isCurrent, true)))
      .limit(1);

    if (activeTenantUnit[0]) {
      const tenantRes = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, activeTenantUnit[0].tenantId))
        .limit(1);
      currentTenant = tenantRes[0] || null;
    }

    // Active contract
    const activeContract =
      contractsList.find((c) => c.contractStatus === 'ACTIVE') ||
      contractsList[0] ||
      null;

    // Receipts for payments
    const paymentIds = paymentsList.map((p) => p.id);
    let receiptsList: any[] = [];
    if (paymentIds.length > 0) {
      receiptsList = await db
        .select()
        .from(receipts)
        .where(inArray(receipts.paymentId, paymentIds));
    }

    return {
      tenant: currentTenant,
      contract: activeContract,
      contracts: contractsList,
      payments: paymentsList,
      receipts: receiptsList,
      maintenance: maintenanceList,
      documents: documentsList,
      activity: activityList,
    };
  }
}

export const unitsRepository = new UnitsRepository();
