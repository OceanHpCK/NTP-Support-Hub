import React from 'react';
import { useNavigate } from 'react-router-dom';
import APP_REGISTRY from '../registry';
import { ArrowRight, Drill, PipetteIcon, Flame, Calculator, Wrench, Cpu } from 'lucide-react';

const ICON_MAP_LARGE: Record<string, React.ReactNode> = {
  drill: <Drill className="w-8 h-8" />,
  pipe: <PipetteIcon className="w-8 h-8" />,
  flame: <Flame className="w-8 h-8" />,
  calculator: <Calculator className="w-8 h-8" />,
  wrench: <Wrench className="w-8 h-8" />,
  cpu: <Cpu className="w-8 h-8" />,
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-cyan-600/5" />
        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              NTP Technical Support Suite
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Bộ công cụ{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Hỗ trợ Kỹ thuật
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Các ứng dụng tính toán chuyên ngành dành cho khách hàng sử dụng sản phẩm ống nhựa Tiền Phong.
              Chọn một công cụ bên dưới để bắt đầu.
            </p>
          </div>
        </div>
      </div>

      {/* App Cards Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16 -mt-2">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APP_REGISTRY.map((app, index) => (
            <div
              key={app.id}
              onClick={() => navigate(`/${app.path}`)}
              className="group relative bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Top accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${app.colorHex}, ${app.colorHex}99)` }}
              />

              <div className="p-6 space-y-4">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${app.colorHex}, ${app.colorHex}cc)` }}
                >
                  {ICON_MAP_LARGE[app.icon] || <Calculator className="w-8 h-8" />}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{app.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{app.description}</p>
                </div>

                {/* Action */}
                <div className="pt-2 flex items-center text-sm font-semibold" style={{ color: app.colorHex }}>
                  Mở ứng dụng
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400">
            Tất cả công cụ tính toán mang tính chất tham khảo. Cần tham khảo ý kiến kỹ sư chuyên ngành cho dự án thực tế.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
