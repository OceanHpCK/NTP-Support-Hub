import React from 'react';
import { PipeParams, CalculationResults } from '../lib/calculations';

interface Props {
  params: PipeParams;
  results: CalculationResults;
}

export const VisualSimulation: React.FC<Props> = ({ params, results }) => {
  const aa = params.airFillingRate / 100;
  
  // Cross-section math
  const cx = 200;
  const cy = 200;
  const rOut = 120;
  const rIn = rOut * (results.innerDiameter / params.outerDiameter);
  
  // Linear approximation for water level (sufficient for visual diagram)
  const airHeight = 2 * rIn * aa;
  const waterY = (cy - rIn) + airHeight;

  return (
    <div className="space-y-8">
      
      {/* 1. Cross Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">1. Mặt cắt ngang ống & Quả tải (Cross-section)</h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <svg width="400" height="420" viewBox="0 0 400 420" className="max-w-full h-auto">
            <defs>
              <clipPath id="waterClip">
                <rect x="0" y={waterY} width="400" height={420 - waterY} />
              </clipPath>
              <pattern id="concretePattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9" stroke="#cbd5e1" strokeWidth="1"/>
              </pattern>
            </defs>

            {/* Concrete Weight */}
            <rect x="130" y="330" width="140" height="80" fill="#94a3b8" rx="6" />
            <rect x="130" y="330" width="140" height="80" fill="url(#concretePattern)" rx="6" />
            <text x="200" y="365" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Bê tông</text>
            <text x="200" y="385" textAnchor="middle" fill="white" fontSize="12">{results.concreteWeightPerBlockAir.toFixed(1)} kN</text>
            
            {/* Straps */}
            <line x1="160" y1="300" x2="160" y2="330" stroke="#475569" strokeWidth="6" />
            <line x1="240" y1="300" x2="240" y2="330" stroke="#475569" strokeWidth="6" />

            {/* Pipe Outer */}
            <circle cx={cx} cy={cy} r={rOut} fill="#334155" />
            
            {/* Pipe Inner (Air) */}
            <circle cx={cx} cy={cy} r={rIn} fill="#f8fafc" />
            
            {/* Water Inside */}
            <circle cx={cx} cy={cy} r={rIn} fill="#3b82f6" clipPath="url(#waterClip)" opacity="0.8" />
            
            {/* Water Surface Line */}
            <line x1={cx - rIn} y1={waterY} x2={cx + rIn} y2={waterY} stroke="#2563eb" strokeWidth="2" strokeDasharray="4,4" />
            
            {/* Annotations */}
            <text x={cx} y={waterY - 15} textAnchor="middle" fill="#64748b" fontSize="14" fontWeight="bold">Khí ({params.airFillingRate}%)</text>
            <text x={cx} y={waterY + 25} textAnchor="middle" fill="#eff6ff" fontSize="14" fontWeight="bold">Nước ({(100 - params.airFillingRate).toFixed(0)}%)</text>
            
            {/* Dimensions */}
            <line x1="30" y1={cy} x2="70" y2={cy} stroke="#64748b" strokeWidth="1" />
            <line x1="50" y1={cy - rOut} x2="50" y2={cy + rOut} stroke="#64748b" strokeWidth="1" />
            <line x1="45" y1={cy - rOut} x2="55" y2={cy - rOut} stroke="#64748b" strokeWidth="1" />
            <line x1="45" y1={cy + rOut} x2="55" y2={cy + rOut} stroke="#64748b" strokeWidth="1" />
            <text x="40" y={cy} textAnchor="end" fill="#475569" fontSize="14" transform={`rotate(-90 35 ${cy})`}>D = {params.outerDiameter} mm</text>
          </svg>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 max-w-xs">
            <h4 className="font-bold text-slate-800 mb-2">Giải thích:</h4>
            <ul className="list-disc pl-4 space-y-2">
              <li><strong>Phần màu xanh:</strong> Nước được điền vào ống để tạo trọng lượng chìm ($w_1$).</li>
              <li><strong>Phần màu trắng:</strong> Khí nén giữ lại để tạo lực nổi ($w_2$) và tránh ống bị móp.</li>
              <li><strong>Quả tải bê tông:</strong> Treo bên dưới để thắng lực nổi của ống PE và đảm bảo ống nằm ổn định dưới đáy.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. S-Bend Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">2. Biên dạng đánh chìm (S-Bend Profile)</h3>
        <div className="w-full overflow-x-auto flex justify-center">
          <svg width="800" height="400" viewBox="0 0 800 400" className="min-w-[700px] h-auto">
            <defs>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
              </marker>
            </defs>

            {/* Sky */}
            <rect x="0" y="0" width="800" height="60" fill="#f0f9ff" />
            {/* Water */}
            <rect x="0" y="60" width="800" height="280" fill="#bae6fd" opacity="0.3" />
            {/* Seabed */}
            <rect x="0" y="340" width="800" height="60" fill="#d6d3d1" />
            
            {/* Sea level line */}
            <line x1="0" y1="60" x2="800" y2="60" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" />
            
            {/* Tugboat */}
            <path d="M 80 30 L 130 30 L 140 60 L 70 60 Z" fill="#ef4444" />
            <rect x="95" y="15" width="25" height="15" fill="#f8fafc" />
            <line x1="107" y1="5" x2="107" y2="15" stroke="#334155" strokeWidth="3" />
            
            {/* Pipe */}
            <path d="M 140 60 C 350 60, 450 340, 750 340" fill="none" stroke="#334155" strokeWidth="10" />
            
            {/* Pulling Force (P) */}
            <path d="M 140 60 L 40 60" fill="none" stroke="#16a34a" strokeWidth="3" markerEnd="url(#arrow-green)" />
            <text x="90" y="50" textAnchor="middle" fill="#16a34a" fontSize="14" fontWeight="bold">P = {results.pullingForce.toFixed(1)} kN</text>
            
            {/* Tension Force (T) */}
            <path d="M 550 340 L 450 340" fill="none" stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrow-red)" />
            <text x="500" y="330" textAnchor="middle" fill="#dc2626" fontSize="14" fontWeight="bold">T = {results.maxTensionForce.toFixed(1)} kN</text>
            
            {/* Depth (H) */}
            <line x1="750" y1="60" x2="750" y2="340" stroke="#64748b" strokeWidth="2" strokeDasharray="4,4" />
            <line x1="745" y1="60" x2="755" y2="60" stroke="#64748b" strokeWidth="2" />
            <line x1="745" y1="340" x2="755" y2="340" stroke="#64748b" strokeWidth="2" />
            <text x="760" y="205" fill="#475569" fontSize="14" fontWeight="bold">H = {params.maxDepth} m</text>
            
            {/* w1 and w2 zones */}
            <path d="M 280 130 L 280 80" fill="none" stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow-blue)" />
            <text x="280" y="150" textAnchor="middle" fill="#0284c7" fontSize="14" fontWeight="bold">w2 (Lực nổi)</text>
            
            <path d="M 550 220 L 550 270" fill="none" stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow-blue)" />
            <text x="550" y="210" textAnchor="middle" fill="#0284c7" fontSize="14" fontWeight="bold">w1 (Trọng lượng chìm)</text>

            {/* Bending Radius Indicator */}
            <path d="M 220 60 A 100 100 0 0 0 300 100" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,4" />
            <text x="260" y="85" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="bold">R_min = {results.minBendingRadius.toFixed(1)}m</text>
          </svg>
        </div>
      </div>

    </div>
  );
};
