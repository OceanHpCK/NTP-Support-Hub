import express, { Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { adminDb, moduleDb, accessCodeDb, auditLogDb, documentDb } from '../db';
import { env } from '../env';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const getAdminUser = () => env.ADMIN_USER || 'duongadmin';
const getAdminPass = () => env.ADMIN_PASS || 'duongntp92$';

const loginSchema = z.object({
  username: z.string().min(1, 'Thiếu tài khoản'),
  password: z.string().min(1, 'Thiếu mật khẩu'),
});

const createCodeSchema = z.object({
  module_id: z.string().min(1, 'Thiếu module_id'),
  max_uses: z.coerce.number().int().min(1, 'Số lượt phải >= 1'),
  duration_minutes: z.coerce.number().int().min(1, 'Thời gian phải >= 1 phút'),
  company_name: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
});

const createModuleSchema = z.object({
  id: z.string().min(1, 'Thiếu ID'),
  name: z.string().min(1, 'Thiếu tên'),
  description: z.string().optional(),
});

const generateRandomCode = (): string => {
  return `NTP-${crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8)}`;
};

// ========== Login ==========
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    return;
  }

  const { username, password } = parsed.data;

  try {
    const count = await adminDb.count();
    if (count === 0) {
      const hashedPass = await bcrypt.hash(getAdminPass(), 10);
      await adminDb.create(getAdminUser(), hashedPass);
      console.log(`[Seed] Đã tự động tạo tài khoản admin: ${getAdminUser()}`);
    }

    const admin = await adminDb.findByUsername(username);
    if (admin) {
      const isValid = await bcrypt.compare(password, admin.password);
      if (isValid) {
        const secret = env.JWT_SECRET || 'NTP_SUPER_SECRET_KEY_2026_!@#';
        const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '1d' });
        res.json({ success: true, token });
        return;
      }
    }

    res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

// ========== Seed documents ==========
const seedDocumentsIfEmpty = async () => {
  try {
    const count = await documentDb.count();
    if (count === 0) {
      await documentDb.createMany([
        { id: 'test-hdpe', category: 'testing', pipe_type: 'HDPE', file_name: 'test-hdpe.pdf', title: 'Hướng dẫn thử áp lực HDPE', description: 'Quy trình chuẩn bị, lắp đặt thiết bị và các bước thực hiện thử áp lực tuyến ống HDPE.' },
        { id: 'test-ppr', category: 'testing', pipe_type: 'PPR', file_name: 'test-ppr.pdf', title: 'Hướng dẫn thử áp lực PP-R', description: 'Các thông số áp suất thử và thời gian duy trì cho hệ thống ống cấp nước nóng/lạnh PP-R.' },
        { id: 'test-pvcu', category: 'testing', pipe_type: 'PVCU', file_name: 'test-pvcu.pdf', title: 'Hướng dẫn thử áp lực PVC-U', description: 'Quy trình thử áp cho ống PVC-U thoát nước và cấp nước.' },
        { id: 'test-corrugated', category: 'testing', pipe_type: 'CORRUGATED', file_name: 'test-corrugated.pdf', title: 'Hướng dẫn thử kín ống gân sóng', description: 'Phương pháp thử kín bằng không khí hoặc nước cho hệ thống thoát nước gân sóng.' },
        { id: 'install-hdpe', category: 'installation', pipe_type: 'HDPE', file_name: 'install-hdpe.pdf', title: 'Hướng dẫn lắp đặt HDPE', description: 'Kỹ thuật đào rãnh, nối ống và lấp đất cho đường ống HDPE.' },
        { id: 'install-ppr', category: 'installation', pipe_type: 'PPR', file_name: 'install-ppr-tech.pdf', title: 'Hướng dẫn lắp đặt PP-R', description: 'Quy trình hàn nhiệt và bố trí giá đỡ cho hệ thống ống PP-R trong nhà.' },
        { id: 'install-pvcu', category: 'installation', pipe_type: 'PVCU', file_name: 'install-pvcu.pdf', title: 'Hướng dẫn lắp đặt PVC-U', description: 'Sử dụng keo dán và gioăng cao su trong lắp đặt ống PVC-U.' },
        { id: 'install-corrugated', category: 'installation', pipe_type: 'CORRUGATED', file_name: 'install-corrugated.pdf', title: 'Hướng dẫn lắp đặt ống gân sóng', description: 'Kỹ thuật nối ống bằng khớp nối hoặc hàn nhiệt cho ống thoát nước gân sóng.' },
      ]);
      console.log('[Seed] Đã tạo 8 tài liệu kỹ thuật mặc định.');
    }
  } catch (error) {
    console.error('Lỗi seed tài liệu:', error);
  }
};

