const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes('securityEnhancedRouter')) {
  // Add import
  serverCode = serverCode.replace(
    `import { webhookRouter } from './src/modules/billing/webhook.routes';`,
    `import { webhookRouter } from './src/modules/billing/webhook.routes';\nimport { securityEnhancedRouter } from './src/modules/security/security-enhanced.routes';`
  );
  // Add route mount (after existing security router)
  serverCode = serverCode.replace(
    `app.use('/api/v1/security', securityRouter);`,
    `app.use('/api/v1/security', securityRouter);\n  app.use('/api/v1/security', securityEnhancedRouter);`
  );
  fs.writeFileSync('server.ts', serverCode);
  console.log('Patched server.ts with securityEnhancedRouter');
} else {
  console.log('Already patched');
}

