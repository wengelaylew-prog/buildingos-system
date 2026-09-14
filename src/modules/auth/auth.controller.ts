import { Response, Request } from 'express';
import { db } from '../../db/index.ts';
import { organizations, users, roles } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { sendSuccess, sendError } from '../common/api-response.ts';
import { adminAuth } from '../../lib/firebase-admin.ts';

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

      // 2. Use the UID provided by the frontend (which already registered in Firebase)
      const uid = req.body.uid;
      if (!uid) {
        return sendError(res, 400, 'Firebase UID is missing from request');
      }

      // 3. Create Organization (Status: PENDING_PAYMENT)
      const orgCode = `ORG-${Date.now().toString(36).toUpperCase()}`;
      const [newOrg] = await db.insert(organizations).values({
        name: organizationName,
        code: orgCode,
        slug: orgCode.toLowerCase(),
        subscriptionPlan: plan || 'FREE',
        subscriptionStatus: 'PENDING_PAYMENT',
      }).returning();

      // 4. Get Property Manager Role
      const [managerRole] = await db.select().from(roles).where(eq(roles.code, 'PROPERTY_MANAGER'));

      // 5. Create User in Postgres
      const [newUser] = await db.insert(users).values({
        uid,
        email,
        fullName,
        organizationId: newOrg.id,
        roleId: managerRole?.id, // Assumes PROPERTY_MANAGER exists
      }).returning();

      return sendSuccess(res, {
        user: newUser,
        organization: newOrg,
      }, 'Registration successful. Please proceed to payment.');
    } catch (err: any) {
      return sendError(res, 500, 'Registration failed', [err.message]);
    }
  }
}

