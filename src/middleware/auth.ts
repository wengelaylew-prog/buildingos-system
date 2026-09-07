import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users, roles, permissions, rolePermissions, auditLogs, organizations } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
  organizationId: string;
  organizationName: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const DEFAULT_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

// In-memory permissions cache for high-throughput validation
const rolePermissionsCache = new Map<string, string[]>();

export async function getPermissionsForRole(roleId: string, roleCode: string): Promise<string[]> {
  if (rolePermissionsCache.has(roleCode)) {
    return rolePermissionsCache.get(roleCode)!;
  }

  try {
    const records = await db
      .select({
        code: permissions.code,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    const codes = records.map((r) => r.code);
    rolePermissionsCache.set(roleCode, codes);
    return codes;
  } catch (error) {
    console.error('Failed to fetch role permissions:', error);
    return [];
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // 1. Real Firebase Auth Token Check
    if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('demo_token')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);

        // A. Look up user by Firebase UID
        let dbUser = (await db.select().from(users).where(eq(users.uid, decodedToken.uid)))[0];

        // B. If not found by UID, check if user was pre-created/invited by email
        if (!dbUser && decodedToken.email) {
          const userByEmail = (await db.select().from(users).where(eq(users.email, decodedToken.email)))[0];
          if (userByEmail) {
            const updated = await db
              .update(users)
              .set({
                uid: decodedToken.uid,
                avatarUrl: decodedToken.picture || userByEmail.avatarUrl,
                fullName: decodedToken.name || userByEmail.fullName,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userByEmail.id))
              .returning();
            dbUser = updated[0];
          }
        }

        // C. If user is completely new: PROVISION A DEDICATED, ISOLATED ORGANIZATION
        // Never dump new users into DEFAULT_ORG_ID (prevents data leak of Apex Properties)
        if (!dbUser) {
          const userDisplayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Property';
          const orgName = `${userDisplayName}'s Properties`;
          const orgCode = `ORG-${Date.now().toString(36).toUpperCase()}`;

          const [newOrg] = await db
            .insert(organizations)
            .values({
              name: orgName,
              code: orgCode,
              slug: orgCode.toLowerCase(),
            })
            .returning();

          const defaultRole = (await db.select().from(roles).where(eq(roles.code, 'PROPERTY_MANAGER')))[0]
            || (await db.select().from(roles).where(eq(roles.code, 'SUPER_ADMIN')))[0]
            || (await db.select().from(roles).limit(1))[0];

          const newUsers = await db
            .insert(users)
            .values({
              uid: decodedToken.uid,
              email: decodedToken.email || `user-${decodedToken.uid.slice(0, 8)}@buildingos.et`,
              fullName: decodedToken.name || userDisplayName,
              avatarUrl: decodedToken.picture,
              roleId: defaultRole?.id,
              organizationId: newOrg.id,
              isActive: true,
            })
            .returning();
          dbUser = newUsers[0];
        }

        if (!dbUser.isActive) {
          return res.status(403).json({
            error: {
              code: 'ACCOUNT_DISABLED',
              message: 'Your user account is disabled. Please contact your administrator.',
            },
            success: false,
            data: null,
            message: 'Your user account is disabled.',
            errors: ['Account inactive'],
          });
        }

        // D. Resolve User Role & Permissions
        const userRole = dbUser.roleId
          ? (await db.select().from(roles).where(eq(roles.id, dbUser.roleId)))[0]
          : null;

        const roleCode = userRole?.code || 'PROPERTY_MANAGER';
        const perms = userRole ? await getPermissionsForRole(userRole.id, roleCode) : [];

        // E. STRICT ORGANIZATION RESOLUTION:
        // Organization ID is strictly bound to dbUser.organizationId in PostgreSQL.
        // Frontend headers (like x-organization-id) are NOT trusted to override this.
        let userOrg = dbUser.organizationId
          ? (await db.select().from(organizations).where(eq(organizations.id, dbUser.organizationId)))[0]
          : null;

        if (!userOrg) {
          // If legacy user record lacks organization, isolate them into a newly created org
          const orgCode = `ORG-${Date.now().toString(36).toUpperCase()}`;
          const [newOrg] = await db
            .insert(organizations)
            .values({
              name: `${dbUser.fullName}'s Organization`,
              code: orgCode,
              slug: orgCode.toLowerCase(),
            })
            .returning();

          await db.update(users).set({ organizationId: newOrg.id }).where(eq(users.id, dbUser.id));
          userOrg = newOrg;
        }

        req.user = {
          id: dbUser.id,
          uid: dbUser.uid,
          email: dbUser.email,
          fullName: dbUser.fullName,
          roleCode,
          roleName: userRole?.name || 'Property Manager',
          permissions: perms,
          organizationId: userOrg.id,
          organizationName: userOrg.name,
        };
        return next();
      } catch (fbError) {
        console.warn('Firebase token verification failed:', fbError);
        if (isProduction) {
          return res.status(401).json({
            error: {
              code: 'UNAUTHENTICATED',
              message: 'Invalid or expired authentication token',
            },
            success: false,
            data: null,
            message: 'Invalid or expired authentication token',
            errors: [String(fbError)],
          });
        }
      }
    }

    // 2. PRODUCTION SECURITY GUARD:
    // In production, require strict Bearer authentication. Never allow demo role headers!
    if (isProduction) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Missing or invalid Bearer token.',
        },
        success: false,
        data: null,
        message: 'Authentication required. Missing or invalid Bearer token.',
        errors: ['Bearer token is mandatory in production environment'],
      });
    }

    // 3. DEVELOPMENT / DEMO FALLBACK (ONLY for non-production environments)
    // Allows testing different roles (x-demo-role) during local evaluation.
    const demoRoleHeader = req.headers['x-demo-role'] as string | undefined;
    const targetRoleCode = demoRoleHeader || 'SUPER_ADMIN';

    const matchedRole = (await db.select().from(roles).where(eq(roles.code, targetRoleCode)))[0]
      || (await db.select().from(roles).where(eq(roles.code, 'SUPER_ADMIN')))[0];

    const matchedUser = matchedRole
      ? (await db.select().from(users).where(eq(users.roleId, matchedRole.id)))[0]
      : null;

    const perms = matchedRole ? await getPermissionsForRole(matchedRole.id, matchedRole.code) : [];

    // In dev mode, resolve the organization tied to that seeded user in PostgreSQL
    let org = matchedUser?.organizationId
      ? (await db.select().from(organizations).where(eq(organizations.id, matchedUser.organizationId)))[0]
      : null;

    if (!org) {
      org = (await db.select().from(organizations).where(eq(organizations.id, DEFAULT_ORG_ID)))[0]
        || (await db.select().from(organizations).limit(1))[0];
    }

    req.user = {
      id: matchedUser?.id || '00000000-0000-0000-0000-000000000001',
      uid: matchedUser?.uid || 'demo-admin-uid',
      email: matchedUser?.email || 'admin@apexproperties.et',
      fullName: matchedUser?.fullName || 'System Administrator',
      roleCode: matchedRole?.code || 'SUPER_ADMIN',
      roleName: matchedRole?.name || 'Super Administrator',
      permissions: perms,
      organizationId: org?.id || DEFAULT_ORG_ID,
      organizationName: org?.name || 'Apex Properties',
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication failed',
      },
      success: false,
      data: null,
      message: 'Authentication failed',
      errors: [String(error)],
    });
  }
};

