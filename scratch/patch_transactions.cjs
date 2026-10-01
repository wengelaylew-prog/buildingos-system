const fs = require('fs');

// 1. PATCH BILLING SERVICE
let billingCode = fs.readFileSync('src/modules/billing/billing.service.ts', 'utf8');

const rentTarget = `        const newInvoiceId = randomUUID();
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

const rentReplacement = `        const newInvoiceId = randomUUID();
        await db.transaction(async (tx) => {
          await tx.insert(invoices).values({
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
          
          await tx.insert(invoiceItems).values({
            id: randomUUID(),
            invoiceId: newInvoiceId,
            description: \`Monthly Rent - \${currentMonth}\`,
            amount: contract.monthlyRent,
            type: 'RENT'
          });
        });`;
billingCode = billingCode.replace(rentTarget, rentReplacement);

const lateTarget = `      const lateFeeInvoiceId = randomUUID();
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

const lateReplacement = `      const lateFeeInvoiceId = randomUUID();
      await db.transaction(async (tx) => {
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
      });`;
billingCode = billingCode.replace(lateTarget, lateReplacement);

fs.writeFileSync('src/modules/billing/billing.service.ts', billingCode);

// 2. PATCH UTILITY SERVICE
let utilityCode = fs.readFileSync('src/modules/billing/utility.service.ts', 'utf8');

if (!utilityCode.includes('import { invoiceItems')) {
  utilityCode = utilityCode.replace(`import { invoices, utilityBills, utilityReadings`, `import { invoices, invoiceItems, utilityBills, utilityReadings`);
}

const utilGenTarget1 = `    // Create the utility invoice in the invoices table
    let invoiceId: string | null = null;
    if (contract) {
      const [invoice] = await db.insert(invoices).values({
        id: randomUUID(),
        organizationId,
        contractId: contract.id,
        tenantId: contract.tenantId,
        unitId,
        invoiceNumber: \`INV-UTIL-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
        type: 'UTILITY',
        amount: String(totalAmount),
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: dueDate(dueDaysFromNow),
        status: 'PENDING',
        lateFeeApplied: false,
      }).returning();
      invoiceId = invoice.id;
    }`;

const utilGenReplacement1 = `    // Create the utility invoice & invoice items atomically
    let invoiceId: string | null = null;
    if (contract) {
      invoiceId = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(invoices).values({
          id: invoiceId as string,
          organizationId,
          contractId: contract.id,
          tenantId: contract.tenantId,
          unitId,
          invoiceNumber: \`INV-UTIL-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
          type: 'UTILITY',
          amount: String(totalAmount),
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: dueDate(dueDaysFromNow),
          status: 'PENDING',
          lateFeeApplied: false,
        });
        await tx.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId: invoiceId as string,
          description: \`Utility Bill (\${utilityType}) - \${billingPeriod}\`,
          amount: String(totalAmount),
          type: 'UTILITY'
        });
      });
    }`;

const utilGenTarget2 = `          const [invoice] = await db.insert(invoices).values({
            id: randomUUID(),
            organizationId,
            contractId: contract.id,
            tenantId: contract.tenantId,
            unitId: targetUnitId,
            invoiceNumber: \`INV-UTIL-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
            type: 'UTILITY',
            amount: String(totalAmount),
            issueDate: new Date().toISOString().slice(0, 10),
            dueDate: dueDate(dueDaysFromNow),
            status: 'PENDING',
            lateFeeApplied: false,
          }).returning();
          invoiceId = invoice.id;`;

const utilGenReplacement2 = `          invoiceId = randomUUID();
          await db.transaction(async (tx) => {
            await tx.insert(invoices).values({
              id: invoiceId as string,
              organizationId,
              contractId: contract.id,
              tenantId: contract.tenantId,
              unitId: targetUnitId,
              invoiceNumber: \`INV-UTIL-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
              type: 'UTILITY',
              amount: String(totalAmount),
              issueDate: new Date().toISOString().slice(0, 10),
              dueDate: dueDate(dueDaysFromNow),
              status: 'PENDING',
              lateFeeApplied: false,
            });
            await tx.insert(invoiceItems).values({
              id: randomUUID(),
              invoiceId: invoiceId as string,
              description: \`Utility Bill (Shared \${utilityType}) - \${billingPeriod}\`,
              amount: String(totalAmount),
              type: 'UTILITY'
            });
          });`;

utilityCode = utilityCode.replace(utilGenTarget1, utilGenReplacement1);
utilityCode = utilityCode.replace(utilGenTarget2, utilGenReplacement2);
utilityCode = utilityCode.replace(utilGenTarget2, utilGenReplacement2); // There are two occurrences of the shared one

fs.writeFileSync('src/modules/billing/utility.service.ts', utilityCode);

// 3. PATCH MAINTENANCE SERVICE
let maintCode = fs.readFileSync('src/modules/maintenance/maintenance.service.ts', 'utf8');

if (!maintCode.includes('import { invoiceItems')) {
  maintCode = maintCode.replace(`import { maintenanceRequests`, `import { invoiceItems, maintenanceRequests`);
}

const maintTarget = `    // Optional integration with billing for billable repairs
    if (data.isBillable && data.cost && data.status === 'RESOLVED' && !invoiceId && req[0].tenantId) {
      invoiceId = randomUUID();
      await db.insert(invoices).values({
        id: invoiceId,
        organizationId,
        contractId: null as any, // Ad-hoc maintenance invoices may not link to a contract directly
        tenantId: req[0].tenantId,
        unitId: req[0].unitId,
        invoiceNumber: \`MAINT-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
        type: 'OTHER',
        amount: String(data.cost),
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        lateFeeApplied: false
      });
    }`;

const maintReplacement = `    // Optional integration with billing for billable repairs
    if (data.isBillable && data.cost && data.status === 'RESOLVED' && !invoiceId && req[0].tenantId) {
      invoiceId = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(invoices).values({
          id: invoiceId as string,
          organizationId,
          contractId: null as any, // Ad-hoc maintenance invoices may not link to a contract directly
          tenantId: req[0].tenantId,
          unitId: req[0].unitId,
          invoiceNumber: \`MAINT-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
          type: 'MAINTENANCE',
          amount: String(data.cost),
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          lateFeeApplied: false
        });
        await tx.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId: invoiceId as string,
          description: \`Maintenance Repair Fee - Request #\${req[0].id.substring(0,8)}\`,
          amount: String(data.cost),
          type: 'MAINTENANCE'
        });
      });
    }`;

maintCode = maintCode.replace(maintTarget, maintReplacement);

fs.writeFileSync('src/modules/maintenance/maintenance.service.ts', maintCode);
console.log('Services patched to use db.transaction and insert invoiceItems.');

