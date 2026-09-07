import { db } from '../../db/index.ts';
import { organizations, users, units, tenants, auditLogs } from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';

export class AdminService {
  static async getSystemStats() {
    const allOrgs = await db.select().from(organizations);
    const allUsers = await db.select().from(users);
    const allUnits = await db.select().from(units).where(eq(units.isDeleted, false));
    const allTenants = await db.select().from(tenants).where(eq(tenants.isDeleted, false));

    return {
      totalOrganizations: allOrgs.length,
      activeOrganizations: allOrgs.filter(o => o.status === 'ACTIVE').length,
      totalUsers: allUsers.length,
      totalUnits: allUnits.length,
      totalTenants: allTenants.length,
    };
  }

  static async getOrganizations() {
    const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
    const allUsers = await db.select().from(users);
    
    return orgs.map(org => ({
      ...org,
      userCount: allUsers.filter(u => u.organizationId === org.id).length
    }));
  }

  static async updateOrganizationStatus(orgId: string, status: string) {
    await db.update(organizations).set({ status }).where(eq(organizations.id, orgId));
    return { success: true };
  }

  static async getUsers(organizationId?: string) {
    if (organizationId) {
      return await db.select().from(users).where(eq(users.organizationId, organizationId));
    }
    // Super admins see all
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  static async getAuditLogs(organizationId?: string) {
    if (organizationId) {
      return await db.select().from(auditLogs).where(eq(auditLogs.organizationId, organizationId)).orderBy(desc(auditLogs.createdAt)).limit(100);
    }
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  }
}
