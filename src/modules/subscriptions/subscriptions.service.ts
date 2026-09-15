import { db } from '../../db/index.ts';
import { subscriptionRequests, organizations } from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { storageService } from '../../services/storage/StorageService.ts';

export class SubscriptionsService {
  static async submitCheckout(
    organizationId: string,
    plan: 'MONTHLY' | 'BI_ANNUAL' | 'YEARLY',
    transactionCode: string,
    receiptFile: any
  ) {
    // 1. Upload receipt image
    const uploadResult = await storageService.upload({
      name: receiptFile.originalname || 'receipt.png',
      type: receiptFile.mimetype || 'image/png',
      size: receiptFile.size || 0
    });
    const receiptUrl = uploadResult.url;

    // 2. Create subscription request
    const request = await db.insert(subscriptionRequests).values({
      organizationId,
      plan,
      transactionCode,
      receiptUrl,
      status: 'PENDING_VERIFICATION'
    }).returning();

    // 3. Update organization status
    await db.update(organizations)
      .set({ subscriptionStatus: 'PENDING_VERIFICATION' })
      .where(eq(organizations.id, organizationId));

    return request[0];
  }

  static async getPendingRequests() {
    // Left join with organizations to get org details
    return await db.select({
      id: subscriptionRequests.id,
      plan: subscriptionRequests.plan,
      transactionCode: subscriptionRequests.transactionCode,
      receiptUrl: subscriptionRequests.receiptUrl,
      status: subscriptionRequests.status,
      createdAt: subscriptionRequests.createdAt,
      organization: {
        id: organizations.id,
        name: organizations.name,
        code: organizations.code,
      }
    })
    .from(subscriptionRequests)
    .innerJoin(organizations, eq(subscriptionRequests.organizationId, organizations.id))
    .where(eq(subscriptionRequests.status, 'PENDING_VERIFICATION'))
    .orderBy(desc(subscriptionRequests.createdAt));
  }

  static async approveRequest(requestId: string, adminId: string) {
    const [request] = await db.select().from(subscriptionRequests).where(eq(subscriptionRequests.id, requestId));
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING_VERIFICATION') throw new Error('Request is not pending');
    // Calculate new end date based on plan
    const endDate = new Date();
    const p = request.plan.toUpperCase();
    if (p.includes('MONTHLY') || p.includes('BASIC')) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (p.includes('BI_ANNUAL') || p.includes('STANDARD')) {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (p.includes('YEARLY') || p.includes('PREMIUM')) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Default to 1 year
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update Request
    await db.update(subscriptionRequests).set({
      status: 'APPROVED',
      reviewedBy: adminId,
      updatedAt: new Date(),
    }).where(eq(subscriptionRequests.id, requestId));

    // Update Organization
    await db.update(organizations).set({
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: request.plan,
      subscriptionEndDate: endDate,
      updatedAt: new Date(),
    }).where(eq(organizations.id, request.organizationId));

    return true;
  }

  static async rejectRequest(requestId: string, adminId: string, notes: string) {
    const [request] = await db.select().from(subscriptionRequests).where(eq(subscriptionRequests.id, requestId));
    if (!request) throw new Error('Request not found');

    await db.update(subscriptionRequests).set({
      status: 'REJECTED',
      reviewedBy: adminId,
      notes,
      updatedAt: new Date(),
    }).where(eq(subscriptionRequests.id, requestId));

    await db.update(organizations).set({
      subscriptionStatus: 'PAST_DUE',
      updatedAt: new Date(),
    }).where(eq(organizations.id, request.organizationId));

    return true;
  }
}

