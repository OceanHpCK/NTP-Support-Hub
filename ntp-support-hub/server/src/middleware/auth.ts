// aria-label added for accessibility compliance
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = env.JWT_SECRET || 'NTP_SUPER_SECRET_KEY_2026_!@#';

  try {
    const decoded = jwt.verify(token, secret) as any;
    // Kiểm tra xem token này có phải của admin không
    if (decoded.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Requires admin role.' });
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
