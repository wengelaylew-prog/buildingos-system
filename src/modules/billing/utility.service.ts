import { db } from '../../db/index.ts';
import {
  utilityReadings,
  utilityBills,
  invoices,
  contracts,
  tenants,
  units,
  buildings,
} from '../../db/schema.ts';
import { eq, and, desc, sql, lt, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { MessagingService } from '../messaging/messaging.service.ts';

// ────────────────────────────────────────────────────────────
// INPUT TYPES
// ────────────────────────────────────────────────────────────

export interface CreateReadingInput {
  organizationId: string;
  unitId: string;
  buildingId: string;
  utilityType: 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET' | 'PARKING' | 'OTHER';
  billingPeriod: string;          // YYYY-MM
  previousReading: number;
  currentReading: number;
  unitPrice: number;              // price per unit of consumption (ETB)
  unit?: string;                  // kWh, m3, Mbps, etc. defaults by type
  readingDate: string;            // ISO date
  enteredBy?: string;             // userId
  notes?: string;
  dueDaysFromNow?: number;        // default 10 days
}

export interface BulkReadingInput {
  organizationId: string;
  buildingId: string;
  utilityType: 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET' | 'PARKING' | 'OTHER';
  billingPeriod: string;
  unitPrice: number;
  unit?: string;
  readingDate: string;
  enteredBy?: string;
  readings: Array<{
    unitId: string;
    previousReading: number;
    currentReading: number;
    notes?: string;
  }>;
  dueDaysFromNow?: number;
}

export interface SplitUtilityInput {
  organizationId: string;
  buildingId: string;
  utilityType: 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET' | 'PARKING' | 'OTHER';
  billingPeriod: string;
  totalAmount: number;            // total building-level bill amount
  splitMethod: 'EQUAL' | 'BY_AREA'; // equal split or proportional to unit area
  enteredBy?: string;
  dueDaysFromNow?: number;
  notes?: string;
}

export interface RecordPaymentInput {
  billId: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Telebirr' | 'CBE Birr' | 'Cash' | 'Check';
  paymentReference?: string;
  paidBy?: string;
  notes?: string;
}

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

const DEFAULT_UNITS: Record<string, string> = {
  ELECTRICITY: 'kWh',
  WATER: 'm³',
  GAS: 'm³',
  INTERNET: 'Mbps',
  PARKING: 'slots',
  OTHER: 'units',
};

function generateBillNumber(utilityType: string): string {
  return `UTIL-${utilityType.slice(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function dueDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

// ────────────────────────────────────────────────────────────
// SERVICE CLASS
// ────────────────────────────────────────────────────────────

export class UtilityService {

  // ── 1. ENTER SINGLE UNIT METER READING ─────────────────────
  static async createReading(input: CreateReadingInput) {
    const {
      organizationId, unitId, buildingId, utilityType,
      billingPeriod, previousReading, currentReading,
      unitPrice, readingDate, enteredBy, notes, dueDaysFromNow = 10,
    } = input;

    if (currentReading < previousReading) {
      throw new Error('Current reading cannot be less than previous reading.');
    }

    const consumption = currentReading - previousReading;
    const totalAmount = parseFloat((consumption * unitPrice).toFixed(2));
    const unit = input.unit ?? DEFAULT_UNITS[utilityType] ?? 'units';

    // Insert reading (unique on unitId + billingPeriod + utilityType)
    const [reading] = await db.insert(utilityReadings).values({
      id: randomUUID(),
      organizationId,
      unitId,
      buildingId,
      utilityType,
      billingPeriod,
      previousReading: String(previousReading),
      currentReading: String(currentReading),
      consumption: String(consumption),
      unitPrice: String(unitPrice),
      totalAmount: String(totalAmount),
      unit,
      readingDate,
      enteredBy: enteredBy ?? null,
      notes: notes ?? null,
    }).returning();

    // Find the active contract for the unit to link the bill
    const [contract] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.unitId, unitId), eq(contracts.contractStatus, 'ACTIVE')))
      .limit(1);

    // Create the utility invoice in the invoices table
    let invoiceId: string | null = null;
    if (contract) {
      const [invoice] = await db.insert(invoices).values({
        id: randomUUID(),
        organizationId,
        contractId: contract.id,
        tenantId: contract.tenantId,
        unitId,
        invoiceNumber: `INV-UTIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'UTILITY',
        amount: String(totalAmount),
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: dueDate(dueDaysFromNow),
        status: 'PENDING',
        lateFeeApplied: false,
      }).returning();
      invoiceId = invoice.id;
    }

    // Create the utility bill record
    const [bill] = await db.insert(utilityBills).values({
      id: randomUUID(),
      organizationId,
      readingId: reading.id,
      unitId,
      buildingId,
      tenantId: contract?.tenantId ?? null,
      contractId: contract?.id ?? null,
      invoiceId,
      billNumber: generateBillNumber(utilityType),
      utilityType,
      billingPeriod,
      amount: String(totalAmount),
      paidAmount: '0',
      remainingAmount: String(totalAmount),
      status: 'PENDING',
      dueDate: dueDate(dueDaysFromNow),
      isSharedBill: false,
      notes: notes ?? null,
    }).returning();

    // Send notification to tenant
    if (contract?.tenantId) {
      try {
        const [tenantInfo] = await db.select().from(tenants).where(eq(tenants.id, contract.tenantId));
        if (tenantInfo?.userId) {
          await MessagingService.sendNotification({
            organizationId,
            userId: tenantInfo.userId,
            title: `${utilityType} Bill — ${billingPeriod}`,
            message: `Your ${utilityType.toLowerCase()} bill for ${billingPeriod} is ${totalAmount.toLocaleString()} ETB. Due by ${dueDate(dueDaysFromNow)}.`,
            type: 'INFO',
            deliveryChannels: ['IN_APP', 'EMAIL', 'SMS'],
          });
        }
      } catch { /* notification failure is non-critical */ }
    }

    return { reading, bill };
  }

  // ── 2. BULK READING FOR A WHOLE BUILDING ───────────────────
  static async createBulkReadings(input: BulkReadingInput) {
    const results: Awaited<ReturnType<typeof UtilityService.createReading>>[] = [];
    const errors: { unitId: string; error: string }[] = [];

    for (const r of input.readings) {
      try {
        const result = await UtilityService.createReading({
          organizationId: input.organizationId,
          buildingId: input.buildingId,
          utilityType: input.utilityType,
          billingPeriod: input.billingPeriod,
          unitPrice: input.unitPrice,
          unit: input.unit,
          readingDate: input.readingDate,
          enteredBy: input.enteredBy,
          dueDaysFromNow: input.dueDaysFromNow,
          ...r,
        });
        results.push(result);
      } catch (err: any) {
        errors.push({ unitId: r.unitId, error: err.message });
      }
    }

    return { created: results.length, failed: errors.length, results, errors };
  }

  // ── 3. SPLIT SHARED UTILITY (EQUAL or BY AREA) ─────────────
  static async splitSharedUtility(input: SplitUtilityInput) {
    const {
      organizationId, buildingId, utilityType,
      billingPeriod, totalAmount, splitMethod,
      enteredBy, dueDaysFromNow = 10, notes,
    } = input;

    // Get all occupied units in the building
    const occupiedUnits = await db
      .select({ unit: units })
      .from(units)
      .where(and(eq(units.buildingId, buildingId), eq(units.status, 'OCCUPIED'), eq(units.isDeleted, false)));

    if (occupiedUnits.length === 0) {
      throw new Error('No occupied units found in this building.');
    }

    const bills: typeof utilityBills.$inferInsert[] = [];

    if (splitMethod === 'EQUAL') {
      const perUnit = parseFloat((totalAmount / occupiedUnits.length).toFixed(2));

      for (const { unit } of occupiedUnits) {
        const [contract] = await db
          .select()
          .from(contracts)
          .where(and(eq(contracts.unitId, unit.id), eq(contracts.contractStatus, 'ACTIVE')))
          .limit(1);

        let invoiceId: string | null = null;
        if (contract) {
          const [invoice] = await db.insert(invoices).values({
            id: randomUUID(),
            organizationId,
            contractId: contract.id,
            tenantId: contract.tenantId,
            unitId: unit.id,
            invoiceNumber: `INV-UTIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'UTILITY',
            amount: String(perUnit),
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: dueDate(dueDaysFromNow),
            status: 'PENDING',
            lateFeeApplied: false,
          }).returning();
          invoiceId = invoice.id;
        }

        bills.push({
          id: randomUUID(),
          organizationId,
          readingId: null,
          unitId: unit.id,
          buildingId,
          tenantId: contract?.tenantId ?? null,
          contractId: contract?.id ?? null,
          invoiceId,
          billNumber: generateBillNumber(utilityType),
          utilityType,
          billingPeriod,
          amount: String(perUnit),
          paidAmount: '0',
          remainingAmount: String(perUnit),
          status: 'PENDING',
          dueDate: dueDate(dueDaysFromNow),
          isSharedBill: true,
          splitRatio: String((1 / occupiedUnits.length).toFixed(6)),
          notes: notes ?? null,
          paidAt: null,
          paymentMethod: null,
          paymentReference: null,
          paidBy: null,
        });
      }
    } else if (splitMethod === 'BY_AREA') {
      const totalArea = occupiedUnits.reduce((s, { unit }) => s + parseFloat(String(unit.area ?? '0')), 0);
      if (totalArea === 0) throw new Error('Total area is 0; cannot split by area.');

      for (const { unit } of occupiedUnits) {
        const ratio = parseFloat(String(unit.area ?? '0')) / totalArea;
        const perUnit = parseFloat((totalAmount * ratio).toFixed(2));

        const [contract] = await db
          .select()
          .from(contracts)
          .where(and(eq(contracts.unitId, unit.id), eq(contracts.contractStatus, 'ACTIVE')))
          .limit(1);

        let invoiceId: string | null = null;
        if (contract) {
          const [invoice] = await db.insert(invoices).values({
            id: randomUUID(),
            organizationId,
            contractId: contract.id,
            tenantId: contract.tenantId,
            unitId: unit.id,
            invoiceNumber: `INV-UTIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'UTILITY',
            amount: String(perUnit),
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: dueDate(dueDaysFromNow),
            status: 'PENDING',
            lateFeeApplied: false,
          }).returning();
          invoiceId = invoice.id;
        }

        bills.push({
          id: randomUUID(),
          organizationId,
          readingId: null,
          unitId: unit.id,
          buildingId,
          tenantId: contract?.tenantId ?? null,
          contractId: contract?.id ?? null,
          invoiceId,
          billNumber: generateBillNumber(utilityType),
          utilityType,
          billingPeriod,
          amount: String(perUnit),
          paidAmount: '0',
          remainingAmount: String(perUnit),
          status: 'PENDING',
          dueDate: dueDate(dueDaysFromNow),
          isSharedBill: true,
          splitRatio: String(ratio.toFixed(6)),
          notes: notes ?? null,
          paidAt: null,
          paymentMethod: null,
          paymentReference: null,
          paidBy: null,
        });
      }
    }

    const inserted = await db.insert(utilityBills).values(bills).returning();

    // Fire notifications
    for (const b of inserted) {
      if (b.tenantId) {
        try {
          const [tenantInfo] = await db.select().from(tenants).where(eq(tenants.id, b.tenantId));
          if (tenantInfo?.userId) {
            await MessagingService.sendNotification({
              organizationId,
              userId: tenantInfo.userId,
              title: `Shared ${utilityType} Bill — ${billingPeriod}`,
              message: `Your share of the ${utilityType.toLowerCase()} bill for ${billingPeriod} is ${parseFloat(b.amount).toLocaleString()} ETB.`,
              type: 'INFO',
              deliveryChannels: ['IN_APP'],
            });
          }
        } catch { /* non-critical */ }
      }
    }

    return { created: inserted.length, bills: inserted };
  }

  // ── 4. RECORD PAYMENT ──────────────────────────────────────
  static async recordPayment(input: RecordPaymentInput) {
    const { billId, amount, paymentMethod, paymentReference, paidBy, notes } = input;

    const [bill] = await db.select().from(utilityBills).where(eq(utilityBills.id, billId));
    if (!bill) throw new Error('Utility bill not found.');
    if (bill.status === 'PAID') throw new Error('Bill is already fully paid.');
    if (bill.status === 'CANCELLED') throw new Error('Bill is cancelled and cannot be paid.');

    const currentPaid = parseFloat(String(bill.paidAmount));
    const billAmount = parseFloat(String(bill.amount));
    const newPaid = Math.min(currentPaid + amount, billAmount);
    const remaining = parseFloat((billAmount - newPaid).toFixed(2));
    const newStatus = remaining <= 0 ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING';

    const [updated] = await db
      .update(utilityBills)
      .set({
        paidAmount: String(newPaid.toFixed(2)),
        remainingAmount: String(remaining),
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date().toISOString() : null,
        paymentMethod: paymentMethod ?? null,
        paymentReference: paymentReference ?? null,
        paidBy: paidBy ?? null,
        notes: notes ?? bill.notes,
        updatedAt: new Date(),
      })
      .where(eq(utilityBills.id, billId))
      .returning();

    // Mark linked invoice as PAID
    if (updated.invoiceId && newStatus === 'PAID') {
      await db.update(invoices).set({ status: 'PAID' }).where(eq(invoices.id, updated.invoiceId));
    }

    return updated;
  }

  // ── 5. GET BILLS (PAGINATED WITH FILTERS) ──────────────────
  static async getBills(organizationId: string, filters: {
    buildingId?: string;
    unitId?: string;
    tenantId?: string;
    status?: string;
    utilityType?: string;
    billingPeriod?: string;
  } = {}) {
    const conditions = [eq(utilityBills.organizationId, organizationId)];

    if (filters.buildingId) conditions.push(eq(utilityBills.buildingId, filters.buildingId));
    if (filters.unitId) conditions.push(eq(utilityBills.unitId, filters.unitId));
    if (filters.tenantId) conditions.push(eq(utilityBills.tenantId, filters.tenantId));
    if (filters.status) conditions.push(eq(utilityBills.status, filters.status));
    if (filters.utilityType) conditions.push(eq(utilityBills.utilityType, filters.utilityType));
    if (filters.billingPeriod) conditions.push(eq(utilityBills.billingPeriod, filters.billingPeriod));

    return db.select({
      bill: utilityBills,
      unit: units,
      tenant: tenants,
      building: buildings,
    })
      .from(utilityBills)
      .leftJoin(units, eq(utilityBills.unitId, units.id))
      .leftJoin(tenants, eq(utilityBills.tenantId, tenants.id))
      .leftJoin(buildings, eq(utilityBills.buildingId, buildings.id))
      .where(and(...conditions))
      .orderBy(desc(utilityBills.createdAt));
  }

  // ── 6. GET SINGLE BILL ─────────────────────────────────────
  static async getBillById(billId: string, organizationId: string) {
    const [result] = await db.select({
      bill: utilityBills,
      unit: units,
      tenant: tenants,
      building: buildings,
    })
      .from(utilityBills)
      .leftJoin(units, eq(utilityBills.unitId, units.id))
      .leftJoin(tenants, eq(utilityBills.tenantId, tenants.id))
      .leftJoin(buildings, eq(utilityBills.buildingId, buildings.id))
      .where(and(eq(utilityBills.id, billId), eq(utilityBills.organizationId, organizationId)));

    if (!result) throw new Error('Utility bill not found.');
    return result;
  }

  // ── 7. GET READINGS ────────────────────────────────────────
  static async getReadings(organizationId: string, filters: {
    buildingId?: string;
    unitId?: string;
    utilityType?: string;
    billingPeriod?: string;
  } = {}) {
    const conditions = [eq(utilityReadings.organizationId, organizationId)];
    if (filters.buildingId) conditions.push(eq(utilityReadings.buildingId, filters.buildingId));
    if (filters.unitId) conditions.push(eq(utilityReadings.unitId, filters.unitId));
    if (filters.utilityType) conditions.push(eq(utilityReadings.utilityType, filters.utilityType));
    if (filters.billingPeriod) conditions.push(eq(utilityReadings.billingPeriod, filters.billingPeriod));

    return db.select({
      reading: utilityReadings,
      unit: units,
      building: buildings,
    })
      .from(utilityReadings)
      .leftJoin(units, eq(utilityReadings.unitId, units.id))
      .leftJoin(buildings, eq(utilityReadings.buildingId, buildings.id))
      .where(and(...conditions))
      .orderBy(desc(utilityReadings.createdAt));
  }

  // ── 8. SUMMARY STATS ───────────────────────────────────────
  static async getSummary(organizationId: string, buildingId?: string) {
    const conditions: any[] = [eq(utilityBills.organizationId, organizationId)];
    if (buildingId) conditions.push(eq(utilityBills.buildingId, buildingId));

    const rows = await db
      .select({
        status: utilityBills.status,
        utilityType: utilityBills.utilityType,
        totalAmount: sql<string>`SUM(${utilityBills.amount}::numeric)`,
        paidAmount: sql<string>`SUM(${utilityBills.paidAmount}::numeric)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(utilityBills)
      .where(and(...conditions))
      .groupBy(utilityBills.status, utilityBills.utilityType);

    const summary = {
      totalBilled: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      byType: {} as Record<string, { billed: number; paid: number; pending: number; overdue: number }>,
    };

    for (const row of rows) {
      const amount = parseFloat(row.totalAmount ?? '0');
      const paid = parseFloat(row.paidAmount ?? '0');
      summary.totalBilled += amount;
      summary.totalPaid += paid;
      if (row.status === 'PENDING' || row.status === 'PARTIALLY_PAID') summary.totalPending += amount - paid;
      if (row.status === 'OVERDUE') summary.totalOverdue += amount - paid;

      const t = row.utilityType;
      if (!summary.byType[t]) summary.byType[t] = { billed: 0, paid: 0, pending: 0, overdue: 0 };
      summary.byType[t].billed += amount;
      summary.byType[t].paid += paid;
      if (row.status === 'PENDING' || row.status === 'PARTIALLY_PAID') summary.byType[t].pending += amount - paid;
      if (row.status === 'OVERDUE') summary.byType[t].overdue += amount - paid;
    }

    return summary;
  }

  // ── 9. MARK OVERDUE BILLS ──────────────────────────────────
  static async markOverdueBills(organizationId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const result = await db
      .update(utilityBills)
      .set({ status: 'OVERDUE', updatedAt: new Date() })
      .where(
        and(
          eq(utilityBills.organizationId, organizationId),
          eq(utilityBills.status, 'PENDING'),
          lt(utilityBills.dueDate, today),
        )
      )
      .returning();
    return { markedOverdue: result.length };
  }

  // ── 10. CANCEL BILL ────────────────────────────────────────
  static async cancelBill(billId: string, organizationId: string) {
    const [bill] = await db.select().from(utilityBills)
      .where(and(eq(utilityBills.id, billId), eq(utilityBills.organizationId, organizationId)));
    if (!bill) throw new Error('Bill not found.');
    if (bill.status === 'PAID') throw new Error('Cannot cancel a paid bill.');

    const [updated] = await db
      .update(utilityBills)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(utilityBills.id, billId))
      .returning();

    // Also cancel linked invoice if any
    if (updated.invoiceId) {
      await db.update(invoices).set({ status: 'CANCELLED' }).where(eq(invoices.id, updated.invoiceId));
    }

    return updated;
  }
}

