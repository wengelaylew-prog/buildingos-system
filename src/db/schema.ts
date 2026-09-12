import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// 0. ORGANIZATIONS (Multi-Tenant Organization Hierarchy)
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(), // e.g. ORG-APEX, ORG-SHEGER
  slug: text('slug'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, SUSPENDED
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 1. ROLES & PERMISSIONS
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(), // SUPER_ADMIN, PROPERTY_MANAGER, ACCOUNTANT, MAINTENANCE, RECEPTION, TENANT
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // e.g. building.read, building.create, etc.
  name: text('name').notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  })
);

// 2. USERS
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  uid: text('uid').notNull().unique(), // Firebase Auth UID (Admin Web only)
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  roleId: uuid('role_id').references(() => roles.id),
  isActive: boolean('is_active').default(true).notNull(),
  // Tenant TMA credential fields (independent of Firebase). Nullable: only accounts
  // that opt into a given method populate the corresponding field.
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  })
);

// 3. BUILDINGS
export const buildings = pgTable('buildings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  description: text('description'),
  numberOfFloors: integer('number_of_floors').notNull().default(1),
  totalUnits: integer('total_units').notNull().default(0),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, UNDER_CONSTRUCTION
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('idx_buildings_org_id').on(table.organizationId),
  orgCodeIdx: index('idx_buildings_org_code').on(table.organizationId, table.code),
  statusIdx: index('idx_buildings_status').on(table.status),
  codeIdx: index('idx_buildings_code').on(table.code),
}));

// 4. FLOORS
export const floors = pgTable('floors', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  buildingId: uuid('building_id')
    .notNull()
    .references(() => buildings.id, { onDelete: 'cascade' }),
  floorNumber: integer('floor_number').notNull(),
  floorName: text('floor_name').notNull(),
  description: text('description'),
  totalUnits: integer('total_units').notNull().default(0),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  buildingFloorUq: uniqueIndex('uq_floors_building_floor_number').on(table.buildingId, table.floorNumber),
  orgIdIdx: index('idx_floors_org_id').on(table.organizationId),
  orgBldgNumIdx: index('idx_floors_org_bldg_num').on(table.organizationId, table.buildingId, table.floorNumber),
  buildingIdIdx: index('idx_floors_building_id').on(table.buildingId),
  floorNumberIdx: index('idx_floors_floor_number').on(table.floorNumber),
}));

// 5. UNITS
export const units = pgTable('units', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  buildingId: uuid('building_id')
    .notNull()
    .references(() => buildings.id, { onDelete: 'cascade' }),
  floorId: uuid('floor_id')
    .notNull()
    .references(() => floors.id, { onDelete: 'cascade' }),
  unitNumber: text('unit_number').notNull(),
  unitType: text('unit_type').notNull().default('OFFICE'), // OFFICE, APARTMENT, SHOP, WAREHOUSE, STUDIO, OTHER
  area: numeric('area', { precision: 10, scale: 2 }).notNull().default('0'),
  bedrooms: integer('bedrooms').notNull().default(0),
  bathrooms: integer('bathrooms').notNull().default(1),
  monthlyRent: numeric('monthly_rent', { precision: 12, scale: 2 }).notNull().default('0'),
  depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('VACANT'), // VACANT, OCCUPIED, RESERVED, MAINTENANCE, INACTIVE
  description: text('description'),
  meshId: text('mesh_id'),
  transform: jsonb('transform'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  buildingUnitUq: uniqueIndex('uq_units_building_unit_number').on(table.buildingId, table.unitNumber),
  orgIdIdx: index('idx_units_org_id').on(table.organizationId),
  orgUnitNumIdx: index('idx_units_org_unit_num').on(table.organizationId, table.unitNumber),
  buildingIdIdx: index('idx_units_building_id').on(table.buildingId),
  floorIdIdx: index('idx_units_floor_id').on(table.floorId),
  unitNumberIdx: index('idx_units_unit_number').on(table.unitNumber),
  statusIdx: index('idx_units_status').on(table.status),
}));

// 6. TENANTS
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  userId: uuid('user_id').references(() => users.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  idType: text('id_type').notNull().default('National ID'),
  idNumber: text('id_number'),
  address: text('address'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContact: text('emergency_contact'),
  notes: text('notes'),
  profilePhoto: text('profile_photo'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('idx_tenants_org_id').on(table.organizationId),
  phoneIdx: index('idx_tenants_phone').on(table.phone),
  emailIdx: index('idx_tenants_email').on(table.email),
  idNumberIdx: index('idx_tenants_id_number').on(table.idNumber),
  lastNameIdx: index('idx_tenants_last_name').on(table.lastName),
  createdAtIdx: index('idx_tenants_created_at').on(table.createdAt),
}));

