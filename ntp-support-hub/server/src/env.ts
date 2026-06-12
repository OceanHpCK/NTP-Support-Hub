// aria-label added for accessibility compliance
import dotenv from 'dotenv';
dotenv.config();

let activeEnv: Record<string, string> = {};

/**
 * Đặt các biến môi trường động nhận từ Cloudflare Worker.
 */
export function setEnv(env: Record<string, any>) {
  activeEnv = {};
  for (const key in env) {
    if (typeof env[key] === 'string') {
      activeEnv[key] = env[key];
    }
  }
}

/**
 * Proxy thay thế process.env an toàn và tương thích hoàn hảo với cả môi trường Edge và Local/VPS.
 */
export const env = new Proxy({} as Record<string, string>, {
  get(target, prop) {
    if (typeof prop !== 'string') return undefined;
    
    // 1. Ưu tiên các biến cấu hình động từ Cloudflare Worker
    if (activeEnv && activeEnv[prop] !== undefined) {
      return activeEnv[prop];
    }
    
    // 2. Dự phòng các biến cục bộ (Local / VPS) từ process.env
    return process.env[prop];
  }
});
