import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { announcements, communityPosts, tenants } from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';

const sendSuccess = (res: Response, data: any, message: string | null = null) => {
  return res.json({ success: true, data, message, errors: [] });
};

const sendError = (res: Response, status: number, message: string, errors: any[] = [], code?: string) => {
  return res.status(status).json({ success: false, data: null, message, errors, error: { code, message } });
};

export class CommunityController {
  // Admin & TMA: Get Announcements
  static async getAnnouncements(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const data = await db.select().from(announcements)
        .where(eq(announcements.organizationId, orgId))
        .orderBy(desc(announcements.createdAt));

      const mapped = data.map(d => ({ ...d, content: d.message, priority: 'NORMAL' }));
      return sendSuccess(res, mapped);
    } catch (e: any) {
      return sendError(res, 400, e.message);
    }
  }

  // Admin: Create Announcement
  static async createAnnouncement(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const { title, content } = req.body;

      const result = await db.insert(announcements).values({
        organizationId: orgId,
        title,
        message: content,
        targetAudience: 'ALL',
        createdBy: req.user.id
      }).returning();

      return sendSuccess(res, result[0]);
    } catch (e: any) {
      return sendError(res, 400, e.message);
    }
  }

  // TMA & Admin: Get Community Posts
  static async getPosts(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');

      const data = await db.select({
        post: communityPosts,
        tenantName: tenants.fullName
      })
      .from(communityPosts)
      .leftJoin(tenants, eq(communityPosts.tenantId, tenants.id))
      .where(eq(communityPosts.organizationId, orgId))
      .orderBy(desc(communityPosts.createdAt));

      return sendSuccess(res, data);
    } catch (e: any) {
      return sendError(res, 400, e.message);
    }
  }

  // TMA: Create Post
  static async createPost(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) return sendError(res, 401, 'Unauthorized');
      
      const { content, postType } = req.body;
      
      const tenant = (await db.select().from(tenants).where(eq(tenants.userId, req.user.id)))[0];
      if (!tenant) return sendError(res, 403, 'Only tenants can post');

      const result = await db.insert(communityPosts).values({
        organizationId: orgId,
        tenantId: tenant.id,
        content,
        postType: postType || 'GENERAL'
      }).returning();

      return sendSuccess(res, result[0]);
    } catch (e: any) {
      return sendError(res, 400, e.message);
    }
  }
}
