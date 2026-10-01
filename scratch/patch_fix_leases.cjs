const fs = require('fs');
let code = fs.readFileSync('src/modules/security/security.routes.ts', 'utf8');

// Replace import
code = code.replace(', leases', ', contracts');

// Replace relations in digital-id route
const badRel = `with: {
        leases: {
          with: { unit: true }
        }
      }`;
const goodRel = `with: {
        contracts: {
          with: { unit: true }
        }
      }`;
code = code.replace(badRel, goodRel);

// Replace mapping logic
const badLogic = `    // Ensure tenant has an active lease
    const activeLease = tenant.leases?.find((l: any) => l.status === 'ACTIVE');
    if (!activeLease) {
      return res.status(403).json({ success: false, message: 'Tenant does not have an active lease/shop.' });
    }`;
const goodLogic = `    // Ensure tenant has an active contract
    const activeLease = (tenant.contracts as any[])?.find((c: any) => c.status === 'ACTIVE');
    if (!activeLease) {
      return res.status(403).json({ success: false, message: 'Tenant does not have an active lease/shop.' });
    }`;
code = code.replace(badLogic, goodLogic);

fs.writeFileSync('src/modules/security/security.routes.ts', code);
console.log('Fixed contracts relation in security.routes.ts');

