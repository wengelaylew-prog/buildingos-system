import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  buildings,
  floors,
  units,
  tenants,
  tenantUnits,
  contracts,
  documents,
  roles,
  permissions,
  rolePermissions,
  users,
  userRoles,
  auditLogs,
  notifications,
  payments,
  receipts,
  maintenanceRequests,
  settings,
} from './src/db/schema.ts';
import { eq, desc, and, sql, ilike, or, not } from 'drizzle-orm';
import {
  authenticate,
  requirePermission,
  logAudit,
  AuthRequest,
} from './src/middleware/auth.ts';
import { storageService } from './src/services/storage/StorageService.ts';
import { seedDatabase } from './src/db/seed.ts';
import { buildingsRouter } from './src/modules/buildings/buildings.routes.ts';
import { floorsRouter } from './src/modules/floors/floors.routes.ts';
import { unitsRouter } from './src/modules/units/units.routes.ts';
import tenantsRouter from './src/modules/tenants/tenants.routes.ts';
import leasesRouter from './src/modules/leases/leases.routes.ts';
import { threeDRouter } from './src/modules/three-d/three-d.routes.ts';
import { billingRouter } from './src/modules/billing/billing.routes.ts';
import { maintenanceRouter } from './src/modules/maintenance/maintenance.routes.ts';
import { messagingRouter } from './src/modules/messaging/messaging.routes.ts';
import { reportsRouter } from './src/modules/reports/reports.routes.ts';
import { adminRouter } from './src/modules/admin/admin.routes.ts';
import { telegramRouter } from './src/modules/telegram/telegram.routes.ts';
import { tmaAuthRouter } from './src/modules/tma-auth/tma-auth.routes.ts';
import { corsMiddleware, securityHeaders, rateLimiter, validateEnvironment } from './src/middleware/security.ts';

