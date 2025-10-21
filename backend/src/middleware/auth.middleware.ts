import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

/**
 * Middleware to protect routes requiring authentication
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to require SuperGuru (or higher) privileges for admin endpoints
 */
export function requireSuperGuru(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const hasElevatedAccess = req.user.globalRole === 'SUPER_GURU' || req.user.globalRole === 'ADMIN';

  if (!hasElevatedAccess) {
    res.status(403).json({ error: 'SuperGuru access required' });
    return;
  }

  // Ensure SuperGuru assignments exist unless user is platform admin
  if (req.user.globalRole === 'SUPER_GURU' && (!req.user.regionIds || req.user.regionIds.length === 0)) {
    res.status(403).json({ error: 'SuperGuru region assignment required' });
    return;
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't reject if missing
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (_error) {
    // Token invalid, but that's ok for optional auth
    next();
  }
}
