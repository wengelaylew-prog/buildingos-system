const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

// Add token field to gatePasses
schema = schema.replace(
  "qrCodeUrl: text('qr_code_url'), // Link to generated QR code for the pass",
  "qrCodeUrl: text('qr_code_url'), // Link to generated QR code for the pass\n  token: text('token'), // e.g. GP-W7XY"
);

// Add visitors table before securityLogs
const visitorsTable = `
// 15b. VISITORS
export const visitors = pgTable('visitors', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone'),
  purpose: text('purpose'),
  status: text('status').notNull().default('PENDING_APPROVAL'), // PENDING_APPROVAL, APPROVED, DENIED, COMPLETED
  loggedBy: uuid('logged_by').references(() => users.id),
  arrivedAt: timestamp('arrived_at').defaultNow().notNull(),
  departedAt: timestamp('departed_at'),
  telegramMessageId: text('telegram_message_id'), // To edit the message once approved
});
`;

schema = schema.replace(
  "// 16. SECURITY LOGS (Visitor & Tenant Entry/Exit)",
  visitorsTable + "\n// 16. SECURITY LOGS (Visitor & Tenant Entry/Exit)"
);

// Add visitors relation
const visitorsRelation = `
export const visitorsRelations = relations(visitors, ({ one }) => ({
  organization: one(organizations, { fields: [visitors.organizationId], references: [organizations.id] }),
  tenant: one(tenants, { fields: [visitors.tenantId], references: [tenants.id] }),
  guard: one(users, { fields: [visitors.loggedBy], references: [users.id] }),
}));
`;

schema = schema.replace(
  "export const securityLogsRelations = relations(securityLogs, ({ one }) => ({",
  visitorsRelation + "\nexport const securityLogsRelations = relations(securityLogs, ({ one }) => ({"
);

fs.writeFileSync('src/db/schema.ts', schema, 'utf8');
console.log('Added visitors table and gate pass token to schema');

