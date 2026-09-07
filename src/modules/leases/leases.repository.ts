import { and, desc, eq, ilike, or, sql, inArray, count } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  contracts,
  tenants,
  units,
  floors,
  buildings,
  tenantUnits,
  documents,
  payments,
} from '../../db/schema.ts';
import {
  LeaseEntity,
  LeaseListQuery,
  CreateLeaseDTO,
  UpdateLeaseDTO,
  RenewLeaseDTO,
  LeaseJoinedItem,
} from './leases.types.ts';

export class LeasesRepository {
  async findMany(query: LeaseListQuery, organizationId: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(contracts.organizationId, organizationId),
      eq(contracts.isDeleted, false),
    ];

    if (query.status && query.status.trim().length > 0) {
      const upperStatus = query.status.trim().toUpperCase();
      conditions.push(eq(contracts.contractStatus, upperStatus));
    }

    if (query.unitId) {
      conditions.push(eq(contracts.unitId, query.unitId));
    }

    if (query.tenantId) {
      conditions.push(eq(contracts.tenantId, query.tenantId));
    }

    // Filter by building or floor
    if (query.buildingId || query.floorId) {
      const unitConds = [
        eq(units.organizationId, organizationId),
        eq(units.isDeleted, false),
      ];
      if (query.buildingId) unitConds.push(eq(units.buildingId, query.buildingId));
      if (query.floorId) unitConds.push(eq(units.floorId, query.floorId));

      const matchedUnits = await db
        .select({ id: units.id })
        .from(units)
        .where(and(...unitConds));
      const uIds = matchedUnits.map((u) => u.id);
      if (uIds.length === 0) {
        return { items: [], total: 0 };
      }
      conditions.push(inArray(contracts.unitId, uIds));
    }

    // Search across tenant name, phone, unit number, building name, contract number
    if (query.search && query.search.trim().length > 0) {
      const s = `%${query.search.trim()}%`;
      // Find matching tenant IDs or unit IDs
      const matchingTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(
          and(
            eq(tenants.organizationId, organizationId),
            or(ilike(tenants.fullName, s), ilike(tenants.phone, s), ilike(tenants.email, s))!
          )
        );
      const tIds = matchingTenants.map((t) => t.id);

      const matchingUnits = await db
        .select({ id: units.id })
        .from(units)
        .leftJoin(buildings, eq(units.buildingId, buildings.id))
        .where(
          and(
            eq(units.organizationId, organizationId),
            or(ilike(units.unitNumber, s), ilike(buildings.name, s))!
          )
        );
      const uIds = matchingUnits.map((u) => u.id);

      const searchOrs = [ilike(contracts.contractNumber, s)];
      if (tIds.length > 0) searchOrs.push(inArray(contracts.tenantId, tIds));
      if (uIds.length > 0) searchOrs.push(inArray(contracts.unitId, uIds));

      conditions.push(or(...searchOrs)!);
    }

    // Total count
    const countRes = await db
      .select({ val: count() })
      .from(contracts)
      .where(and(...conditions));
    const total = Number(countRes[0]?.val || 0);

