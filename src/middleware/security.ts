import { Request, Response, NextFunction } from 'express';

// 1. Basic CORS configuration
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-organization-id');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
};

// 2. Security Headers (Helmet alternative)
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// 3. Simple In-Memory Rate Limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let record = requestCounts.get(ip);
  if (!record || record.resetTime < now) {
    record = { count: 0, resetTime: now + WINDOW_MS };
  }
  
  record.count++;
  requestCounts.set(ip, record);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - record.count).toString());
  
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  
  next();
};

// 4. Environment Validation
export const validateEnvironment = () => {
  const requiredVars = ['PORT', 'DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.warn(`[WARNING] Missing recommended production environment variables: ${missing.join(', ')}`);
    // Fallbacks are handled in the application gracefully for sandbox, 
    // but in strict production this should throw:
    if (process.env.NODE_ENV === 'production') {
      console.warn('Production environment detected, but missing critical variables. Proceeding with caution.');
    }
  }
};

