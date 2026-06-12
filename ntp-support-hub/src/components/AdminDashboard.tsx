import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import APP_REGISTRY from '../registry';
import { getApiUrl } from '../config';


interface AccessCode {
  id: string;
  code: string;
  module_id: string;
  max_uses: number;
  used_count: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  company_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

interface AuditLog {
  id: string;
  ip_address: string;
  user_agent: string;
  accessed_at: string;
  access_code: {
    code: string;
    module: { name: string };
  };
}

interface ModuleInfo {
  id: string;
  name: string;
  is_public: boolean;
  is_active: boolean;
  _count: { accessCodes: number };
}

interface AdminDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  exists: boolean;
  size: string;
  updatedAt: string;
}

type Tab = 'create' | 'codes' | 'logs' | 'modules' | 'documents';

const AdminDashboard: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('create');

  const [selectedModule, setSelectedModule] = useState(APP_REGISTRY[0].id);
  const [maxUses, setMaxUses] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [newCode, setNewCode] = useState<AccessCode | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [adminDocs, setAdminDocs] = useState<AdminDocument[]>([]);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // States cho Form tạo mới tài liệu kỹ thuật
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<string>('testing');
  const [customCategory, setCustomCategory] = useState('');
  const [newDocPipeType, setNewDocPipeType] = useState('HDPE');
  const [customPipeType, setCustomPipeType] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocFileBase64, setNewDocFileBase64] = useState<string | null>(null);
  const [newDocFileName, setNewDocFileName] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const existingCategories = useMemo(() => {
    const defaults = ['testing', 'installation', 'Hướng dẫn kết nối'];
    const docCats = adminDocs.map(d => d.category);
    return Array.from(new Set([...defaults, ...docCats])).filter(Boolean);
  }, [adminDocs]);

  const qrRef = useRef<HTMLCanvasElement>(null);
  const API_URL = getApiUrl();

  const [qrBaseUrl, setQrBaseUrl] = useState(() => {
    return localStorage.getItem('ntp_qr_base_url') || window.location.origin;
  });

  const handleQrBaseUrlChange = (val: string) => {
    setQrBaseUrl(val);
    localStorage.setItem('ntp_qr_base_url', val);
  };

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  // ========== Fetch Data ==========
  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/access-codes`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCodes(data.data);
      else if (res.status === 401 || res.status === 403) setToken(null);
    } catch { /* network error */ }
  }, [API_URL, authHeaders]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-logs`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch { /* network error */ }
  }, [API_URL, authHeaders]);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/modules`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setModules(data.data);
    } catch { /* network error */ }
  }, [API_URL, authHeaders]);

  const fetchAdminDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/documents`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setAdminDocs(data.data);
    } catch { /* network error */ }
  }, [API_URL, authHeaders]);

  const toggleModulePublic = async (id: string, currentPublic: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/modules/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_public: !currentPublic })
      });
      const data = await res.json();
      if (data.success) fetchModules();
    } catch { /* error */ }
  };

  useEffect(() => {
    if (token) {
      fetchCodes();
      fetchLogs();
      fetchModules();
      fetchAdminDocs();
    }
  }, [token, fetchCodes, fetchLogs, fetchModules, fetchAdminDocs]);

  const handleDocUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Chỉ chấp nhận file định dạng PDF (.pdf)!');
      return;
    }

    setUploadingDocId(docId);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          
          const res = await fetch(`${API_URL}/api/admin/documents/upload`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              id: docId,
              fileData: base64String,
            })
          });

          if (!res.ok) {
            if (res.status === 413) {
              alert('Lỗi: File tài liệu quá lớn! Nginx giới hạn dung lượng tải lên (tối đa 15MB).');
            } else {
              alert(`Lỗi từ máy chủ: ${res.status} ${res.statusText}`);
            }
            return;
          }

          const result = await res.json();
          if (result.success) {
            alert(result.message);
            fetchAdminDocs();
          } else {
            alert(result.message || 'Lỗi khi upload file');
          }
        } catch (err) {
          console.error('Lỗi khi tải lên tài liệu:', err);
          alert('Có lỗi xảy ra khi gửi yêu cầu hoặc máy chủ phản hồi không hợp lệ.');
        } finally {
          setUploadingDocId(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Có lỗi xảy ra trong quá trình đọc file.');
      setUploadingDocId(null);
    }
  };

  const handleNewDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Chỉ chấp nhận file định dạng PDF (.pdf)!');
      return;
    }

    setNewDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setNewDocFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu!');
      return;
    }

    const finalPipeType = newDocPipeType === 'custom' ? customPipeType.trim() : newDocPipeType;
    if (!finalPipeType) {
      alert('Vui lòng nhập/chọn dòng ống!');
      return;
    }

    const finalCategory = newDocCategory === 'custom' ? customCategory.trim() : newDocCategory;
    if (!finalCategory) {
      alert('Vui lòng chọn/nhập mục phân loại!');
      return;
    }

    setIsCreatingDoc(true);
    try {
      const payload = {
        title: newDocTitle,
        category: finalCategory,
        pipe_type: finalPipeType.toUpperCase(),
        description: newDocDescription,
        fileData: newDocFileBase64 || undefined
      };

      const res = await fetch(`${API_URL}/api/admin/documents`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        // Reset form
        setNewDocTitle('');
        setNewDocDescription('');
        setNewDocFileBase64(null);
        setNewDocFileName('');
        setCustomPipeType('');
        setCustomCategory('');
        setShowCreateDocModal(false);
        fetchAdminDocs();
      } else {
        alert(data.message || 'Lỗi khi tạo tài liệu');
      }
    } catch (err) {
      alert('Không thể gửi yêu cầu tạo tài liệu');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`⚠️ Xóa vĩnh viễn tài liệu "${title}" và file PDF liên quan?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/documents/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminDocs();
      } else {
        alert(data.message || 'Lỗi khi xóa tài liệu');
      }
    } catch {
      alert('Lỗi khi gửi yêu cầu xóa tài liệu');
    }
  };

  // ========== Auth ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) { setToken(data.token); }
      else { alert(data.message); }
    } catch { alert('Lỗi đăng nhập'); }
  };

  // ========== Generate Code ==========
  const generateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/access-codes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          module_id: selectedModule,
          max_uses: maxUses,
          duration_minutes: durationMinutes,
          company_name: companyName,
          contact_name: contactName,
          contact_phone: contactPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewCode(data.data);
        fetchCodes();
        setCompanyName('');
        setContactName('');
        setContactPhone('');
      } else {
        alert(data.message);
      }
    } catch {
      alert('Lỗi khi tạo mã');
    }
  };

  // ========== Toggle Code Active ==========
  const toggleCodeActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/access-codes/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !currentActive })
      });
      const data = await res.json();
      if (data.success) fetchCodes();
    } catch { /* error */ }
  };

  // ========== Delete Code Permanently ==========
  const deleteCode = async (id: string, codeName: string) => {
    if (!confirm(`⚠️ Xóa vĩnh viễn mã ${codeName}?\n\nMã này sẽ không thể khôi phục và người dùng không thể truy cập nữa.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/access-codes/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) { fetchCodes(); fetchLogs(); }
      else { alert(data.message); }
    } catch { alert('Lỗi khi xóa mã'); }
  };

  // ========== Download QR as PNG Image ==========
  const downloadQR = () => {
    if (!newCode || !qrRef.current) return;

    const moduleName = APP_REGISTRY.find(a => a.id === newCode.module_id)?.name || newCode.module_id;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 480;
    canvas.height = 620;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, 480, 620, 16);
    ctx.fill();

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, 480, 100);
    grad.addColorStop(0, '#1d4ed8');
    grad.addColorStop(1, '#2563eb');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 480, 100, [16, 16, 0, 0]);
    ctx.fill();

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NTP Support Hub', 240, 40);
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(moduleName, 240, 65);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`Hiệu lực: ${newCode.duration_minutes} phút | Số lượt: ${newCode.max_uses}`, 240, 85);

    // QR Code from existing canvas
    const qrCanvas = qrRef.current;
    const qrSize = 280;
    const qrX = (480 - qrSize) / 2;
    ctx.drawImage(qrCanvas, qrX, 120, qrSize, qrSize);

    // Border around QR
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 10, 110, qrSize + 20, qrSize + 20);

    // Code text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(newCode.code, 240, 450);

    // Instructions
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('Quét mã QR hoặc nhập mã phía trên', 240, 490);
    ctx.fillText('để truy cập ứng dụng.', 240, 510);

    // Draw company and contact details if available
    if (newCode.company_name) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(`Đơn vị: ${newCode.company_name}`, 240, 542);
      
      const contactParts = [];
      if (newCode.contact_name) contactParts.push(newCode.contact_name);
      if (newCode.contact_phone) contactParts.push(newCode.contact_phone);
      if (contactParts.length > 0) {
        ctx.fillStyle = '#475569';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText(contactParts.join(' - '), 240, 562);
      }
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('© 2026 Nhựa Tiền Phong — Hỗ trợ kỹ thuật', 240, 595);

    // Trigger download
    const link = document.createElement('a');
    link.download = `QR-${newCode.code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ========== LOGIN SCREEN ==========
  if (!token) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
            <p className="text-slate-500 text-sm mt-2">Quản lý mã truy cập hệ thống</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl" required />
            </div>
            <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 transition-colors">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  const qrUrl = newCode
    ? `${qrBaseUrl.replace(/\/$/, '')}/${APP_REGISTRY.find(a => a.id === newCode.module_id)?.path}?code=${newCode.code}`
    : '';

  // ========== DASHBOARD ==========
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Access Control Center</h1>
          <p className="text-slate-500 text-sm mt-1">Hệ thống quản lý phân quyền và tạo mã truy cập</p>
        </div>
        <button onClick={() => setToken(null)} className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
          Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {([['create', '➕ Tạo mã'], ['codes', '📋 Danh sách mã'], ['logs', '📊 Lịch sử'], ['modules', '⚙️ Quản lý Module'], ['documents', '📚 Tài liệu kỹ thuật']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Tạo mã */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tạo mã truy cập mới</h2>
            <form onSubmit={generateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn ứng dụng (Module)</label>
                <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-slate-50">
                  {APP_REGISTRY.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị sử dụng (Nhập tay)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Công ty Nhựa Tiền Phong, Ban QLDA..."
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Người sử dụng (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Anh Dương, Chị Thảo..."
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="SĐT liên hệ..."
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số lượt cho phép</label>
                  <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(parseInt(e.target.value) || 1)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian/Lượt</label>
                  <select value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-xl bg-slate-50">
                    <option value={30}>30 phút</option>
                    <option value={60}>60 phút (1 giờ)</option>
                    <option value={120}>120 phút (2 giờ)</option>
                    <option value={480}>480 phút (8 giờ)</option>
                    <option value={1440}>24 giờ (1 ngày)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
                Sinh mã ngay
              </button>
            </form>
          </div>

          {/* QR Code Display + Download */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            {newCode ? (
              <div className="flex flex-col items-center text-center space-y-4 w-full max-w-sm">
                <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Tạo thành công</div>
                <div className="text-3xl font-mono font-bold text-slate-800 tracking-wider">{newCode.code}</div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <QRCodeCanvas
                    ref={qrRef as React.RefObject<HTMLCanvasElement | null>}
                    value={qrUrl}
                    size={220}
                    level="Q"
                    marginSize={2}
                  />
                </div>

                {/* Base URL Configuration for QR */}
                <div className="w-full text-left border border-slate-100 bg-slate-50 p-3.5 rounded-xl space-y-2">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cấu hình IP/Tên miền cho mã QR</label>
                  <input
                    type="text"
                    value={qrBaseUrl}
                    onChange={e => handleQrBaseUrlChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 font-mono shadow-inner"
                    placeholder="Ví dụ: http://10.21.21.13:3000"
                  />
                  <div className="text-[10px] text-slate-500 break-all leading-relaxed bg-white p-2 rounded-md border border-slate-100 font-mono">
                    <span className="font-bold text-slate-600">Link QR:</span> <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{qrUrl}</a>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    ⚠️ Nếu điện thoại quét mã không kết nối được, hãy nhập địa chỉ IP mạng nội bộ (LAN) của máy chủ chạy dự án (ví dụ: <code>http://10.21.21.13:3000</code>).
                  </p>
                </div>

                <p className="text-xs text-slate-500 max-w-xs">Khách hàng quét mã QR hoặc nhập mã để truy cập ứng dụng.</p>

                <button
                  onClick={downloadQR}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-md shadow-emerald-500/20 w-full justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải ảnh QR để chia sẻ
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <svg className="w-16 h-16 mx-auto text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-sm">QR Code sẽ hiện ở đây sau khi tạo mã</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Danh sách mã */}
      {activeTab === 'codes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Mã truy cập ({codes.length})</h2>
            <button onClick={fetchCodes} className="text-sm text-blue-600 hover:text-blue-700 font-medium">🔄 Làm mới</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium border-b">Mã</th>
                  <th className="p-4 font-medium border-b">Ứng dụng</th>
                  <th className="p-4 font-medium border-b">Đơn vị & Người dùng</th>
                  <th className="p-4 font-medium border-b text-center">Đã dùng</th>
                  <th className="p-4 font-medium border-b text-center">Thời gian/Lượt</th>
                  <th className="p-4 font-medium border-b text-center">Trạng thái</th>
                  <th className="p-4 font-medium border-b text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {codes.map(code => {
                  const moduleName = APP_REGISTRY.find(a => a.id === code.module_id)?.shortName || code.module_id;
                  const isExpired = code.used_count >= code.max_uses;
                  return (
                    <tr key={code.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700">{code.code}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">{moduleName}</span></td>
                      <td className="p-4">
                        {code.company_name ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800">{code.company_name}</div>
                            {(code.contact_name || code.contact_phone) && (
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                                {code.contact_name && (
                                  <span className="flex items-center gap-0.5">
                                    👤 {code.contact_name}
                                  </span>
                                )}
                                {code.contact_name && code.contact_phone && <span className="text-slate-300">|</span>}
                                {code.contact_phone && (
                                  <span className="flex items-center gap-0.5">
                                    📞 {code.contact_phone}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-slate-600">{code.used_count} / {code.max_uses}</td>
                      <td className="p-4 text-center text-slate-500">{code.duration_minutes} phút</td>
                      <td className="p-4 text-center">
                        {!code.is_active ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Đã khóa</span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Hết lượt</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Hoạt động</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleCodeActive(code.id, code.is_active)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              code.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {code.is_active ? '🔒 Khóa' : '🔓 Mở'}
                          </button>
                          <button
                            onClick={() => deleteCode(code.id, code.code)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Lịch sử truy cập (Audit Logs) */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Lịch sử truy cập ({logs.length})</h2>
            <button onClick={fetchLogs} className="text-sm text-blue-600 hover:text-blue-700 font-medium">🔄 Làm mới</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium border-b">Thời gian</th>
                  <th className="p-4 font-medium border-b">Mã sử dụng</th>
                  <th className="p-4 font-medium border-b">Ứng dụng</th>
                  <th className="p-4 font-medium border-b">Địa chỉ IP</th>
                  <th className="p-4 font-medium border-b">Trình duyệt</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.accessed_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">{log.access_code?.code}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
                        {log.access_code?.module?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">{log.ip_address}</td>
                    <td className="p-4 text-xs text-slate-400 max-w-[200px] truncate" title={log.user_agent}>
                      {log.user_agent}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Chưa có lịch sử truy cập nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Quản lý Module */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Quản lý Module</h2>
              <p className="text-sm text-slate-500 mt-1">Bật/tắt chế độ Public — Module public không yêu cầu nhập mã truy cập</p>
            </div>
            <button onClick={fetchModules} className="text-sm text-blue-600 hover:text-blue-700 font-medium">🔄 Làm mới</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium border-b">Module</th>
                  <th className="p-4 font-medium border-b text-center">Số mã đã tạo</th>
                  <th className="p-4 font-medium border-b text-center">Trạng thái</th>
                  <th className="p-4 font-medium border-b text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {modules.map(mod => (
                  <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{mod.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{mod.id}</div>
                    </td>
                    <td className="p-4 text-center text-slate-600">{mod._count?.accessCodes ?? 0}</td>
                    <td className="p-4 text-center">
                      {mod.is_public ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">🔓 Public</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">🔒 Yêu cầu mã</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleModulePublic(mod.id, mod.is_public)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          mod.is_public
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {mod.is_public ? '🔒 Khóa lại' : '🔓 Mở public'}
                      </button>
                    </td>
                  </tr>
                ))}
                {modules.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Chưa có module nào. Hãy tạo mã truy cập trước.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Quản lý Tài liệu */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Create Document Modal Overlay */}
          {showCreateDocModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">➕ Tạo tài liệu kỹ thuật mới</h3>
                  <button 
                    onClick={() => { setShowCreateDocModal(false); setNewDocFileBase64(null); setNewDocFileName(''); }} 
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleCreateDocument} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tiêu đề tài liệu</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Hướng dẫn lắp đặt ống PVC-U lõi xoắn..."
                      value={newDocTitle} 
                      onChange={e => setNewDocTitle(e.target.value)} 
                      className="w-full px-4 py-2 border rounded-xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phân loại</label>
                      <select 
                        value={newDocCategory} 
                        onChange={e => setNewDocCategory(e.target.value)} 
                        className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        {existingCategories.map(cat => {
                          let label = cat;
                          if (cat === 'testing') label = 'Thử áp / thử kín';
                          else if (cat === 'installation') label = 'Hướng dẫn lắp đặt';
                          return (
                            <option key={cat} value={cat}>{label}</option>
                          );
                        })}
                        <option value="custom">Phân loại mới...</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dòng ống</label>
                      <select 
                        value={newDocPipeType} 
                        onChange={e => setNewDocPipeType(e.target.value)} 
                        className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="HDPE">HDPE</option>
                        <option value="PPR">PP-R</option>
                        <option value="PVCU">PVC-U</option>
                        <option value="CORRUGATED">Gân sóng</option>
                        {Array.from(new Set(adminDocs.map(d => d.pipeType).filter(t => t && !['HDPE', 'PPR', 'PVCU', 'CORRUGATED'].includes(t)))).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="custom">Dòng ống mới...</option>
                      </select>
                    </div>
                  </div>

                  {newDocCategory === 'custom' && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nhập phân loại mới</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ví dụ: Hướng dẫn kết nối, Tài liệu kỹ thuật khác..."
                        value={customCategory} 
                        onChange={e => setCustomCategory(e.target.value)} 
                        className="w-full px-4 py-2 border bg-white rounded-xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700" 
                      />
                    </div>
                  )}

                  {newDocPipeType === 'custom' && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nhập dòng ống mới</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ví dụ: PP, PVDF..."
                        value={customPipeType} 
                        onChange={e => setCustomPipeType(e.target.value)} 
                        className="w-full px-4 py-2 border bg-white rounded-xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mô tả tài liệu</label>
                    <textarea 
                      rows={3}
                      placeholder="Mô tả tóm tắt nội dung tài liệu..."
                      value={newDocDescription} 
                      onChange={e => setNewDocDescription(e.target.value)} 
                      className="w-full px-4 py-2 border rounded-xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">File tài liệu (PDF)</label>
                    <div className="mt-1 flex items-center gap-4">
                      <label className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 border rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-sm text-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Chọn file PDF
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={handleNewDocFileChange} 
                          className="absolute inset-0 w-0 h-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate max-w-[240px]">
                        {newDocFileName || "Chưa chọn file (Có thể tải lên sau)"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => { setShowCreateDocModal(false); setNewDocFileBase64(null); setNewDocFileName(''); }}
                      className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                      disabled={isCreatingDoc}
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                      disabled={isCreatingDoc}
                    >
                      {isCreatingDoc ? 'Đang tạo...' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Quản lý Tài liệu Kỹ thuật</h2>
                <p className="text-sm text-slate-500 mt-1">Cập nhật hoặc tải lên tài liệu hướng dẫn kỹ thuật dạng PDF</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => setShowCreateDocModal(true)} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  ➕ Thêm tài liệu mới
                </button>
                <button onClick={fetchAdminDocs} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors">
                  🔄 Làm mới
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium border-b">Tên tài liệu</th>
                    <th className="p-4 font-medium border-b">Loại & Dòng ống</th>
                    <th className="p-4 font-medium border-b text-center">Dung lượng</th>
                    <th className="p-4 font-medium border-b text-center">Cập nhật</th>
                    <th className="p-4 font-medium border-b text-center">Trạng thái</th>
                    <th className="p-4 font-medium border-b text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {adminDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{doc.title}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{doc.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="w-fit px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium uppercase">
                            {doc.category === 'testing' ? 'Thử áp / kín' : doc.category === 'installation' ? 'Lắp đặt' : doc.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            Dòng ống: {doc.pipeType} | File: {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-600">{doc.size}</td>
                      <td className="p-4 text-center text-slate-500">{doc.updatedAt}</td>
                      <td className="p-4 text-center">
                        {doc.exists ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ Đã tải lên</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">⚠️ Chưa có file</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <label className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm ${
                            uploadingDocId === doc.id 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : doc.exists
                                ? 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {uploadingDocId === doc.id ? 'Đang lưu...' : doc.exists ? 'Cập nhật PDF' : 'Tải PDF lên'}
                            <input 
                              type="file" 
                              accept=".pdf" 
                              onChange={(e) => handleDocUpload(doc.id, e)} 
                              disabled={uploadingDocId === doc.id} 
                              className="absolute inset-0 w-0 h-0 opacity-0 cursor-pointer"
                            />
                          </label>
                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.title)}
                            className="px-3 py-1.5 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-lg text-xs font-medium transition-colors text-slate-500"
                            title="Xóa tài liệu"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
