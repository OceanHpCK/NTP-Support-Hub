// Tầng truy cập database — hỗ trợ cả D1 (Cloudflare Worker) và Postgres (Local/VPS Docker)
import { env } from './env';

// D1 binding được inject từ Worker env — lưu trữ ở đây sau setDb()
let d1: any = null;

export function setDb(binding: any) {
  d1 = binding;
}

function getD1() {
  if (!d1) throw new Error('D1 binding chưa được khởi tạo. Gọi setDb(env.DB) trước.');
  return d1;
}

function now() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

function uuid() {
  return crypto.randomUUID();
}

// ==================== Generic helpers ====================

async function queryAll<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  const result = await getD1().prepare(sql).bind(...params).all();
  return (result.results ?? []) as T[];
}

async function queryFirst<T = any>(sql: string, ...params: any[]): Promise<T | null> {
  const result = await getD1().prepare(sql).bind(...params).first();
  return (result ?? null) as T | null;
}

async function execute(sql: string, ...params: any[]) {
  return getD1().prepare(sql).bind(...params).run();
}

async function batch(stmts: { sql: string; params: any[] }[]) {
  const prepared = stmts.map(s => getD1().prepare(s.sql).bind(...s.params));
  return getD1().batch(prepared);
}

// ==================== Module ====================

export const moduleDb = {
  findMany: (opts?: { orderBy?: string; where?: { is_public?: boolean } }) =>
    queryAll(
      opts?.where?.is_public !== undefined
        ? 'SELECT * FROM modules WHERE is_public = ? ORDER BY name ASC'
        : 'SELECT * FROM modules ORDER BY name ASC',
      ...(opts?.where?.is_public !== undefined ? [opts.where.is_public ? 1 : 0] : [])
    ),

  findById: (id: string) => queryFirst('SELECT * FROM modules WHERE id = ?', id),

  upsert: async (id: string, name: string, description?: string | null) => {
    const existing = await queryFirst('SELECT id FROM modules WHERE id = ?', id);
    if (existing) {
      await execute('UPDATE modules SET name = ?, description = ?, updated_at = ? WHERE id = ?', name, description ?? null, now(), id);
    } else {
      await execute(
        'INSERT INTO modules (id, name, description, is_active, is_public, created_at, updated_at) VALUES (?, ?, ?, 1, 0, ?, ?)',
        id, name, description ?? null, now(), now()
      );
    }
  },

  create: (data: { id?: string; name: string; description?: string | null }) => {
    const id = data.id || uuid();
    return execute(
      'INSERT INTO modules (id, name, description, is_active, is_public, created_at, updated_at) VALUES (?, ?, ?, 1, 0, ?, ?)',
      id, data.name, data.description ?? null, now(), now()
    );
  },

  updatePublic: (id: string, is_public: boolean) =>
    execute('UPDATE modules SET is_public = ?, updated_at = ? WHERE id = ?', is_public ? 1 : 0, now(), id),

  count: async () => {
    const r = await queryFirst<{ c: number }>('SELECT count(*) as c FROM modules');
    return r?.c ?? 0;
  },
};

// ==================== Admin ====================

