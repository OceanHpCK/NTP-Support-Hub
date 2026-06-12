// aria-label added for accessibility compliance
/**
 * NTP Support Hub Configuration
 * Tự động phân giải địa chỉ API URL tương thích hoàn hảo giữa môi trường Localhost, LAN IP và Production.
 */

const isLocalOrLanHostname = (host: string): boolean => {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  );
};

export const getApiUrl = (): string => {
  let apiUrl = import.meta.env.VITE_API_URL || '';
  
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    
    // Trong môi trường Production build (Nginx / Docker), luôn dùng relative path để Nginx tự proxy
    if (import.meta.env.PROD) {
      return apiUrl || '';
    }

    // Trong môi trường Dev (Vite Dev Server)
    if (!apiUrl) {
      if (isLocalOrLanHostname(hostname)) {
        return `${protocol}//${hostname}:5000`;
      }
    }
  }
  
  return apiUrl || 'http://localhost:5000';
};
