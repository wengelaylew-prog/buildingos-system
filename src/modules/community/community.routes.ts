import { Router } from 'express';
import { CommunityController } from './community.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

export const communityRouter = Router();

communityRouter.get('/announcements', authenticate, CommunityController.getAnnouncements);
communityRouter.post('/announcements', authenticate, CommunityController.createAnnouncement);
communityRouter.get('/posts', authenticate, CommunityController.getPosts);
communityRouter.post('/posts', authenticate, CommunityController.createPost);
