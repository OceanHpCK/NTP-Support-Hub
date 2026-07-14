// aria-label added for accessibility compliance
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import APP_REGISTRY from '../registry';
import { Home, Drill, PipetteIcon, Flame, Calculator, Wrench, Cpu, X, Anchor, Book } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  drill: <Drill className="w-5 h-5" />,
  pipe: <PipetteIcon className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  calculator: <Calculator className="w-5 h-5" />,
  wrench: <Wrench className="w-5 h-5" />,
  cpu: <Cpu className="w-5 h-5" />,
  anchor: <Anchor className="w-5 h-5" />,
  book: <Book className="w-5 h-5" />,
};

interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="h-full bg-[#064529] text-white flex flex-col shadow-2xl shadow-slate-950/20">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/20 group-hover:scale-105 transition overflow-hidden p-1">
              <img src="/logo.png" alt="NTP Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">NTP Hub</h1>
              <p className="text-[10px] text-emerald-100/80 font-semibold uppercase tracking-[0.18em]">Hỗ trợ kỹ thuật</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-emerald-100/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-emerald-300/20"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-white text-emerald-950 shadow-lg shadow-emerald-950/15'
                : 'text-emerald-50/75 hover:text-white hover:bg-white/10'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Trang chủ</span>
        </NavLink>

        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-bold text-emerald-100/45 uppercase tracking-[0.18em]">
            Ứng dụng
          </p>
        </div>

        {APP_REGISTRY.map((app) => {
          const isActive = location.pathname.startsWith(`/${app.path}`);
          return (
            <NavLink
              key={app.id}
              to={`/${app.path}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-white text-emerald-950 shadow-lg shadow-emerald-950/15'
                  : 'text-emerald-50/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-gradient-to-br text-white shadow-md' : 'bg-white/10 text-emerald-50 group-hover:bg-white/15'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${app.colorHex}, ${app.colorHex}cc)` } : {}}
              >
                {ICON_MAP[app.icon] || <Calculator className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 leading-snug">{app.name}</p>
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-emerald-100/50 text-center">
          © {new Date().getFullYear()} Nhựa Tiền Phong
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
