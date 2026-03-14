import React, { Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import Dashboard from './components/Dashboard';
import APP_REGISTRY from './registry';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      <p className="text-sm text-slate-500 font-medium">Đang tải ứng dụng...</p>
    </div>
  </div>
);

// ErrorBoundary to catch lazy-load failures and allow recovery via navigation
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Wrapper that resets error state when location changes
function ErrorBoundaryWithReset({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [errorKey, setErrorKey] = React.useState(0);

  // Listen for popstate events to reset error boundary
  React.useEffect(() => {
    const handleClick = () => {
      // Small delay to allow navigation to complete
      setTimeout(() => setErrorKey(k => k + 1), 0);
    };
    // Reset on any sidebar link click
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('a[href]')) {
        handleClick();
      }
    });
  }, []);

  const errorFallback = (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Không thể tải ứng dụng</h3>
        <p className="text-sm text-slate-500">Có lỗi xảy ra khi tải module. Vui lòng thử lại.</p>
        <button
          onClick={() => { setErrorKey(k => k + 1); navigate('/'); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary key={errorKey} fallback={errorFallback}>
      {children}
    </ErrorBoundary>
  );
}

const App: React.FC = () => {
  return (
    <AppShell>
      <ErrorBoundaryWithReset>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {APP_REGISTRY.map((app) => (
              <Route
                key={app.id}
                path={`/${app.path}/*`}
                element={<app.component />}
              />
            ))}
          </Routes>
        </Suspense>
      </ErrorBoundaryWithReset>
    </AppShell>
  );
};

export default App;
