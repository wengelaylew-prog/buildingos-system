import { db } from '../../db/index.ts';
import { invoices, contracts, tenants, units } from '../../db/schema.ts';
import { eq, and, lt, sql, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { MessagingService } from '../messaging/messaging.service.ts';

export class BillingService {
  static async generateRecurringInvoices(organizationId: string) {
    const activeContracts = await db.select().from(contracts)
      .where(and(eq(contracts.contractStatus, 'ACTIVE'), eq(contracts.organizationId, organizationId)));
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let created = 0;
    
    for (const contract of activeContracts) {
      const existing = await db.select().from(invoices).where(
        and(
          eq(invoices.contractId, contract.id),
          eq(invoices.type, 'RENT'),
          sql`issue_date LIKE ${currentMonth + '%'}`
        )
      );
      
      if (existing.length === 0) {
        await db.insert(invoices).values({
          id: randomUUID(),
          organizationId,
          contractId: contract.id,
          tenantId: contract.tenantId,
          unitId: contract.unitId,
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'RENT',
          amount: contract.monthlyRent,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          lateFeeApplied: false
        });
        
        const tenantInfo = await db.select().from(tenants).where(eq(tenants.id, contract.tenantId));
        if (tenantInfo.length > 0 && tenantInfo[0].userId) {
          await MessagingService.sendNotification({
            organizationId,
            userId: tenantInfo[0].userId,
            title: 'New Rent Invoice Generated',
            message: `Your rent invoice for ${currentMonth} (${contract.monthlyRent} ETB) is now available.`,
            type: 'INFO',
            deliveryChannels: ['IN_APP', 'EMAIL', 'SMS']
          });
        }
        
        created++;
      }
    }
    return { created };
  }

  static async applyLateFees(organizationId: string) {
    const overdue = await db.select().from(invoices).where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.status, 'PENDING'),
        eq(invoices.lateFeeApplied, false),
        lt(invoices.dueDate, new Date().toISOString())
      )
    );
    
    let applied = 0;
    for (const inv of overdue) {
      const lateFeeAmount = (parseFloat(inv.amount) * 0.05).toFixed(2);
      await db.insert(invoices).values({
        id: randomUUID(),
        organizationId,
        contractId: inv.contractId,
        tenantId: inv.tenantId,
        unitId: inv.unitId,
        invoiceNumber: `LF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'LATE_FEE',
        amount: lateFeeAmount,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        lateFeeApplied: false
      });
      await db.update(invoices)
        .set({ lateFeeApplied: true, status: 'OVERDUE' })
        .where(eq(invoices.id, inv.id));
      applied++;
    }
    return { applied };
  }

  static async getInvoices(organizationId: string) {
    return db.select({
      invoice: invoices,
      tenant: tenants,
      unit: units,
      contract: contracts
    }).from(invoices)
      .leftJoin(tenants, eq(invoices.tenantId, tenants.id))
      .leftJoin(units, eq(invoices.unitId, units.id))
      .leftJoin(contracts, eq(invoices.contractId, contracts.id))
      .where(eq(invoices.organizationId, organizationId))
      .orderBy(desc(invoices.issueDate));
  }
}