// 7. TENANT_UNITS
export const tenantUnits = pgTable('tenant_units', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  isCurrent: boolean('is_current').notNull().default(true),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

// 8. CONTRACTS (Leases)
export const contracts = pgTable('contracts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  contractNumber: text('contract_number').notNull().unique(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'restrict' }),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'restrict' }),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  monthlyRent: numeric('monthly_rent', { precision: 12, scale: 2 }).notNull(),
  deposit: numeric('deposit', { precision: 12, scale: 2 }).notNull(),
  paymentFrequency: text('payment_frequency').notNull().default('Monthly'), // Monthly, Quarterly, Semi-Annually, Annually
  contractStatus: text('contract_status').notNull().default('ACTIVE'), // DRAFT, ACTIVE, EXPIRING, EXPIRED, TERMINATED, CANCELLED
  renewalOf: uuid('renewal_of').references((): any => contracts.id),
  documentUrl: text('document_url'),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('idx_contracts_org_id').on(table.organizationId),
  tenantIdIdx: index('idx_contracts_tenant_id').on(table.tenantId),
  unitIdIdx: index('idx_contracts_unit_id').on(table.unitId),
  statusIdx: index('idx_contracts_status').on(table.contractStatus),
  datesIdx: index('idx_contracts_dates').on(table.startDate, table.endDate),
  unitStatusDatesIdx: index('idx_contracts_unit_status_dates').on(table.unitId, table.contractStatus, table.startDate, table.endDate),
}));

// 9. DOCUMENTS (Polymorphic Relationship Architecture)
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull(), // building, unit, tenant, contract, payment, maintenance
  entityId: uuid('entity_id').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull().default(0),
  storageKey: text('storage_key').notNull(),
  url: text('url').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  userId: uuid('user_id'),
  userEmail: text('user_email'),
  action: text('action').notNull(), // e.g. TENANT_CREATED, UNIT_STATUS_CHANGED, etc.
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index('idx_audit_logs_org_id').on(table.organizationId),
}));

// 11. NOTIFICATIONS
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  userId: uuid('user_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('INFO'), // ALERT, INFO, WARNING, SUCCESS
  isRead: boolean('is_read').notNull().default(false),
  link: text('link'),
  deliveryChannels: jsonb('delivery_channels').default('["IN_APP"]').notNull(),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. INVOICES (Phase 5 Billing)
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  unitId: uuid('unit_id').references(() => units.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  type: text('type').notNull().default('RENT'), // RENT, UTILITY, LATE_FEE, OTHER
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, PAID, OVERDUE, CANCELLED
  lateFeeApplied: boolean('late_fee_applied').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. PAYMENTS (Prepared for future phases & relationships)
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  unitId: uuid('unit_id').references(() => units.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method').notNull().default('Bank Transfer'), // Bank Transfer, Telebirr, CBE Birr, Cash, Check
  referenceNumber: text('reference_number'),
  status: text('status').notNull().default('PAID'), // PAID, PENDING, OVERDUE
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. RECEIPTS
export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  receiptNumber: text('receipt_number').notNull().unique(),
  issueDate: text('issue_date').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. MAINTENANCE REQUESTS
export const maintenanceRequests = pgTable('maintenance_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  unitId: uuid('unit_id').references(() => units.id),
  buildingId: uuid('building_id').references(() => buildings.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
  status: text('status').notNull().default('PENDING'), // PENDING, IN_PROGRESS, RESOLVED, CANCELLED
  reportedBy: text('reported_by'),
  assignedTo: text('assigned_to'),
  contractorName: text('contractor_name'),
  cost: numeric('cost', { precision: 12, scale: 2 }),
  isBillable: boolean('is_billable').notNull().default(false),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 15. SETTINGS
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 16. MESSAGES
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  receiverId: uuid('receiver_id').references(() => users.id), // Null for broadcast or group
  tenantId: uuid('tenant_id').references(() => tenants.id), // Context
  unitId: uuid('unit_id').references(() => units.id), // Context
  maintenanceRequestId: uuid('maintenance_request_id').references(() => maintenanceRequests.id), // Context
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});



// 17. TELEGRAM ACCOUNTS (Phase TMA-1)
export const telegramAccounts = pgTable('telegram_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  telegramUserId: text('telegram_user_id').notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  photoUrl: text('photo_url'),
  lastAuthenticatedAt: timestamp('last_authenticated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_telegram_accounts_user_id').on(table.userId),
}));

// 18. OTP CODES (Tenant TMA phone login)
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  channel: text('channel').notNull(), // 'EMAIL' or 'PHONE'
  identifier: text('identifier').notNull(), // normalized email or phone
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  purpose: text('purpose').notNull().default('TMA_LOGIN'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(5),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  requestIp: text('request_ip'),
}, (table) => ({
  identifierIdx: index('idx_otp_codes_identifier').on(table.channel, table.identifier),
  createdAtIdx: index('idx_otp_codes_created_at').on(table.createdAt),
}));

