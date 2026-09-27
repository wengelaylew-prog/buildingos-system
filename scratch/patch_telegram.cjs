const fs = require('fs');
let code = fs.readFileSync('src/modules/telegram/telegram.service.ts', 'utf8');

const target = `    // Get outstanding balance
    const outstandingPayments = await db.select().from(payments)
      .where(and(eq(payments.tenantId, tenant.id), eq(payments.status, 'OVERDUE')));
    const balance = outstandingPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    // Get next payment (simplification: next pending)
    const pendingPayments = await db.select().from(payments)
      .where(and(eq(payments.tenantId, tenant.id), eq(payments.status, 'PENDING')))
      .orderBy(payments.paymentDate);
    const nextPayment = pendingPayments[0] || null;`;

const replacement = `    // Get outstanding balance (from invoices)
    const outstandingInvoices = await db.select().from(invoices)
      .where(and(eq(invoices.tenantId, tenant.id), sql\`status IN ('PENDING', 'OVERDUE', 'PARTIALLY_PAID')\`));
    const balance = outstandingInvoices.reduce((sum, i) => sum + (parseFloat(i.amount || '0') - parseFloat(i.paidAmount || '0')), 0);

    // Get next payment
    const pendingInvoices = outstandingInvoices
      .filter(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const nextInvoice = pendingInvoices[0] || null;`;

// Handle both \n and \r\n
code = code.replace(target.replace(/\r\n/g, '\n'), replacement);
code = code.replace(target.replace(/\n/g, '\r\n'), replacement);

// Fix nextPayment usage
code = code.replace('nextPaymentDate: nextPayment?.paymentDate || null,', 'nextPaymentDate: nextInvoice?.dueDate || null,');
code = code.replace('nextPaymentAmount: nextPayment?.amount || null,', 'nextPaymentAmount: nextInvoice ? (parseFloat(nextInvoice.amount || "0") - parseFloat(nextInvoice.paidAmount || "0")) : null,');

fs.writeFileSync('src/modules/telegram/telegram.service.ts', code);
console.log('patched');

