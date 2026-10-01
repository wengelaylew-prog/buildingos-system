const fs = require('fs');
let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

const emergencyTableStr = `
export const emergencyAlerts = pgTable('emergency_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  buildingId: uuid('building_id').references(() => buildings.id),
  type: text('type').notNull().default('FIRE'), // FIRE, SEISMIC, SECURITY
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, RESOLVED
  locationDetails: text('location_details'),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => users.id)
});
`;

if (!schema.includes('emergencyAlerts')) {
  schema += emergencyTableStr;
  fs.writeFileSync('src/db/schema.ts', schema);
  console.log('Added emergencyAlerts table to schema.ts');
}