async function startServer() {
  validateEnvironment();
  const app = express();

  // PRODUCTION HARDENING (Phase 10)
  app.use(securityHeaders);
  app.use(corsMiddleware);
  if (process.env.NODE_ENV === 'production') {
    app.use('/api', rateLimiter);
  }

  const PORT = 3000;

  app.use(express.json());

  // Helper response wrapper
  const successResponse = (res: Response, data: any, message: string | null = null, meta: any = {}) => {
    return res.json({
      success: true,
      data,
      message,
      meta,
    });
  };

  const errorResponse = (res: Response, status: number, message: string, errors: any[] = []) => {
    return res.status(status).json({
      success: false,
      data: null,
      message,
      errors,
    });
  };

  // Run initial seed if DB is empty
  try {
    await seedDatabase();
  } catch (seedErr) {
    console.warn('Initial seed check error:', seedErr);
  }

  // HEALTH CHECK
  app.get(['/api/health', '/api/v1/health'], (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // SEED TRIGGER ENDPOINT
  app.post('/api/v1/seed', authenticate, requirePermission('settings.manage'), async (req: AuthRequest, res) => {
    try {
      const result = await seedDatabase();
      await logAudit({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DATABASE_SEEDED',
        entityType: 'database',
        entityId: 'seed',
        req,
      });
      return successResponse(res, result, 'Database seeded successfully');
    } catch (err: any) {
      return errorResponse(res, 500, 'Seeding failed', [err.message]);
    }
  });

  // 1. AUTH & USER ENDPOINTS
  app.get('/api/v1/auth/me', authenticate, async (req: AuthRequest, res) => {
    return successResponse(res, req.user);
  });

  // 2. DASHBOARD KPIS & OVERVIEW
  app.get('/api/v1/dashboard/kpis', authenticate, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;

      const bldgConditions = [eq(buildings.isDeleted, false)];
      const floorConditions = [eq(floors.isDeleted, false)];
      const unitConditions = [eq(units.isDeleted, false)];
      const auditConditions: any[] = [];

      if (orgId) {
        bldgConditions.push(eq(buildings.organizationId, orgId));
        floorConditions.push(eq(floors.organizationId, orgId));
        unitConditions.push(eq(units.organizationId, orgId));
        auditConditions.push(eq(auditLogs.organizationId, orgId));
      }

      const [
        bldgCountRes,
        floorCountRes,
        unitStatsRes,
        recentActivity,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(buildings).where(and(...bldgConditions)),
        db.select({ count: sql<number>`count(*)::int` }).from(floors).where(and(...floorConditions)),
        db.select({
          total: sql<number>`count(*)::int`,
          occupied: sql<number>`count(case when UPPER(status) = 'OCCUPIED' then 1 end)::int`,
          vacant: sql<number>`count(case when UPPER(status) = 'VACANT' then 1 end)::int`,
          reserved: sql<number>`count(case when UPPER(status) = 'RESERVED' then 1 end)::int`,
          maintenance: sql<number>`count(case when UPPER(status) = 'MAINTENANCE' then 1 end)::int`,
          monthlyRentTotal: sql<string>`coalesce(sum(case when UPPER(status) = 'OCCUPIED' then monthly_rent else 0 end), 0)::text`,
        }).from(units).where(and(...unitConditions)),
        db
          .select()
          .from(auditLogs)
          .where(auditConditions.length > 0 ? and(...auditConditions) : undefined)
          .orderBy(desc(auditLogs.createdAt))
          .limit(10),
      ]);

      // Scoped units list for sub-queries
      const orgUnits = await db
        .select({ id: units.id })
        .from(units)
        .where(and(...unitConditions));
      const orgUnitIds = orgUnits.map((u) => u.id);

      let tenantCount = 0;
      let allContracts: any[] = [];
      let allPayments: any[] = [];
      let allMaintenance: any[] = [];

      if (orgUnitIds.length > 0) {
        const [tenantsRes, contractsRes, paymentsRes, maintenanceRes] = await Promise.all([
          db
            .select({ count: sql<number>`count(distinct ${tenantUnits.tenantId})::int` })
            .from(tenantUnits)
            .where(and(sql`${tenantUnits.unitId} in ${orgUnitIds}`, eq(tenantUnits.isCurrent, true))),
          db
            .select()
            .from(contracts)
            .where(and(sql`${contracts.unitId} in ${orgUnitIds}`, eq(contracts.isDeleted, false))),
          db
            .select()
            .from(payments)
            .where(sql`${payments.unitId} in ${orgUnitIds}`),
          db
            .select()
            .from(maintenanceRequests)
            .where(sql`${maintenanceRequests.unitId} in ${orgUnitIds}`),
        ]);

        tenantCount = tenantsRes[0]?.count || 0;
        allContracts = contractsRes;
        allPayments = paymentsRes;
        allMaintenance = maintenanceRes;
      }

      const totalBuildings = bldgCountRes[0]?.count || 0;
      const totalFloors = floorCountRes[0]?.count || 0;
      const unitStats = unitStatsRes[0] || {
        total: 0,
        occupied: 0,
        vacant: 0,
        reserved: 0,
        maintenance: 0,
        monthlyRentTotal: '0',
      };
      const totalUnits = unitStats.total;
      const occupiedUnits = unitStats.occupied;
      const vacantUnits = unitStats.vacant;
      const reservedUnits = unitStats.reserved;
      const maintenanceUnits = unitStats.maintenance;
      const totalTenants = tenantCount;
      const monthlyRentTotal = parseFloat(unitStats.monthlyRentTotal || '0');

      // Calculate outstanding rent
      const outstandingRentTotal = allPayments
        .filter((p) => p.status === 'OVERDUE')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

      // Calculate expiring contracts (< 30 days) and expired
      const now = new Date();
      const thirtyDaysAhead = new Date();
      thirtyDaysAhead.setDate(now.getDate() + 30);

      let expiringContractsCount = 0;
      let expiredContractsCount = 0;

      for (const c of allContracts) {
        const endDate = new Date(c.endDate);
        if (endDate < now) {
          expiredContractsCount++;
        } else if (endDate <= thirtyDaysAhead) {
          expiringContractsCount++;
        }
      }

      // Open alerts
      const alerts = [
        {
          id: 'alert-expiring-contracts',
          type: 'WARNING',
          title: 'Expiring Contracts',
          description: `${expiringContractsCount} tenant lease(s) expire within the next 30 days.`,
          count: expiringContractsCount,
          link: '/contracts',
        },
        {
          id: 'alert-rent-overdue',
          type: 'ALERT',
          title: 'Outstanding Rent Overdue',
          description: `${outstandingRentTotal.toLocaleString()} ETB pending in overdue payments.`,
          count: allPayments.filter((p) => p.status === 'OVERDUE').length,
          link: '/payments',
        },
        {
          id: 'alert-vacant-units',
          type: 'INFO',
          title: 'Vacant Units Available',
          description: `${vacantUnits} vacant unit(s) currently ready for lease leasing.`,
          count: vacantUnits,
          link: '/units',
        },
        {
          id: 'alert-maintenance-open',
          type: 'WARNING',
          title: 'Open Maintenance Requests',
          description: `${allMaintenance.filter((m) => m.status !== 'RESOLVED' && m.status !== 'CLOSED').length} unresolved tickets requiring technician dispatch.`,
          count: allMaintenance.filter((m) => m.status !== 'RESOLVED' && m.status !== 'CLOSED').length,
          link: '/maintenance',
        },
      ];

      return successResponse(res, {
        kpis: {
          totalBuildings,
          totalFloors,
          totalUnits,
          occupiedUnits,
          vacantUnits,
          reservedUnits,
          maintenanceUnits,
          occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalTenants,
          monthlyRent: monthlyRentTotal,
          outstandingRent: outstandingRentTotal,
          expiringContracts: expiringContractsCount,
          expiredContracts: expiredContractsCount,
        },
        recentActivity,
        alerts,
      });
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to calculate dashboard statistics', [err.message]);
    }
  });

  // 3. BUILDINGS, FLOORS, & UNITS MODULES (PHASE 2 MODULAR ARCHITECTURE)
  app.use('/api/v1/buildings', buildingsRouter);
  app.use('/api/v1/floors', floorsRouter);
  app.use('/api/v1/units', unitsRouter);

  // 4. TENANTS & LEASES MODULES (PHASE 3 MODULAR MULTI-TENANT ARCHITECTURE)
  app.use('/api/v1', tenantsRouter);
  app.use('/api/v1', leasesRouter);

  // 5. 3D BUILDING & PROPERTY VIEWER (PHASE 4 INTERACTIVE 3D SYSTEM)
  app.use('/api/v1/properties', threeDRouter);
  app.use('/api/v1/3d', threeDRouter);

  // 6. BILLING & INVOICING (PHASE 5)
  app.use('/api/v1/billing', billingRouter);

  // 8. DOCUMENTS MODULE (Generic Polymorphic Document Architecture)
  // GET /api/v1/documents
  app.get('/api/v1/documents', authenticate, requirePermission('document.read'), async (req: AuthRequest, res) => {
    try {
      const { entityType, entityId, search } = req.query;

      let allDocs = await db.select().from(documents).orderBy(desc(documents.createdAt));

      if (entityType && entityType !== 'ALL') {
        allDocs = allDocs.filter((d) => d.entityType === entityType);
      }
      if (entityId) {
        allDocs = allDocs.filter((d) => d.entityId === entityId);
      }
      if (search) {
        const s = (search as string).toLowerCase();
        allDocs = allDocs.filter((d) => d.fileName.toLowerCase().includes(s) || d.fileType.toLowerCase().includes(s));
      }

      return successResponse(res, allDocs);
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch documents', [err.message]);
    }
  });

  // POST /api/v1/documents (Upload / Attach metadata via StorageService)
  app.post('/api/v1/documents', authenticate, requirePermission('document.upload'), async (req: AuthRequest, res) => {
    try {
      const { entityType, entityId, fileName, fileType, fileSize, fileContent } = req.body;

      if (!entityType || !entityId || !fileName) {
        return errorResponse(res, 400, 'Validation failed', [
          'Entity type, Entity ID, and File name are required.',
        ]);
      }

      // Delegate file physical storage to StorageService abstraction
      const uploadResult = await storageService.upload({
        name: fileName,
        type: fileType || 'application/pdf',
        size: parseInt(fileSize, 10) || 1024,
        content: fileContent,
      });

      // Persist document metadata in PostgreSQL
      const created = await db
        .insert(documents)
        .values({
          entityType,
          entityId,
          fileName: fileName.trim(),
          fileType: uploadResult.mimeType,
          fileSize: uploadResult.size,
          storageKey: uploadResult.key,
          url: uploadResult.url,
          uploadedBy: req.user?.id,
        })
        .returning();

      await logAudit({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DOCUMENT_UPLOADED',
        entityType,
        entityId,
        newValues: created[0],
        req,
      });

      return successResponse(res, created[0], 'Document attached successfully');
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to upload document', [err.message]);
    }
  });

  // DELETE /api/v1/documents/:id
  app.delete('/api/v1/documents/:id', authenticate, requirePermission('document.delete'), async (req: AuthRequest, res) => {
    try {
      const docId = req.params.id;
      const current = (await db.select().from(documents).where(eq(documents.id, docId)))[0];
      if (!current) return errorResponse(res, 404, 'Document not found');

      await storageService.delete(current.storageKey);
      await db.delete(documents).where(eq(documents.id, docId));

      await logAudit({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DOCUMENT_DELETED',
        entityType: current.entityType,
        entityId: current.entityId,
        oldValues: current,
        req,
      });

      return successResponse(res, { id: docId }, 'Document deleted successfully');
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to delete document', [err.message]);
    }
  });

  // 9. AUDIT LOGS
  app.get('/api/v1/audit-logs', authenticate, requirePermission('audit.read'), async (req: AuthRequest, res) => {
    try {
      const { action, entityType, search } = req.query;

      let logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

      if (action && action !== 'ALL') {
        logs = logs.filter((l) => l.action === action);
      }
      if (entityType && entityType !== 'ALL') {
        logs = logs.filter((l) => l.entityType === entityType);
      }
      if (search) {
        const s = (search as string).toLowerCase();
        logs = logs.filter(
          (l) =>
            l.action.toLowerCase().includes(s) ||
            l.entityType.toLowerCase().includes(s) ||
            (l.userEmail && l.userEmail.toLowerCase().includes(s))
        );
      }

      return successResponse(res, logs);
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch audit logs', [err.message]);
    }
  });

  // 10. ROLES & PERMISSIONS
  app.get('/api/v1/roles', authenticate, requirePermission('user.manage'), async (req, res) => {
    try {
      const allRoles = await db.select().from(roles);
      const allPerms = await db.select().from(permissions);
      const allRolePerms = await db.select().from(rolePermissions);

      const enriched = allRoles.map((r) => {
        const assignedPermIds = allRolePerms.filter((rp) => rp.roleId === r.id).map((rp) => rp.permissionId);
        const assignedPerms = allPerms.filter((p) => assignedPermIds.includes(p.id));
        return {
          ...r,
          permissions: assignedPerms,
        };
      });

      return successResponse(res, { roles: enriched, allPermissions: allPerms });
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch roles', [err.message]);
    }
  });

  // 11. USERS MODULE
  app.get('/api/v1/users', authenticate, requirePermission('user.manage'), async (req, res) => {
    try {
      const allUsers = await db
        .select({
          user: users,
          role: roles,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .orderBy(desc(users.createdAt));

      const formatted = allUsers.map((row) => ({
        ...row.user,
        role: row.role,
      }));

      return successResponse(res, formatted);
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch users', [err.message]);
    }
  });

  // PUT /api/v1/users/:id/role
  app.put('/api/v1/users/:id/role', authenticate, requirePermission('user.manage'), async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const { roleId } = req.body;

      const current = (await db.select().from(users).where(eq(users.id, userId)))[0];
      if (!current) return errorResponse(res, 404, 'User not found');

      const updated = await db
        .update(users)
        .set({ roleId, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      await logAudit({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'USER_ROLE_CHANGED',
        entityType: 'user',
        entityId: userId,
        oldValues: { roleId: current.roleId },
        newValues: { roleId },
        req,
      });

      return successResponse(res, updated[0], 'User role updated successfully');
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to update user role', [err.message]);
    }
  });

  // 12. SETTINGS MODULE
  app.get('/api/v1/settings', authenticate, async (req, res) => {
    try {
      const allSettings = await db.select().from(settings);
      const settingsMap: Record<string, string> = {};
      allSettings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      return successResponse(res, settingsMap);
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch settings', [err.message]);
    }
  });

  app.put('/api/v1/settings', authenticate, requirePermission('settings.manage'), async (req: AuthRequest, res) => {
    try {
      const entries = Object.entries(req.body);
      for (const [key, value] of entries) {
        await db
          .insert(settings)
          .values({ key, value: String(value), updatedAt: new Date() })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: String(value), updatedAt: new Date() },
          });
      }

      await logAudit({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'SETTINGS_UPDATED',
        entityType: 'settings',
        entityId: 'system',
        newValues: req.body,
        req,
      });

      return successResponse(res, req.body, 'Settings saved successfully');
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to save settings', [err.message]);
    }
  });

  // 13. PAYMENTS & RECEIPTS (Read and Record)
  app.get('/api/v1/payments', authenticate, requirePermission('payment.read'), async (req, res) => {
    try {
      const allPayments = await db
        .select({
          payment: payments,
          tenant: tenants,
          unit: units,
        })
        .from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .leftJoin(units, eq(payments.unitId, units.id))
        .orderBy(desc(payments.paymentDate));

      const allReceipts = await db.select().from(receipts);

      const enriched = allPayments.map((row) => ({
        ...row.payment,
        tenant: row.tenant,
        unit: row.unit,
        receipt: allReceipts.find((r) => r.paymentId === row.payment.id) || null,
      }));

      return successResponse(res, enriched);
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch payments', [err.message]);
    }
  });

  // RECEIPTS API
  app.get('/api/v1/receipts', authenticate, requirePermission('receipt.read'), async (req, res) => {
    try {
      const allReceipts = await db.select().from(receipts).orderBy(desc(receipts.issueDate));
      const allPayments = await db.select().from(payments);
      const allTenants = await db.select().from(tenants);
      const allUnits = await db.select().from(units);
      const allBuildings = await db.select().from(buildings);

      const enriched = allReceipts.map((r) => {
        const payment = allPayments.find((p) => p.id === r.paymentId);
        const tenant = payment ? allTenants.find((t) => t.id === payment.tenantId) : null;
        const unit = payment ? allUnits.find((u) => u.id === payment.unitId) : null;
        const building = unit ? allBuildings.find((b) => b.id === unit.buildingId) : null;
        return {
          ...r,
          payment,
          tenant,
          unit,
          building,
        };
      });

      return successResponse(res, enriched);
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch receipts', [err.message]);
    }
  });

  app.get('/api/v1/receipts/:id', authenticate, requirePermission('receipt.read'), async (req, res) => {
    try {
      const found = (await db.select().from(receipts).where(eq(receipts.id, req.params.id)))[0];
      if (!found) {
        return errorResponse(res, 404, 'Receipt not found');
      }
      const payment = (await db.select().from(payments).where(eq(payments.id, found.paymentId)))[0] || null;
      const tenant = payment ? (await db.select().from(tenants).where(eq(tenants.id, payment.tenantId)))[0] || null : null;
      const unit = payment ? (await db.select().from(units).where(eq(units.id, payment.unitId)))[0] || null : null;
      return successResponse(res, { receipt: found, payment, tenant, unit });
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to fetch receipt details', [err.message]);
    }
  });

  // REPORTS SUMMARY API
  app.get('/api/v1/reports', authenticate, async (req: AuthRequest, res) => {
    try {
      const allBuildings = await db.select().from(buildings).where(eq(buildings.isDeleted, false));
      const allUnits = await db.select().from(units).where(eq(units.isDeleted, false));
      const allTenants = await db.select().from(tenants).where(eq(tenants.isDeleted, false));
      const allPayments = await db.select().from(payments);
      const allContracts = await db.select().from(contracts).where(eq(contracts.isDeleted, false));

      const totalRevenue = allPayments
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

      const overdueRevenue = allPayments
        .filter((p) => p.status === 'OVERDUE')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

      const totalUnits = allUnits.length;
      const occupiedUnits = allUnits.filter((u) => u.status === 'OCCUPIED').length;
      const vacantUnits = allUnits.filter((u) => u.status === 'VACANT').length;
      const reservedUnits = allUnits.filter((u) => u.status === 'RESERVED').length;
      const maintenanceUnits = allUnits.filter((u) => u.status === 'MAINTENANCE').length;

      return successResponse(res, {
        summary: {
          totalBuildings: allBuildings.length,
          totalUnits,
          occupiedUnits,
          vacantUnits,
          reservedUnits,
          maintenanceUnits,
          occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
          totalTenants: allTenants.length,
          totalRevenue,
          overdueRevenue,
          activeContracts: allContracts.filter((c) => c.contractStatus === 'ACTIVE').length,
        },
        phase: 'Phase 1 Foundation Verified',
        nextMilestone: 'Phase 2: Automated Tax Schedules, Advanced Analytics & PDF Export Engine',
      });
    } catch (err: any) {
      return errorResponse(res, 500, 'Failed to generate reports overview', [err.message]);
    }
  });

  // 13. MESSAGING MODULE (PHASE 7)
  app.use('/api/v1', messagingRouter);

  // 14. REPORTS MODULE (PHASE 8)
  app.use('/api/v1/reports', reportsRouter);

  // 15. SAAS ADMIN MODULE (PHASE 9)
  app.use('/api/v1/admin', adminRouter);

  // 16. TELEGRAM MINI APP (PHASE TMA-1)
  app.use('/api/v1/telegram', telegramRouter);
  app.use('/api/v1/tma-auth', tmaAuthRouter);

  // VITE MIDDLEWARE SETUP
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Building & Tenant Management Server running on port ${PORT}`);
  });
}

startServer();
