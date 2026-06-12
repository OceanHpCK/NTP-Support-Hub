import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../config';


interface AccessGuardProps {
  moduleId: string;
  moduleName: string;
  isPublic?: boolean;
  children: React.ReactNode;
}

const AccessGuard: React.FC<AccessGuardProps> = ({ moduleId, moduleName, isPublic, children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Khôi phục trạng thái đã xác thực từ sessionStorage nếu chưa hết hạn
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    const expires = sessionStorage.getItem(`auth_expires_${moduleId}`);
    if (expires) {
      const remaining = Math.floor((parseInt(expires) - Date.now()) / 1000);
      return remaining > 0;
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Nếu là public hoặc đã được authorized từ sessionStorage thì không hiện loading mặc định
    const expires = sessionStorage.getItem(`auth_expires_${moduleId}`);
    if (expires) {
      const remaining = Math.floor((parseInt(expires) - Date.now()) / 1000);
      if (remaining > 0) return false;
    }
    return true;
  });

  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    const expires = sessionStorage.getItem(`auth_expires_${moduleId}`);
    if (expires) {
      const remaining = Math.floor((parseInt(expires) - Date.now()) / 1000);
      return remaining > 0 ? remaining : null;
    }
    return null;
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasVerifiedUrlCode = useRef<boolean>(false);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startCountdown = (durationMinutes: number) => {
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    sessionStorage.setItem(`auth_expires_${moduleId}`, expiresAt.toString());
    
    const totalSeconds = durationMinutes * 60;
    setRemainingSeconds(totalSeconds);
  };

  // Quản lý đếm ngược thời gian dựa trên sessionStorage để đồng bộ chính xác khi reload trang
  useEffect(() => {
    if (isPublic) return;

    const expires = sessionStorage.getItem(`auth_expires_${moduleId}`);
    if (expires && isAuthorized) {
      const remaining = Math.floor((parseInt(expires) - Date.now()) / 1000);
      if (remaining > 0) {
        setRemainingSeconds(remaining);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          const currentRemaining = Math.floor((parseInt(expires) - Date.now()) / 1000);
          if (currentRemaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            sessionStorage.removeItem(`auth_expires_${moduleId}`);
            setIsAuthorized(false);
            setCode('');
            setError('Phiên truy cập đã hết hạn. Vui lòng nhận mã mới từ Admin.');
            setRemainingSeconds(null);
          } else {
            setRemainingSeconds(currentRemaining);
          }
        }, 1000);
      } else {
        sessionStorage.removeItem(`auth_expires_${moduleId}`);
        setIsAuthorized(false);
        setRemainingSeconds(null);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthorized, moduleId, isPublic]);

  const verifyCode = async (accessCode: string) => {
    setIsLoading(true);
    setError('');
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode, module_id: moduleId })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsAuthorized(true);
        if (data.duration_minutes) {
          startCountdown(data.duration_minutes);
        } else {
          sessionStorage.setItem(`auth_expires_${moduleId}`, (Date.now() + 60 * 60 * 1000).toString());
        }
        if (searchParams.has('code')) {
          searchParams.delete('code');
          setSearchParams(searchParams, { replace: true });
        }
      } else {
        setError(data.message || 'Mã không hợp lệ hoặc đã hết hạn.');
      }
    } catch {
      setError('Lỗi kết nối đến máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hasVerifiedUrlCode.current = false;
  }, [moduleId]);

  useEffect(() => {
    if (isPublic) {
      setIsLoading(false);
      return;
    }

    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      if (!isAuthorized) {
        if (!hasVerifiedUrlCode.current) {
          hasVerifiedUrlCode.current = true;
          setCode(codeFromUrl);
          verifyCode(codeFromUrl);
        }
      } else {
        // Nếu đã có session hợp lệ mà URL vẫn chứa code, tiến hành xóa tham số code để làm sạch URL
        if (searchParams.has('code')) {
          searchParams.delete('code');
          setSearchParams(searchParams, { replace: true });
        }
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [searchParams, moduleId, isAuthorized, isPublic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      verifyCode(code.trim());
    }
  };

  // Trả về trực tiếp children nếu module ở chế độ công khai (Public)
  if (isPublic) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang xác thực hệ thống...</p>
      </div>
    );
  }

  if (isAuthorized) {
    const WARNING_THRESHOLD = 5 * 60; // 5 phút
    const CRITICAL_THRESHOLD = 60;    // 1 phút
    const showWarning = remainingSeconds !== null && remainingSeconds <= WARNING_THRESHOLD;
    const isCritical = remainingSeconds !== null && remainingSeconds <= CRITICAL_THRESHOLD;

    return (
      <>
        {showWarning && (
          <div
            className={`sticky top-0 z-50 px-4 py-2.5 text-center text-sm font-medium transition-colors ${
              isCritical
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-400 text-amber-900'
            }`}
          >
            {isCritical ? '🔴' : '⚠️'} Phiên sắp hết hạn — Còn {formatTime(remainingSeconds!)}
            {!isCritical && (
              <span className="ml-2 opacity-70">| Hãy lưu công việc của bạn</span>
            )}
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="flex items-center justify-center h-full min-h-[80vh] bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-blue-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Yêu cầu quyền truy cập</h2>
          <p className="text-blue-100 text-sm mt-1">Module: {moduleName}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã xác thực (Access Code)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: NTP-8A3X9B2C"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center tracking-widest text-lg uppercase transition-shadow"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !code}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors shadow-md shadow-blue-500/20"
          >
            {isLoading ? 'Đang kiểm tra...' : 'Xác nhận & Vào ứng dụng'}
          </button>
          
          <p className="text-xs text-center text-slate-500 pt-2">
            * Hệ thống tự động kích hoạt nếu bạn dùng tính năng quét mã QR.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AccessGuard;
