import { db } from '../../db/index.ts';
import { tenants, tenantUnits, units, buildings, floors, contracts, maintenanceRequests, notifications, payments, invoices, receipts, telegramAccounts, users } from '../../db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import { validateTelegramWebAppData } from '../../lib/telegram.ts';
import { MessagingService } from '../messaging/messaging.service.ts';

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
    // SECURITY: never fall back to a guessable bot token in production (see middleware/auth.ts).
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram authentication is not configured');
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
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

    const allInvoices = await db.select().from(invoices)
      .where(eq(invoices.tenantId, tenant.id))
      .orderBy(desc(invoices.dueDate));

    const outstandingInvoices = allInvoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
    const balance = outstandingInvoices.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);

    // Current invoice: the earliest-due unpaid invoice, falling back to the most recent invoice
    const currentInvoice =
      outstandingInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || allInvoices[0] || null;

    return {
      balance,
      currentInvoice,
      payments: allPayments,
    };
  }

  static async getInvoiceDetail(userId: string, invoiceId: string) {
    const tenant = await this.getTenantForUser(userId);

    // Ownership is enforced in the query itself — never trust invoiceId alone.
    const invoice = (await db.select().from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenant.id))))[0];
    if (!invoice) throw new Error('Invoice not found');

    const unit = invoice.unitId ? (await db.select().from(units).where(eq(units.id, invoice.unitId)))[0] : null;
    const building = unit ? (await db.select().from(buildings).where(eq(buildings.id, unit.buildingId)))[0] : null;

    // Group sibling invoices from the same contract & billing period (issue month) into a single readable breakdown.
    const billingPeriod = invoice.issueDate.slice(0, 7);
    const periodInvoices = invoice.contractId
      ? await db.select().from(invoices).where(
          and(eq(invoices.contractId, invoice.contractId), sql`issue_date LIKE ${billingPeriod + '%'}`)
        )
      : [invoice];

    const sumByType = (type: string) =>
      periodInvoices.filter((i) => i.type === type).reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);

    const rent = sumByType('RENT');
    const utilities = sumByType('UTILITY');
    const lateFees = sumByType('LATE_FEE');
    const discounts = 0; // Not yet tracked as a distinct invoice type in the data model
    const total = periodInvoices.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);

    const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, invoice.id));
    const amountPaid = invoicePayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const remainingBalance = Math.max(0, parseFloat(invoice.amount || '0') - amountPaid);

    let receiptUrl: string | null = null;
    const paidPayment = invoicePayments.find((p) => p.status === 'PAID');
    if (paidPayment) {
      const receipt = (await db.select().from(receipts).where(eq(receipts.paymentId, paidPayment.id)))[0];
      receiptUrl = receipt?.receiptUrl || null;
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      billingPeriod,
      tenantName: tenant.fullName,
      buildingName: building?.name || 'N/A',
      unitNumber: unit?.unitNumber || 'N/A',
      rent,
      utilities,
      lateFees,
      discounts,
      total,
      amountPaid,
      remainingBalance,
      dueDate: invoice.dueDate,
      status: invoice.status,
      receiptUrl,
    };
  }

  static async getPaymentStatus(userId: string, paymentId: string) {
    const tenant = await this.getTenantForUser(userId);

    // Ownership is enforced in the query itself — never trust paymentId alone.
    const payment = (await db.select().from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.tenantId, tenant.id))))[0];
    if (!payment) throw new Error('Payment not found');

    const invoice = payment.invoiceId
      ? (await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId)))[0]
      : null;

    // The DB only records the statuses actually produced by the system today (PAID/PENDING/OVERDUE).
    // PROCESSING/FAILED/CANCELLED will populate once the Phase 5 gateway webhook is live —
    // the status shown here always reflects real backend state, never a frontend assumption.
    let status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
    if (payment.status === 'PAID') {
      status = 'PAID';
    } else if (payment.status === 'OVERDUE') {
      status = 'EXPIRED';
    } else {
      status = 'PENDING';
    }

    let receiptUrl: string | null = null;
    if (status === 'PAID') {
      const receipt = (await db.select().from(receipts).where(eq(receipts.paymentId, payment.id)))[0];
      receiptUrl = receipt?.receiptUrl || null;
    }

    const RETRYABLE_STATUSES: readonly string[] = ['FAILED', 'CANCELLED', 'EXPIRED'];

    return {
      id: payment.id,
      amount: payment.amount,
      invoiceId: payment.invoiceId,
      invoiceNumber: invoice?.invoiceNumber || null,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      paymentDate: payment.paymentDate,
      status,
      canRetry: RETRYABLE_STATUSES.includes(status),
      receiptUrl,
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

  static async markNotificationRead(userId: string, notificationId: string) {
    // Ownership (eq(notifications.userId, userId)) is enforced inside MessagingService — never trust notificationId alone.
    return MessagingService.markNotificationRead(notificationId, userId);
  }

  static async getProfile(userId: string) {
    const tenant = await this.getTenantForUser(userId);
    const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

    const lease = (await db.select().from(contracts)
      .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.contractStatus, 'ACTIVE'))))[0];

    let unit = null;
    let building = null;
    if (lease) {
      unit = (await db.select().from(units).where(eq(units.id, lease.unitId)))[0] || null;
      if (unit) {
        building = (await db.select().from(buildings).where(eq(buildings.id, unit.buildingId)))[0] || null;
      }
    }

    const telegramAccount = (await db.select().from(telegramAccounts).where(eq(telegramAccounts.userId, userId)))[0];

    return {
      fullName: tenant.fullName,
      email: user?.email || tenant.email || null,
      phone: tenant.phone || null,
      buildingName: building?.name || null,
      unitNumber: unit?.unitNumber || null,
      accountStatus: user?.isActive === false ? 'INACTIVE' : 'ACTIVE',
      emergencyContactName: tenant.emergencyContactName || null,
      emergencyContactPhone: tenant.emergencyContactPhone || null,
      telegramUsername: telegramAccount?.username || null,
      telegramLinkedAt: telegramAccount?.createdAt || null,
    };
  }

  static async disconnectTelegram(userId: string) {
    // Ownership enforced by scoping the delete to the caller's own userId.
    await db.delete(telegramAccounts).where(eq(telegramAccounts.userId, userId));
    return { disconnected: true };
  }
}

