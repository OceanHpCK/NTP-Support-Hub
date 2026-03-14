import React from 'react';
import { WeldingType } from '../types';
import { Layers, CircleDot, Home } from 'lucide-react';

interface HeaderProps {
  currentView: WeldingType;
  setView: (view: WeldingType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView(WeldingType.HOME)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform rotate-3 hover:rotate-0 transition">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Poly<span className="text-blue-600">Weld</span> Pro
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-lg">
             <button
              onClick={() => setView(WeldingType.BUTT_FUSION)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === WeldingType.BUTT_FUSION
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Hàn Mặt Đầu
            </button>
            <button
              onClick={() => setView(WeldingType.SOCKET_FUSION)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentView === WeldingType.SOCKET_FUSION
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Hàn Lồng
            </button>
          </nav>
          
          {/* Mobile Nav Placeholder (Simplified) */}
          <div className="md:hidden flex items-center">
            {currentView !== WeldingType.HOME && (
                <button onClick={() => setView(WeldingType.HOME)} className="text-slate-600">
                    <Home size={24} />
                </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
