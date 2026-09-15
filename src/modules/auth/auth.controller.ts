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
      const existingUsers = await db.select().from(users).where(eq(users.email, email));
      if (existingUsers.length === 0) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const user = existingUsers[0];

      // 2. Verify password
      if (!user.passwordHash) {
        return sendError(res, 401, 'Please reset your password or login via original method');
      }

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
}
