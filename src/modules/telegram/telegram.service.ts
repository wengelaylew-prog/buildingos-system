import { db } from '../../db/index.ts';
import { tenants, tenantUnits, units, buildings, floors, contracts, maintenanceRequests, notifications, payments, invoices, telegramAccounts } from '../../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { validateTelegramWebAppData } from '../../lib/telegram.ts';

export class TelegramService {
  /**
   * Helper to resolve the active tenant record for a user
   */
  static async getTenantForUser(userId: string) {
    const tenant = (await db.select().from(tenants).where(and(eq(tenants.userId, userId), eq(tenants.isDeleted, false))))[0];
    if (!tenant) throw new Error('User is not a tenant');
    return tenant;
  }

  static async linkAccount(userId: string, initData: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token';
    if (!validateTelegramWebAppData(initData, botToken)) {
      throw new Error('Invalid Telegram initData signature');
    }

    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    if (!userStr) throw new Error('No user data in initData');

    const tgUser = JSON.parse(userStr);
    const telegramUserId = tgUser.id.toString();

    // Ensure not already linked
    const existingTg = (await db.select().from(telegramAccounts).where(eq(telegramAccounts.telegramUserId, telegramUserId)))[0];
    if (existingTg) {
      if (existingTg.userId !== userId) {
        throw new Error('Telegram account is already linked to another BuildingOS user');
      }
      return existingTg; // already linked
    }
    
    // Ensure this user doesn't already have another telegram account linked
    const existingUserTg = (await db.select().from(telegramAccounts).where(eq(telegramAccounts.userId, userId)))[0];
    if (existingUserTg) {
       throw new Error('This BuildingOS user is already linked to a Telegram account');
    }

    const [newAccount] = await db.insert(telegramAccounts).values({
      userId,
      telegramUserId,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      lastAuthenticatedAt: new Date(),
    }).returning();

    return newAccount;
  }

  static async getDashboard(userId: string) {
    const tenant = await this.getTenantForUser(userId);

    // Get current lease
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    
    let unitData = null;
    let bldgData = null;
    if (lease) {
      unitData = (await db.select().from(units).where(eq(units.id, lease.unitId)))[0];
      if (unitData) {
         bldgData = (await db.select().from(buildings).where(eq(buildings.id, unitData.buildingId)))[0];
      }
    }

    // Get outstanding balance
    const outstandingPayments = await db.select().from(payments)
      .where(and(eq(payments.tenantId, tenant.id), eq(payments.status, 'OVERDUE')));
    const balance = outstandingPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    // Get next payment (simplification: next pending)
    const pendingPayments = await db.select().from(payments)
      .where(and(eq(payments.tenantId, tenant.id), eq(payments.status, 'PENDING')))
      .orderBy(payments.paymentDate);
    const nextPayment = pendingPayments[0] || null;

    // Get recent invoice
    const recentInvoices = await db.select().from(invoices)
      .where(eq(invoices.tenantId, tenant.id))
      .orderBy(desc(invoices.issueDate));
    const recentInvoice = recentInvoices[0] || null;

    // Get recent maintenance request
    const recentMaint = await db.select().from(maintenanceRequests)
      .where(eq(maintenanceRequests.tenantId, tenant.id))
      .orderBy(desc(maintenanceRequests.createdAt));
    const recentMaintenance = recentMaint[0] || null;

    // Get unread notifications count
    const unreadNotifs = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return {
      tenantName: tenant.fullName,
      buildingName: bldgData?.name || 'N/A',
      unitNumber: unitData?.unitNumber || 'N/A',
      leaseStatus: lease?.contractStatus || 'No Active Lease',
      rentAmount: lease?.monthlyRent || '0',
      balance,
      nextPaymentDate: nextPayment?.paymentDate || null,
      nextPaymentAmount: nextPayment?.amount || null,
      recentInvoice: recentInvoice ? { id: recentInvoice.id, number: recentInvoice.invoiceNumber, amount: recentInvoice.amount, status: recentInvoice.status } : null,
      recentMaintenance: recentMaintenance ? { id: recentMaintenance.id, title: recentMaintenance.title, status: recentMaintenance.status } : null,
      unreadNotifications: unreadNotifs.length,
    };
  }

  static async getProperty(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    
    if (!lease) throw new Error('No active property found');

    const unit = (await db.select().from(units).where(eq(units.id, lease.unitId)))[0];
    const building = (await db.select().from(buildings).where(eq(buildings.id, unit.buildingId)))[0];
    const floor = (await db.select().from(floors).where(eq(floors.id, unit.floorId)))[0];

    return { building, unit, floor };
  }

  static async getLease(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    
    if (!lease) throw new Error('No active lease found');

    // Compute derived fields from the lease dates (stored as text YYYY-MM-DD)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(lease.endDate);
    endDate.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / msPerDay);

    // Compute next payment due: 1st of next month based on today
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextPaymentDate = nextMonth.toISOString().split('T')[0];

    // Renewal eligibility: within 60 days of expiry and still ACTIVE
    const isExpiringSoon = daysRemaining <= 60 && daysRemaining > 0;
    const renewalEligible = isExpiringSoon && lease.contractStatus === 'ACTIVE';

    return {
      ...lease,
      daysRemaining,
      nextPaymentDate,
      isExpiringSoon,
      renewalEligible,
    };
  }

  static async requestRenewal(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    if (!lease) throw new Error('No active lease found');

    // For now, record the renewal request by creating a notification
    // (Full renewal workflow is Phase 5+)
    await db.insert(notifications).values({
      organizationId: tenant.organizationId,
      userId,
      title: 'Lease Renewal Requested',
      message: `Tenant ${tenant.fullName} has requested renewal for contract ${lease.contractNumber}.`,
      type: 'INFO',
    });
    return { requested: true, contractNumber: lease.contractNumber };
  }

  static async getBilling(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const allPayments = await db.select().from(payments)
      .where(eq(payments.tenantId, tenant.id))
      .orderBy(desc(payments.paymentDate));

    const balance = allPayments
      .filter((p) => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    return {
      balance,
      payments: allPayments,
    };
  }

  static async getMaintenanceRequests(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    return await db.select().from(maintenanceRequests)
      .where(eq(maintenanceRequests.tenantId, tenant.id))
      .orderBy(desc(maintenanceRequests.createdAt));
  }

  static async createMaintenanceRequest(userId: string, data: any) {
    const tenant = await this.getTenantForUser(userId);
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    
    if (!lease) throw new Error('Cannot create maintenance request without an active lease');
    
    const unit = (await db.select().from(units).where(eq(units.id, lease.unitId)))[0];

    const [newRequest] = await db.insert(maintenanceRequests).values({
      organizationId: tenant.organizationId,
      unitId: unit.id,
      buildingId: unit.buildingId,
      tenantId: tenant.id,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'PENDING',
      reportedBy: tenant.fullName,
      photoUrl: data.photoUrl,
    }).returning();

    return newRequest;
  }

  static async getNotifications(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    // Usually notifications are tied to user, so we use userId.
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
}