const isCfWorker = (): boolean =>
  typeof (globalThis as any).WebSocketPair !== 'undefined' || env.CF_WORKER === 'true';

const getDocumentRootDir = (): string => {
  if (process.cwd() === '/app') return path.resolve('/app', 'document_technical');
  return path.resolve(process.cwd(), '..', 'document_technical');
};

const getSubFolder = (category: string): string => {
  if (category === 'testing') return 'testing';
  if (category === 'installation') return 'install';
  let slug = category.toLowerCase();
  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
  slug = slug.replace(/[ìíịỉĩ]/g, 'i');
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, 'u');
  slug = slug.replace(/[ỳýỵỷỹ]/g, 'y');
  slug = slug.replace(/đ/g, 'd');
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  return slug || 'other';
};

// ========== Public APIs ==========
router.get('/documents/public-list', async (_req: Request, res: Response): Promise<void> => {
  try {
    await seedDocumentsIfEmpty();
    const docs = await documentDb.findMany({ where: { is_active: true }, orderBy: 'asc' });
    const onWorker = isCfWorker();
    const rootDir = onWorker ? '' : getDocumentRootDir();

    const data = docs.map((doc: any) => {
      const subFolder = getSubFolder(doc.category);
      const exists = onWorker ? true : fs.existsSync(path.join(rootDir, 'instructions', subFolder, doc.file_name));
      return {
        id: doc.id, title: doc.title, category: doc.category, pipeType: doc.pipe_type,
        description: doc.description || '', fileName: doc.file_name, exists,
        size: doc.file_size,
        updatedAt: doc.updated_at?.split('T')[0] || doc.updated_at?.split(' ')[0] || '',
        url: onWorker
          ? `/documents/instructions/${subFolder}/${doc.file_name}`
          : `/api/admin/documents/file/${subFolder}/${doc.file_name}`
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Lỗi danh sách tài liệu public:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách tài liệu' });
  }
});

router.get('/documents/public-status', async (_req: Request, res: Response): Promise<void> => {
  try {
    await seedDocumentsIfEmpty();
    const docs = await documentDb.findMany();
    const onWorker = isCfWorker();
    const rootDir = onWorker ? '' : getDocumentRootDir();
    const statusMap: Record<string, boolean> = {};

    docs.forEach((doc: any) => {
      const subFolder = getSubFolder(doc.category);
      statusMap[doc.id] = onWorker ? true : fs.existsSync(path.join(rootDir, 'instructions', subFolder, doc.file_name));
    });

    res.json({ success: true, data: statusMap });
  } catch (error) {
    console.error('Lỗi trạng thái tài liệu:', error);
    res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái tài liệu' });
  }
});

router.get('/documents/file/:category/:fileName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, fileName } = req.params;
    if (!/^[a-z0-9-]+$/.test(category)) { res.status(400).send('Loại tài liệu không hợp lệ'); return; }
    if (!/^[a-z0-9-]+\.pdf$/.test(fileName)) { res.status(400).send('Tên file không hợp lệ'); return; }

    if (isCfWorker()) { res.redirect(302, `/documents/instructions/${category}/${fileName}`); return; }

    const rootDir = getDocumentRootDir();
    const filePath = path.join(rootDir, 'instructions', category, fileName);
    if (!fs.existsSync(filePath)) { res.status(404).send('Tài liệu không tồn tại'); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Lỗi serve PDF:', error);
    res.status(500).send('Lỗi hệ thống');
  }
});

// ========== Admin routes (require auth) ==========
router.use(authenticateAdmin);

const REGISTRY_MODULES = [
  { id: 'hdd-calculator', name: 'HDD Pro Calculator', description: 'Tính toán & Thiết kế khoan ngầm định hướng cho ống HDPE theo ASTM F1962.' },
  { id: 'pipecalc', name: 'PipeCalc Pro', description: 'Tính toán chôn lấp ống theo tiêu chuẩn BS EN 1295-1 (Spangler/Marston).' },
  { id: 'polyweld', name: 'PolyWeld Pro', description: 'Tra cứu quy trình & tính toán thông số hàn ống HDPE/PPR theo ISO 21307.' },
  { id: 'hdpe-sinking', name: 'HDPE Sinking Calculator', description: 'Tính toán và xuất báo cáo các thông số đánh chìm ống HDPE qua biển, sông.' },
  { id: 'cement-calculator', name: 'Tiền Phong Cement Calculator', description: 'Tính toán lượng keo dán ống Nhựa Tiền Phong dựa trên định mức tiêu chuẩn.' },
  { id: 'heat-loss-calculator', name: 'Tính toán tổn thất nhiệt', description: 'Tính toán tổn thất nhiệt cho đường ống nhựa HDPE & PP-R có/không bảo ôn.' },
  { id: 'doc-hub', name: 'Thư viện kỹ thuật', description: 'Tra cứu & Tải về tài liệu hướng dẫn kỹ thuật, lắp đặt, thử áp cho các dòng ống Nhựa Tiền Phong.' },
  { id: 'water-hammer-calculator', name: 'Water Hammer Calculator', description: 'Tính toán hiện tượng búa nước và áp lực nước tăng thêm trong đường ống.' },
];

router.get('/modules', async (_req: Request, res: Response): Promise<void> => {
  try {
    for (const mod of REGISTRY_MODULES) {
      await moduleDb.upsert(mod.id, mod.name, mod.description);
    }
    const modules = await moduleDb.findMany();
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error('Error syncing modules:', error);
    res.status(500).json({ success: false, message: 'Lỗi đồng bộ danh sách module' });
  }
});

router.post('/modules', async (req: Request, res: Response): Promise<void> => {
  const parsed = createModuleSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return; }
  try {
    await moduleDb.create(parsed.data);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Module ID đã tồn tại hoặc có lỗi' });
  }
});

router.patch('/modules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await moduleDb.updatePublic(req.params.id, Boolean(req.body.is_public));
    res.json({ success: true });
  } catch {
    res.status(404).json({ success: false, message: 'Không tìm thấy module' });
  }
});

