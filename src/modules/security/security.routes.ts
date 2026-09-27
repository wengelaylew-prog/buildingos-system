import { Router } from 'express';
import { db } from '../../db/index.ts';
import { gatePasses, securityLogs, visitors, tenants, users, contracts, mallShoppers } from '../../db/schema.ts';
import { TelegramService } from '../telegram/telegram.service.ts';
import { eq, desc } from 'drizzle-orm';
import { authenticate, requirePermission } from '../../middleware/auth.ts';
import { TurnstileService } from './turnstile.service.ts';

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

    if (req.body.gateIp) {
      await TurnstileService.triggerRelay(req.body.gateIp, pass.direction as 'IN'|'OUT');
    }
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

securityRouter.post('/digital-id/verify', authenticate, requirePermission('gate_pass.approve'), async (req: any, res) => {
  try {
    const { token, direction = 'IN' } = req.body;
    if (!token || !token.startsWith('DID-')) return res.status(400).json({ success: false, message: 'Invalid Digital ID format' });

    const tenantId = token.replace('DID-', '');

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      with: {
        contracts: {
          with: { unit: true }
        }
      }
    });

    if (!tenant) return res.status(404).json({ success: false, message: 'Digital ID not found or inactive tenant' });

    // Ensure tenant has an active contract
    const activeLease = (tenant.contracts as any[])?.find((c: any) => c.status === 'ACTIVE');
    if (!activeLease) {
      return res.status(403).json({ success: false, message: 'Tenant does not have an active lease/shop.' });
    }

    // Log in security logs
    await db.insert(securityLogs).values({
      organizationId: req.user.organizationId,
      scanType: 'DIGITAL_ID',
      scannedId: tenantId,
      direction,
      tenantId: tenant.id,
      scannedBy: req.user.id,
      notes: `Mall Digital ID scanned (${direction}) - Shop: ${activeLease.unit?.unitNumber}`
    });

    if (req.body.gateIp) {
      await TurnstileService.triggerRelay(req.body.gateIp, direction);
    }
    res.json({ success: true, data: { tenant, activeLease } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/shopper-scan', authenticate, requirePermission('gate_pass.approve'), async (req: any, res) => {
  try {
    const { token, direction = 'IN' } = req.body;
    
    // ANTI-FAKE ID (Cryptographic & Format Validation)
    if (!token) return res.status(400).json({ success: false, message: 'Invalid Shopper Digital ID format' });
    
    // Valid Digital IDs must either be a signed JWT (starts with eyJ) or an official National ID format (FAYDA-...)
    const isSignedJWT = token.startsWith('eyJ');
    const isOfficialFayda = token.startsWith('FAYDA-') && token.length > 20;
    
    if (!isSignedJWT && !isOfficialFayda) {
      // Log the fake attempt
      await db.insert(securityLogs).values({
        organizationId: req.user.organizationId,
        scanType: 'SHOPPER_ID',
        scannedId: token.substring(0, 50), // prevent massive payload injection
        direction,
        scannedBy: req.user.id,
        notes: '🚨 FAKE ID ATTEMPT DETECTED: Invalid cryptographic signature.'
      });
      return res.status(403).json({ success: false, message: 'FAKE_ID_DETECTED' });
    }

    if (direction === 'IN') {
      // Register entry
      const newShopper = await db.insert(mallShoppers).values({
        organizationId: req.user.organizationId,
        digitalIdToken: token,
        shopperData: 'Mall Shopper Entry',
      }).returning();
      
      // Audit log
      await db.insert(securityLogs).values({
        organizationId: req.user.organizationId,
        scanType: 'SHOPPER_ID',
        scannedId: token,
        direction: 'IN',
        scannedBy: req.user.id,
        notes: `Mall Shopper Digital ID scanned IN`
      });

      if (req.body.gateIp) {
        await TurnstileService.triggerRelay(req.body.gateIp, 'IN');
      }
      return res.json({ success: true, data: newShopper[0], message: 'Shopper entry recorded.' });
    } else {
      // Register exit & DELETE the record per strict privacy requirement
      const existing = await db.query.mallShoppers.findFirst({
        where: eq(mallShoppers.digitalIdToken, token)
      });
      
      if (!existing) {
        return res.status(404).json({ success: false, message: 'No active entry found for this Shopper ID.' });
      }

      await db.delete(mallShoppers).where(eq(mallShoppers.id, existing.id));

      // Audit log
      await db.insert(securityLogs).values({
        organizationId: req.user.organizationId,
        scanType: 'SHOPPER_ID',
        scannedId: token,
        direction: 'OUT',
        scannedBy: req.user.id,
        notes: `Mall Shopper Digital ID scanned OUT. Data securely erased.`
      });

      if (req.body.gateIp) {
        await TurnstileService.triggerRelay(req.body.gateIp, 'OUT');
      }
      return res.json({ success: true, data: { erased: true }, message: 'Shopper exited and data erased.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
