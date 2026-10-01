const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('emergency.routes.ts')) {
  code = code.replace(
    "import { securityRouter } from './src/modules/security/security.routes.ts';", 
    "import { securityRouter } from './src/modules/security/security.routes.ts';\nimport { emergencyRouter } from './src/modules/security/emergency.routes.ts';"
  );
  
  code = code.replace(
    "app.use('/api/v1/security', securityRouter);",
    "app.use('/api/v1/security', securityRouter);\n  app.use('/api/v1/emergency', emergencyRouter);"
  );
  
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts successfully");
} else {
  console.log("Already patched");
}
