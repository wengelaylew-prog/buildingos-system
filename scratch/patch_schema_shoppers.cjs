const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

const mallShoppersTable = `
export const mallShoppers = pgTable('mall_shoppers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  digitalIdToken: text('digital_id_token').notNull(),
  shopperData: text('shopper_data'),
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
});
`;

if (!schema.includes('mallShoppers')) {
  schema = schema + mallShoppersTable;
  fs.writeFileSync('src/db/schema.ts', schema);
  console.log('Added mallShoppers table to schema.ts');
}
