const fs = require('fs');
let code = fs.readFileSync('src/modules/billing/utility.service.ts', 'utf8');
code = code.replace('invoices,\\n  invoiceItems,', 'invoices,\\n  invoiceItems,'); 
// wait, the literal string is: "invoices,\\n  invoiceItems,"
code = code.replace('invoices,\\n  invoiceItems,', 'invoices, invoiceItems,');
fs.writeFileSync('src/modules/billing/utility.service.ts', code);

