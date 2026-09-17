import { Response, Request } from 'express';
import { db } from '../../db/index.ts';
import { organizations, users, roles } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { fullName, email, password, organizationName, plan } = req.body;

      if (!fullName || !email || !password || !organizationName) {
        return sendError(res, 400, 'All fields are required');
      }

      // 1. Check if email already exists in DB
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        return sendError(res, 400, 'User with this email already exists');
      }

      // 2. Create Organization (Status: PENDING_PAYMENT)
      const orgCode = `ORG-${Date.now().toString(36).toUpperCase()}`;
      const [newOrg] = await db.insert(organizations).values({
        name: organizationName,
        code: orgCode,
        slug: orgCode.toLowerCase(),
        subscriptionPlan: plan || 'FREE',
        subscriptionStatus: 'PENDING_PAYMENT',
      }).returning();

      // 3. Get Property Manager Role
      const [managerRole] = await db.select().from(roles).where(eq(roles.code, 'PROPERTY_MANAGER'));

      // 4. Create User in Postgres with hashed password
      const passwordHash = hashPassword(password);
      // Generate a random UID since we are not using Firebase
      const uid = `custom-${randomBytes(8).toString('hex')}`;

      const [newUser] = await db.insert(users).values({
        uid,
        email,
        fullName,
        passwordHash,
        organizationId: newOrg.id,
        roleId: managerRole?.id, // Assumes PROPERTY_MANAGER exists
      }).returning();

      // 5. Generate JWT Token
      const token = jwt.sign(
        { uid: newUser.uid, email: newUser.email },
        process.env.JWT_SECRET || 'fallback-secret-key-for-jwt-signing',
        { expiresIn: '30d' }
      );

      return sendSuccess(res, {
        user: newUser,
        organization: newOrg,
        token
      }, 'Registration successful. Please proceed to payment.');
    } catch (err: any) {
      return sendError(res, 500, 'Registration failed', [err.message]);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
      }

      // 1. Find user by email
      const existingUsers = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
      if (existingUsers.length === 0) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const user = existingUsers[0];

      // 2. Verify password
      if (!user.passwordHash) {
        const newHash = hashPassword(password);
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
        user.passwordHash = newHash;
      }

      // Check password validity
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return sendError(res, 401, 'Invalid email or password');
      }

      // 3. Generate JWT Token
      const token = jwt.sign(
        { uid: user.uid, email: user.email },
        process.env.JWT_SECRET || 'fallback-secret-key-for-jwt-signing',
        { expiresIn: '30d' }
      );

      return sendSuccess(res, {
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          fullName: user.fullName,
          organizationId: user.organizationId
        },
        token
      }, 'Login successful');
    } catch (err: any) {
      return sendError(res, 500, 'Login failed', [err.message]);
    }
  }

  static async seedDemo(req: any, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 400, 'No organization ID found');

      // Import tables inside the function to avoid circular dependencies at top level
      const { buildings, floors, units, tenants, contracts } = require('../../db/schema.ts');
      
      // 1. Building
      const bldg = await db.insert(buildings).values({
        organizationId: orgId,
        name: 'Century Mall & Residences',
        code: 'CMR-01',
        address: 'Bole Road, Block A',
        city: 'Addis Ababa',
        description: 'A premium mixed-use commercial and residential building.',
        numberOfFloors: 3,
        totalUnits: 6,
        status: 'ACTIVE'
      }).returning();
      
      const buildingId = bldg[0].id;

      // 2. Floors
      const flrs = await db.insert(floors).values([
        { organizationId: orgId, buildingId, floorNumber: 0, floorName: 'Ground Floor', description: 'Retail Shops', totalUnits: 2 },
        { organizationId: orgId, buildingId, floorNumber: 1, floorName: 'First Floor', description: 'Offices', totalUnits: 2 },
        { organizationId: orgId, buildingId, floorNumber: 2, floorName: 'Second Floor', description: 'Apartments', totalUnits: 2 },
      ]).returning();

      // 3. Units
      const insertedUnits = await db.insert(units).values([
        // Ground Floor
        { organizationId: orgId, buildingId, floorId: flrs[0].id, unitNumber: 'G-01', unitType: 'Retail', area: '120.5', baseRent: '150000.00', status: 'OCCUPIED' },
        { organizationId: orgId, buildingId, floorId: flrs[0].id, unitNumber: 'G-02', unitType: 'Retail', area: '95.0', baseRent: '120000.00', status: 'VACANT' },
        // First Floor
        { organizationId: orgId, buildingId, floorId: flrs[1].id, unitNumber: '1-01', unitType: 'Office', area: '200.0', baseRent: '250000.00', status: 'OCCUPIED' },
        { organizationId: orgId, buildingId, floorId: flrs[1].id, unitNumber: '1-02', unitType: 'Office', area: '180.0', baseRent: '230000.00', status: 'OCCUPIED' },
        // Second Floor
        { organizationId: orgId, buildingId, floorId: flrs[2].id, unitNumber: '2-01', unitType: 'Residential', area: '150.0', bedrooms: 3, bathrooms: 2, baseRent: '80000.00', status: 'OCCUPIED' },
        { organizationId: orgId, buildingId, floorId: flrs[2].id, unitNumber: '2-02', unitType: 'Residential', area: '100.0', bedrooms: 2, bathrooms: 1, baseRent: '50000.00', status: 'RESERVED' },
      ]).returning();

      // 4. Tenants
      const tnnts = await db.insert(tenants).values([
        { organizationId: orgId, firstName: 'Abebe', lastName: 'Kebede', email: 'abebe.k@example.com', phoneNumber: '+251911000001', idType: 'NATIONAL_ID', status: 'ACTIVE' },
        { organizationId: orgId, firstName: 'Zemen', lastName: 'Bank', email: 'branch@zemen.com', phoneNumber: '+251911000002', idType: 'BUSINESS_REGISTRATION', status: 'ACTIVE' },
        { organizationId: orgId, firstName: 'Selam', lastName: 'Trading', email: 'contact@selam.com', phoneNumber: '+251911000003', idType: 'BUSINESS_REGISTRATION', status: 'ACTIVE' },
        { organizationId: orgId, firstName: 'Tigist', lastName: 'Haile', email: 't.haile@example.com', phoneNumber: '+251911000004', idType: 'PASSPORT', status: 'ACTIVE' },
      ]).returning();

      // 5. Contracts
      const d = new Date();
      const nextYear = new Date(d);
      nextYear.setFullYear(d.getFullYear() + 1);

      await db.insert(contracts).values([
        { organizationId: orgId, buildingId, unitId: insertedUnits[0].id, tenantId: tnnts[1].id, contractType: 'COMMERCIAL', status: 'ACTIVE', startDate: d.toISOString(), endDate: nextYear.toISOString(), monthlyRent: '150000.00', securityDeposit: '450000.00' },
        { organizationId: orgId, buildingId, unitId: insertedUnits[2].id, tenantId: tnnts[2].id, contractType: 'COMMERCIAL', status: 'ACTIVE', startDate: d.toISOString(), endDate: nextYear.toISOString(), monthlyRent: '250000.00', securityDeposit: '750000.00' },
        { organizationId: orgId, buildingId, unitId: insertedUnits[3].id, tenantId: tnnts[2].id, contractType: 'COMMERCIAL', status: 'ACTIVE', startDate: d.toISOString(), endDate: nextYear.toISOString(), monthlyRent: '230000.00', securityDeposit: '690000.00' },
        { organizationId: orgId, buildingId, unitId: insertedUnits[4].id, tenantId: tnnts[3].id, contractType: 'RESIDENTIAL', status: 'ACTIVE', startDate: d.toISOString(), endDate: nextYear.toISOString(), monthlyRent: '80000.00', securityDeposit: '160000.00' },
      ]);

      return sendSuccess(res, { message: 'Demo data seeded successfully' });
    } catch (err: any) {
      console.error(err);
      return sendError(res, 500, 'Failed to seed demo data', [err.message]);
    }
  }

}