// ========== Access Codes ==========
router.post('/access-codes', async (req: Request, res: Response): Promise<void> => {
  const parsed = createCodeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return; }

  const { module_id, max_uses, duration_minutes, company_name, contact_name, contact_phone } = parsed.data;

  try {
    await moduleDb.upsert(module_id, module_id, 'Tự động tạo từ hệ thống');

    let code = generateRandomCode();
    while (await accessCodeDb.findByCode(code)) { code = generateRandomCode(); }

    await accessCodeDb.create({ code, module_id, max_uses, duration_minutes, company_name, contact_name, contact_phone });
    const created = await accessCodeDb.findByCode(code);
    res.json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating code:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo mã mới' });
  }
});

router.get('/access-codes', async (_req: Request, res: Response): Promise<void> => {
  const codes = await accessCodeDb.findMany();
  // Reshape to match Prisma's include format
  const data = codes.map((c: any) => ({
    ...c,
    module: c.module_name ? { id: c.module_id, name: c.module_name, description: c.module_description } : null,
  }));
  res.json({ success: true, data });
});

router.patch('/access-codes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await accessCodeDb.updateActive(req.params.id, Boolean(req.body.is_active));
    res.json({ success: true });
  } catch {
    res.status(404).json({ success: false, message: 'Không tìm thấy mã' });
  }
});

router.delete('/access-codes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await auditLogDb.deleteByCodeId(req.params.id);
    await accessCodeDb.delete(req.params.id);
    res.json({ success: true, message: 'Đã xóa mã thành công' });
  } catch {
    res.status(404).json({ success: false, message: 'Không tìm thấy mã' });
  }
});

// ========== Audit Logs ==========
router.get('/audit-logs', async (_req: Request, res: Response): Promise<void> => {
  const logs = await auditLogDb.findMany(200);
  // Reshape to match Prisma's nested include format
  const data = logs.map((l: any) => ({
    ...l,
    access_code: l.code ? {
      id: l.access_code_id, code: l.code, module_id: l.module_id,
      module: l.module_name ? { id: l.module_id, name: l.module_name } : null,
    } : null,
  }));
  res.json({ success: true, data });
});

