import express, { Request, Response } from 'express';
import { accessCodeDb, auditLogDb, moduleDb } from '../db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../env';

const router = express.Router();

const verifyCodeSchema = z.object({
  code: z.string().min(1, 'Thiếu mã truy cập'),
  module_id: z.string().min(1, 'Thiếu module_id'),
});

router.post('/verify-code', async (req: Request, res: Response): Promise<void> => {
  const parsed = verifyCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    return;
  }

  const { code, module_id } = parsed.data;

  try {
    const accessCode = await accessCodeDb.findByCode(code);

    if (!accessCode) {
      res.status(404).json({ success: false, message: 'Mã không tồn tại' });
      return;
    }
    if (!accessCode.is_active) {
      res.status(403).json({ success: false, message: 'Mã đã bị khóa' });
      return;
    }
    if (accessCode.module_id !== module_id) {
      res.status(403).json({ success: false, message: 'Mã không áp dụng cho chức năng này' });
      return;
    }
    if (accessCode.used_count >= accessCode.max_uses) {
      res.status(403).json({ success: false, message: 'Mã đã hết lượt sử dụng' });
      return;
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await accessCodeDb.incrementUsed(accessCode.id, accessCode.used_count);
    await auditLogDb.create(
      accessCode.id,
      typeof clientIp === 'string' ? clientIp : 'Unknown IP',
      userAgent
    );

    const secret = env.JWT_SECRET || 'NTP_SUPER_SECRET_KEY_2026_!@#';
    const expiresInSeconds = accessCode.duration_minutes * 60;

    const token = jwt.sign(
      { code_id: accessCode.id, module_id: accessCode.module_id, role: 'customer' },
      secret,
      { expiresIn: expiresInSeconds }
    );

    res.json({
      success: true,
      message: 'Xác thực thành công',
      token,
      duration_minutes: accessCode.duration_minutes
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/public-modules', async (_req: Request, res: Response): Promise<void> => {
  const modules = await moduleDb.findMany({ where: { is_public: true } });
  res.json({ success: true, publicIds: modules.map((m: any) => m.id) });
});

export default router;
