const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

code = code.replace(
  "  unitId: uuid('unit_id').references(() => units.id),\r\n  invoiceNumber: text('invoice_number').notNull().unique(),",
  "  unitId: uuid('unit_id').references(() => units.id),\r\n  parentInvoiceId: uuid('parent_invoice_id').references((): any => invoices.id),\r\n  invoiceNumber: text('invoice_number').notNull().unique(),"
);

code = code.replace(
  "  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),\r\n  issueDate: text('issue_date').notNull(),",
  "  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),\r\n  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),\r\n  issueDate: text('issue_date').notNull(),"
);

code = code.replace(
  "  id: uuid('id').defaultRandom().primaryKey(),\r\n  invoiceId: uuid('invoice_id').references(() => invoices.id),",
  "  id: uuid('id').defaultRandom().primaryKey(),\r\n  organizationId: uuid('organization_id').references(() => organizations.id),\r\n  invoiceId: uuid('invoice_id').references(() => invoices.id),"
);

code = code.replace(
  "  referenceNumber: text('reference_number'),\r\n  status: text('status').notNull().default('PAID'), // PAID, PENDING, OVERDUE",
  "  referenceNumber: text('reference_number'),\r\n  gatewayTransactionId: text('gateway_transaction_id'),\r\n  checkoutUrl: text('checkout_url'),\r\n  status: text('status').notNull().default('PAID'), // PROCESSING, PAID, PENDING, OVERDUE, FAILED, CANCELLED"
);

code = code.replace(
  "// 13. RECEIPTS\r\nexport const receipts = pgTable('receipts', {\r\n  id: uuid('id').defaultRandom().primaryKey(),\r\n  paymentId: uuid('payment_id')",
  "// 13. RECEIPTS\r\nexport const receipts = pgTable('receipts', {\r\n  id: uuid('id').defaultRandom().primaryKey(),\r\n  organizationId: uuid('organization_id').references(() => organizations.id),\r\n  paymentId: uuid('payment_id')"
);

fs.writeFileSync('src/db/schema.ts', code);
console.log("Replaced successfully!");

