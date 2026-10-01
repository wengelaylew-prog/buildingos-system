import { Router } from 'express';
import { db } from '../../db/index.ts';
import { emergencyAlerts, tenants, telegramAccounts, users, organizations } from '../../db/schema.ts';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { authenticate } from '../../middleware/auth.ts';
import { MessagingService } from '../messaging/messaging.service.ts';
import { TurnstileService } from './turnstile.service.ts'; // For auto-unlock

export const emergencyRouter = Router();

// 1. TRIGGER FIRE ALARM (IoT or Guard)
emergencyRouter.post('/fire', authenticate, async (req: any, res) => {
  try {
    const { buildingId, locationDetails, severity = 'HIGH' } = req.body;
    const organizationId = req.user.organizationId;

    // Log the emergency
    const [alert] = await db.insert(emergencyAlerts).values({
      organizationId,
      buildingId,
      type: 'FIRE',
      status: 'ACTIVE',
      locationDetails: locationDetails || 'Unknown Location'
    }).returning();

    // Fetch all tenants in the organization to notify them
    // In a real scenario, we might filter by buildingId if provided
    let tenantQuery = db.select({ id: tenants.userId }).from(tenants).where(eq(tenants.organizationId, organizationId));
    
    // Also notify security/admin staff
    let staffQuery = db.select({ id: users.id }).from(users).where(eq(users.organizationId, organizationId));

    const [tenantList, staffList] = await Promise.all([tenantQuery, staffQuery]);
    
    // Combine unique user IDs
    const userIdsToNotify = [...new Set([
      ...tenantList.filter(t => t.id).map(t => t.id as string),
      ...staffList.map(s => s.id)
    ])];

    // Trigger Telegram Broadcasts
    console.log(`🚨 Triggering MASS EVACUATION to ${userIdsToNotify.length} users!`);
    for (const userId of userIdsToNotify) {
      await MessagingService.sendNotification({
        organizationId,
        userId,
        title: '🚨 FIRE ALARM / EVACUATE 🚨',
        message: `FIRE DETECTED at ${locationDetails || 'your building'}. PLEASE EVACUATE IMMEDIATELY. DO NOT USE ELEVATORS.`,
        type: 'EMERGENCY',
        deliveryChannels: ['IN_APP', 'EMAIL', 'SMS'] // Handled by our messaging layer, which falls back to Telegram
      }).catch(console.error);
    }

    // Auto-unlock Turnstiles for Evacuation
    try {
       await TurnstileService.triggerEvacuationMode(organizationId);
    } catch(e) {
       console.error("Failed to auto-unlock turnstiles:", e);
    }

    res.json({ success: true, alert, message: 'Emergency triggered and mass notifications sent.' });
  } catch (err: any) {
    console.error('Emergency Trigger Error:', err);
    res.status(500).json({ success: false, message: 'Failed to trigger emergency' });
  }
});

// 2. GET ACTIVE EMERGENCIES (For Security Kiosk Polling)
emergencyRouter.get('/active', authenticate, async (req: any, res) => {
  try {
    const activeAlerts = await db.select().from(emergencyAlerts)
      .where(and(
        eq(emergencyAlerts.organizationId, req.user.organizationId),
        eq(emergencyAlerts.status, 'ACTIVE')
      ))
      .orderBy(desc(emergencyAlerts.reportedAt));
      
    res.json({ success: true, data: activeAlerts });
  } catch(err) {
    res.status(500).json({ success: false });
  }
});

// 3. RESOLVE EMERGENCY
emergencyRouter.post('/:id/resolve', authenticate, async (req: any, res) => {
  try {
    const [alert] = await db.update(emergencyAlerts)
      .set({ 
        status: 'RESOLVED', 
        resolvedAt: new Date(),
        resolvedBy: req.user.id
      })
      .where(and(
        eq(emergencyAlerts.id, req.params.id),
        eq(emergencyAlerts.organizationId, req.user.organizationId)
      )).returning();
      
    // Re-lock turnstiles
    try {
      await TurnstileService.normalizeTurnstiles(req.user.organizationId);
    } catch (e) {}
    
    res.json({ success: true, alert });
  } catch(err) {
    res.status(500).json({ success: false });
  }
});
