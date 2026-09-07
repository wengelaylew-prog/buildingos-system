import { db } from '../../db/index.ts';
import { maintenanceRequests, units, buildings, invoices } from '../../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { MessagingService } from '../messaging/messaging.service.ts';

export class MaintenanceService {
  static async createRequest(data: {
    organizationId: string;
    unitId?: string;
    buildingId?: string;
    tenantId?: string;
    title: string;
    description: string;
    priority: string;
    photoUrl?: string;
    reportedBy?: string;
  }) {
    const id = randomUUID();
    await db.insert(maintenanceRequests).values({
      id,
      organizationId: data.organizationId,
      unitId: data.unitId || null,
      buildingId: data.buildingId || null,
      tenantId: data.tenantId || null,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'PENDING',
      photoUrl: data.photoUrl || null,
      reportedBy: data.reportedBy || null,
    });
    return { id };
  }

  static async getRequests(organizationId: string, tenantId?: string) {
    let query = db.select({
      request: maintenanceRequests,
      unit: units,
      building: buildings
    }).from(maintenanceRequests)
      .leftJoin(units, eq(maintenanceRequests.unitId, units.id))
      .leftJoin(buildings, eq(maintenanceRequests.buildingId, buildings.id))
      .where(eq(maintenanceRequests.organizationId, organizationId));

    const results = await query.orderBy(desc(maintenanceRequests.createdAt));
    
    // RBAC logic applied in code or SQL
    if (tenantId) {
      return results.filter(r => r.request.tenantId === tenantId).map(r => ({ ...r.request, unit: r.unit, building: r.building }));
    }
    return results.map(r => ({ ...r.request, unit: r.unit, building: r.building }));
  }

  static async updateRequest(
    organizationId: string, 
    requestId: string, 
    data: {
      status?: string;
      assignedTo?: string;
      contractorName?: string;
      cost?: number;
      isBillable?: boolean;
    }
  ) {
    const req = await db.select().from(maintenanceRequests).where(and(eq(maintenanceRequests.id, requestId), eq(maintenanceRequests.organizationId, organizationId)));
    if (req.length === 0) throw new Error('Request not found');

    let invoiceId = req[0].invoiceId;

    // Optional integration with billing for billable repairs
    if (data.isBillable && data.cost && data.status === 'RESOLVED' && !invoiceId && req[0].tenantId) {
      invoiceId = randomUUID();
      await db.insert(invoices).values({
        id: invoiceId,
        organizationId,
        contractId: null as any, // Ad-hoc maintenance invoices may not link to a contract directly
        tenantId: req[0].tenantId,
        unitId: req[0].unitId,
        invoiceNumber: `MAINT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'OTHER',
        amount: String(data.cost),
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        lateFeeApplied: false
      });
    }

    await db.update(maintenanceRequests)
      .set({
        ...data,
        cost: data.cost ? String(data.cost) : undefined,
        invoiceId,
        updatedAt: new Date()
      })
      .where(eq(maintenanceRequests.id, requestId));

    if (data.status && req[0].tenantId) {
      const tenant = await db.select().from(require('../../db/schema.ts').tenants).where(eq(require('../../db/schema.ts').tenants.id, req[0].tenantId));
      if (tenant.length > 0 && tenant[0].userId) {
        await MessagingService.sendNotification({
          organizationId,
          userId: tenant[0].userId,
          title: 'Maintenance Update',
          message: `Your maintenance request "${req[0].title}" is now ${data.status}.`,
          type: data.status === 'RESOLVED' ? 'SUCCESS' : 'INFO',
          deliveryChannels: ['IN_APP', 'EMAIL']
        });
      }
    }

    return { success: true, invoiceId };
  }
}

