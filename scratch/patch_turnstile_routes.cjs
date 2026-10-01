const fs = require('fs');

let code = fs.readFileSync('src/modules/security/security.routes.ts', 'utf8');

// Import TurnstileService
const importTarget = `import { authenticate, requirePermission } from '../../middleware/auth.ts';`;
const importReplacement = `import { authenticate, requirePermission } from '../../middleware/auth.ts';
import { TurnstileService } from './turnstile.service.ts';`;

if (!code.includes('TurnstileService')) {
  code = code.replace(importTarget, importReplacement);
}

// 1. Digital ID
const didTarget = `res.json({ success: true, data: { tenant, activeLease } });`;
const didReplacement = `if (req.body.gateIp) {
      await TurnstileService.triggerRelay(req.body.gateIp, direction);
    }
    res.json({ success: true, data: { tenant, activeLease } });`;
if (!code.includes('req.body.gateIp') && code.includes(didTarget)) {
  code = code.replace(didTarget, didReplacement);
}

// 2. Shopper Scan IN
const shopperInTarget = `return res.json({ success: true, data: newShopper[0], message: 'Shopper entry recorded.' });`;
const shopperInReplacement = `if (req.body.gateIp) {
        await TurnstileService.triggerRelay(req.body.gateIp, 'IN');
      }
      return res.json({ success: true, data: newShopper[0], message: 'Shopper entry recorded.' });`;
if (code.includes(shopperInTarget)) {
  code = code.replace(shopperInTarget, shopperInReplacement);
}

// 3. Shopper Scan OUT
const shopperOutTarget = `return res.json({ success: true, data: { erased: true }, message: 'Shopper exited and data erased.' });`;
const shopperOutReplacement = `if (req.body.gateIp) {
        await TurnstileService.triggerRelay(req.body.gateIp, 'OUT');
      }
      return res.json({ success: true, data: { erased: true }, message: 'Shopper exited and data erased.' });`;
if (code.includes(shopperOutTarget)) {
  code = code.replace(shopperOutTarget, shopperOutReplacement);
}

// 4. Gate Pass
const gatePassTarget = `res.json({ success: true, data: pass });`;
const gatePassReplacement = `if (req.body.gateIp) {
      await TurnstileService.triggerRelay(req.body.gateIp, pass.direction as 'IN'|'OUT');
    }
    res.json({ success: true, data: pass });`;
if (!code.includes('pass.direction as') && code.includes(gatePassTarget)) {
  code = code.replace(gatePassTarget, gatePassReplacement);
}

fs.writeFileSync('src/modules/security/security.routes.ts', code);
console.log('security.routes.ts patched for Turnstile IoT integration.');

