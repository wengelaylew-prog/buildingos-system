import { db } from '../../db/index.ts';
import { messages, notifications, users } from '../../db/schema.ts';
import { eq, and, desc, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class MessagingService {
  static async sendMessage(data: {
    organizationId: string;
    senderId: string;
    receiverId?: string;
    tenantId?: string;
    unitId?: string;
    maintenanceRequestId?: string;
    content: string;
  }) {
    const id = randomUUID();
    await db.insert(messages).values({
      id,
      ...data,
      isRead: false,
    });
    return { id };
  }

  static async getAnnouncements(organizationId: string) {
    const { announcements } = await import('../../db/schema.ts');
    return db.select().from(announcements)
      .where(eq(announcements.organizationId, organizationId))
      .orderBy(desc(announcements.createdAt));
  }

  static async createAnnouncement(data: {
    organizationId: string;
    title: string;
    message: string;
    targetAudience: 'ALL' | 'BUILDING' | 'FLOOR';
    targetId?: string;
    createdBy: string;
  }) {
    const { announcements } = await import('../../db/schema.ts');
    const result = await db.insert(announcements).values(data).returning();
    return result[0];
  }

  static async getMessages(organizationId: string, userId: string) {
    // For MVP: Fetch all messages where user is sender or receiver within the org.
    const results = await db.select({
      message: messages,
      sender: { id: users.id, fullName: users.fullName, email: users.email },
    }).from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.organizationId, organizationId),
          or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(desc(messages.createdAt));

    return results.map(r => ({ ...r.message, sender: r.sender }));
  }

  static async sendNotification(data: {
    organizationId: string;
    userId: string;
    title: string;
    message: string;
    type?: string;
    deliveryChannels?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const id = randomUUID();
    
    // Webhook/Architecture readiness for external providers
    if (data.deliveryChannels?.includes('EMAIL')) {
      console.log(`[Email Integration] Sending email to User ${data.userId}: ${data.title}`);
    }
    if (data.deliveryChannels?.includes('SMS')) {
      console.log(`[SMS/Telegram Hook] Dispatching SMS to User ${data.userId}: ${data.title}`);
    }

    await db.insert(notifications).values({
      id,
      organizationId: data.organizationId,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
      deliveryChannels: data.deliveryChannels ? JSON.stringify(data.deliveryChannels) : '["IN_APP"]',
      relatedEntityType: data.relatedEntityType || null,
      relatedEntityId: data.relatedEntityId || null,
      isRead: false,
    });
    return { id };
  }

  static async getUserNotifications(organizationId: string, userId: string) {
    return await db.select().from(notifications)
      .where(and(eq(notifications.organizationId, organizationId), eq(notifications.userId, userId)))
      .orderBy(desc(notifications.createdAt));
  }

  static async markNotificationRead(id: string, userId: string) {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return { success: true };
  }
}