// ========== Documents (Admin) ==========
router.get('/documents', async (_req: Request, res: Response): Promise<void> => {
  try {
    await seedDocumentsIfEmpty();
    const docs = await documentDb.findMany({ orderBy: 'desc' });
    const onWorker = isCfWorker();
    const rootDir = onWorker ? '' : getDocumentRootDir();

    const data = docs.map((doc: any) => {
      const subFolder = getSubFolder(doc.category);
      const filePath = onWorker ? '' : path.join(rootDir, 'instructions', subFolder, doc.file_name);
      const exists = onWorker ? true : fs.existsSync(filePath);
      let size = doc.file_size;
      if (!onWorker && exists) {
        try { size = `${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB`; } catch {}
      } else if (!onWorker) { size = '-'; }

      return {
        id: doc.id, title: doc.title, category: doc.category, pipeType: doc.pipe_type,
        description: doc.description || '', fileName: doc.file_name, exists, size,
        updatedAt: doc.updated_at?.split('T')[0] || doc.updated_at?.split(' ')[0] || '',
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error documents list:', error);
    res.status(500).json({ success: false, message: 'Lỗi danh sách tài liệu' });
  }
});

const uploadDocSchema = z.object({
  id: z.string().min(1, 'Thiếu ID tài liệu'),
  fileData: z.string().min(1, 'Thiếu dữ liệu file'),
});

router.post('/documents/upload', async (req: Request, res: Response): Promise<void> => {
  const parsed = uploadDocSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return; }

  const { id, fileData } = parsed.data;
  const doc = await documentDb.findById(id);
  if (!doc) { res.status(400).json({ success: false, message: 'Tài liệu không tồn tại' }); return; }

  if (isCfWorker()) {
    res.status(501).json({ success: false, message: 'Trên Cloudflare, thêm file PDF vào repo rồi deploy lại.' });
    return;
  }

  try {
    const rootDir = getDocumentRootDir();
    const subFolder = getSubFolder(doc.category);
    const targetDir = path.join(rootDir, 'instructions', subFolder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filePath = path.join(targetDir, doc.file_name);
    const buffer = Buffer.from(fileData, 'base64');
    fs.writeFileSync(filePath, buffer);
    const sizeStr = `${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB`;
    await documentDb.updateSize(id, sizeStr);

    res.json({ success: true, message: `Đã cập nhật tài liệu "${doc.title}" thành công!` });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ success: false, message: 'Lỗi lưu trữ file' });
  }
});

const createDocSchema = z.object({
  title: z.string().min(1, 'Thiếu tiêu đề'),
  category: z.string().min(1, 'Thiếu phân loại'),
  pipe_type: z.string().min(1, 'Thiếu dòng ống'),
  description: z.string().optional(),
  fileData: z.string().optional(),
});

router.post('/documents', async (req: Request, res: Response): Promise<void> => {
  const parsed = createDocSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return; }

  const { title, category, pipe_type, description, fileData } = parsed.data;

  try {
    const fileName = `${crypto.randomUUID()}.pdf`;
    const newDoc = await documentDb.create({ title, category, pipe_type, description, file_name: fileName });

    if (fileData && !isCfWorker()) {
      const rootDir = getDocumentRootDir();
      const subFolder = getSubFolder(category);
      const targetDir = path.join(rootDir, 'instructions', subFolder);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const filePath = path.join(targetDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(fileData, 'base64'));
      await documentDb.updateSize(newDoc.id, `${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB`);
    }

    res.json({ success: true, data: newDoc, message: `Đã tạo tài liệu "${title}" thành công!` });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ success: false, message: 'Lỗi tạo tài liệu mới' });
  }
});

router.delete('/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await documentDb.findById(req.params.id);
    if (!doc) { res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu' }); return; }

    if (!isCfWorker()) {
      const rootDir = getDocumentRootDir();
      const subFolder = getSubFolder(doc.category);
      const filePath = path.join(rootDir, 'instructions', subFolder, doc.file_name);
      if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch {} }
    }

    await documentDb.delete(req.params.id);
    res.json({ success: true, message: 'Đã xóa tài liệu thành công!' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tài liệu' });
  }
});

export default router;
