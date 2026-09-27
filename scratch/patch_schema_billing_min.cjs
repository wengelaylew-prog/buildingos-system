const fs = require('fs');
let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

// 1. Add taxAmount and discountAmount to invoices
const invoicesTarget = "export const invoices = pgTable('invoices', {";
const invoicesReplacement = `export const invoices = pgTable('invoices', {
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),`;

if (!schema.includes("taxAmount: numeric('tax_amount'")) {
    schema = schema.replace(invoicesTarget, invoicesReplacement);
}

// 2. Add invoiceItems table
const invoiceItemsDefinition = `
// Phase 5 Minimal Billing Update
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: text('type').notNull(), // RENT, TAX, DISCOUNT, FEE
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));
`;

if (!schema.includes("export const invoiceItems =")) {
    schema += invoiceItemsDefinition;
}

// 3. Add relation to invoices
const invoiceRelationsTarget = "export const invoiceRelations = relations(invoices, ({ one, many }) => ({";
const invoiceRelationsReplacement = `export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  items: many(invoiceItems),`;

if (!schema.includes("items: many(invoiceItems)")) {
    schema = schema.replace(invoiceRelationsTarget, invoiceRelationsReplacement);
}

fs.writeFileSync('src/db/schema.ts', schema);
console.log('Schema updated successfully.');

