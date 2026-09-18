import { Router } from 'express';
import { db } from '../../db/index.ts';
import { gatePasses, securityLogs, visitors, tenants, users } from '../../db/schema.ts';
import { TelegramService } from '../telegram/telegram.service.ts';
import { eq, desc } from 'drizzle-orm';
import { authenticate, requirePermission } from '../../middleware/auth.ts';

export const securityRouter = Router();

securityRouter.get('/gate-passes', authenticate, requirePermission('gate_pass.read'), async (req, res) => {
  try {
    const passes = await db.query.gatePasses.findMany({
      orderBy: [desc(gatePasses.requestedAt)],
      with: {
        tenant: true,
        unit: true,
      }
    });
    res.json({ success: true, data: passes });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/gate-passes', authenticate, requirePermission('gate_pass.create'), async (req: any, res) => {
  try {
    const { tenantId, unitId, direction, itemDescription, quantity } = req.body;
    const pass = await db.insert(gatePasses).values({
      tenantId,
      unitId,
      direction,
      itemDescription,
      quantity,
    }).returning();
    res.json({ success: true, data: pass[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.put('/gate-passes/:id/approve', authenticate, requirePermission('gate_pass.approve'), async (req: any, res) => {
  try {
    const pass = await db.update(gatePasses)
      .set({ status: 'APPROVED', approvedBy: req.user.id })
      .where(eq(gatePasses.id, req.params.id))
      .returning();
    res.json({ success: true, data: pass[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/logs', authenticate, requirePermission('security_log.create'), async (req: any, res) => {
  try {
    const { scanType, scannedId, direction, tenantId, gatePassId } = req.body;
    
    if (gatePassId) {
      await db.update(gatePasses).set({ status: 'COMPLETED' }).where(eq(gatePasses.id, gatePassId));
    }

    const log = await db.insert(securityLogs).values({
      organizationId: req.user.organizationId,
      scanType,
      scannedId,
      direction,
      tenantId,
      gatePassId,
      scannedBy: req.user.id,
    }).returning();
    res.json({ success: true, data: log[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


securityRouter.post('/gate-passes/verify', authenticate, requirePermission('gate_pass.approve'), async (req: any, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const pass = await db.query.gatePasses.findFirst({
      where: eq(gatePasses.token, token),
      with: { tenant: true, unit: true }
    });

    if (!pass) return res.status(404).json({ success: false, message: 'Invalid or expired Gate Pass' });
    if (pass.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Gate Pass already consumed' });

    // Mark as consumed
    await db.update(gatePasses).set({ status: 'COMPLETED', verifiedAt: new Date(), approvedBy: req.user.id }).where(eq(gatePasses.id, pass.id));
    
    // Log in security logs
    await db.insert(securityLogs).values({
      organizationId: req.user.organizationId,
      scanType: 'GATE_PASS',
      scannedId: token,
      direction: pass.direction,
      tenantId: pass.tenantId,
      gatePassId: pass.id,
      scannedBy: req.user.id,
    });

    res.json({ success: true, data: pass });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


securityRouter.post('/visitors/check-in', authenticate, requirePermission('security_log.create'), async (req: any, res) => {
  try {
    const { tenantId, name, phone, purpose } = req.body;
    
    const newVisitor = await db.insert(visitors).values({
      organizationId: req.user.organizationId,
      tenantId,
      name,
      phone,
      purpose,
      loggedBy: req.user.id,
    }).returning();

    const visitor = newVisitor[0];

    // Attempt to notify tenant via Telegram
    try {
      const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
      if (tenant && tenant.userId) {
         await TelegramService.sendVisitorApprovalRequest(tenant.userId, {
           visitorId: visitor.id,
           visitorName: name,
           purpose: purpose || 'Visit'
         });
      }
    } catch(e) {
      console.error('Failed to send telegram notification:', e);
    }

    res.json({ success: true, data: visitor });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.get('/visitors', authenticate, requirePermission('security_log.create'), async (req, res) => {
  try {
    const v = await db.query.visitors.findMany({
      orderBy: [desc(visitors.arrivedAt)],
      with: { tenant: true }
    });
    res.json({ success: true, data: v });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