export const adminDb = {
  findByUsername: (username: string) =>
    queryFirst<{ id: string; username: string; password: string }>('SELECT * FROM admins WHERE username = ?', username),

  count: async () => {
    const r = await queryFirst<{ c: number }>('SELECT count(*) as c FROM admins');
    return r?.c ?? 0;
  },

  create: (username: string, password: string) =>
    execute('INSERT INTO admins (id, username, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      uuid(), username, password, now(), now()),
};

// ==================== AccessCode ====================

export const accessCodeDb = {
  findByCode: (code: string) =>
    queryFirst('SELECT * FROM access_codes WHERE code = ?', code),

  findById: (id: string) =>
    queryFirst('SELECT * FROM access_codes WHERE id = ?', id),

  findMany: () =>
    queryAll(`SELECT ac.*, m.name as module_name, m.description as module_description
              FROM access_codes ac LEFT JOIN modules m ON ac.module_id = m.id
              ORDER BY ac.created_at DESC`),

  create: (data: {
    code: string; module_id: string; max_uses: number; duration_minutes: number;
    company_name?: string | null; contact_name?: string | null; contact_phone?: string | null;
  }) => {
    const id = uuid();
    return execute(
      `INSERT INTO access_codes (id, code, module_id, max_uses, used_count, duration_minutes, is_active, company_name, contact_name, contact_phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, 1, ?, ?, ?, ?, ?)`,
      id, data.code, data.module_id, data.max_uses, data.duration_minutes,
      data.company_name ?? null, data.contact_name ?? null, data.contact_phone ?? null,
      now(), now()
    );
  },

  updateActive: (id: string, is_active: boolean) =>
    execute('UPDATE access_codes SET is_active = ?, updated_at = ? WHERE id = ?', is_active ? 1 : 0, now(), id),

  incrementUsed: (id: string, currentCount: number) =>
    execute('UPDATE access_codes SET used_count = ?, updated_at = ? WHERE id = ?', currentCount + 1, now(), id),

  delete: (id: string) => execute('DELETE FROM access_codes WHERE id = ?', id),
};

// ==================== AuditLog ====================

export const auditLogDb = {
  findMany: (limit = 200) =>
    queryAll(
      `SELECT al.*, ac.code, ac.module_id, m.name as module_name
       FROM audit_logs al
       LEFT JOIN access_codes ac ON al.access_code_id = ac.id
       LEFT JOIN modules m ON ac.module_id = m.id
       ORDER BY al.accessed_at DESC LIMIT ?`, limit
    ),

  create: (access_code_id: string, ip_address?: string, user_agent?: string) =>
    execute('INSERT INTO audit_logs (id, access_code_id, ip_address, user_agent, accessed_at) VALUES (?, ?, ?, ?, ?)',
      uuid(), access_code_id, ip_address ?? null, user_agent ?? null, now()),

  deleteByCodeId: (access_code_id: string) =>
    execute('DELETE FROM audit_logs WHERE access_code_id = ?', access_code_id),
};

// ==================== TechnicalDocument ====================

export const documentDb = {
  count: async () => {
    const r = await queryFirst<{ c: number }>('SELECT count(*) as c FROM technical_documents');
    return r?.c ?? 0;
  },

  findMany: (opts?: { where?: { is_active?: boolean }; orderBy?: 'asc' | 'desc' }) =>
    queryAll(
      `SELECT * FROM technical_documents ${opts?.where?.is_active !== undefined ? 'WHERE is_active = ' + (opts.where.is_active ? 1 : 0) : ''} ORDER BY created_at ${opts?.orderBy || 'ASC'}`
    ),

  findById: (id: string) =>
    queryFirst('SELECT * FROM technical_documents WHERE id = ?', id),

  createMany: async (docs: { id: string; category: string; pipe_type: string; file_name: string; title: string; description: string }[]) => {
    const stmts = docs.map(d => ({
      sql: 'INSERT INTO technical_documents (id, title, category, pipe_type, description, file_name, file_size, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      params: [d.id, d.title, d.category, d.pipe_type, d.description, d.file_name, '-', now(), now()],
    }));
    await batch(stmts);
  },

  create: async (data: { title: string; category: string; pipe_type: string; description?: string | null; file_name: string }) => {
    const id = uuid();
    await execute(
      'INSERT INTO technical_documents (id, title, category, pipe_type, description, file_name, file_size, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      id, data.title, data.category, data.pipe_type, data.description ?? null, data.file_name, '-', now(), now()
    );
    return { id, ...data, file_size: '-', is_active: 1, created_at: now(), updated_at: now() };
  },

  updateSize: (id: string, file_size: string) =>
    execute('UPDATE technical_documents SET file_size = ?, updated_at = ? WHERE id = ?', file_size, now(), id),

  delete: (id: string) =>
    execute('DELETE FROM technical_documents WHERE id = ?', id),
};

// Legacy: export batch cho transaction-like operations
export { batch as dbBatch };
