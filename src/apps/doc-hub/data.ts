export interface Document {
  id: string;
  title: string;
  category: 'testing' | 'installation';
  pipeType: 'HDPE' | 'PPR' | 'PVCU' | 'CORRUGATED';
  description: string;
  url: string; // Relative path from /public/documents/ or external link
  size?: string;
  updatedAt: string;
}

export const DOCUMENTS: Document[] = [
  // Hướng dẫn thử áp
  {
    id: 'test-hdpe',
    title: 'Hướng dẫn thử áp tuyến ống HDPE',
    category: 'testing',
    pipeType: 'HDPE',
    description: 'Quy trình chuẩn bị, lắp đặt thiết bị và các bước thực hiện thử áp lực tuyến ống HDPE.',
    url: '/documents/instructions/testing/test-hdpe.pdf',
    size: '1.2 MB',
    updatedAt: '2024-03-21',
  },
  {
    id: 'test-ppr',
    title: 'Hướng dẫn thử áp tuyến ống PP-R',
    category: 'testing',
    pipeType: 'PPR',
    description: 'Các thông số áp suất thử và thời gian duy trì cho hệ thống ống cấp nước nóng/lạnh PP-R.',
    url: '/documents/instructions/testing/test-ppr.pdf',
    size: '0.8 MB',
    updatedAt: '2024-03-21',
  },
  {
    id: 'test-pvcu',
    title: 'Hướng dẫn thử áp tuyến ống PVC-U',
    category: 'testing',
    pipeType: 'PVCU',
    description: 'Quy trình thử áp cho ống PVC-U thoát nước và cấp nước.',
    url: '/documents/instructions/testing/test-pvcu.pdf',
    size: '1.0 MB',
    updatedAt: '2024-03-21',
  },
  {
    id: 'test-corr',
    title: 'Hướng dẫn thử kín ống gân sóng (HDPE/PP)',
    category: 'testing',
    pipeType: 'CORRUGATED',
    description: 'Phương pháp thử kín bằng không khí hoặc nước cho hệ thống thoát nước gân sóng.',
    url: '/documents/instructions/testing/test-corrugated.pdf',
    size: '1.5 MB',
    updatedAt: '2024-03-21',
  },
  
  // Hướng dẫn lắp đặt
  {
    id: 'install-hdpe',
    title: 'Hướng dẫn lắp đặt tuyến ống HDPE',
    category: 'installation',
    pipeType: 'HDPE',
    description: 'Kỹ thuật đào rãnh, nối ống và lấp đất cho đường ống HDPE.',
    url: '/documents/instructions/install/install-hdpe.pdf',
    size: '2.4 MB',
    updatedAt: '2024-03-21',
  },
  {
    id: 'install-ppr',
    title: 'Hướng dẫn lắp đặt tuyến ống PP-R',
    category: 'installation',
    pipeType: 'PPR',
    description: 'Quy trình hàn nhiệt và bố trí giá đỡ cho hệ thống ống PP-R trong nhà.',
    url: '/documents/instructions/install/install-ppr.pdf',
    size: '1.8 MB',
    updatedAt: '2024-03-21',
  },
  {
    id: 'install-pvcu',
    title: 'Hướng dẫn lắp đặt tuyến ống PVC-U',
    category: 'installation',
    pipeType: 'PVCU',
    description: 'Sử dụng keo dán và gioăng cao su trong lắp đặt ống PVC-U.',
    url: '/documents/instructions/install/install-pvcu.pdf',
    size: '1.6 MB',
    updatedAt: '2024-03-21',
  },
  {
    id: 'install-corr',
    title: 'Hướng dẫn lắp đặt ống gân sóng HDPE/PP',
    category: 'installation',
    pipeType: 'CORRUGATED',
    description: 'Kỹ thuật nối ống bằng khớp nối hoặc hàn nhiệt cho ống thoát nước gân sóng.',
    url: '/documents/instructions/install/install-corrugated.pdf',
    size: '2.1 MB',
    updatedAt: '2024-03-21',
  },
];