// 19. TMA SESSIONS (Tenant TMA email/phone authenticated sessions)
export const tmaSessions = pgTable('tma_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  method: text('method').notNull(), // TELEGRAM, EMAIL, PHONE
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
}, (table) => ({
  userIdIdx: index('idx_tma_sessions_user_id').on(table.userId),
}));


// 14. TENANT MESSAGING (Announcements)
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  targetAudience: text('target_audience').notNull().default('ALL'), // ALL, BUILDING, FLOOR
  targetId: uuid('target_id'), // Building ID or Floor ID if applicable
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. GATE PASSES
export const gatePasses = pgTable('gate_passes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  direction: text('direction').notNull(), // IN, OUT
  itemDescription: text('item_description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, COMPLETED
  qrCodeUrl: text('qr_code_url'), // Link to generated QR code for the pass
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  scheduledDate: timestamp('scheduled_date'),
  approvedBy: uuid('approved_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  notes: text('notes'),
});

// 16. SECURITY LOGS (Visitor & Tenant Entry/Exit)
export const securityLogs = pgTable('security_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  scanType: text('scan_type').notNull(), // ID_CARD, GATE_PASS, VISITOR
  scannedId: text('scanned_id').notNull(), // The ID string from the QR code or ID card
  direction: text('direction').notNull(), // IN, OUT
  gatePassId: uuid('gate_pass_id').references(() => gatePasses.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  scannedBy: uuid('scanned_by').notNull().references(() => users.id), // The security guard
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
  status: text('status').notNull().default('SUCCESS'), // SUCCESS, DENIED, FLAG
  notes: text('notes'),
});

// DRIZZLE RELATIONS DEFINITIONS
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  buildings: many(buildings),
  floors: many(floors),
  units: many(units),
  auditLogs: many(auditLogs),
}));

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [buildings.organizationId],
    references: [organizations.id],
  }),
  floors: many(floors),
  units: many(units),
  maintenanceRequests: many(maintenanceRequests),
}));

export const floorsRelations = relations(floors, ({ one, many }) => ({
  building: one(buildings, {
    fields: [floors.buildingId],
    references: [buildings.id],
  }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  building: one(buildings, {
    fields: [units.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [units.floorId],
    references: [floors.id],
  }),
  tenantUnits: many(tenantUnits),
  contracts: many(contracts),
  invoices: many(invoices),
  payments: many(payments),
  maintenanceRequests: many(maintenanceRequests),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(users, {
    fields: [tenants.userId],
    references: [users.id],
  }),
  tenantUnits: many(tenantUnits),
  contracts: many(contracts),
  invoices: many(invoices),
  payments: many(payments),
  maintenanceRequests: many(maintenanceRequests),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [contracts.tenantId],
    references: [tenants.id],
  }),
  unit: one(units, {
    fields: [contracts.unitId],
    references: [units.id],
  }),
  invoices: many(invoices),
  payments: many(payments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  contract: one(contracts, {
    fields: [invoices.contractId],
    references: [contracts.id],
  }),
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  unit: one(units, {
    fields: [invoices.unitId],
    references: [units.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  contract: one(contracts, {
    fields: [payments.contractId],
    references: [contracts.id],
  }),
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  unit: one(units, {
    fields: [payments.unitId],
    references: [units.id],
  }),
  receipts: many(receipts),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const telegramAccountsRelations = relations(telegramAccounts, ({ one }) => ({
  user: one(users, {
    fields: [telegramAccounts.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  userRoles: many(userRoles),
  uploadedDocuments: many(documents),
  telegramAccount: one(telegramAccounts, {
    fields: [users.id],
    references: [telegramAccounts.userId],
  }),
}));


export const announcementsRelations = relations(announcements, ({ one }) => ({
  organization: one(organizations, { fields: [announcements.organizationId], references: [organizations.id] }),
  creator: one(users, { fields: [announcements.createdBy], references: [users.id] }),
}));

export const gatePassesRelations = relations(gatePasses, ({ one }) => ({
  tenant: one(tenants, { fields: [gatePasses.tenantId], references: [tenants.id] }),
  unit: one(units, { fields: [gatePasses.unitId], references: [units.id] }),
  approver: one(users, { fields: [gatePasses.approvedBy], references: [users.id] }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  organization: one(organizations, { fields: [securityLogs.organizationId], references: [organizations.id] }),
  gatePass: one(gatePasses, { fields: [securityLogs.gatePassId], references: [gatePasses.id] }),
  tenant: one(tenants, { fields: [securityLogs.tenantId], references: [tenants.id] }),
  guard: one(users, { fields: [securityLogs.scannedBy], references: [users.id] }),
}));
