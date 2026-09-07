import { and, desc, eq, ilike, or, sql, inArray, count } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  tenants,
  contracts,
  units,
  floors,
  buildings,
  documents,
  payments,
  maintenanceRequests,
  auditLogs,
} from '../../db/schema.ts';
import {
  TenantEntity,
  TenantListQuery,
  CreateTenantDTO,
  UpdateTenantDTO,
} from './tenants.types.ts';

export class TenantsRepository {
  async findMany(query: TenantListQuery, organizationId: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(tenants.organizationId, organizationId),
      eq(tenants.isDeleted, false),
    ];

    // Search across first name, last name, full name, phone, email, id number
    if (query.search && query.search.trim().length > 0) {
      const s = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(tenants.fullName, s),
          ilike(tenants.firstName, s),
          ilike(tenants.lastName, s),
          ilike(tenants.phone, s),
          ilike(tenants.email, s),
          ilike(tenants.idNumber, s)
        )!
      );
    }

    // Filter by unit / floor / building / lease status via contracts
    if (query.unitId || query.floorId || query.buildingId || query.leaseStatus) {
      const contractConditions = [
        eq(contracts.organizationId, organizationId),
        eq(contracts.isDeleted, false),
      ];

      if (query.unitId) {
        contractConditions.push(eq(contracts.unitId, query.unitId));
      }
      if (query.leaseStatus) {
        contractConditions.push(eq(contracts.contractStatus, query.leaseStatus.toUpperCase()));
      }

      if (query.buildingId || query.floorId) {
        const unitConditions = [
          eq(units.organizationId, organizationId),
          eq(units.isDeleted, false),
        ];
        if (query.buildingId) unitConditions.push(eq(units.buildingId, query.buildingId));
        if (query.floorId) unitConditions.push(eq(units.floorId, query.floorId));

        const matchedUnits = await db
          .select({ id: units.id })
          .from(units)
          .where(and(...unitConditions));

        const unitIds = matchedUnits.map((u) => u.id);
        if (unitIds.length === 0) {
          return { items: [], total: 0 };
        }
        contractConditions.push(inArray(contracts.unitId, unitIds));
      }

      const matchingContracts = await db
        .select({ tenantId: contracts.tenantId })
        .from(contracts)
        .where(and(...contractConditions));

      const matchingTenantIds = Array.from(new Set(matchingContracts.map((c) => c.tenantId)));
      if (matchingTenantIds.length === 0) {
        return { items: [], total: 0 };
      }
      conditions.push(inArray(tenants.id, matchingTenantIds));
    }

    // Total count
    const countRes = await db
      .select({ val: count() })
      .from(tenants)
      .where(and(...conditions));
    const total = Number(countRes[0]?.val || 0);

    // Fetch tenants
    const rows = await db
      .select()
      .from(tenants)
      .where(and(...conditions))
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset(offset);

    // Attach active lease and unit info for each tenant efficiently
    const tenantIds = rows.map((r) => r.id);
    let activeLeasesMap = new Map<string, any>();

    if (tenantIds.length > 0) {
      const activeLeases = await db
        .select({
          leaseId: contracts.id,
          contractNumber: contracts.contractNumber,
          status: contracts.contractStatus,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          monthlyRent: contracts.monthlyRent,
          deposit: contracts.deposit,
          tenantId: contracts.tenantId,
          unitId: contracts.unitId,
          unitNumber: units.unitNumber,
          floorId: units.floorId,
          buildingId: units.buildingId,
          floorName: floors.floorName,
          buildingName: buildings.name,
        })
        .from(contracts)
        .leftJoin(units, eq(contracts.unitId, units.id))
        .leftJoin(floors, eq(units.floorId, floors.id))
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .where(
          and(
            inArray(contracts.tenantId, tenantIds),
            eq(contracts.organizationId, organizationId),
            eq(contracts.isDeleted, false),
            or(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.contractStatus, 'EXPIRING'))
          )
        );

      for (const al of activeLeases) {
        if (!activeLeasesMap.has(al.tenantId)) {
          activeLeasesMap.set(al.tenantId, al);
        }
      }
    }

    const items = rows.map((tenant) => {
      const activeLease = activeLeasesMap.get(tenant.id) || null;
      return {
        ...tenant,
        activeLease,
        unit: activeLease
          ? {
              id: activeLease.unitId,
              unitNumber: activeLease.unitNumber,
              unitType: 'OFFICE',
            }
          : null,
        building: activeLease
          ? {
              id: activeLease.buildingId,
              name: activeLease.buildingName,
              code: '',
            }
          : null,
        contract: activeLease
          ? {
              id: activeLease.leaseId,
              contractNumber: activeLease.contractNumber,
              status: activeLease.status,
              endDate: activeLease.endDate,
              monthlyRent: activeLease.monthlyRent,
            }
          : null,
        leaseStatus: activeLease ? activeLease.status : 'NO_LEASE',
      };
    });

    return { items, total };
  }

  async findById(id: string, organizationId: string): Promise<TenantEntity | null> {
    const rows = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.id, id),
          eq(tenants.organizationId, organizationId),
          eq(tenants.isDeleted, false)
        )
      )
      .limit(1);

    return rows[0] || null;
  }

  async findByUserIdOrEmail(userId: string, email: string, organizationId: string): Promise<TenantEntity | null> {
    const conditions = [
      eq(tenants.organizationId, organizationId),
      eq(tenants.isDeleted, false),
      or(
        eq(tenants.userId, userId),
        ilike(tenants.email, email.trim())
      ),
    ];

    const rows = await db
      .select()
      .from(tenants)
      .where(and(...conditions))
      .limit(1);

    return rows[0] || null;
  }

  async getDetailEntities(tenantId: string, organizationId: string) {
    // 1. All contracts/leases for this tenant
    const leaseHistory = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        status: contracts.contractStatus,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        monthlyRent: contracts.monthlyRent,
        deposit: contracts.deposit,
        paymentFrequency: contracts.paymentFrequency,
        renewalOf: contracts.renewalOf,
        notes: contracts.notes,
        createdAt: contracts.createdAt,
        unitId: contracts.unitId,
        unitNumber: units.unitNumber,
        unitType: units.unitType,
        buildingId: units.buildingId,
        buildingName: buildings.name,
        floorId: units.floorId,
        floorName: floors.floorName,
      })
      .from(contracts)
      .leftJoin(units, eq(contracts.unitId, units.id))
      .leftJoin(floors, eq(units.floorId, floors.id))
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .where(
        and(
          eq(contracts.tenantId, tenantId),
          eq(contracts.organizationId, organizationId),
          eq(contracts.isDeleted, false)
        )
      )
      .orderBy(desc(contracts.createdAt));

    // Active lease is first with status ACTIVE or EXPIRING
    const activeLease =
      leaseHistory.find((l) => l.status === 'ACTIVE' || l.status === 'EXPIRING') || null;

    let activeUnit: any = null;
    let activeFloor: any = null;
    let activeBuilding: any = null;

    if (activeLease && activeLease.unitId) {
      const unitRows = await db
        .select()
        .from(units)
        .where(and(eq(units.id, activeLease.unitId), eq(units.organizationId, organizationId)));
      activeUnit = unitRows[0] || null;

      if (activeUnit) {
        const floorRows = await db
          .select()
          .from(floors)
          .where(and(eq(floors.id, activeUnit.floorId), eq(floors.organizationId, organizationId)));
        activeFloor = floorRows[0] || null;

        const bldgRows = await db
          .select()
          .from(buildings)
          .where(and(eq(buildings.id, activeUnit.buildingId), eq(buildings.organizationId, organizationId)));
        activeBuilding = bldgRows[0] || null;
      }
    }

    // Tenant documents
    const docList = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, 'tenant'), eq(documents.entityId, tenantId)));

    // Tenant payments
    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.tenantId, tenantId))
      .orderBy(desc(payments.createdAt))
      .limit(10);

    // Tenant maintenance requests
    const maintenanceList = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.tenantId, tenantId))
      .orderBy(desc(maintenanceRequests.createdAt));

    // Tenant audit activity
    const activityList = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, 'tenant'), eq(auditLogs.entityId, tenantId)))
      .orderBy(desc(auditLogs.createdAt));

    return {
      activeLease,
      unit: activeUnit,
      floor: activeFloor,
      building: activeBuilding,
      leaseHistory,
      documents: docList,
      payments: paymentList,
      maintenance: maintenanceList,
      activity: activityList,
    };
  }

  async create(data: CreateTenantDTO, organizationId: string): Promise<TenantEntity> {
    const fullName = data.fullName || `${data.firstName} ${data.lastName}`.trim();
    const rows = await db
      .insert(tenants)
      .values({
        organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        phone: data.phone,
        email: data.email || null,
        idType: data.idType || 'National ID',
        idNumber: data.idNumber || null,
        address: data.address || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContact: data.emergencyContact || null,
        notes: data.notes || null,
        profilePhoto: data.profilePhoto || null,
        userId: data.userId || null,
        isDeleted: false,
      })
      .returning();

    return rows[0];
  }

  async update(
    id: string,
    data: UpdateTenantDTO,
    organizationId: string
  ): Promise<TenantEntity | null> {
    const current = await this.findById(id, organizationId);
    if (!current) return null;

    const firstName = data.firstName !== undefined ? data.firstName : current.firstName;
    const lastName = data.lastName !== undefined ? data.lastName : current.lastName;
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || current.fullName;

    const rows = await db
      .update(tenants)
      .set({
        firstName,
        lastName,
        fullName,
        phone: data.phone !== undefined ? data.phone : current.phone,
        email: data.email !== undefined ? data.email : current.email,
        idType: data.idType !== undefined ? data.idType : current.idType,
        idNumber: data.idNumber !== undefined ? data.idNumber : current.idNumber,
        address: data.address !== undefined ? data.address : current.address,
        emergencyContactName:
          data.emergencyContactName !== undefined
            ? data.emergencyContactName
            : current.emergencyContactName,
        emergencyContactPhone:
          data.emergencyContactPhone !== undefined
            ? data.emergencyContactPhone
            : current.emergencyContactPhone,
        emergencyContact:
          data.emergencyContact !== undefined ? data.emergencyContact : current.emergencyContact,
        notes: data.notes !== undefined ? data.notes : current.notes,
        profilePhoto:
          data.profilePhoto !== undefined ? data.profilePhoto : current.profilePhoto,
        userId: data.userId !== undefined ? data.userId : current.userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenants.id, id),
          eq(tenants.organizationId, organizationId),
          eq(tenants.isDeleted, false)
        )
      )
      .returning();

    return rows[0] || null;
  }

  async hasHistoryOrActiveLease(
    tenantId: string,
    organizationId: string
  ): Promise<{ hasActive: boolean; hasHistory: boolean; count: number }> {
    const contractsList = await db
      .select({
        id: contracts.id,
        status: contracts.contractStatus,
      })
      .from(contracts)
      .where(
        and(
          eq(contracts.tenantId, tenantId),
          eq(contracts.organizationId, organizationId),
          eq(contracts.isDeleted, false)
        )
      );

    const hasActive = contractsList.some(
      (c) => c.status === 'ACTIVE' || c.status === 'EXPIRING'
    );
    const hasHistory = contractsList.length > 0;

    return {
      hasActive,
      hasHistory,
      count: contractsList.length,
    };
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const rows = await db
      .update(tenants)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenants.id, id),
          eq(tenants.organizationId, organizationId),
          eq(tenants.isDeleted, false)
        )
      )
      .returning();

    return rows.length > 0;
  }
}

export const tenantsRepository = new TenantsRepository();
