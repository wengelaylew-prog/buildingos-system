import { db } from '../../db/index.ts';
import { units, contracts, invoices, payments, maintenanceRequests } from '../../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

export class ReportsService {
  static async getMetrics(organizationId: string) {
    // 1. Operational Metrics
    const allUnits = await db.select().from(units).where(and(eq(units.organizationId, organizationId), eq(units.isDeleted, false)));
    const allContracts = await db.select().from(contracts).where(and(eq(contracts.organizationId, organizationId), eq(contracts.isDeleted, false)));

    const totalUnits = allUnits.length;
    const occupiedUnits = allUnits.filter(u => u.status === 'OCCUPIED').length;
    const vacantUnits = allUnits.filter(u => u.status === 'VACANT').length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const activeLeases = allContracts.filter(c => c.contractStatus === 'ACTIVE').length;

    // 2. Financial Metrics
    const allInvoices = await db.select().from(invoices).where(eq(invoices.organizationId, organizationId));
    
    const totalRevenue = allInvoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);
      
    const outstandingBalances = allInvoices
      .filter(i => i.status === 'PENDING' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);

    // 3. Maintenance Metrics
    const allMaintenance = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.organizationId, organizationId));
    
    const openTickets = allMaintenance.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length;
    const resolvedTickets = allMaintenance.filter(m => m.status === 'RESOLVED').length;
    
    const totalMaintenanceCosts = allMaintenance
      .reduce((sum, m) => sum + parseFloat(m.cost || '0'), 0);

    return {
      operational: { totalUnits, occupiedUnits, vacantUnits, occupancyRate, activeLeases },
      financial: { totalRevenue, outstandingBalances, totalMaintenanceCosts },
      maintenance: { openTickets, resolvedTickets, totalTickets: allMaintenance.length }
    };
  }

  static async exportToCSV(organizationId: string, type: string): Promise<string> {
    if (type === 'financial') {
      const allInvoices = await db.select().from(invoices).where(eq(invoices.organizationId, organizationId));
      let csv = 'ID,Type,Amount,Status,Date\n';
      allInvoices.forEach(i => {
        csv += `${i.id},${i.type},${i.amount},${i.status},${i.createdAt.toISOString()}\n`;
      });
      return csv;
    } else if (type === 'operational') {
      const allUnits = await db.select().from(units).where(and(eq(units.organizationId, organizationId), eq(units.isDeleted, false)));
      let csv = 'Unit Number,Status,Floor ID,Building ID\n';
      allUnits.forEach(u => {
        csv += `${u.unitNumber},${u.status},${u.floorId},${u.buildingId}\n`;
      });
      return csv;
    } else if (type === 'maintenance') {
      const allMaintenance = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.organizationId, organizationId));
      let csv = 'Title,Status,Priority,Cost,Contractor,Created At\n';
      allMaintenance.forEach(m => {
        csv += `"${m.title.replace(/"/g, '""')}",${m.status},${m.priority},${m.cost || 0},"${(m.contractorName || '').replace(/"/g, '""')}",${m.createdAt.toISOString()}\n`;
      });
      return csv;
    }
    throw new Error('Invalid export type');
  }
}
