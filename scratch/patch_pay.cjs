const fs = require('fs');

const filePath = 'src/modules/telegram/telegram.service.ts';
let source = fs.readFileSync(filePath, 'utf8');

const target = `  static async payInvoice(userId: string, invoiceId: string, gateway: 'TELEBIRR' | 'CHAPA') {
    const tenant = await this.getTenantForUser(userId);
    
    // Verify invoice belongs to tenant
    const invList = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenant.id)));
    if (invList.length === 0) throw new Error('Invoice not found');
    
    const invoice = invList[0];
    if (invoice.status === 'PAID') throw new Error('Invoice is already paid');

    // Mark as PAID
    await db.update(invoices).set({ status: 'PAID' }).where(eq(invoices.id, invoiceId));

    // Create payment record
    const paymentId = crypto.randomUUID(); // wait, db might not need this if it's defaultRandom()
    // Let's rely on drizzle defaultRandom
    const newPayment = await db.insert(payments).values({
      
      invoiceId: invoice.id,
      tenantId: tenant.id,
      unitId: invoice.unitId,
      amount: invoice.amount,
      paymentMethod: gateway,
      referenceNumber: gateway.substring(0,2) + '-' + Math.floor(100000 + Math.random() * 900000),
      status: 'COMPLETED',
      paymentDate: new Date().toISOString()
    }).returning();

    return newPayment[0];
  }`;

const replacement = `  // Starts a payment and returns checkout details.
  static async payInvoice(userId: string, invoiceId: string, gateway: 'TELEBIRR' | 'CHAPA' | 'CBE_BIRR') {
    const tenant = await this.getTenantForUser(userId);
    
    const invList = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenant.id)));
    if (invList.length === 0) throw new Error('Invoice not found');
    
    const invoice = invList[0];
    if (invoice.status === 'PAID') throw new Error('Invoice is already paid');

    // Placeholder integration for payment gateway checkout.
    const transactionId = gateway.substring(0, 3) + '-' + Math.floor(100000 + Math.random() * 900000);
    const checkoutUrl = \`https://checkout.\${gateway.toLowerCase()}.com/pay/\${transactionId}\`;

    const newPayment = await db.insert(payments).values({
      organizationId: tenant.organizationId,
      invoiceId: invoice.id,
      contractId: invoice.contractId,
      tenantId: tenant.id,
      unitId: invoice.unitId,
      amount: invoice.amount,
      paymentMethod: gateway,
      gatewayTransactionId: transactionId,
      checkoutUrl: checkoutUrl,
      status: 'PROCESSING',
      paymentDate: new Date().toISOString()
    }).returning();

    return newPayment[0];
  }`;

source = source.replace(target.replace(/\r\n/g, '\n'), replacement);
source = source.replace(target.replace(/\n/g, '\r\n'), replacement);

fs.writeFileSync(filePath, source, 'utf8');
console.log('Updated payInvoice implementation.');
