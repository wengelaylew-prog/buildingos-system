import { Router } from 'express';
import { MessagingController } from './messaging.controller.ts';
import { authenticate } from '../../middleware/auth.ts';

const router = Router();

// Message Routes
router.get('/messages', authenticate, MessagingController.getMessages);
router.post('/messages', authenticate, MessagingController.sendMessage);

// Notification Routes
router.get('/notifications', authenticate, MessagingController.getNotifications);
router.patch('/notifications/:id/read', authenticate, MessagingController.markNotificationRead);

// Announcements (Broadcasts)
router.get('/announcements', authenticate, MessagingController.getAnnouncements);
router.post('/announcements', authenticate, MessagingController.createAnnouncement);

export const messagingRouter = router;