    // Fetch joined leases
    const rows = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        organizationId: contracts.organizationId,
        tenantId: contracts.tenantId,
        unitId: contracts.unitId,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        monthlyRent: contracts.monthlyRent,
        deposit: contracts.deposit,
        paymentFrequency: contracts.paymentFrequency,
        status: contracts.contractStatus,
        renewalOf: contracts.renewalOf,
        notes: contracts.notes,
        documentUrl: contracts.documentUrl,
        createdAt: contracts.createdAt,
        // Tenant
        tenantFullName: tenants.fullName,
        tenantPhone: tenants.phone,
        tenantEmail: tenants.email,
        tenantIdNumber: tenants.idNumber,
        // Unit
        unitNumber: units.unitNumber,
        unitType: units.unitType,
        unitStatus: units.status,
        unitMonthlyRent: units.monthlyRent,
        // Floor
        floorId: floors.id,
        floorNumber: floors.floorNumber,
        floorName: floors.floorName,
        // Building
        buildingId: buildings.id,
        buildingName: buildings.name,
        buildingCode: buildings.code,
        buildingAddress: buildings.address,
      })
      .from(contracts)
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .leftJoin(units, eq(contracts.unitId, units.id))
      .leftJoin(floors, eq(units.floorId, floors.id))
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .where(and(...conditions))
      .orderBy(desc(contracts.createdAt))
      .limit(limit)
      .offset(offset);

    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    const items: LeaseJoinedItem[] = rows.map((r) => {
      let calculatedStatus = r.status;
      const end = new Date(r.endDate);
      const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (r.status !== 'TERMINATED' && r.status !== 'CANCELLED' && r.status !== 'DRAFT') {
        if (end < now) {
          calculatedStatus = 'EXPIRED';
        } else if (end <= thirtyDaysAhead) {
          calculatedStatus = 'EXPIRING';
        } else {
          calculatedStatus = 'ACTIVE';
        }
      }

      return {
        id: r.id,
        contractNumber: r.contractNumber,
        organizationId: r.organizationId,
        tenantId: r.tenantId,
        unitId: r.unitId,
        startDate: r.startDate,
        endDate: r.endDate,
        monthlyRent: r.monthlyRent,
        deposit: r.deposit,
        paymentFrequency: r.paymentFrequency,
        status: r.status,
        contractStatus: r.status,
        calculatedStatus,
        daysRemaining,
        renewalOf: r.renewalOf,
        notes: r.notes,
        documentUrl: r.documentUrl,
        createdAt: r.createdAt,
        tenant: r.tenantId
          ? {
              id: r.tenantId,
              fullName: r.tenantFullName || 'Unknown Tenant',
              phone: r.tenantPhone || '',
              email: r.tenantEmail,
              idNumber: r.tenantIdNumber,
            }
          : null,
        unit: r.unitId
          ? {
              id: r.unitId,
              unitNumber: r.unitNumber || '',
              unitType: r.unitType || 'OFFICE',
              status: r.unitStatus || 'VACANT',
              monthlyRent: r.unitMonthlyRent || '0',
            }
          : null,
        floor: r.floorId
          ? {
              id: r.floorId,
              floorNumber: r.floorNumber || 0,
              floorName: r.floorName || '',
            }
          : null,
        building: r.buildingId
          ? {
              id: r.buildingId,
              name: r.buildingName || '',
              code: r.buildingCode || '',
              address: r.buildingAddress || '',
            }
          : null,
      };
    });

    return { items, total };
  }

  async findById(id: string, organizationId: string): Promise<LeaseEntity | null> {
    const rows = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.id, id),
          eq(contracts.organizationId, organizationId),
          eq(contracts.isDeleted, false)
        )
      )
      .limit(1);

    return rows[0] || null;
  }

  async getDetailEntities(id: string, organizationId: string) {
    const lease = await this.findById(id, organizationId);
    if (!lease) return null;

    const [tenantRows, unitRows] = await Promise.all([
      db
        .select()
        .from(tenants)
        .where(and(eq(tenants.id, lease.tenantId), eq(tenants.organizationId, organizationId))),
      db
        .select()
        .from(units)
        .where(and(eq(units.id, lease.unitId), eq(units.organizationId, organizationId))),
    ]);

    const tenant = tenantRows[0] || null;
    const unit = unitRows[0] || null;

    let floor: any = null;
    let building: any = null;

    if (unit) {
      const [floorRows, buildingRows] = await Promise.all([
        db
          .select()
          .from(floors)
          .where(and(eq(floors.id, unit.floorId), eq(floors.organizationId, organizationId))),
        db
          .select()
          .from(buildings)
          .where(and(eq(buildings.id, unit.buildingId), eq(buildings.organizationId, organizationId))),
      ]);
      floor = floorRows[0] || null;
      building = buildingRows[0] || null;
    }

    // Previous lease if this is a renewal
    let previousLease: LeaseEntity | null = null;
    if (lease.renewalOf) {
      previousLease = await this.findById(lease.renewalOf, organizationId);
    }

    // Renewed leases originating from this one
    const renewedLeases = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.renewalOf, id),
          eq(contracts.organizationId, organizationId),
          eq(contracts.isDeleted, false)
        )
      );

    // Documents & payments
    const docList = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, 'contract'), eq(documents.entityId, id)));

    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.contractId, id))
      .orderBy(desc(payments.createdAt));

    return {
      lease,
      tenant,
      unit,
      floor,
      building,
      previousLease,
      renewedLeases,
      documents: docList,
      payments: paymentList,
    };
  }

  async checkActiveOverlap(
    unitId: string,
    startDate: string,
    endDate: string,
    excludeLeaseId: string | null,
    organizationId: string,
    txClient: any = db
  ): Promise<LeaseEntity[]> {
    // Overlap condition:
    // startDate <= existing.endDate AND endDate >= existing.startDate
    const conds = [
      eq(contracts.unitId, unitId),
      eq(contracts.organizationId, organizationId),
      eq(contracts.isDeleted, false),
      or(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.contractStatus, 'EXPIRING'))!,
      sql`${contracts.startDate} <= ${endDate}`,
      sql`${contracts.endDate} >= ${startDate}`,
    ];

    if (excludeLeaseId) {
      conds.push(sql`${contracts.id} != ${excludeLeaseId}`);
    }

    const overlapping = await txClient
      .select()
      .from(contracts)
      .where(and(...conds));

    return overlapping;
  }

  async createWithUnitSync(
    data: CreateLeaseDTO,
    organizationId: string
  ): Promise<{ lease: LeaseEntity; unitStatusChanged: boolean; oldUnitStatus?: string; newUnitStatus?: string }> {
    return await db.transaction(async (tx) => {
      // 1. Lock the unit row for update to ensure race-condition resistant overlap check
      const lockedUnitRes = await tx.execute(
        sql`SELECT id, status, organization_id, unit_number FROM units WHERE id = ${data.unitId} FOR UPDATE`
      );

      if (lockedUnitRes.rows.length === 0) {
        throw new Error('UNIT_NOT_FOUND');
      }
      const unitRow = lockedUnitRes.rows[0] as any;
      if (unitRow.organization_id !== organizationId) {
        throw new Error('UNIT_ORG_MISMATCH');
      }

      // 2. Check overlap inside transaction
      if (data.status === 'ACTIVE' || data.status === 'EXPIRING') {
        const overlaps = await this.checkActiveOverlap(
          data.unitId,
          data.startDate,
          data.endDate,
          null,
          organizationId,
          tx
        );
        if (overlaps.length > 0) {
          throw new Error('UNIT_ALREADY_LEASED');
        }
      }

      // 3. Generate unique contract/lease number
      const year = new Date().getFullYear();
      const countRes = await tx.execute(
        sql`SELECT count(*)::int as c FROM contracts WHERE organization_id = ${organizationId}`
      );
      const nextNum = (countRes.rows[0] as any).c + 1;
      const contractNumber = `LSE-${year}-${String(nextNum).padStart(4, '0')}`;

      // 4. Insert lease
      const inserted = await tx
        .insert(contracts)
        .values({
          organizationId,
          contractNumber,
          tenantId: data.tenantId,
          unitId: data.unitId,
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyRent: data.rentAmount,
          deposit: data.depositAmount || '0',
          paymentFrequency: data.paymentFrequency || 'Monthly',
          contractStatus: data.status || 'ACTIVE',
          notes: data.notes || null,
          documentUrl: data.documentUrl || null,
          isDeleted: false,
        })
        .returning();

      const createdLease = inserted[0];

      // 5. Synchronize Unit status and occupancy
      let unitStatusChanged = false;
      const oldUnitStatus = unitRow.status;
      let newUnitStatus = oldUnitStatus;

      if (createdLease.contractStatus === 'ACTIVE' || createdLease.contractStatus === 'EXPIRING') {
        // If unit is VACANT, set to OCCUPIED
        // If unit is MAINTENANCE or RESERVED, do not overwrite unless explicitly requested
        if (oldUnitStatus === 'VACANT') {
          newUnitStatus = 'OCCUPIED';
          await tx
            .update(units)
            .set({ status: 'OCCUPIED', updatedAt: new Date() })
            .where(eq(units.id, data.unitId));
          unitStatusChanged = true;
        }

        // Maintain tenant_units mapping
        await tx
          .insert(tenantUnits)
          .values({
            tenantId: data.tenantId,
            unitId: data.unitId,
            isCurrent: true,
            assignedAt: new Date(),
          });
      }

      return {
        lease: createdLease,
        unitStatusChanged,
        oldUnitStatus,
        newUnitStatus,
      };
    });
  }

  async updateWithUnitSync(
    id: string,
    data: UpdateLeaseDTO,
    organizationId: string
  ): Promise<{ lease: LeaseEntity; unitStatusChanged: boolean; oldUnitStatus?: string; newUnitStatus?: string }> {
    return await db.transaction(async (tx) => {
      const currentRows = await tx
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, id),
            eq(contracts.organizationId, organizationId),
            eq(contracts.isDeleted, false)
          )
        )
        .limit(1);

      if (currentRows.length === 0) {
        throw new Error('LEASE_NOT_FOUND');
      }
      const current = currentRows[0];

      const unitId = current.unitId;
      const startDate = data.startDate || current.startDate;
      const endDate = data.endDate || current.endDate;
      const newStatus = data.status || current.contractStatus;

      // If status is or becomes active, check overlap
      if (newStatus === 'ACTIVE' || newStatus === 'EXPIRING') {
        const overlaps = await this.checkActiveOverlap(
          unitId,
          startDate,
          endDate,
          id,
          organizationId,
          tx
        );
        if (overlaps.length > 0) {
          throw new Error('UNIT_ALREADY_LEASED');
        }
      }

      const updateValues: any = {
        updatedAt: new Date(),
      };
      if (data.startDate) updateValues.startDate = data.startDate;
      if (data.endDate) updateValues.endDate = data.endDate;
      if (data.rentAmount !== undefined) updateValues.monthlyRent = data.rentAmount;
      if (data.depositAmount !== undefined) updateValues.deposit = data.depositAmount;
      if (data.paymentFrequency !== undefined) updateValues.paymentFrequency = data.paymentFrequency;
      if (data.notes !== undefined) updateValues.notes = data.notes;
      if (data.documentUrl !== undefined) updateValues.documentUrl = data.documentUrl;
      if (data.status !== undefined) updateValues.contractStatus = data.status;

      const updatedRows = await tx
        .update(contracts)
        .set(updateValues)
        .where(eq(contracts.id, id))
        .returning();

      const updatedLease = updatedRows[0];

      let unitStatusChanged = false;
      let oldUnitStatus: string | undefined;
      let newUnitStatus: string | undefined;

      // If status changed from ACTIVE to TERMINATED / CANCELLED / EXPIRED
      if (
        (current.contractStatus === 'ACTIVE' || current.contractStatus === 'EXPIRING') &&
        (newStatus === 'TERMINATED' || newStatus === 'CANCELLED' || newStatus === 'EXPIRED')
      ) {
        // Check if any other active lease exists on this unit
        const otherActive = await tx
          .select()
          .from(contracts)
          .where(
            and(
              eq(contracts.unitId, unitId),
              eq(contracts.organizationId, organizationId),
              eq(contracts.isDeleted, false),
              sql`${contracts.id} != ${id}`,
              or(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.contractStatus, 'EXPIRING'))
            )
          );

        if (otherActive.length === 0) {
          const unitRes = await tx
            .select({ status: units.status })
            .from(units)
            .where(eq(units.id, unitId));
          oldUnitStatus = unitRes[0]?.status;

          if (oldUnitStatus === 'OCCUPIED') {
            newUnitStatus = 'VACANT';
            await tx
              .update(units)
              .set({ status: 'VACANT', updatedAt: new Date() })
              .where(eq(units.id, unitId));
            unitStatusChanged = true;
          }
        }
      }

      return {
        lease: updatedLease,
        unitStatusChanged,
        oldUnitStatus,
        newUnitStatus,
      };
    });
  }

  async terminateWithUnitSync(
    id: string,
    notes?: string,
    organizationId?: string
  ): Promise<{ lease: LeaseEntity; unit: any; unitStatusChanged: boolean }> {
    return await db.transaction(async (tx) => {
      const conds = [eq(contracts.id, id), eq(contracts.isDeleted, false)];
      if (organizationId) conds.push(eq(contracts.organizationId, organizationId));

      const rows = await tx.select().from(contracts).where(and(...conds)).limit(1);
      if (rows.length === 0) {
        throw new Error('LEASE_NOT_FOUND');
      }
      const lease = rows[0];

      if (lease.contractStatus !== 'ACTIVE' && lease.contractStatus !== 'EXPIRING') {
        throw new Error('LEASE_NOT_ACTIVE');
      }

      // 1. Lock unit
      const unitRes = await tx.execute(
        sql`SELECT id, status, organization_id, unit_number FROM units WHERE id = ${lease.unitId} FOR UPDATE`
      );
      const unitRow = unitRes.rows[0] as any;

      // 2. Terminate lease
      const updatedLeaseRes = await tx
        .update(contracts)
        .set({
          contractStatus: 'TERMINATED',
          notes: notes ? `${lease.notes ? lease.notes + '\n' : ''}Termination: ${notes}` : lease.notes,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id))
        .returning();

      const terminatedLease = updatedLeaseRes[0];

      // 3. Mark tenant_units as not current
      await tx
        .update(tenantUnits)
        .set({ isCurrent: false })
        .where(
          and(
            eq(tenantUnits.tenantId, lease.tenantId),
            eq(tenantUnits.unitId, lease.unitId)
          )
        );

      // 4. Check if any OTHER active lease remains on this unit
      const otherActive = await tx
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.unitId, lease.unitId),
            sql`${contracts.id} != ${id}`,
            eq(contracts.isDeleted, false),
            or(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.contractStatus, 'EXPIRING'))
          )
        );

      let unitStatusChanged = false;
      let updatedUnit = unitRow;

      if (otherActive.length === 0) {
        // If occupied, switch to VACANT. If maintenance/reserved, preserve it!
        if (unitRow.status === 'OCCUPIED') {
          const uRes = await tx
            .update(units)
            .set({ status: 'VACANT', updatedAt: new Date() })
            .where(eq(units.id, lease.unitId))
            .returning();
          updatedUnit = uRes[0];
          unitStatusChanged = true;
        }
      }

      return {
        lease: terminatedLease,
        unit: updatedUnit,
        unitStatusChanged,
      };
    });
  }

  async renewWithUnitSync(
    oldLeaseId: string,
    data: RenewLeaseDTO,
    organizationId: string
  ): Promise<{ oldLease: LeaseEntity; newLease: LeaseEntity; unit: any }> {
    return await db.transaction(async (tx) => {
      const oldLeaseRes = await tx
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, oldLeaseId),
            eq(contracts.organizationId, organizationId),
            eq(contracts.isDeleted, false)
          )
        )
        .limit(1);

      if (oldLeaseRes.length === 0) {
        throw new Error('LEASE_NOT_FOUND');
      }
      const oldLease = oldLeaseRes[0];

      // 1. Lock unit
      const unitRes = await tx.execute(
        sql`SELECT id, status, organization_id, unit_number FROM units WHERE id = ${oldLease.unitId} FOR UPDATE`
      );
      const unitRow = unitRes.rows[0] as any;

      // 2. Check overlap for new lease date range, excluding old lease if new lease is immediately after
      const overlaps = await tx
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.unitId, oldLease.unitId),
            eq(contracts.organizationId, organizationId),
            eq(contracts.isDeleted, false),
            sql`${contracts.id} != ${oldLeaseId}`,
            or(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.contractStatus, 'EXPIRING')),
            sql`${contracts.startDate} <= ${data.endDate}`,
            sql`${contracts.endDate} >= ${data.startDate}`
          )
        );

      if (overlaps.length > 0) {
        throw new Error('UNIT_ALREADY_LEASED');
      }

      // 3. Mark old lease as EXPIRED or keep historical
      const updatedOldRes = await tx
        .update(contracts)
        .set({
          contractStatus: 'EXPIRED',
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, oldLeaseId))
        .returning();

      // 4. Generate next contract number
      const year = new Date().getFullYear();
      const countRes = await tx.execute(
        sql`SELECT count(*)::int as c FROM contracts WHERE organization_id = ${organizationId}`
      );
      const nextNum = (countRes.rows[0] as any).c + 1;
      const contractNumber = `LSE-${year}-${String(nextNum).padStart(4, '0')}`;

      // 5. Create new renewal lease
      const newRent = data.rentAmount || oldLease.monthlyRent;
      const newDeposit = data.depositAmount || oldLease.deposit;
      const newFreq = data.paymentFrequency || oldLease.paymentFrequency;

      const insertedNew = await tx
        .insert(contracts)
        .values({
          organizationId,
          contractNumber,
          tenantId: oldLease.tenantId,
          unitId: oldLease.unitId,
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyRent: newRent,
          deposit: newDeposit,
          paymentFrequency: newFreq,
          contractStatus: 'ACTIVE',
          renewalOf: oldLeaseId,
          notes: data.notes || `Renewal of contract ${oldLease.contractNumber}`,
          isDeleted: false,
        })
        .returning();

      // Ensure unit is OCCUPIED
      if (unitRow.status === 'VACANT') {
        await tx
          .update(units)
          .set({ status: 'OCCUPIED', updatedAt: new Date() })
          .where(eq(units.id, oldLease.unitId));
      }

      return {
        oldLease: updatedOldRes[0],
        newLease: insertedNew[0],
        unit: unitRow,
      };
    });
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const rows = await db
      .update(contracts)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contracts.id, id),
          eq(contracts.organizationId, organizationId),
          eq(contracts.isDeleted, false)
        )
      )
      .returning();

    return rows.length > 0;
  }
}

export const leasesRepository = new LeasesRepository();
