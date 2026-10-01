const fs = require('fs');
let code = fs.readFileSync('src/modules/billing/billing.service.ts', 'utf8');

const target = `      await db.transaction(async (tx) => {
        await tx.insert(invoices).values({
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

        await tx.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId: lateFeeInvoiceId,
          description: \`Late Fee (5%) for Invoice \${inv.invoiceNumber}\`,
          amount: lateFeeAmount,
          type: 'LATE_FEE'
        });
      });
      await db.update(invoices)
        .set({ lateFeeApplied: true, status: 'OVERDUE' })
        .where(eq(invoices.id, inv.id));`;

const replacement = `      await db.transaction(async (tx) => {
        await tx.insert(invoices).values({
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

        await tx.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId: lateFeeInvoiceId,
          description: \`Late Fee (5%) for Invoice \${inv.invoiceNumber}\`,
          amount: lateFeeAmount,
          type: 'LATE_FEE'
        });
        
        await tx.update(invoices)
          .set({ lateFeeApplied: true, status: 'OVERDUE' })
          .where(eq(invoices.id, inv.id));
      });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/modules/billing/billing.service.ts', code);
console.log('Fixed late fee atomic transaction');

