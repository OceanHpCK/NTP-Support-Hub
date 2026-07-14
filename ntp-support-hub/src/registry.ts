// aria-label added for accessibility compliance
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
    name: 'Tính toán Khoan rút HDPE',
    shortName: 'Khoan rút HDPE',
    description: 'Tính toán và thiết kế khoan rút/khoan ngầm định hướng cho ống HDPE theo ASTM F1962.',
    icon: 'drill',
    color: 'green',
    colorHex: '#16a34a',
    path: 'hdd-calculator',
    component: React.lazy(() => import('./apps/hdd-calculator/App')),
  },
  {
    id: 'pipecalc',
    name: 'Tính toán chôn lấp ống',
    shortName: 'Chôn lấp ống',
    description: 'Tính toán chôn lấp ống theo tiêu chuẩn BS EN 1295-1 (Spangler/Marston).',
    icon: 'pipe',
    color: 'blue',
    colorHex: '#2563eb',
    path: 'pipecalc',
    component: React.lazy(() => import('./apps/pipecalc/App')),
  },
  {
    id: 'pipe-stiffness',
    name: 'Độ cứng vòng',
    shortName: 'Độ cứng vòng',
    description: 'Tính SN, chiều dày thành ống và khối lượng ống theo OD, SDR, E và Density dựa trên bảng Excel kỹ thuật.',
    icon: 'calculator',
    color: 'violet',
    colorHex: '#7c3aed',
    path: 'pipe-stiffness',
    component: React.lazy(() => import('./apps/pipe-stiffness/App')),
  },
  {
    id: 'polyweld',
    name: 'Thông số hàn nhiệt',
    shortName: 'Hàn nhiệt',
    description: 'Tra cứu quy trình và tính toán thông số hàn nhiệt ống HDPE/PPR theo ISO 21307.',
    icon: 'flame',
    color: 'cyan',
    colorHex: '#0891b2',
    path: 'polyweld',
    component: React.lazy(() => import('./apps/polyweld/App')),
  },
  {
    id: 'hdpe-sinking',
    name: 'Tính toán đánh chìm',
    shortName: 'Đánh chìm',
    description: 'Tính toán và xuất báo cáo các thông số đánh chìm ống HDPE qua biển, sông.',
    icon: 'anchor',
    color: 'sky',
    colorHex: '#0ea5e9',
    path: 'hdpe-sinking',
    component: React.lazy(() => import('./apps/hdpe-sinking/App')),
  },
  {
    id: 'cement-calculator',
    name: 'Tính toán lượng keo dán',
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
    id: 'water-hammer-calculator',
    name: 'Tính toán Búa Nước',
    shortName: 'Búa Nước',
    description: 'Tính toán hiện tượng búa nước và áp lực nước tăng thêm trong đường ống.',
    icon: 'calculator',
    color: 'teal',
    colorHex: '#14b8a6',
    path: 'water-hammer',
    component: React.lazy(() => import('./apps/water-hammer-calculator/App')),
  },
  {
    id: 'doc-hub',
    name: 'Tài liệu kỹ thuật',
    shortName: 'Tài liệu kỹ thuật',
    description: 'Tra cứu và tải về tài liệu hướng dẫn kỹ thuật, lắp đặt, thử áp cho các dòng ống Nhựa Tiền Phong.',
    icon: 'book',
    color: 'indigo',
    colorHex: '#4f46e5',
    path: 'manuals',
    component: React.lazy(() => import('./apps/doc-hub/App')),
  },
];

export default APP_REGISTRY;
