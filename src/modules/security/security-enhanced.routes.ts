import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { SeismicService } from './seismic.service';
import { ThreatDetectionService } from './threat-detection.service';
import { sendSuccess, sendError } from '../common/api-response';
import { db } from '../../db';
import { settings } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/v1/security/seismic/live
 * Returns live USGS earthquake data near the given lat/lng
 */
router.get('/seismic/live', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string || '9.03');
    const lng = parseFloat(req.query.lng as string || '38.74');
    const radius = parseInt(req.query.radius as string || '500');

    const earthquakes = await SeismicService.getLiveDataNearLocation(lat, lng, radius);
    return sendSuccess(res, earthquakes, 'Live seismic data fetched');
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
});

/**
 * POST /api/v1/security/analyze-frame
 * Upload a camera frame for AI threat analysis
 * Body: { image: base64 | url, cameraId: string }
 */
router.post('/analyze-frame', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { image, cameraId } = req.body;
    if (!image) return sendError(res, 400, 'Image (base64 or URL) is required');
    if (!cameraId) return sendError(res, 400, 'Camera ID is required');

    const result = await ThreatDetectionService.analyzeFrame(image, cameraId);
    return sendSuccess(res, result, 'Frame analysis complete');
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
});

/**
 * POST /api/v1/security/capture-and-analyze
 * Fetches a snapshot from an IP Camera URL then analyzes it
 * Body: { cameraUrl: string, cameraId: string }
 */
router.post('/capture-and-analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { cameraUrl, cameraId } = req.body;
    if (!cameraUrl) return sendError(res, 400, 'Camera URL is required');

    const base64 = await ThreatDetectionService.captureSnapshot(cameraUrl);
    const result = await ThreatDetectionService.analyzeFrame(base64, cameraId || 'IP-CAM');
    return sendSuccess(res, result, 'Camera captured and analyzed');
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
});

/**
 * POST /api/v1/security/cameras
 * Save IP camera URLs to settings (org-scoped)
 */
router.post('/cameras', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { cameras } = req.body; // [{ id, name, url }]
    const orgId = req.user?.organizationId;
    if (!orgId) return sendError(res, 400, 'Organization context required');

    await db.insert(settings).values({
      key: `security_cameras_${orgId}`,
      value: JSON.stringify(cameras),
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: JSON.stringify(cameras) }
    });

    return sendSuccess(res, cameras, 'Camera configuration saved');
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
});

/**
 * GET /api/v1/security/cameras
 * Retrieve saved camera list for this org
 */
router.get('/cameras', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return sendError(res, 400, 'Organization context required');

    const [row] = await db.select().from(settings).where(eq(settings.key, `security_cameras_${orgId}`));
    const cameras = row ? JSON.parse(row.value) : [];
    return sendSuccess(res, cameras, 'Cameras loaded');
  } catch (err: any) {
    return sendError(res, 500, err.message);
  }
});

export const securityEnhancedRouter = router;

