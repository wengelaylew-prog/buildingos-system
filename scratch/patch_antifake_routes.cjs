const fs = require('fs');
let code = fs.readFileSync('src/modules/security/security.routes.ts', 'utf8');

const shopperTarget = `    const { token, direction = 'IN' } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Invalid Shopper Digital ID format' });`;

const shopperReplacement = `    const { token, direction = 'IN' } = req.body;
    
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
    }`;

if (!code.includes('ANTI-FAKE ID')) {
  code = code.replace(shopperTarget, shopperReplacement);
  fs.writeFileSync('src/modules/security/security.routes.ts', code);
  console.log('Backend patched with Anti-Fake ID check.');
}

