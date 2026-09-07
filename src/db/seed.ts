import { db } from './index.ts';
import {
  buildings,
  floors,
  units,
  tenants,
  tenantUnits,
  contracts,
  documents,
  roles,
  permissions,
  rolePermissions,
  users,
  userRoles,
  auditLogs,
  notifications,
  payments,
  receipts,
  maintenanceRequests,
  settings,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // Check if buildings already exist
    const existingBuildings = await db.select().from(buildings);
    if (existingBuildings.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return { message: 'Database already seeded', skipped: true };
    }

    console.log('Starting seed process...');

    // 1. SEED PERMISSIONS
    const permissionList = [
      // Building
      { code: 'building.read', name: 'View Buildings', category: 'Buildings' },
      { code: 'building.create', name: 'Create Buildings', category: 'Buildings' },
      { code: 'building.update', name: 'Update Buildings', category: 'Buildings' },
      { code: 'building.delete', name: 'Delete Buildings', category: 'Buildings' },
      // Floor
      { code: 'floor.read', name: 'View Floors', category: 'Floors' },
      { code: 'floor.create', name: 'Create Floors', category: 'Floors' },
      { code: 'floor.update', name: 'Update Floors', category: 'Floors' },
      { code: 'floor.delete', name: 'Delete Floors', category: 'Floors' },
      // Unit
      { code: 'unit.read', name: 'View Units', category: 'Units' },
      { code: 'unit.create', name: 'Create Units', category: 'Units' },
      { code: 'unit.update', name: 'Update Units', category: 'Units' },
      { code: 'unit.delete', name: 'Delete Units', category: 'Units' },
      // Tenant
      { code: 'tenant.read', name: 'View Tenants', category: 'Tenants' },
      { code: 'tenant.create', name: 'Create Tenants', category: 'Tenants' },
      { code: 'tenant.update', name: 'Update Tenants', category: 'Tenants' },
      { code: 'tenant.delete', name: 'Delete Tenants', category: 'Tenants' },
      // Contract
      { code: 'contract.read', name: 'View Contracts', category: 'Contracts' },
      { code: 'contract.create', name: 'Create Contracts', category: 'Contracts' },
      { code: 'contract.update', name: 'Update Contracts', category: 'Contracts' },
      { code: 'contract.terminate', name: 'Terminate Contracts', category: 'Contracts' },
      // Payment & Receipt
      { code: 'payment.read', name: 'View Payments', category: 'Financials' },
      { code: 'payment.create', name: 'Record Payments', category: 'Financials' },
      { code: 'payment.update', name: 'Update Payments', category: 'Financials' },
      { code: 'receipt.read', name: 'View Receipts', category: 'Financials' },
      { code: 'receipt.generate', name: 'Generate Receipts', category: 'Financials' },
      // Maintenance
      { code: 'maintenance.read', name: 'View Maintenance', category: 'Maintenance' },
      { code: 'maintenance.create', name: 'Create Maintenance Request', category: 'Maintenance' },
      { code: 'maintenance.update', name: 'Update Maintenance Request', category: 'Maintenance' },
      // Documents
      { code: 'document.read', name: 'View Documents', category: 'Documents' },
      { code: 'document.upload', name: 'Upload Documents', category: 'Documents' },
      { code: 'document.delete', name: 'Delete Documents', category: 'Documents' },
      // System & Users
      { code: 'user.manage', name: 'Manage Users & Roles', category: 'Administration' },
      { code: 'audit.read', name: 'View Audit Logs', category: 'Administration' },
      { code: 'settings.manage', name: 'Manage System Settings', category: 'Administration' },
    ];

    const insertedPermissions = await db
      .insert(permissions)
      .values(permissionList)
      .returning();
    const permMap = new Map(insertedPermissions.map((p) => [p.code, p.id]));

    // 2. SEED ROLES
    const rolesData = [
      {
        name: 'Super Administrator',
        code: 'SUPER_ADMIN',
        description: 'Complete and unrestricted system-wide access across all modules.',
      },
      {
        name: 'Property Manager',
        code: 'PROPERTY_MANAGER',
        description: 'Manages buildings, units, tenants, leases, maintenance, and reports.',
      },
      {
        name: 'Accountant',
        code: 'ACCOUNTANT',
        description: 'Manages payments, invoices, receipts, and financial reporting.',
      },
      {
        name: 'Maintenance Staff',
        code: 'MAINTENANCE',
        description: 'Handles facility maintenance tickets, unit inspections, and repairs.',
      },
      {
        name: 'Receptionist',
        code: 'RECEPTION',
        description: 'Handles tenant inquiries, unit visitor check-ins, and basic directory.',
      },
      {
        name: 'Tenant Portal',
        code: 'TENANT',
        description: 'Restricted view to own lease, unit, documents, and payments.',
      },
    ];

    const insertedRoles = await db.insert(roles).values(rolesData).returning();
    const roleMap = new Map(insertedRoles.map((r) => [r.code, r.id]));

    // Map Permissions to Roles
    const rolePermissionMappings: { roleId: string; permissionId: string }[] = [];
    const superAdminRoleId = roleMap.get('SUPER_ADMIN')!;
    const propManagerRoleId = roleMap.get('PROPERTY_MANAGER')!;
    const accountantRoleId = roleMap.get('ACCOUNTANT')!;
    const maintenanceRoleId = roleMap.get('MAINTENANCE')!;
    const receptionRoleId = roleMap.get('RECEPTION')!;
    const tenantRoleId = roleMap.get('TENANT')!;

    // Super Admin gets all permissions
    for (const p of insertedPermissions) {
      rolePermissionMappings.push({ roleId: superAdminRoleId, permissionId: p.id });
    }

    // Property Manager
    const pmPerms = [
      'building.read', 'building.create', 'building.update',
      'floor.read', 'floor.create', 'floor.update',
      'unit.read', 'unit.create', 'unit.update',
      'tenant.read', 'tenant.create', 'tenant.update',
      'contract.read', 'contract.create', 'contract.update',
      'maintenance.read', 'maintenance.create', 'maintenance.update',
      'document.read', 'document.upload',
      'audit.read',
    ];
    for (const code of pmPerms) {
      const pid = permMap.get(code);
      if (pid) rolePermissionMappings.push({ roleId: propManagerRoleId, permissionId: pid });
    }

    // Accountant
    const accPerms = [
      'building.read', 'unit.read', 'tenant.read', 'contract.read',
      'payment.read', 'payment.create', 'payment.update',
      'receipt.read', 'receipt.generate', 'document.read', 'document.upload',
    ];
    for (const code of accPerms) {
      const pid = permMap.get(code);
      if (pid) rolePermissionMappings.push({ roleId: accountantRoleId, permissionId: pid });
    }

    // Maintenance
    const maintPerms = [
      'building.read', 'unit.read',
      'maintenance.read', 'maintenance.create', 'maintenance.update',
      'document.read', 'document.upload',
    ];
    for (const code of maintPerms) {
      const pid = permMap.get(code);
      if (pid) rolePermissionMappings.push({ roleId: maintenanceRoleId, permissionId: pid });
    }

    // Reception
    const recPerms = ['building.read', 'unit.read', 'tenant.read', 'document.read'];
    for (const code of recPerms) {
      const pid = permMap.get(code);
      if (pid) rolePermissionMappings.push({ roleId: receptionRoleId, permissionId: pid });
    }

    // Tenant
    const tenPerms = [
      'unit.read', 'tenant.read', 'contract.read', 'payment.read',
      'receipt.read', 'maintenance.create', 'maintenance.read', 'document.read',
    ];
    for (const code of tenPerms) {
      const pid = permMap.get(code);
      if (pid) rolePermissionMappings.push({ roleId: tenantRoleId, permissionId: pid });
    }

    await db.insert(rolePermissions).values(rolePermissionMappings);

    // 3. SEED DEFAULT USERS (For Demo & Testing RBAC)
    const demoUsers = [
      {
        uid: 'user_super_admin_01',
        email: 'admin@apexproperties.et',
        fullName: 'Kassahun Alemayehu',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roleId: superAdminRoleId,
      },
      {
        uid: 'user_manager_01',
        email: 'manager@apexproperties.et',
        fullName: 'Bethlehem Tadesse',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        roleId: propManagerRoleId,
      },
      {
        uid: 'user_accountant_01',
        email: 'finance@apexproperties.et',
        fullName: 'Yonas Gebremedhin',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        roleId: accountantRoleId,
      },
      {
        uid: 'user_maintenance_01',
        email: 'tech@apexproperties.et',
        fullName: 'Dawit Mengistu',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        roleId: maintenanceRoleId,
      },
    ];

    const insertedUsers = await db.insert(users).values(demoUsers).returning();
    const superAdminUserId = insertedUsers[0].id;

    // 4. SEED BUILDINGS (3 Iconic Ethiopian Commercial/Residential Centers)
    const buildingsData = [
      {
        name: 'Bole Business Center',
        code: 'BBC-01',
        address: 'Bole Medhanealem, Cameroon Street',
        city: 'Addis Ababa',
        description: 'Prime Grade-A commercial building featuring executive offices, premium retail frontage, and modern underground parking.',
        numberOfFloors: 5,
        totalUnits: 16,
        status: 'ACTIVE',
      },
      {
        name: 'Addis Tower',
        code: 'AT-02',
        address: 'Kirkos Sub-City, Mexico Square',
        city: 'Addis Ababa',
        description: 'High-density mixed-use corporate tower with bank branches, diplomatic offices, and modern open-plan workspaces.',
        numberOfFloors: 6,
        totalUnits: 14,
        status: 'ACTIVE',
      },
      {
        name: 'Meskel Square Complex',
        code: 'MSC-03',
        address: 'Meskel Square, Joma Avenue',
        city: 'Addis Ababa',
        description: 'Flagship commercial and executive apartment residency overlooking the historic Meskel Square plaza.',
        numberOfFloors: 4,
        totalUnits: 10,
        status: 'ACTIVE',
      },
    ];

    const insertedBuildings = await db.insert(buildings).values(buildingsData).returning();

    // 5. SEED FLOORS (8 Floors across buildings)
    const floorsData = [
      // Building 1: Bole Business Center (3 floors seeded)
      {
        buildingId: insertedBuildings[0].id,
        floorNumber: 0,
        floorName: 'Ground Floor (Retail Promenade)',
        description: 'High-footfall street-facing retail shops and bank branches.',
        totalUnits: 4,
      },
      {
        buildingId: insertedBuildings[0].id,
        floorNumber: 1,
        floorName: '1st Floor (Financial Services)',
        description: 'Insurance, microfinance, and legal consultancy suites.',
        totalUnits: 6,
      },
      {
        buildingId: insertedBuildings[0].id,
        floorNumber: 2,
        floorName: '2nd Floor (Tech & Creative Hub)',
        description: 'Modern open-plan IT, fintech, and design offices.',
        totalUnits: 6,
      },
      // Building 2: Addis Tower (3 floors seeded)
      {
        buildingId: insertedBuildings[1].id,
        floorNumber: 0,
        floorName: 'Ground Floor (Lobby & Commercial)',
        description: 'Customer reception, café, and commercial showrooms.',
        totalUnits: 4,
      },
      {
        buildingId: insertedBuildings[1].id,
        floorNumber: 1,
        floorName: '1st Floor (Corporate Suites)',
        description: 'Corporate executive offices with conference spaces.',
        totalUnits: 5,
      },
      {
        buildingId: insertedBuildings[1].id,
        floorNumber: 2,
        floorName: '2nd Floor (Medical & Health Center)',
        description: 'Specialist clinics and wellness facilities.',
        totalUnits: 5,
      },
      // Building 3: Meskel Square Complex (2 floors seeded)
      {
        buildingId: insertedBuildings[2].id,
        floorNumber: 1,
        floorName: '1st Floor (Executive Suites)',
        description: 'Serviced offices and business delegation facilities.',
        totalUnits: 5,
      },
      {
        buildingId: insertedBuildings[2].id,
        floorNumber: 2,
        floorName: '2nd Floor (Penthouse Apartments)',
        description: 'Luxury executive short & long term residential apartments.',
        totalUnits: 5,
      },
    ];

    const insertedFloors = await db.insert(floors).values(floorsData).returning();

    // 6. SEED UNITS (40 Units across the 8 floors)
    const unitTemplates = [
      // Floor 0 BBC (4 units)
      { floorIdx: 0, bldgIdx: 0, num: 'G-01', type: 'Shop', area: '120.00', bed: 0, bath: 1, rent: '65000.00', dep: '130000.00', status: 'OCCUPIED', desc: 'Corner retail showroom facing Cameroon Street.' },
      { floorIdx: 0, bldgIdx: 0, num: 'G-02', type: 'Shop', area: '85.00', bed: 0, bath: 1, rent: '48000.00', dep: '96000.00', status: 'OCCUPIED', desc: 'Boutique coffee and specialty roastery.' },
      { floorIdx: 0, bldgIdx: 0, num: 'G-03', type: 'Shop', area: '95.00', bed: 0, bath: 1, rent: '52000.00', dep: '104000.00', status: 'OCCUPIED', desc: 'Pharmacy and medical cosmetics outlet.' },
      { floorIdx: 0, bldgIdx: 0, num: 'G-04', type: 'Shop', area: '110.00', bed: 0, bath: 1, rent: '58000.00', dep: '116000.00', status: 'VACANT', desc: 'High-visibility retail space ready for immediate fitout.' },

      // Floor 1 BBC (6 units)
      { floorIdx: 1, bldgIdx: 0, num: '101', type: 'Office', area: '140.00', bed: 0, bath: 2, rent: '55000.00', dep: '110000.00', status: 'OCCUPIED', desc: 'Headquarters suite with partitioned executive director room.' },
      { floorIdx: 1, bldgIdx: 0, num: '102', type: 'Office', area: '115.00', bed: 0, bath: 1, rent: '46000.00', dep: '92000.00', status: 'OCCUPIED', desc: 'Chartered accountancy firm office.' },
      { floorIdx: 1, bldgIdx: 0, num: '103', type: 'Office', area: '90.00', bed: 0, bath: 1, rent: '38000.00', dep: '76000.00', status: 'OCCUPIED', desc: 'Import-export logistics consultancy.' },
      { floorIdx: 1, bldgIdx: 0, num: '104', type: 'Office', area: '75.00', bed: 0, bath: 1, rent: '32000.00', dep: '64000.00', status: 'RESERVED', desc: 'Architectural drafting studio under lease finalization.' },
      { floorIdx: 1, bldgIdx: 0, num: '105', type: 'Office', area: '100.00', bed: 0, bath: 1, rent: '42000.00', dep: '84000.00', status: 'VACANT', desc: 'Freshly painted open workspace with terrace access.' },
      { floorIdx: 1, bldgIdx: 0, num: '106', type: 'Office', area: '80.00', bed: 0, bath: 1, rent: '35000.00', dep: '70000.00', status: 'MAINTENANCE', desc: 'HVAC duct inspection and LED lighting upgrade in progress.' },

      // Floor 2 BBC (6 units)
      { floorIdx: 2, bldgIdx: 0, num: '201', type: 'Office', area: '200.00', bed: 0, bath: 2, rent: '85000.00', dep: '170000.00', status: 'OCCUPIED', desc: 'Full software engineering center with server rack room.' },
      { floorIdx: 2, bldgIdx: 0, num: '202', type: 'Office', area: '130.00', bed: 0, bath: 1, rent: '54000.00', dep: '108000.00', status: 'OCCUPIED', desc: 'Digital marketing & creative agency studio.' },
      { floorIdx: 2, bldgIdx: 0, num: '203', type: 'Studio', area: '65.00', bed: 1, bath: 1, rent: '28000.00', dep: '56000.00', status: 'OCCUPIED', desc: 'Compact audio/podcast and video production suite.' },
      { floorIdx: 2, bldgIdx: 0, num: '204', type: 'Office', area: '110.00', bed: 0, bath: 1, rent: '45000.00', dep: '90000.00', status: 'VACANT', desc: 'Spacious rectangular office with natural southern light.' },
      { floorIdx: 2, bldgIdx: 0, num: '205', type: 'Office', area: '95.00', bed: 0, bath: 1, rent: '40000.00', dep: '80000.00', status: 'VACANT', desc: 'Fitted with sound-dampened glass partitions.' },
      { floorIdx: 2, bldgIdx: 0, num: '206', type: 'Warehouse', area: '180.00', bed: 0, bath: 1, rent: '48000.00', dep: '96000.00', status: 'OCCUPIED', desc: 'Secured climate-moderated archives and hardware storage.' },

      // Floor 3 Addis Tower Floor 0 (4 units)
      { floorIdx: 3, bldgIdx: 1, num: 'AT-G01', type: 'Shop', area: '160.00', bed: 0, bath: 2, rent: '90000.00', dep: '180000.00', status: 'OCCUPIED', desc: 'Commercial bank branch with automated ATM vestibule.' },
      { floorIdx: 3, bldgIdx: 1, num: 'AT-G02', type: 'Shop', area: '70.00', bed: 0, bath: 1, rent: '42000.00', dep: '84000.00', status: 'OCCUPIED', desc: 'Telecommunications service and customer retail hub.' },
      { floorIdx: 3, bldgIdx: 1, num: 'AT-G03', type: 'Shop', area: '90.00', bed: 0, bath: 1, rent: '50000.00', dep: '100000.00', status: 'VACANT', desc: 'Prime lobby-adjacent retail storefront.' },
      { floorIdx: 3, bldgIdx: 1, num: 'AT-G04', type: 'Shop', area: '85.00', bed: 0, bath: 1, rent: '46000.00', dep: '92000.00', status: 'RESERVED', desc: 'Art gallery and cultural craft showroom.' },

      // Floor 4 Addis Tower Floor 1 (5 units)
      { floorIdx: 4, bldgIdx: 1, num: 'AT-101', type: 'Office', area: '175.00', bed: 0, bath: 2, rent: '72000.00', dep: '144000.00', status: 'OCCUPIED', desc: 'Law firm chambers with dedicated consultation booths.' },
      { floorIdx: 4, bldgIdx: 1, num: 'AT-102', type: 'Office', area: '120.00', bed: 0, bath: 1, rent: '50000.00', dep: '100000.00', status: 'OCCUPIED', desc: 'Civil engineering and infrastructure consulting office.' },
      { floorIdx: 4, bldgIdx: 1, num: 'AT-103', type: 'Office', area: '110.00', bed: 0, bath: 1, rent: '45000.00', dep: '90000.00', status: 'OCCUPIED', desc: 'Travel and corporate aviation ticketing agency.' },
      { floorIdx: 4, bldgIdx: 1, num: 'AT-104', type: 'Office', area: '95.00', bed: 0, bath: 1, rent: '39000.00', dep: '78000.00', status: 'VACANT', desc: 'Modern turnkey workspace with carpet tiles.' },
      { floorIdx: 4, bldgIdx: 1, num: 'AT-105', type: 'Office', area: '85.00', bed: 0, bath: 1, rent: '36000.00', dep: '72000.00', status: 'MAINTENANCE', desc: 'Plumbing leak remediation and ceiling tile replacement.' },

      // Floor 5 Addis Tower Floor 2 (5 units)
      { floorIdx: 5, bldgIdx: 1, num: 'AT-201', type: 'Office', area: '150.00', bed: 0, bath: 2, rent: '62000.00', dep: '124000.00', status: 'OCCUPIED', desc: 'Dental clinic with water and vacuum lines installed.' },
      { floorIdx: 5, bldgIdx: 1, num: 'AT-202', type: 'Office', area: '135.00', bed: 0, bath: 2, rent: '56000.00', dep: '112000.00', status: 'OCCUPIED', desc: 'Physiotherapy and rehabilitation practice.' },
      { floorIdx: 5, bldgIdx: 1, num: 'AT-203', type: 'Office', area: '110.00', bed: 0, bath: 1, rent: '45000.00', dep: '90000.00', status: 'VACANT', desc: 'Clean clinical suite ready for immediate licensing.' },
      { floorIdx: 5, bldgIdx: 1, num: 'AT-204', type: 'Studio', area: '60.00', bed: 1, bath: 1, rent: '25000.00', dep: '50000.00', status: 'VACANT', desc: 'Private consultation studio.' },
      { floorIdx: 5, bldgIdx: 1, num: 'AT-205', type: 'Warehouse', area: '140.00', bed: 0, bath: 1, rent: '38000.00', dep: '76000.00', status: 'OCCUPIED', desc: 'Pharmaceutical supplies and medical records depot.' },

      // Floor 6 Meskel Square Floor 1 (5 units)
      { floorIdx: 6, bldgIdx: 2, num: 'MS-101', type: 'Office', area: '210.00', bed: 0, bath: 2, rent: '95000.00', dep: '190000.00', status: 'OCCUPIED', desc: 'International NGO regional coordination headquarters.' },
      { floorIdx: 6, bldgIdx: 2, num: 'MS-102', type: 'Office', area: '140.00', bed: 0, bath: 1, rent: '60000.00', dep: '120000.00', status: 'OCCUPIED', desc: 'Diplomatic trade mission representative suite.' },
      { floorIdx: 6, bldgIdx: 2, num: 'MS-103', type: 'Office', area: '120.00', bed: 0, bath: 1, rent: '52000.00', dep: '104000.00', status: 'VACANT', desc: 'Panoramic corner suite overlooking Meskel Square.' },
      { floorIdx: 6, bldgIdx: 2, num: 'MS-104', type: 'Studio', area: '70.00', bed: 1, bath: 1, rent: '32000.00', dep: '64000.00', status: 'VACANT', desc: 'Executive meeting studio with bar facility.' },
      { floorIdx: 6, bldgIdx: 2, num: 'MS-105', type: 'Office', area: '95.00', bed: 0, bath: 1, rent: '42000.00', dep: '84000.00', status: 'RESERVED', desc: 'Consulting room reserved for commercial audit group.' },

      // Floor 7 Meskel Square Floor 2 (5 units)
      { floorIdx: 7, bldgIdx: 2, num: 'MS-201', type: 'Apartment', area: '180.00', bed: 3, bath: 2, rent: '85000.00', dep: '170000.00', status: 'OCCUPIED', desc: 'Three-bedroom luxury furnished penthouse suite.' },
      { floorIdx: 7, bldgIdx: 2, num: 'MS-202', type: 'Apartment', area: '145.00', bed: 2, bath: 2, rent: '68000.00', dep: '136000.00', status: 'OCCUPIED', desc: 'Modern two-bedroom executive serviced flat.' },
      { floorIdx: 7, bldgIdx: 2, num: 'MS-203', type: 'Apartment', area: '140.00', bed: 2, bath: 2, rent: '66000.00', dep: '132000.00', status: 'OCCUPIED', desc: 'Two-bedroom residential unit with balcony view.' },
      { floorIdx: 7, bldgIdx: 2, num: 'MS-204', type: 'Studio', area: '65.00', bed: 1, bath: 1, rent: '34000.00', dep: '68000.00', status: 'VACANT', desc: 'Furnished studio flat with fitted kitchen appliances.' },
      { floorIdx: 7, bldgIdx: 2, num: 'MS-205', type: 'Apartment', area: '190.00', bed: 3, bath: 3, rent: '92000.00', dep: '184000.00', status: 'VACANT', desc: 'Executive duplex apartment with private elevator access.' },
    ];

    const unitsToInsert = unitTemplates.map((u) => ({
      buildingId: insertedBuildings[u.bldgIdx].id,
      floorId: insertedFloors[u.floorIdx].id,
      unitNumber: u.num,
      unitType: u.type,
      area: u.area,
      bedrooms: u.bed,
      bathrooms: u.bath,
      monthlyRent: u.rent,
      depositAmount: u.dep,
      status: u.status,
      description: u.desc,
    }));

    const insertedUnits = await db.insert(units).values(unitsToInsert).returning();

    // 7. SEED TENANTS (20 Realistic Ethiopian Individuals and Corporate Entities)
    const tenantsData = [
      {
        fullName: 'Abyssinia Coffee Roasters PLC',
        phone: '+251 911 234567',
        email: 'info@abyssiniacoffee.et',
        idType: 'Business License',
        idNumber: 'BL-AA-2023-8841',
        address: 'Bole Sub-City, Addis Ababa',
        emergencyContact: 'Tewodros Kassaye (+251 911 345678)',
        notes: 'High volume specialty coffee chain anchor tenant.',
        profilePhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Dr. Selamawit Hailemariam',
        phone: '+251 912 345678',
        email: 'dr.selamawit@healthplus.et',
        idType: 'National ID',
        idNumber: 'ETH-ID-992384',
        address: 'Kirkos Sub-City, Addis Ababa',
        emergencyContact: 'Yonas Hailemariam (+251 912 887766)',
        notes: 'Lead practitioner at HealthPlus Specialist Clinic.',
        profilePhoto: 'https://images.unsplash.com/photo-1594824813576-24e548fa068b?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'FinTech Africa Solutions',
        phone: '+251 911 889900',
        email: 'contact@fintechafrica.et',
        idType: 'Investment Permit',
        idNumber: 'EIC-INV-7732',
        address: 'Bole Medhanealem, Addis Ababa',
        emergencyContact: 'Meron Mengesha (+251 911 554433)',
        notes: 'Payment gateway and core banking integration technology provider.',
        profilePhoto: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Eleni Berhanu & Associates Law',
        phone: '+251 913 456789',
        email: 'eleni@berhanulaw.et',
        idType: 'Advocate License',
        idNumber: 'MOJ-ADV-1049',
        address: 'Mexico Square, Addis Ababa',
        emergencyContact: 'Abebe Berhanu (+251 913 223344)',
        notes: 'Commercial arbitration and property conveyance legal firm.',
        profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Awash Express Logistics Ltd',
        phone: '+251 911 654321',
        email: 'dispatch@awashexpress.et',
        idType: 'Business License',
        idNumber: 'BL-KIRKOS-4921',
        address: 'Kirkos, Addis Ababa',
        emergencyContact: 'Binyam Worku (+251 911 998877)',
        notes: 'Air freight forwarding and customs clearing agent.',
        profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Zemen Microfinance Share Co',
        phone: '+251 911 112233',
        email: 'branch.bole@zemenmf.et',
        idType: 'Banking License',
        idNumber: 'NBE-BNK-039',
        address: 'Cameroon St, Bole, Addis Ababa',
        emergencyContact: 'Rahel Tadesse (+251 911 445566)',
        notes: 'Financial inclusion provider with high foot traffic.',
        profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Dawit & Mahlet Pharmaceutical',
        phone: '+251 914 567890',
        email: 'order@dmpharma.et',
        idType: 'Pharmacy Board License',
        idNumber: 'EFDA-MED-4421',
        address: 'Bole, Addis Ababa',
        emergencyContact: 'Mahlet Gebru (+251 914 332211)',
        notes: 'Imported essential medical supplies and community dispensing.',
        profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Horn of Africa Humanitarian Initiative',
        phone: '+251 911 776655',
        email: 'countryoffice@hoahi.org',
        idType: 'NGO Registration',
        idNumber: 'ACSO-NGO-5519',
        address: 'Meskel Square, Addis Ababa',
        emergencyContact: 'Samuel Bekele (+251 911 110022)',
        notes: 'International NGO regional humanitarian coordination desk.',
        profilePhoto: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Marcus Vance (Embassy Attaché)',
        phone: '+251 920 112233',
        email: 'm.vance@diplomatic-mission.gov',
        idType: 'Diplomatic Passport',
        idNumber: 'DIP-GB-884910',
        address: 'Meskel Square Complex, Penthouse 201',
        emergencyContact: 'Sarah Vance (+251 920 998811)',
        notes: 'Long term diplomatic residency lease.',
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Kidus Yohannes Architecture Studio',
        phone: '+251 915 678901',
        email: 'kidus@arch-design.et',
        idType: 'National ID',
        idNumber: 'ETH-ID-773412',
        address: 'Bole Sub-City, Addis Ababa',
        emergencyContact: 'Hanna Yohannes (+251 915 224466)',
        notes: 'Sustainable urban design and construction supervision consultancy.',
        profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Red Sea Trade Delegation',
        phone: '+251 911 334455',
        email: 'liaison@redseatrade.com',
        idType: 'Bilateral Mission',
        idNumber: 'MFA-BL-0941',
        address: 'Meskel Square, Addis Ababa',
        emergencyContact: 'Ahmed Al-Mansoor (+251 911 778899)',
        notes: 'Commercial trade and transit coordination desk.',
        profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Solomon Teshome & Co Auditors',
        phone: '+251 916 789012',
        email: 'st@solomonaudit.et',
        idType: 'AABE Certified Auditor',
        idNumber: 'AABE-AUD-0238',
        address: 'Cameroon St, Bole, Addis Ababa',
        emergencyContact: 'Martha Teshome (+251 916 556677)',
        notes: 'Tax advisory and statutory auditing practice.',
        profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Nile Blue Creative Media',
        phone: '+251 911 009988',
        email: 'producer@nileblue.et',
        idType: 'Business License',
        idNumber: 'BL-BOLE-6612',
        address: 'Bole Business Center, Addis Ababa',
        emergencyContact: 'Desta Alemayehu (+251 911 223399)',
        notes: 'Broadcasting, advertising, and digital documentary production.',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Addis Dental Specialty Group',
        phone: '+251 917 890123',
        email: 'info@addisdental.et',
        idType: 'Medical Council License',
        idNumber: 'EMC-DEN-0418',
        address: 'Mexico Square, Addis Tower, Addis Ababa',
        emergencyContact: 'Dr. Michael Desta (+251 917 665544)',
        notes: 'Orthodontic and maxillofacial specialist clinic.',
        profilePhoto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Ethio telecom Authorized Agent',
        phone: '+251 911 443322',
        email: 'store.mexico@ethioagent.et',
        idType: 'Dealer Certificate',
        idNumber: 'ETC-DLR-1082',
        address: 'Mexico Square, Addis Tower, Addis Ababa',
        emergencyContact: 'Helen Kebede (+251 911 667788)',
        notes: 'SIM provisioning, Telebirr merchant services, devices.',
        profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Abinet Mekonnen (Executive Residence)',
        phone: '+251 918 901234',
        email: 'abinet.mekonnen@telecom.et',
        idType: 'National ID',
        idNumber: 'ETH-ID-339182',
        address: 'Meskel Square Complex, Flat 202',
        emergencyContact: 'Tsion Mekonnen (+251 918 112233)',
        notes: 'Senior telecommunications executive long-term residency.',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Berhan Skylight Travel & Tours',
        phone: '+251 911 556677',
        email: 'booking@berhantravel.et',
        idType: 'Tour Operator License',
        idNumber: 'MOT-TOUR-0912',
        address: 'Mexico Square, Addis Tower, Addis Ababa',
        emergencyContact: 'Girma Belay (+251 911 889911)',
        notes: 'IATA-certified international airline ticketing agent.',
        profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Tadesse & Sons Hardware & Tech Supplies',
        phone: '+251 919 012345',
        email: 'supply@tadessesons.et',
        idType: 'Business License',
        idNumber: 'BL-BOLE-3390',
        address: 'Bole Business Center, Addis Ababa',
        emergencyContact: 'Eyob Tadesse (+251 919 778899)',
        notes: 'IT equipment wholesale and server accessories distribution.',
        profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Kagnew Physiotherapy & Wellness',
        phone: '+251 911 665544',
        email: 'rehab@kagnewwellness.et',
        idType: 'Health Bureau License',
        idNumber: 'AAHB-PHY-0192',
        address: 'Mexico Square, Addis Tower, Addis Ababa',
        emergencyContact: 'Sister Aster Kagnew (+251 911 332211)',
        notes: 'Sports injury rehabilitation and postural ergonomics.',
        profilePhoto: 'https://images.unsplash.com/photo-1594824813576-24e548fa068b?w=150&auto=format&fit=crop&q=80',
      },
      {
        fullName: 'Sophie Durand (International Consultant)',
        phone: '+251 922 334455',
        email: 'sophie.durand@un-habitat.org',
        idType: 'UN Laissez-Passer',
        idNumber: 'UNLP-09381',
        address: 'Meskel Square Complex, Flat 203',
        emergencyContact: 'Pierre Durand (+33 6 12345678)',
        notes: 'Urban sustainability expert on long-term project posting.',
        profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
    ];

    const insertedTenants = await db.insert(tenants).values(tenantsData).returning();

    // 8. LINK OCCUPIED UNITS & TENANTS (tenant_units)
    // We match 15 occupied units with tenants
    const occupiedUnits = insertedUnits.filter((u) => u.status === 'OCCUPIED').slice(0, 15);
    const tenantUnitPairs = occupiedUnits.map((u, idx) => ({
      tenantId: insertedTenants[idx].id,
      unitId: u.id,
      isCurrent: true,
      assignedAt: new Date(),
    }));

    await db.insert(tenantUnits).values(tenantUnitPairs);

    // 9. SEED CONTRACTS (15 Contracts with diverse statuses: ACTIVE, EXPIRING SOON, EXPIRED, DRAFT)
    const today = new Date('2026-09-05');
    const addDays = (d: Date, days: number) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy.toISOString().split('T')[0];
    };

    const contractsData = [
      // 1. Expiring soon (<30 days from 2026-09-05) -> Ends in 12 days
      {
        contractNumber: 'CNT-2025-001',
        tenantId: insertedTenants[0].id,
        unitId: occupiedUnits[0].id,
        startDate: '2025-09-17',
        endDate: addDays(today, 12),
        monthlyRent: occupiedUnits[0].monthlyRent,
        deposit: occupiedUnits[0].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'EXPIRING',
        notes: 'Renewal discussion ongoing. Tenant requests 2-year extension.',
      },
      // 2. Expiring soon -> Ends in 24 days
      {
        contractNumber: 'CNT-2025-002',
        tenantId: insertedTenants[1].id,
        unitId: occupiedUnits[1].id,
        startDate: '2025-09-29',
        endDate: addDays(today, 24),
        monthlyRent: occupiedUnits[1].monthlyRent,
        deposit: occupiedUnits[1].depositAmount,
        paymentFrequency: 'Quarterly',
        contractStatus: 'EXPIRING',
        notes: 'Tenant scheduled inspection for lease rollover.',
      },
      // 3. Expired (End date is in the past)
      {
        contractNumber: 'CNT-2024-089',
        tenantId: insertedTenants[2].id,
        unitId: occupiedUnits[2].id,
        startDate: '2024-08-01',
        endDate: addDays(today, -15),
        monthlyRent: occupiedUnits[2].monthlyRent,
        deposit: occupiedUnits[2].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'EXPIRED',
        notes: 'Contract expired on August 21, 2026. Needs immediate renewal signing or unit vacancy notice.',
      },
      // 4. Expired 2 months ago
      {
        contractNumber: 'CNT-2024-072',
        tenantId: insertedTenants[3].id,
        unitId: occupiedUnits[3].id,
        startDate: '2024-06-15',
        endDate: addDays(today, -60),
        monthlyRent: occupiedUnits[3].monthlyRent,
        deposit: occupiedUnits[3].depositAmount,
        paymentFrequency: 'Semi-Annually',
        contractStatus: 'EXPIRED',
        notes: 'Overdue contract under legal review for continuation.',
      },
      // 5. Active - Healthy (Ends in 8 months)
      {
        contractNumber: 'CNT-2026-105',
        tenantId: insertedTenants[4].id,
        unitId: occupiedUnits[4].id,
        startDate: '2026-05-01',
        endDate: addDays(today, 240),
        monthlyRent: occupiedUnits[4].monthlyRent,
        deposit: occupiedUnits[4].depositAmount,
        paymentFrequency: 'Quarterly',
        contractStatus: 'ACTIVE',
        notes: 'Corporate lease with prompt quarterly bank wire transfer.',
      },
      // 6. Active (Ends in 11 months)
      {
        contractNumber: 'CNT-2026-112',
        tenantId: insertedTenants[5].id,
        unitId: occupiedUnits[5].id,
        startDate: '2026-08-01',
        endDate: addDays(today, 330),
        monthlyRent: occupiedUnits[5].monthlyRent,
        deposit: occupiedUnits[5].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'ACTIVE',
        notes: 'Financial institution with standard 3-year escalation clause.',
      },
      // 7. Active
      {
        contractNumber: 'CNT-2026-118',
        tenantId: insertedTenants[6].id,
        unitId: occupiedUnits[6].id,
        startDate: '2026-07-01',
        endDate: addDays(today, 300),
        monthlyRent: occupiedUnits[6].monthlyRent,
        deposit: occupiedUnits[6].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'ACTIVE',
        notes: 'Pharmacy lease with priority power generator clause.',
      },
      // 8. Active (Ends in 14 months)
      {
        contractNumber: 'CNT-2026-124',
        tenantId: insertedTenants[7].id,
        unitId: occupiedUnits[7].id,
        startDate: '2026-06-01',
        endDate: addDays(today, 420),
        monthlyRent: occupiedUnits[7].monthlyRent,
        deposit: occupiedUnits[7].depositAmount,
        paymentFrequency: 'Annually',
        contractStatus: 'ACTIVE',
        notes: 'International NGO annual prepaid lease.',
      },
      // 9. Active
      {
        contractNumber: 'CNT-2026-130',
        tenantId: insertedTenants[8].id,
        unitId: occupiedUnits[8].id,
        startDate: '2026-03-01',
        endDate: addDays(today, 180),
        monthlyRent: occupiedUnits[8].monthlyRent,
        deposit: occupiedUnits[8].depositAmount,
        paymentFrequency: 'Semi-Annually',
        contractStatus: 'ACTIVE',
        notes: 'Diplomatic residential tenancy with diplomatic waiver clause.',
      },
      // 10. Active
      {
        contractNumber: 'CNT-2026-135',
        tenantId: insertedTenants[9].id,
        unitId: occupiedUnits[9].id,
        startDate: '2026-02-15',
        endDate: addDays(today, 160),
        monthlyRent: occupiedUnits[9].monthlyRent,
        deposit: occupiedUnits[9].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'ACTIVE',
        notes: 'Design office with permission for architectural model display.',
      },
      // 11. Active
      {
        contractNumber: 'CNT-2026-140',
        tenantId: insertedTenants[10].id,
        unitId: occupiedUnits[10].id,
        startDate: '2026-01-10',
        endDate: addDays(today, 125),
        monthlyRent: occupiedUnits[10].monthlyRent,
        deposit: occupiedUnits[10].depositAmount,
        paymentFrequency: 'Quarterly',
        contractStatus: 'ACTIVE',
        notes: 'Trade delegation with diplomatic parking stall allocation.',
      },
      // 12. Active
      {
        contractNumber: 'CNT-2026-145',
        tenantId: insertedTenants[11].id,
        unitId: occupiedUnits[11].id,
        startDate: '2026-04-01',
        endDate: addDays(today, 210),
        monthlyRent: occupiedUnits[11].monthlyRent,
        deposit: occupiedUnits[11].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'ACTIVE',
        notes: 'Audit firm lease.',
      },
      // 13. Active
      {
        contractNumber: 'CNT-2026-150',
        tenantId: insertedTenants[12].id,
        unitId: occupiedUnits[12].id,
        startDate: '2026-05-15',
        endDate: addDays(today, 255),
        monthlyRent: occupiedUnits[12].monthlyRent,
        deposit: occupiedUnits[12].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'ACTIVE',
        notes: 'Media studio with acoustic dampening guarantee.',
      },
      // 14. Draft
      {
        contractNumber: 'CNT-2026-155-DRAFT',
        tenantId: insertedTenants[13].id,
        unitId: occupiedUnits[13].id,
        startDate: addDays(today, 15),
        endDate: addDays(today, 380),
        monthlyRent: occupiedUnits[13].monthlyRent,
        deposit: occupiedUnits[13].depositAmount,
        paymentFrequency: 'Monthly',
        contractStatus: 'DRAFT',
        notes: 'Awaiting board approval and final stamp from Ministry of Trade.',
      },
      // 15. Draft
      {
        contractNumber: 'CNT-2026-160-DRAFT',
        tenantId: insertedTenants[14].id,
        unitId: occupiedUnits[14].id,
        startDate: addDays(today, 20),
        endDate: addDays(today, 385),
        monthlyRent: occupiedUnits[14].monthlyRent,
        deposit: occupiedUnits[14].depositAmount,
        paymentFrequency: 'Quarterly',
        contractStatus: 'DRAFT',
        notes: 'Fit-out schedule attached. Deposit verification in progress.',
      },
    ];

    const insertedContracts = await db.insert(contracts).values(contractsData).returning();

    // 10. SEED DOCUMENTS (Generic Polymorphic Document Architecture)
    const documentsData = [
      // Building document
      {
        entityType: 'building',
        entityId: insertedBuildings[0].id,
        fileName: 'Bole_Business_Center_Architectural_Blueprints.pdf',
        fileType: 'application/pdf',
        fileSize: 14820000,
        storageKey: 'buildings/bbc-01/blueprints.pdf',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
      {
        entityType: 'building',
        entityId: insertedBuildings[1].id,
        fileName: 'Addis_Tower_Structural_Safety_Certificate_2026.pdf',
        fileType: 'application/pdf',
        fileSize: 3420000,
        storageKey: 'buildings/at-02/safety-cert.pdf',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
      // Unit document
      {
        entityType: 'unit',
        entityId: occupiedUnits[0].id,
        fileName: 'Unit_G01_Floorplan_Electrical_Layout.pdf',
        fileType: 'application/pdf',
        fileSize: 2150000,
        storageKey: 'units/g-01/layout.pdf',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
      // Tenant documents
      {
        entityType: 'tenant',
        entityId: insertedTenants[0].id,
        fileName: 'Abyssinia_Coffee_Commercial_Registration_Certificate.pdf',
        fileType: 'application/pdf',
        fileSize: 1980000,
        storageKey: 'tenants/t1/business_reg.pdf',
        url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
      {
        entityType: 'tenant',
        entityId: insertedTenants[1].id,
        fileName: 'Dr_Selamawit_Medical_License_Board_ID.pdf',
        fileType: 'application/pdf',
        fileSize: 1450000,
        storageKey: 'tenants/t2/medical_board.pdf',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
      // Contract documents
      {
        entityType: 'contract',
        entityId: insertedContracts[0].id,
        fileName: 'CNT_2025_001_Executed_Lease_Agreement_Stamped.pdf',
        fileType: 'application/pdf',
        fileSize: 5600000,
        storageKey: 'contracts/cnt-2025-001/signed_lease.pdf',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
      {
        entityType: 'contract',
        entityId: insertedContracts[4].id,
        fileName: 'CNT_2026_105_Corporate_Tenancy_Contract.pdf',
        fileType: 'application/pdf',
        fileSize: 4200000,
        storageKey: 'contracts/cnt-2026-105/signed_lease.pdf',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
        uploadedBy: superAdminUserId,
      },
    ];

    await db.insert(documents).values(documentsData);

    // 11. SEED PAYMENTS & RECEIPTS (Prepared for future phases)
    const paymentsData = [
      {
        contractId: insertedContracts[0].id,
        tenantId: insertedTenants[0].id,
        unitId: occupiedUnits[0].id,
        amount: '65000.00',
        paymentDate: '2026-08-05',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'CBE-TX-9948201',
        status: 'PAID',
        notes: 'August 2026 monthly rent payment.',
      },
      {
        contractId: insertedContracts[4].id,
        tenantId: insertedTenants[4].id,
        unitId: occupiedUnits[4].id,
        amount: '216000.00',
        paymentDate: '2026-08-01',
        paymentMethod: 'Telebirr SuperApp',
        referenceNumber: 'TB-88992314',
        status: 'PAID',
        notes: 'Q3 Advance rent payment (3 months).',
      },
      {
        contractId: insertedContracts[2].id,
        tenantId: insertedTenants[2].id,
        unitId: occupiedUnits[2].id,
        amount: '52000.00',
        paymentDate: '2026-08-01',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'BOA-FT-7741',
        status: 'OVERDUE',
        notes: 'August rent overdue. Second reminder sent to tenant finance.',
      },
    ];

    const insertedPayments = await db.insert(payments).values(paymentsData).returning();

    // Receipts
    const receiptsData = [
      {
        paymentId: insertedPayments[0].id,
        receiptNumber: 'RCP-2026-0801',
        issueDate: '2026-08-05',
        amount: '65000.00',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
      },
      {
        paymentId: insertedPayments[1].id,
        receiptNumber: 'RCP-2026-0802',
        issueDate: '2026-08-01',
        amount: '216000.00',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
      },
    ];
    await db.insert(receipts).values(receiptsData);

    // 12. SEED MAINTENANCE REQUESTS
    const maintenanceData = [
      {
        unitId: insertedUnits.find((u) => u.unitNumber === '106')?.id,
        buildingId: insertedBuildings[0].id,
        title: 'Central Air Conditioning Duct Sensor Replacement',
        description: 'VAV damper controller on Unit 106 ceiling plenum intermittent signal.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        reportedBy: 'Bethlehem Tadesse (Property Manager)',
        assignedTo: 'Dawit Mengistu (HVAC Technician)',
      },
      {
        unitId: insertedUnits.find((u) => u.unitNumber === 'AT-105')?.id,
        buildingId: insertedBuildings[1].id,
        title: 'Executive Washroom Water Pressure Regulator Leak',
        description: 'Secondary line pressure relief valve weeping behind service hatch.',
        priority: 'URGENT',
        status: 'OPEN',
        reportedBy: 'Kagnew Physiotherapy & Wellness',
        assignedTo: 'Dawit Mengistu (Lead Plumber)',
      },
      {
        unitId: occupiedUnits[0].id,
        buildingId: insertedBuildings[0].id,
        tenantId: insertedTenants[0].id,
        title: 'Automated Entrance Glass Sliding Door Calibration',
        description: 'Motion sensor sensitivity needs recalibration during peak rush hours.',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        reportedBy: 'Abyssinia Coffee Operations',
        assignedTo: 'Haile Facilities Services',
      },
    ];

    await db.insert(maintenanceRequests).values(maintenanceData);

    // 13. SEED NOTIFICATIONS
    const notificationsData = [
      {
        userId: superAdminUserId,
        title: 'Contract Expiring Soon',
        message: 'Contract CNT-2025-001 (Abyssinia Coffee Roasters) expires in 12 days.',
        type: 'WARNING',
        link: '/contracts',
      },
      {
        userId: superAdminUserId,
        title: 'Rent Overdue',
        message: 'Unit G-03 (FinTech Africa Solutions) rent is 15 days overdue.',
        type: 'ALERT',
        link: '/payments',
      },
      {
        userId: superAdminUserId,
        title: 'Open Maintenance Request',
        message: 'High priority plumbing repair logged for Addis Tower Unit AT-105.',
        type: 'WARNING',
        link: '/maintenance',
      },
      {
        userId: superAdminUserId,
        title: 'Occupancy Rate Stable',
        message: 'Overall property portfolio occupancy currently stands at 65% with 26 occupied units.',
        type: 'INFO',
        link: '/units',
      },
    ];

    await db.insert(notifications).values(notificationsData);

    // 14. SEED AUDIT LOGS
    const auditLogsData = [
      {
        userId: superAdminUserId,
        userEmail: 'admin@apexproperties.et',
        action: 'BUILDING_CREATED',
        entityType: 'building',
        entityId: insertedBuildings[0].id,
        newValues: JSON.stringify({ name: 'Bole Business Center', code: 'BBC-01', totalUnits: 16 }),
        ipAddress: '197.156.103.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        userId: superAdminUserId,
        userEmail: 'admin@apexproperties.et',
        action: 'TENANT_CREATED',
        entityType: 'tenant',
        entityId: insertedTenants[0].id,
        newValues: JSON.stringify({ fullName: 'Abyssinia Coffee Roasters PLC' }),
        ipAddress: '197.156.103.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        userId: superAdminUserId,
        userEmail: 'admin@apexproperties.et',
        action: 'CONTRACT_CREATED',
        entityType: 'contract',
        entityId: insertedContracts[0].id,
        newValues: JSON.stringify({ contractNumber: 'CNT-2025-001', monthlyRent: '65000.00' }),
        ipAddress: '197.156.103.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        userId: superAdminUserId,
        userEmail: 'admin@apexproperties.et',
        action: 'UNIT_STATUS_CHANGED',
        entityType: 'unit',
        entityId: insertedUnits.find((u) => u.unitNumber === '106')!.id,
        oldValues: JSON.stringify({ status: 'VACANT' }),
        newValues: JSON.stringify({ status: 'MAINTENANCE' }),
        ipAddress: '197.156.103.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    ];

    await db.insert(auditLogs).values(auditLogsData);

    // 15. SEED SYSTEM & ORG SETTINGS
    const settingsData = [
      { key: 'org_name', value: 'Apex Property Holdings Ltd' },
      { key: 'org_address', value: 'Bole Sub-City, Woreda 03, Cameroon Street, Addis Ababa' },
      { key: 'org_phone', value: '+251 11 661 2345' },
      { key: 'org_email', value: 'info@apexproperties.et' },
      { key: 'org_currency', value: 'ETB' },
      { key: 'org_date_format', value: 'YYYY-MM-DD' },
      { key: 'org_timezone', value: 'Africa/Addis_Ababa' },
      { key: 'org_language', value: 'English' },
    ];

    await db.insert(settings).values(settingsData);

    console.log('Seed process completed successfully!');
    return {
      message: 'Database seeded successfully with realistic demo data.',
      buildings: insertedBuildings.length,
      floors: insertedFloors.length,
      units: insertedUnits.length,
      tenants: insertedTenants.length,
      contracts: insertedContracts.length,
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
