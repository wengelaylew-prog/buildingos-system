const fs = require('fs');

let service = fs.readFileSync('src/modules/billing/billing.service.ts', 'utf8');

// Update imports
if (!service.includes('invoiceItems')) {
  service = service.replace(
    "import { invoices, contracts, tenants, units } from '../../db/schema.ts';",
    "import { invoices, invoiceItems, contracts, tenants, units } from '../../db/schema.ts';"
  );
}

// Update generateRecurringInvoices
if (!service.includes('await db.insert(invoiceItems).values({')) {
  // We need to capture the generated randomUUID() for the invoice so we can use it in invoiceItems.
  
  // Replace the RENT invoice insert
  const rentInsertTarget = `        await db.insert(invoices).values({
          id: randomUUID(),
          organizationId,
          contractId: contract.id,
          tenantId: contract.tenantId,
          unitId: contract.unitId,
          invoiceNumber: \`INV-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
          type: 'RENT',
          amount: contract.monthlyRent,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          lateFeeApplied: false
        });`;
        
  const rentInsertReplacement = `        const newInvoiceId = randomUUID();
        await db.insert(invoices).values({
          id: newInvoiceId,
          organizationId,
          contractId: contract.id,
          tenantId: contract.tenantId,
          unitId: contract.unitId,
          invoiceNumber: \`INV-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
          type: 'RENT',
          amount: contract.monthlyRent,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          lateFeeApplied: false
        });
        
        await db.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId: newInvoiceId,
          description: \`Monthly Rent - \${currentMonth}\`,
          amount: contract.monthlyRent,
          type: 'RENT'
        });`;
        
  service = service.replace(rentInsertTarget, rentInsertReplacement);
  
  // Replace the LATE_FEE invoice insert
  const feeInsertTarget = `      await db.insert(invoices).values({
        id: randomUUID(),
        organizationId,
        contractId: inv.contractId,
        tenantId: inv.tenantId,
        unitId: inv.unitId,
        invoiceNumber: \`LF-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
        type: 'LATE_FEE',
        amount: lateFeeAmount,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        lateFeeApplied: false
      });`;
      
  const feeInsertReplacement = `      const lateFeeInvoiceId = randomUUID();
      await db.insert(invoices).values({
        id: lateFeeInvoiceId,
        organizationId,
        contractId: inv.contractId,
        tenantId: inv.tenantId,
        unitId: inv.unitId,
        invoiceNumber: \`LF-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
        type: 'LATE_FEE',
        amount: lateFeeAmount,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        lateFeeApplied: false
      });

      await db.insert(invoiceItems).values({
        id: randomUUID(),
        invoiceId: lateFeeInvoiceId,
        description: \`Late Fee (5%) for Invoice \${inv.invoiceNumber}\`,
        amount: lateFeeAmount,
        type: 'LATE_FEE'
      });`;
      
  service = service.replace(feeInsertTarget, feeInsertReplacement);
  
  fs.writeFileSync('src/modules/billing/billing.service.ts', service);
  console.log('billing.service.ts patched.');
} else {
  console.log('Already patched.');
}

