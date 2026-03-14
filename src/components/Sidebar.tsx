import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import APP_REGISTRY from '../registry';
import { Home, Drill, PipetteIcon, Flame, Calculator, Wrench, Cpu, X, Anchor } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  drill: <Drill className="w-5 h-5" />,
  pipe: <PipetteIcon className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  calculator: <Calculator className="w-5 h-5" />,
  wrench: <Wrench className="w-5 h-5" />,
  cpu: <Cpu className="w-5 h-5" />,
  anchor: <Anchor className="w-5 h-5" />,
};

interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="h-full bg-[#004d2c] text-white flex flex-col shadow-2xl">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/10 transition-shadow overflow-hidden p-1">
              <img src="/logo.png" alt="NTP Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">NTP Hub</h1>
              <p className="text-[10px] text-emerald-200 font-medium uppercase tracking-widest">Hỗ trợ Kỹ thuật</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {/* Home link */}
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-emerald-800/80 text-white shadow-lg border border-emerald-700'
                : 'text-emerald-100/70 hover:text-white hover:bg-emerald-800/40'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Trang chủ</span>
        </NavLink>

        {/* Divider */}
        <div className="pt-3 pb-2">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            Ứng dụng
          </p>
        </div>

        {/* App links from registry */}
        {APP_REGISTRY.map((app) => {
          const isActive = location.pathname.startsWith(`/${app.path}`);
          return (
            <NavLink
              key={app.id}
              to={`/${app.path}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-800/80 text-white shadow-lg border border-emerald-700'
                  : 'text-emerald-100/70 hover:text-white hover:bg-emerald-800/40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-gradient-to-br shadow-md' : 'bg-slate-800 group-hover:bg-slate-700'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${app.colorHex}, ${app.colorHex}cc)` } : {}}
              >
                {ICON_MAP[app.icon] || <Calculator className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="truncate">{app.shortName}</p>
                {isActive && (
                  <p className="text-[10px] text-slate-400 truncate">{app.name}</p>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 text-center">
          © {new Date().getFullYear()} Nhựa Tiền Phong
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