/**
 * Granular RBAC Permission Guard Middleware
 */
export const requirePermission = (permissionCode: string | string[]) => {
  const codes = Array.isArray(permissionCode) ? permissionCode : [permissionCode];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Unauthorized: User not authenticated',
        },
        success: false,
        data: null,
        message: 'Unauthorized: User not authenticated',
        errors: [],
      });
    }

    // Tenant must NOT access organization-wide CRUD or manage properties
    if (req.user.roleCode === 'TENANT') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Tenant users do not have access to property management operations.',
        },
        success: false,
        data: null,
        message: 'Tenant users do not have access to property management operations.',
        errors: ['Role TENANT is forbidden from property operations'],
      });
    }

    // SUPER_ADMIN has master override
    if (req.user.roleCode === 'SUPER_ADMIN') {
      return next();
    }

    // Maintenance role special permission for status update
    if (
      req.user.roleCode === 'MAINTENANCE' &&
      codes.includes('unit.update') &&
      req.user.permissions.includes('unit.status')
    ) {
      return next();
    }

    // Check if user has any of the acceptable permissions
    const hasPermission = codes.some((code) => req.user?.permissions.includes(code));
    if (hasPermission) {
      return next();
    }

    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: `Forbidden: You do not have permission to perform this action (${codes.join(' or ')}).`,
      },
      success: false,
      data: null,
      message: `Forbidden: You lack the required permission (${codes.join(' or ')}) for this operation.`,
      errors: [`Required permission: ${codes.join(' or ')}`],
    });
  };
};

const isValidUuid = (val?: string): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

/**
 * Mutation Audit Logging Helper
 */
export async function logAudit(params: {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  req?: Request;
}) {
  try {
    const authReq = params.req as AuthRequest | undefined;
    const orgId = params.organizationId || authReq?.user?.organizationId || DEFAULT_ORG_ID;

    await db.insert(auditLogs).values({
      organizationId: isValidUuid(orgId) ? orgId : DEFAULT_ORG_ID,
      userId: isValidUuid(params.userId) ? params.userId : null,
      userEmail: params.userEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
      newValues: params.newValues ? JSON.stringify(params.newValues) : null,
      ipAddress: params.req?.ip || params.req?.headers['x-forwarded-for']?.toString() || '127.0.0.1',
      userAgent: params.req?.headers['user-agent'] || 'App Backend',
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
