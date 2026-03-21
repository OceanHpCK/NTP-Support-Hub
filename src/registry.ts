import React from 'react';

/**
 * Plugin Registry — Trung tâm đăng ký ứng dụng con.
 * 
 * 🔑 Để thêm app mới:
 *   1. Tạo folder mới trong src/apps/<app-name>/
 *   2. Tạo component App.tsx (default export)
 *   3. Thêm 1 entry vào mảng APP_REGISTRY bên dưới
 * 
 * Sidebar, Dashboard, Router sẽ tự động cập nhật.
 */

export interface AppModule {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: 'drill' | 'pipe' | 'flame' | 'calculator' | 'wrench' | 'cpu' | 'anchor' | 'book';
  color: string;       // Tailwind color class prefix, e.g. 'green', 'blue', 'cyan'
  colorHex: string;    // Hex for gradient/dynamic use
  path: string;        // Route path (no leading /)
  component: React.LazyExoticComponent<React.ComponentType>;
}

const APP_REGISTRY: AppModule[] = [
  {
    id: 'hdd-calculator',
    name: 'HDD Pro Calculator',
    shortName: 'HDD Calc',
    description: 'Tính toán & Thiết kế khoan ngầm định hướng cho ống HDPE theo ASTM F1962.',
    icon: 'drill',
    color: 'green',
    colorHex: '#16a34a',
    path: 'hdd-calculator',
    component: React.lazy(() => import('./apps/hdd-calculator/App')),
  },
  {
    id: 'pipecalc',
    name: 'PipeCalc Pro',
    shortName: 'PipeCalc',
    description: 'Tính toán chôn lấp ống theo tiêu chuẩn BS EN 1295-1 (Spangler/Marston).',
    icon: 'pipe',
    color: 'blue',
    colorHex: '#2563eb',
    path: 'pipecalc',
    component: React.lazy(() => import('./apps/pipecalc/App')),
  },
  {
    id: 'polyweld',
    name: 'PolyWeld Pro',
    shortName: 'PolyWeld',
    description: 'Tra cứu quy trình & tính toán thông số hàn ống HDPE/PPR theo ISO 21307.',
    icon: 'flame',
    color: 'cyan',
    colorHex: '#0891b2',
    path: 'polyweld',
    component: React.lazy(() => import('./apps/polyweld/App')),
  },
  {
    id: 'hdpe-sinking',
    name: 'HDPE Sinking Calculator',
    shortName: 'HDPE Sinking',
    description: 'Tính toán và xuất báo cáo các thông số đánh chìm ống HDPE qua biển, sông.',
    icon: 'anchor',
    color: 'sky',
    colorHex: '#0ea5e9',
    path: 'hdpe-sinking',
    component: React.lazy(() => import('./apps/hdpe-sinking/App')),
  },
  {
    id: 'cement-calculator',
    name: 'Tiền Phong Cement Calculator',
    shortName: 'Keo dán',
    description: 'Tính toán lượng keo dán ống Nhựa Tiền Phong dựa trên định mức tiêu chuẩn.',
    icon: 'calculator',
    color: 'emerald',
    colorHex: '#10b981',
    path: 'cement-calculator',
    component: React.lazy(() => import('./apps/cement-calculator/App')),
  },
  {
    id: 'heat-loss-calculator',
    name: 'Tính toán tổn thất nhiệt',
    shortName: 'Tổn thất nhiệt',
    description: 'Tính toán tổn thất nhiệt cho đường ống nhựa HDPE & PP-R có/không bảo ôn.',
    icon: 'wrench',
    color: 'blue',
    colorHex: '#3b82f6',
    path: 'heat-loss-calculator',
    component: React.lazy(() => import('./apps/heat-loss-calculator/App')),
  },
  {
    id: 'doc-hub',
    name: 'Thư viện kỹ thuật',
    shortName: 'Tài liệu',
    description: 'Tra cứu & Tải về tài liệu hướng dẫn kỹ thuật, lắp đặt, thử áp cho các dòng ống Nhựa Tiền Phong.',
    icon: 'book',
    color: 'indigo',
    colorHex: '#4f46e5',
    path: 'manuals',
    component: React.lazy(() => import('./apps/doc-hub/App')),
  },
];

export default APP_REGISTRY;
