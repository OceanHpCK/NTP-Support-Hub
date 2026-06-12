import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';

const app = express();

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(',')
      : [];

    const isLocalOrLan = () => {
      try {
        const hostname = new URL(origin).hostname;
        return (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
        );
      } catch {
        return false;
      }
    };

    if (
      allowedOrigins.includes(origin) ||
      origin.includes('pages.dev') ||
      origin.includes('workers.dev') ||
      origin.includes('nhuatienphong.io.vn') ||
      isLocalOrLan()
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} không được phép`));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting — lazy-init để tránh setInterval trong global scope (Cloudflare Workers không cho phép)
const isCfWorker = () =>
  typeof (globalThis as any).WebSocketPair !== 'undefined' || env.CF_WORKER === 'true';

let _authRL: any, _adminRL: any, _aiRL: any;

const lazyRateLimit = (cached: { v?: any }, opts: any) => {
  if (!cached.v) {
    const rateLimit = require('express-rate-limit').default || require('express-rate-limit');
    cached.v = rateLimit(opts);
  }
  return cached.v;
};

const authCache: any = {}, adminCache: any = {}, aiCache: any = {};

const authLimiter = (req: Request, res: Response, next: express.NextFunction) => {
  if (isCfWorker()) return next();
  return lazyRateLimit(authCache, {
    windowMs: 15 * 60 * 1000, max: 10,
    message: { success: false, message: 'Quá nhiều lần thử. Vui lòng đợi 15 phút.' },
    standardHeaders: true, legacyHeaders: false,
  })(req, res, next);
};

const adminLoginLimiter = (req: Request, res: Response, next: express.NextFunction) => {
  if (isCfWorker()) return next();
  return lazyRateLimit(adminCache, {
    windowMs: 15 * 60 * 1000, max: 5,
    message: { success: false, message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng đợi 15 phút.' },
    standardHeaders: true, legacyHeaders: false,
  })(req, res, next);
};

const aiLimiter = (req: Request, res: Response, next: express.NextFunction) => {
  if (isCfWorker()) return next();
  return lazyRateLimit(aiCache, {
    windowMs: 15 * 60 * 1000, max: 30,
    message: { success: false, message: 'Bạn đã hỏi AI quá nhiều. Vui lòng đợi 15 phút.' },
    standardHeaders: true, legacyHeaders: false,
  })(req, res, next);
};

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'NTP Support Hub Backend is running' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

export default app;
