import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import APP_REGISTRY from '../registry';
import { Home, Drill, PipetteIcon, Flame, Calculator, Wrench, Cpu, X } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  drill: <Drill className="w-5 h-5" />,
  pipe: <PipetteIcon className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  calculator: <Calculator className="w-5 h-5" />,
  wrench: <Wrench className="w-5 h-5" />,
  cpu: <Cpu className="w-5 h-5" />,
};

interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col shadow-2xl">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">NTP Hub</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Hỗ trợ Kỹ thuật</p>
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
                ? 'bg-slate-800 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
