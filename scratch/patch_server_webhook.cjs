const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('webhookRouter')) {
  // Add import
  code = code.replace(
    "import { billingRouter } from './src/modules/billing/billing.routes';",
    "import { billingRouter } from './src/modules/billing/billing.routes';\nimport { webhookRouter } from './src/modules/billing/webhook.routes';"
  );

  // Add mount
  code = code.replace(
    "app.use('/api/v1/billing', billingRouter);",
    "app.use('/api/v1/billing', billingRouter);\n  app.use('/api/v1/webhooks', webhookRouter);"
  );

  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts");
} else {
  console.log("Already patched");
}

