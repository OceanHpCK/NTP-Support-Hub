import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import { PipeParams, BorePathParams, MaterialGrade, CalculationResult, ProfilePoint, CrossingType, SoilType } from './types';
import { calculateHDD, generatePathProfile } from './services/hddCalculator';
import { analyzeWithGemini } from './services/geminiService';
import { generatePDF } from './services/pdfGenerator';
import MethodologyReview from './components/MethodologyReview';
import MiniHDDReference from './components/MiniHDDReference';

const App: React.FC = () => {
  const [pipe, setPipe] = useState<PipeParams>({
    outerDiameter: 315,
    sdr: 11,
    material: MaterialGrade.PE100,
    yieldStrength: 24,
  });

  const [path, setPath] = useState<BorePathParams>({
    totalLength: 200,
    depth: 10,
    entryAngle: 12,
    exitAngle: 10,
    soilFriction: 0.25,
    mudDensity: 1150,
    viscosity: 45,
    crossingType: CrossingType.Standard,
    soilType: SoilType.Clay
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showMiniHDD, setShowMiniHDD] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('hdd_gemini_key') || '');

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('hdd_gemini_key', key);
  };

  const results: CalculationResult = useMemo(() => {
    return calculateHDD(pipe, path);
  }, [pipe, path]);

  const profileData: ProfilePoint[] = useMemo(() => {
    return generatePathProfile(path.totalLength, path.depth, path.entryAngle, path.exitAngle);
  }, [path.totalLength, path.depth, path.entryAngle, path.exitAngle]);

  const handleGenerateAI = async () => {
    if (!apiKey && !import.meta.env.VITE_GEMINI_API_KEY) {
      setShowSettings(true);
      return;
    }
    setIsAiLoading(true);
    setAiAnalysis(null);
    const report = await analyzeWithGemini(pipe, path, results, apiKey);
    setAiAnalysis(report);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-full pb-12 relative">
      <MethodologyReview isOpen={showMethodology} onClose={() => setShowMethodology(false)} />
      <MiniHDDReference isOpen={showMiniHDD} onClose={() => setShowMiniHDD(false)} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Cấu hình hệ thống</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                  placeholder="Nhập API Key của bạn..."
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Key được lưu cục bộ trên trình duyệt của bạn.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                Đóng & Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="report-content" className="bg-white min-h-full">
        {/* Compact Sub-Header */}
        <div className="bg-green-600 text-white px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1.5 rounded-lg">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight uppercase">HDD Pro Calculator</h1>
                <p className="text-xs text-green-50 font-medium">Tính toán & Thiết kế khoan ngầm HDPE</p>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="text-white hover:text-green-100 p-2 rounded-full hover:bg-green-700/50" title="Cấu hình" data-html2canvas-ignore>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Thiết kế tuyến khoan</h2>
              <p className="text-gray-600 mt-1">Nhập thông số ống và tuyến khoan để tính toán lực kéo và kiểm tra an toàn.</p>
            </div>
            <div className="flex space-x-3" data-html2canvas-ignore>
              <button onClick={() => setShowMiniHDD(true)} className="flex items-center space-x-2 bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold shadow-md border border-emerald-100 hover:shadow-lg transition-all text-sm">
                <span>Mini-HDD Specs</span>
              </button>
              <button onClick={() => setShowMethodology(true)} className="flex items-center space-x-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold shadow-md border border-indigo-100 hover:shadow-lg transition-all text-sm">
                <span>Phương pháp tính (ASTM F1962)</span>
              </button>
            </div>
          </div>

          <InputSection pipe={pipe} setPipe={setPipe} path={path} setPath={setPath} />
          <div className="border-t border-gray-200 my-8"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kết quả tính toán & Phân tích</h2>
          <ResultsDashboard results={results} profileData={profileData} onGenerateAI={handleGenerateAI} isAiLoading={isAiLoading} />

          {aiAnalysis && (
            <div className="mt-8 animate-fade-in-up">
              <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl shadow-md border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center relative z-10">
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Báo cáo tư vấn từ AI Chuyên gia
                </h3>
                <div className="prose prose-indigo max-w-none relative z-10 mb-6">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
                <div className="flex justify-end space-x-4 border-t border-indigo-100 pt-4 relative z-10" data-html2canvas-ignore>
                  <button onClick={() => generatePDF('report-content', 'hdd-report.pdf')} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <span>Xuất báo cáo PDF</span>
                  </button>
                  <button onClick={() => setAiAnalysis(null)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-4 py-2">
                    Đóng báo cáo
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
