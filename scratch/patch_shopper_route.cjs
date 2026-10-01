const fs = require('fs');
let code = fs.readFileSync('src/modules/security/security.routes.ts', 'utf8');

const importTarget = 'visitors, tenants, users, leases';
if (code.includes(importTarget)) {
  code = code.replace(importTarget, importTarget + ', mallShoppers');
} else {
  // Try to find the exact import and append it
  const match = code.match(/import\s+\{[^}]*\}\s+from\s+'..\/..\/db\/schema.ts';/);
  if (match && !match[0].includes('mallShoppers')) {
    code = code.replace(match[0], match[0].replace('}', ', mallShoppers }'));
  }
}

const shopperRoute = `
securityRouter.post('/shopper-scan', authenticate, requirePermission('gate_pass.approve'), async (req: any, res) => {
  try {
    const { token, direction = 'IN' } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Invalid Shopper Digital ID format' });

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
        notes: \`Mall Shopper Digital ID scanned IN\`
      });

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
        notes: \`Mall Shopper Digital ID scanned OUT. Data securely erased.\`
      });

      return res.json({ success: true, data: { erased: true }, message: 'Shopper exited and data erased.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;

if (!code.includes('/shopper-scan')) {
  code = code + '\\n' + shopperRoute;
  fs.writeFileSync('src/modules/security/security.routes.ts', code);
  console.log('Added shopper-scan route to security.routes.ts');
}

