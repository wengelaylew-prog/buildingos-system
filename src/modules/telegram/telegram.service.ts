import { db } from '../../db/index.ts';
import { tenants, tenantUnits, units, buildings, contracts, maintenanceRequests, notifications, payments, invoices, telegramAccounts } from '../../db/schema.ts';
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

    return {
      tenantName: tenant.fullName,
      buildingName: bldgData?.name || 'N/A',
      unitNumber: unitData?.unitNumber || 'N/A',
      leaseStatus: lease?.contractStatus || 'No Active Lease',
      rentAmount: lease?.monthlyRent || '0',
      balance,
      nextPaymentDate: nextPayment?.paymentDate || null,
      nextPaymentAmount: nextPayment?.amount || null,
    };
  }

  static async getProperty(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    
    if (!lease) throw new Error('No active property found');

    const unit = (await db.select().from(units).where(eq(units.id, lease.unitId)))[0];
    const building = (await db.select().from(buildings).where(eq(buildings.id, unit.buildingId)))[0];

    return { building, unit };
  }

  static async getLease(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];
    
    if (!lease) throw new Error('No active lease found');
    return lease;
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

