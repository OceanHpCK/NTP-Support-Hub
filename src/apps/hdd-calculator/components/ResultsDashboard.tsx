import React from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalculationResult, ProfilePoint } from '../types';

interface ResultsDashboardProps {
  results: CalculationResult;
  profileData: ProfilePoint[];
  onGenerateAI: () => void;
  isAiLoading: boolean;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, profileData, onGenerateAI, isAiLoading }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Key Metrics Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
                <h4 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Lực kéo dự tính</h4>
                <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-extrabold text-blue-600">{results.estimatedPullForce.toFixed(1)}</span>
                    <span className="ml-1 text-lg text-gray-500">kN</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Ứng suất kéo:</span>
                    <span className="font-semibold">{results.tensileStress.toFixed(1)} MPa</span>
                </div>
            </div>
        </div>

        <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between ${results.safetyFactorTensile >= 1.5 ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}>
             <div>
                <h4 className="text-gray-500 text-sm font-medium uppercase tracking-wider">HS An Toàn (Kéo)</h4>
                <div className={`mt-2 flex items-baseline ${results.safetyFactorTensile >= 2.0 ? 'text-green-600' : results.safetyFactorTensile >= 1.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    <span className="text-3xl font-extrabold">{results.safetyFactorTensile.toFixed(2)}</span>
                    <span className="ml-1 text-sm font-normal text-gray-500">(Target &gt; 1.5)</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Bán kính cong min:</span>
                    <span className="font-semibold">{results.bendingRadius.toFixed(0)} m</span>
                </div>
            </div>
        </div>

        <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between ${results.safetyFactorCollapse >= 1.5 ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}>
             <div>
                <h4 className="text-gray-500 text-sm font-medium uppercase tracking-wider">HS An Toàn (Móp)</h4>
                 <div className={`mt-2 flex items-baseline ${results.safetyFactorCollapse >= 2.0 ? 'text-green-600' : results.safetyFactorCollapse >= 1.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    <span className="text-3xl font-extrabold">{results.safetyFactorCollapse.toFixed(2)}</span>
                     <span className="ml-1 text-sm font-normal text-gray-500">(Target &gt; 1.5)</span>
                </div>
            </div>
             <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Trạng thái ống:</span>
                    <span className="font-semibold">{results.pipeWeightMud < 0 ? 'Nổi' : 'Chìm'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Equipment Recommendation Section */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl shadow-sm">
        <h4 className="text-indigo-900 text-lg font-bold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tư vấn thiết bị & Lỗ khoan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                <p className="text-sm text-gray-500 mb-1">Đường kính lỗ khoan (Doa) đề xuất</p>
                <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-indigo-700">{results.recommendedBoreholeDiameter.toFixed(0)}</span>
                    <span className="ml-1 text-gray-600">mm</span>
                    <span className="ml-2 text-xs text-gray-400">(~1.5x Đường kính ống)</span>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-indigo-100">
                <p className="text-sm text-gray-500 mb-1">Công suất máy khoan tối thiểu (Lực kéo)</p>
                <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-indigo-700">{results.requiredRigPullback.toFixed(1)}</span>
                    <span className="ml-1 text-gray-600">Tấn</span>
                    <span className="ml-2 text-xs text-gray-400">(HS an toàn thiết bị 2.0)</span>
                </div>
            </div>
        </div>
      </div>

      {/* Warnings */}
      {results.warnings.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
               <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Cảnh báo kỹ thuật</h3>
              <ul className="mt-2 text-sm text-orange-700 list-disc list-inside">
                {results.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Biểu đồ trắc dọc tuyến khoan (Mô phỏng)</h3>
            <button 
                onClick={onGenerateAI}
                disabled={isAiLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
            >
                {isAiLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang phân tích AI...
                    </>
                ) : (
                    <>
                        <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Tư vấn Thiết bị & Quy trình
                    </>
                )}
            </button>
        </div>
        
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={profileData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="x" 
                        type="number" 
                        label={{ value: 'Khoảng cách (m)', position: 'insideBottomRight', offset: -5 }} 
                        domain={[0, 'auto']}
                    />
                    <YAxis 
                        label={{ value: 'Độ sâu (m)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                        formatter={(value: number) => [`${Math.abs(value).toFixed(2)} m`, 'Độ sâu']}
                        labelFormatter={(label) => `Khoảng cách: ${Number(label).toFixed(1)} m`}
                    />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    <Area 
                        type="monotone" 
                        dataKey="depth" 
                        stroke="#2563eb" 
                        fillOpacity={1} 
                        fill="url(#colorDepth)" 
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;