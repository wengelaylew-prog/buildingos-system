const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importRegex = /import \{ billingRouter \} from '.*?billing\.routes';/;
const match = code.match(importRegex);
if (match) {
    code = code.replace(match[0], match[0] + "\nimport { webhookRouter } from './src/modules/billing/webhook.routes';");
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts imports");
} else {
    code = "import { webhookRouter } from './src/modules/billing/webhook.routes';\n" + code;
    fs.writeFileSync('server.ts', code);
    console.log("Prepended to server.ts imports");
}

