import React, { useState } from 'react';
import Header from './components/Header';
import ButtFusion from './components/ButtFusion';
import SocketFusion from './components/SocketFusion';
import AIChat from './components/AIChat';
import { WeldingType } from './types';
import { ArrowRight, FileText, Settings, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<WeldingType>(WeldingType.HOME);

  const renderContent = () => {
    switch (currentView) {
      case WeldingType.BUTT_FUSION:
        return <ButtFusion />;
      case WeldingType.SOCKET_FUSION:
        return <SocketFusion />;
      case WeldingType.HOME:
      default:
        return (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Chuyên Gia Kỹ Thuật <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Hàn Ống Nhựa Chất Lượng Cao
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-slate-600">
                Ứng dụng hỗ trợ tính toán thông số, tra cứu quy trình và tư vấn kỹ thuật hàn HDPE/PPR theo tiêu chuẩn quốc tế ISO 21307.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div 
                onClick={() => setCurrentView(WeldingType.BUTT_FUSION)}
                className="group relative bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 w-full h-2 bg-blue-600"></div>
                <div className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                    <Settings className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Hàn Mặt Đầu (Butt Fusion)</h3>
                  <p className="text-slate-600">
                    Dành cho ống HDPE đường kính lớn. Tính toán áp suất kéo, gia nhiệt và làm nguội chính xác theo diện tích xy-lanh máy.
                  </p>
                  <div className="pt-4 flex items-center text-blue-600 font-semibold">
                    Truy cập công cụ <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setCurrentView(WeldingType.SOCKET_FUSION)}
                className="group relative bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 w-full h-2 bg-emerald-500"></div>
                <div className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300">
                    <FileText className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Hàn Lồng (Socket Fusion)</h3>
                  <p className="text-slate-600">
                    Dành cho ống PPR/HDPE đường kính nhỏ (≤ 110mm). Bảng tra cứu nhanh thời gian gia nhiệt và chiều sâu lắp ghép.
                  </p>
                  <div className="pt-4 flex items-center text-emerald-600 font-semibold">
                    Xem bảng tra cứu <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
               <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-700">
                    <ShieldCheck />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Chuẩn ISO 21307</h4>
                  <p className="text-sm text-slate-500">Dữ liệu được tham chiếu từ các tiêu chuẩn quốc tế mới nhất.</p>
               </div>
               <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-700">
                    <Settings />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Tính Toán Tự Động</h4>
                  <p className="text-sm text-slate-500">Nhập thông số máy và ống, nhận ngay quy trình hàn chi tiết.</p>
               </div>
               <div className="p-4">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-700">
                    <FileText />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">AI Trợ Giúp 24/7</h4>
                  <p className="text-sm text-slate-500">Tích hợp Gemini AI để giải đáp mọi thắc mắc kỹ thuật.</p>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 font-sans">
      <Header currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-grow pb-24">
        {renderContent()}
      </main>

      <AIChat />
    </div>
  );
};

export default App;
