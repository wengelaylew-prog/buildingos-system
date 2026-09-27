const fs = require('fs');
let code = fs.readFileSync('src/modules/security/security.routes.ts', 'utf8');

// Ensure leases is imported
if (!code.includes(' leases,')) {
  code = code.replace('gatePasses, securityLogs, visitors, tenants, users', 'gatePasses, securityLogs, visitors, tenants, users, leases');
}

const digitalIdRoute = `
securityRouter.post('/digital-id/verify', authenticate, requirePermission('gate_pass.approve'), async (req: any, res) => {
  try {
    const { token, direction = 'IN' } = req.body;
    if (!token || !token.startsWith('DID-')) return res.status(400).json({ success: false, message: 'Invalid Digital ID format' });

    const tenantId = token.replace('DID-', '');

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      with: {
        leases: {
          with: { unit: true }
        }
      }
    });

    if (!tenant) return res.status(404).json({ success: false, message: 'Digital ID not found or inactive tenant' });

    // Ensure tenant has an active lease
    const activeLease = tenant.leases?.find((l: any) => l.status === 'ACTIVE');
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
      notes: \`Mall Digital ID scanned (\${direction}) - Shop: \${activeLease.unit?.unitNumber}\`
    });

    res.json({ success: true, data: { tenant, activeLease } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;

if (!code.includes('/digital-id/verify')) {
  code = code + '\\n' + digitalIdRoute;
  fs.writeFileSync('src/modules/security/security.routes.ts', code);
  console.log('security.routes.ts patched.');
}
