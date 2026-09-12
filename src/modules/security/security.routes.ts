import { Router } from 'express';
import { db } from '../../db/index.ts';
import { gatePasses, securityLogs } from '../../db/schema.ts';
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
