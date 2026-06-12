import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  Settings, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Zap,
  Gauge,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { cn } from './lib/utils';

// --- Constants & Types ---

type Material = 'Steel' | 'DuctileIron' | 'PVC_U' | 'HDPE' | 'PP_R';

interface MaterialConfig {
  name: string;
  eModulus: number; // Pa
  surgeFactor: number; // Hệ số chịu áp tức thời (Short-term surge factor)
}

const MATERIALS: Record<Material, MaterialConfig> = {
  Steel: { name: 'Thép (Steel)', eModulus: 200e9, surgeFactor: 1.5 },
  DuctileIron: { name: 'Gang dẻo (Ductile Iron)', eModulus: 170e9, surgeFactor: 2.0 },
  PVC_U: { name: 'Nhựa PVC-U', eModulus: 3e9, surgeFactor: 1.5 }, // Theo tài liệu Georg Fischer (1.3 - 1.5x PN)
  HDPE: { name: 'Nhựa HDPE', eModulus: 0.8e9, surgeFactor: 2.5 },
  PP_R: { name: 'Nhựa PP-R', eModulus: 0.9e9, surgeFactor: 1.5 },
};

function interpolate(temp: number, points: {t: number, f: number}[]): number {
  if (temp <= points[0].t) return points[0].f;
  if (temp >= points[points.length - 1].t) return points[points.length - 1].f;
  for (let i = 0; i < points.length - 1; i++) {
    if (temp >= points[i].t && temp <= points[i + 1].t) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const ratio = (temp - p1.t) / (p2.t - p1.t);
      return p1.f + ratio * (p2.f - p1.f);
    }
  }
  return 1.0;
}

function getDeratingFactor(material: string, temp: number): number {
  if (material === 'PVC_U') {
    if (temp <= 25) return 1.0;
    if (temp <= 30) return 0.9;
    if (temp <= 35) return 0.8;
    if (temp <= 40) return 0.7;
    if (temp <= 45) return 0.65;
    return 0.4;
  }
  if (material === 'HDPE') {
    const points = [
      { t: 20, f: 1.00 },
      { t: 25, f: 0.92 },
      { t: 30, f: 0.85 },
      { t: 35, f: 0.79 },
      { t: 40, f: 0.73 },
      { t: 50, f: 0.63 },
    ];
    return interpolate(temp, points);
  }
  if (material === 'PP_R') {
    // PP-R chịu nhiệt tốt hơn
    if (temp <= 20) return 1.0;
    if (temp <= 30) return 0.9;
    if (temp <= 40) return 0.85;
    if (temp <= 50) return 0.8;
    if (temp <= 60) return 0.7;
    if (temp <= 70) return 0.6;
    return 0.5;
  }
  return 1.0;
}

// --- Helper Components ---

const InputField = ({ label, icon: Icon, unit, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    <div className="relative">
      <input
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        {...props}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const ResultCard = ({ title, value, unit, subtitle, colorClass }: any) => (
  <div className={cn("p-4 rounded-xl border transition-all hover:shadow-md", colorClass || "bg-white border-slate-100 shadow-sm")}>
    <div className="text-xs font-medium opacity-70 mb-1">{title}</div>
    <div className="flex items-baseline gap-1">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium opacity-80">{unit}</div>
    </div>
    {subtitle && <div className="text-[10px] mt-2 font-medium opacity-60 uppercase">{subtitle}</div>}
  </div>
);

// --- Main App ---

export default function App() {
  const [showDoc, setShowDoc] = useState(false);
  const [inputs, setInputs] = useState({
    flowRate: 100, // m3/h
    head: 50,      // m
    dn: 150,       // mm
    pn: 10,        // bar
    length: 1000,  // m
    material: 'PVC_U' as Material,
    closureTime: 3, // s
    roughness: 0.1, // mm
    temperature: 25, // °C
    deratingFactor: 1.0,
    isCustomDerating: false,
    cyclesPerDay: 24, // lần/ngày
  });

  const results = useMemo(() => {
    const { flowRate, dn, length, material, closureTime, head, pn, temperature, deratingFactor, cyclesPerDay } = inputs;
    const g = 9.81;
    const bulkModulusWater = 2.2e9; // K in Pa
    const densityWater = 1000;      // kg/m3

    // 0. Derating by Temperature
    const parsedDerating = parseFloat(String(deratingFactor));
    const safeDerating = isNaN(parsedDerating) ? 0 : parsedDerating;
    const operatingPn = pn * safeDerating;

    // 1. Velocity (v)
    const area = Math.PI * Math.pow((dn * 1e-3) / 2, 2);
    const flowM3s = flowRate / 3600;
    const velocity = area > 0 ? flowM3s / area : 0;

    // 2. Wave Speed (a)
    const deRatio = pn > 0 ? (material === 'PVC_U' || material === 'HDPE' || material === 'PP_R' ? 20 : 40) : 40;
    
    const matE = MATERIALS[material].eModulus;
    const a = Math.sqrt(bulkModulusWater / densityWater) / Math.sqrt(1 + (bulkModulusWater / matE) * deRatio);

    // 3. Critical Time (Tc)
    const tc = (2 * length) / a;

    // 4. Surge Pressure (dH)
    let dH = 0;
    const isInstant = closureTime <= tc;
    
    if (isInstant) {
      dH = (a * velocity) / g;
    } else {
      // Michaud formula for gradual closure
      dH = (2 * length * velocity) / (g * closureTime);
    }

    const operatingBar = head / 10.2;
    const surgeBar = dH / 10.2;
    const totalBar = operatingBar + surgeBar;

    // Giới hạn chịu tải tức thời của vật liệu (tính trên PN đã suy giảm theo nhiệt độ)
    const maxAllowableSurge = operatingPn * MATERIALS[material].surgeFactor;

    // 5. Fatigue Calculation (Tuổi thọ 50 năm)
    const designLifeYears = 50;
    const totalCycles = cyclesPerDay * 365 * designLifeYears;
    
    let fatigueFactor = 1.0;
    // Đơn giản hóa hệ số mỏi (chủ yếu tham khảo cho PVC/HDPE)
    if (totalCycles > 1e7) fatigueFactor = 0.5;
    else if (totalCycles > 5e6) fatigueFactor = 0.6;
    else if (totalCycles > 1e6) fatigueFactor = 0.7;
    else if (totalCycles > 5e5) fatigueFactor = 0.8;
    else if (totalCycles > 1e5) fatigueFactor = 0.9;
    else fatigueFactor = 1.0;

    const maxFatigueAmplitude = operatingPn * fatigueFactor;

    return {
      velocity: velocity.toFixed(2),
      waveSpeed: a.toFixed(0),
      criticalTime: tc.toFixed(1),
      surgePressure: surgeBar.toFixed(1),
      totalPressure: totalBar.toFixed(1),
      maxAllowableSurge: maxAllowableSurge.toFixed(1),
      deratingFactor: safeDerating.toFixed(2),
      operatingPn: operatingPn.toFixed(1),
      totalCycles: totalCycles.toExponential(2),
      fatigueFactor: fatigueFactor.toFixed(2),
      maxFatigueAmplitude: maxFatigueAmplitude.toFixed(1),
      isFatigueSafe: surgeBar <= maxFatigueAmplitude,
      formulaUsed: isInstant ? 'Joukowsky' : 'Michaud',
      isInstant,
      safetyFactor: (maxAllowableSurge / totalBar).toFixed(1),
      status: totalBar <= operatingPn ? 'safe' : (totalBar <= maxAllowableSurge ? 'warning' : 'danger')
    };
  }, [inputs]);

  const chartData = [
    { name: 'PN Định danh', value: inputs.pn, fill: '#94a3b8' }, // grey for nominal
    { name: `PN Lắp đặt (${inputs.temperature}°C)`, value: parseFloat(results.operatingPn), fill: '#10b981' }, 
    { name: 'Xung kích cho phép', value: parseFloat(results.maxAllowableSurge), fill: '#0ea5e9' },
    { name: 'Áp lực hoạt động', value: parseFloat((inputs.head / 10.2).toFixed(1)), fill: '#3b82f6' },
    { name: 'Tổng áp lực', value: parseFloat(results.totalPressure), fill: results.status === 'safe' ? '#4ade80' : (results.status === 'warning' ? '#f59e0b' : '#ef4444') }
  ];

  const handleInputChange = (key: string, value: any) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'material' || key === 'temperature') {
        if (!next.isCustomDerating) {
          next.deratingFactor = getDeratingFactor(next.material, next.temperature);
        }
      }
      if (key === 'deratingFactor') {
        next.isCustomDerating = true;
      }
      return next;
    });
  };

  const resetDerating = () => {
    setInputs(prev => ({
      ...prev,
      isCustomDerating: false,
      deratingFactor: getDeratingFactor(prev.material, prev.temperature)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Droplets className="text-blue-600 w-8 h-8" />
              Công Cụ Tính Toán Water Hammer
            </h1>
            <p className="text-slate-500 text-sm mt-1">Phân tích thủy lực & Tư vấn thông số DN, PN hệ thống bơm</p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-600">THỦY LỰC REAL-TIME</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Section */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-800">Thông số đầu vào</h2>
              </div>

              <div className="space-y-6">
                {/* Pump Params */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Thông số Bơm</div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Lưu lượng Q" 
                      unit="m³/h" 
                      type="number"
                      value={inputs.flowRate}
                      onChange={(e: any) => handleInputChange('flowRate', parseFloat(e.target.value) || 0)}
                    />
                    <InputField 
                      label="Cột áp H" 
                      unit="m" 
                      type="number"
                      value={inputs.head}
                      onChange={(e: any) => handleInputChange('head', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Pipe Params */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Đường ống & Sản phẩm</div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Đường kính DN" 
                      unit="mm" 
                      type="number"
                      value={inputs.dn}
                      onChange={(e: any) => handleInputChange('dn', parseFloat(e.target.value) || 0)}
                    />
                    <InputField 
                      label="Cấp Áp PN" 
                      unit="bar" 
                      type="number"
                      value={inputs.pn}
                      onChange={(e: any) => handleInputChange('pn', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Chiều dài L" 
                      unit="m" 
                      type="number"
                      value={inputs.length}
                      onChange={(e: any) => handleInputChange('length', parseFloat(e.target.value) || 0)}
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        Vật liệu
                      </label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={inputs.material}
                        onChange={(e: any) => handleInputChange('material', e.target.value)}
                      >
                        {Object.entries(MATERIALS).map(([key, config]) => (
                          <option key={key} value={key}>{config.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <InputField 
                      label="Nhiệt độ lưu chất" 
                      unit="°C" 
                      type="number"
                      value={inputs.temperature}
                      onChange={(e: any) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                    />
                    <div className="space-y-1.5 relative group">
                      <div className="flex items-center justify-between">
                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2" title="Hệ số suy giảm áp suất do nhiệt độ (Derating Factor - fT)">
                           <Activity className="w-3 h-3" /> Suy giảm (fT)
                         </label>
                         {inputs.isCustomDerating && (
                           <button onClick={resetDerating} title="Sử dụng hệ số tự động của phần mềm" className="text-[9px] text-blue-500 hover:text-blue-700 font-bold uppercase underline">
                             Tự động
                           </button>
                         )}
                      </div>
                      <input
                        className={cn(
                          "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                          !inputs.isCustomDerating && "bg-slate-50 border-dashed"
                        )}
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="2.0"
                        title={inputs.isCustomDerating ? "Hệ số fT do người dùng tự nhập" : "Hệ số tự động theo vật liệu và nhiệt độ"}
                        value={inputs.deratingFactor}
                        onChange={(e: any) => handleInputChange('deratingFactor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Closing Time */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Vận hành</div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Thời gian đóng van" 
                      unit="giây" 
                      type="number"
                      value={inputs.closureTime}
                      onChange={(e: any) => handleInputChange('closureTime', parseFloat(e.target.value) || 0)}
                    />
                    <InputField 
                      label="Tần suất đóng/bơm" 
                      unit="lần/ngày" 
                      type="number"
                      value={inputs.cyclesPerDay}
                      onChange={(e: any) => handleInputChange('cyclesPerDay', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Giải thích về L */}
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4" /> Chiều dài L quan trọng ra sao?
              </h3>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Với thời gian đóng van hiện tại là <strong>{inputs.closureTime}s</strong>:
              </p>
              <div className="bg-blue-700/50 p-3 rounded-xl border border-white/10 text-[11px]">
                 {inputs.closureTime <= parseFloat(results.criticalTime) ? (
                   <p>⚡ <strong>Đóng van tức thời (T ≤ {results.criticalTime}s):</strong> Áp suất đã đạt mức <strong>TỐI ĐA</strong> (Công thức Joukowsky). Ở trạng thái này, chiều dài $L$ không còn ảnh hưởng đến độ lớn áp suất vì sóng phản hồi không kịp về để giảm áp. Việc tăng thêm $L$ sẽ không làm tăng thêm áp suất đỉnh.</p>
                 ) : (
                   <p>⏳ <strong>Đóng van chậm (T &gt; {results.criticalTime}s):</strong> Áp suất tỉ lệ thuận với $L$ (Công thức Michaud). Nếu bạn tăng $L$ lên gấp đôi, áp suất Water Hammer sẽ <strong>TĂNG GẤP ĐÔI</strong> ({results.surgePressure} bar hiện tại). Hệ thống đang ở vùng nhạy cảm với chiều dài.</p>
                 )}
              </div>
            </div>

            {/* Formulas Box */}
            <div className="bg-slate-800 text-slate-300 p-5 rounded-2xl shadow-inner text-[11px] leading-relaxed">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Phương pháp tính toán
              </h3>
              <ul className="space-y-2 opacity-80">
                <li>• Sử dụng công thức <span className="text-blue-400 font-mono">Joukowsky</span> cho đóng van tức thời.</li>
                <li>• Công thức <span className="text-blue-400 font-mono">Michaud</span> cho đóng van chậm.</li>
                <li>• Vận tốc truyền sóng (a) phụ thuộc vào mô-đun đàn hồi vật liệu.</li>
              </ul>
            </div>
          </aside>

          {/* Results Section */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ResultCard 
                title="Vận tốc dòng chảy" 
                value={results.velocity} 
                unit="m/s" 
                subtitle={parseFloat(results.velocity) > 2.0 ? "VƯỢT NGƯỠNG AN TOÀN" : "DÒNG ỔN ĐỊNH"} 
                colorClass={parseFloat(results.velocity) > 2.0 ? "bg-rose-50 border-rose-200 text-rose-900 animate-pulse" : ""}
              />
              <ResultCard title="Vận tốc sóng âm" value={results.waveSpeed} unit="m/s" subtitle="Phụ thuộc vật liệu" />
              <ResultCard title="Water Hammer" value={results.surgePressure} unit="bar" subtitle="Tăng thêm (dH)" colorClass="bg-amber-50 border-amber-200 text-amber-900" />
              <ResultCard 
                title="Tổng áp lực" 
                value={results.totalPressure} 
                unit="bar" 
                subtitle="Max pressure" 
                colorClass={results.status === 'safe' ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}
              />
            </div>

            {/* Analysis Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Phân tích hệ thống</h2>
                  <p className="text-sm text-slate-500 italic">So sánh áp lực thiết kế (PN) và áp lực vận hành thực tế</p>
                </div>
                {results.status === 'safe' ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-pulse">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-tight">Hệ thống an toàn</span>
                  </div>
                ) : (
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border",
                    results.status === 'warning' ? "text-amber-600 bg-amber-50 border-amber-100" : "text-rose-600 bg-rose-50 border-rose-100 shadow-[0_0_15px_-5px_red]"
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-tight">Cảnh báo rủi ro</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Chart */}
                  <div className="h-64 flex flex-col justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40, top: 20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, (dataMax: number) => Math.max(dataMax + 5, inputs.pn + 5)]} hide />
                        <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                        <ReferenceLine x={parseFloat(results.operatingPn)} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: `PN sau suy giảm (${results.operatingPn})`, fill: '#10b981', fontSize: 10, fontWeight: 800, offset: 10 }} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-slate-400 mt-4 font-mono uppercase text-center">BIỂU ĐỒ SO SÁNH ÁP SUẤT (BAR)</p>
                  </div>

                  {/* Stats Card */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between shadow-xl">
                    <div>
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Áp suất xung kích cho phép (ngắn hạn)</h4>
                       <p className="text-4xl font-bold text-sky-400">{results.maxAllowableSurge}<span className="text-sm ml-1">bar</span></p>
                       <p className="text-[10px] text-sky-300 mt-1 font-medium pb-2">= {MATERIALS[inputs.material].surgeFactor} × PN Thực tế ({results.operatingPn})</p>
                       <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-[9px] text-slate-400 italic leading-relaxed">
                            Tham khảo Georg Fischer (GF): Xung kích ngắn hạn lên tới {MATERIALS[inputs.material].surgeFactor} × PN (sau suy giảm) được phép nếu xảy ra không thường xuyên. Tránh xung kích lặp lại trên mức PN.
                          </p>
                       </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10">
                       <p className="text-[11px] text-slate-300 font-bold">Tổng áp lực tác động thực tế:</p>
                       <p className={cn("text-3xl font-bold mt-1", results.status === 'danger' ? 'text-rose-500' : (results.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'))}>{results.totalPressure} bar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h3 className="font-bold text-slate-900 border-b pb-3 uppercase text-xs tracking-wider">Tư vấn kỹ thuật chuyên sâu</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <div className="flex gap-3">
                     <div className={cn("p-2 rounded-lg h-fit", parseFloat(results.velocity) > 2.0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
                       {parseFloat(results.velocity) > 2.0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                     </div>
                     <div>
                       <p className="text-xs font-bold uppercase tracking-tight">Vận tốc dòng chảy (TCVN 13606:2023)</p>
                       <p className="text-sm text-slate-600 mt-1">Hiện tại: <strong>{results.velocity} m/s</strong> (Tiêu chuẩn: ≤ 2.0 m/s).</p>
                       {parseFloat(results.velocity) > 2.0 ? (
                         <p className="text-sm text-rose-600 font-medium mt-1">
                           ⚠️ CẢNH BÁO: Vận tốc vượt giới hạn cho phép. Gây tăng ma sát và nguy cơ búa nước phá hủy hệ thống rất cao. Hãy tăng đường kính ống (DN)!
                         </p>
                       ) : (
                         <p className="text-sm text-emerald-600 font-medium mt-1">
                           ✅ Vận tốc lý tưởng, đảm bảo an toàn thủy lực.
                         </p>
                       )}
                     </div>
                   </div>

                   <div className="flex gap-3">
                     <div className="p-2 bg-green-100 rounded-lg text-green-600 h-fit"><Zap className="w-4 h-4" /></div>
                     <div>
                       <p className="text-xs font-bold uppercase tracking-tight">Vật liệu & Truyền sóng</p>
                       <p className="text-sm text-slate-600 mt-1">Sóng búa nước truyền đi với tốc độ <strong>{results.waveSpeed} m/s</strong>. Với nhựa {MATERIALS[inputs.material].name}, khả năng đàn hồi giúp giảm sốc tốt hơn các vật liệu cứng.</p>
                     </div>
                   </div>
                 </div>

                 <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                    <p className="text-sm font-bold text-slate-800 uppercase text-[10px]">Đánh giá khả năng chịu áp (PN Thực tế: {results.operatingPn} bar):</p>
                    {results.status === 'safe' ? (
                      <div className="text-sm text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                        ✅ <strong>An toàn:</strong> Tổng áp lực ({results.totalPressure} bar) nằm trong giới hạn PN thực tế. Hệ thống vận hành bền bỉ ở nhiệt độ {inputs.temperature}°C.
                      </div>
                    ) : results.status === 'warning' ? (
                      <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        ⚠️ <strong>Ngưỡng xung kích cho phép:</strong> Theo <i>GF Piping Systems</i>, áp suất {results.totalPressure} bar vượt PN thực tế nhưng vẫn nằm trong ngưỡng xung kích ngắn hạn cho phép (max {results.maxAllowableSurge} bar). 
                        Cần hạn chế tần suất đóng ngắt van đột ngột.
                      </div>
                    ) : (
                      <div className="text-sm text-rose-800 font-bold bg-rose-50 border border-rose-200 p-4 rounded-lg animate-pulse">
                        🚨 <strong>VƯỢT NGƯỠNG AN TOÀN:</strong> Áp suất vượt quá giới hạn an toàn vật liệu ({MATERIALS[inputs.material].surgeFactor}x PN thực tế). Nguy cơ mỏi vật liệu và nổ ống cực cao.
                      </div>
                    )}
                 </div>

                 {/* Cảnh báo Mỏi vật liệu (Fatigue) */}
                 <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <p className="text-sm font-bold text-slate-800 uppercase text-[10px] flex items-center justify-between">
                       Đánh giá độ bền mỏi (Fatigue / Life = 50 năm):
                       <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider">{results.totalCycles} chu kỳ</span>
                    </p>
                    
                    {results.isFatigueSafe ? (
                      <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                        ✅ <strong>An toàn mỏi:</strong> Biên độ áp suất xung kích ({results.surgePressure} bar) thấp hơn giới hạn mỏi cho phép ({results.maxFatigueAmplitude} bar). 
                        Cực kỳ an toàn cho vận hành dài hạn.
                      </div>
                    ) : (
                      <div className="text-sm text-rose-800 font-bold bg-rose-50 border border-rose-200 p-4 rounded-lg">
                        ⚠️ <strong>Nguy cơ mỏi vật liệu:</strong> Biên độ áp suất ({results.surgePressure} bar) &gt; giới hạn mỏi ({results.maxFatigueAmplitude} bar). 
                        Với hệ số mỏi ({results.fatigueFactor}), hệ thống có khả năng bị nứt, vỡ ống sớm hơn tuổi thọ thiết kế do dao động áp suất liên tục.
                      </div>
                    )}
                 </div>
               </div>
            </div>

            {/* Technical Documentation Section (Collapsible) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button 
                onClick={() => setShowDoc(!showDoc)}
                className="w-full p-6 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Tài liệu & Công thức tính toán</h2>
                    <p className="text-xs text-slate-500">Xem chi tiết phương pháp luận và tiêu chuẩn áp dụng</p>
                  </div>
                </div>
                <div className={cn("transition-transform duration-300", showDoc ? "rotate-180" : "")}>
                  <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                </div>
              </button>
              
              <AnimatePresence>
                {showDoc && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-8 pb-8 space-y-8 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-0 pt-6">
                      {/* Section 1: Basic Flow */}
                      <section className="space-y-3">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          1. Vận tốc dòng chảy (Flow Velocity)
                        </h3>
                        <p>Vận tốc dòng chảy được tính dựa trên lưu lượng và diện tích mặt cắt ngang của ống:</p>
                        <div className="bg-slate-50 p-4 rounded-xl font-mono text-blue-700 text-center border border-slate-100 relative group">
                          <span className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold">FORMULA</span>
                          v = Q / (3600 × A)
                        </div>
                        <p className="text-xs">
                          Trong đó: <b>A = π × (DN/2000)²</b> (m²). <br/>
                          Vận tốc lý tưởng khuyến cáo: <b>1.5-2 m/s</b>.
                        </p>
                      </section>

                      {/* Section 2: Wave Speed */}
                      <section className="space-y-3">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          2. Vận tốc truyền sóng áp suất (Wave Speed)
                        </h3>
                        <p>Tốc độ lan truyền của xung lực Water Hammer trong môi trường lỏng:</p>
                        <div className="bg-slate-50 p-4 rounded-xl font-mono text-blue-700 text-center border border-slate-100 relative group">
                          <span className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold">ALLIEVI</span>
                          a = sqrt(K/ρ) / sqrt(1 + (K/E) × (D/e))
                        </div>
                        <ul className="text-xs space-y-2 list-none">
                          <li className="flex gap-2"><b>K:</b><span>Mô-đun nén của nước (≈ 2.2 × 10⁹ Pa).</span></li>
                          <li className="flex gap-2"><b>E:</b><span>Mô-đun đàn hồi của vật liệu ống (Pa).</span></li>
                          <li className="flex gap-2"><b>D/e:</b><span>Tỷ lệ đường kính trên độ dày thành ống (SDR).</span></li>
                          <li className="flex gap-2"><b>ρ:</b><span>Khối lượng riêng của nước (1000 kg/m³).</span></li>
                        </ul>
                      </section>

                      {/* Section 3: Surge Pressure */}
                      <section className="space-y-4">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          3. Tính toán áp suất Water Hammer (Surge Pressure)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 border border-blue-100 rounded-xl bg-blue-50/30">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                              <Zap className="w-3 h-3" /> Đóng van Tức thời (T ≤ Tc)
                            </h4>
                            <p className="text-[11px] mb-3 italic">Công thức Joukowsky (Giá trị cực đại):</p>
                            <div className="font-mono text-blue-700 font-bold mb-2 text-center bg-white py-2 rounded border border-blue-100 shadow-sm">
                              ΔH = (a × v) / g
                            </div>
                            <p className="text-[10px] leading-relaxed text-slate-500">Áp dụng khi thời gian đóng van nhỏ hơn thời gian sóng đi và về (Tc = 2L/a).</p>
                          </div>

                          <div className="p-4 border border-amber-100 rounded-xl bg-amber-50/30">
                            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                              <Activity className="w-3 h-3" /> Đóng van Chậm (T {'>'} Tc)
                            </h4>
                            <p className="text-[11px] mb-3 italic">Công thức Michaud:</p>
                            <div className="font-mono text-amber-700 font-bold mb-2 text-center bg-white py-2 rounded border border-amber-100 shadow-sm">
                              ΔH = (2 × L × v) / (g × T)
                            </div>
                            <p className="text-[10px] leading-relaxed text-slate-500">Áp suất Water Hammer giảm dần khi thời gian đóng van (T) kéo dài.</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Đổi đơn vị áp suất</p>
                          <p className="text-xs font-mono text-slate-700 mt-1">P (bar) = (H_operating + ΔH) / 10.2</p>
                          <p className="text-[9px] text-slate-400 italic mt-1">(1 bar ≈ 10.2 mét cột nước)</p>
                        </div>
                      </section>

                      {/* Section 4: Safety Standards */}
                      <section className="space-y-3 pt-4 border-t border-slate-100">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          4. Suy giảm áp suất theo nhiệt độ (Temperature Derating)
                        </h3>
                        <p>Theo tiêu chuẩn quốc tế (ISO, DIN) và tài liệu của <b>Nhựa Tiền Phong</b>:</p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed mb-3">
                          Khả năng chịu áp lực của các loại ống nhựa (PVC-U, HDPE, PP-R) phụ thuộc rất lớn vào nhiệt độ lưu chất lưu thông. Ở nhiệt độ từ 20°C - 25°C, hệ thống đạt 100% cấp áp lực danh nghĩa (PN). Khi nhiệt độ tăng, khả năng chịu áp sẽ suy giảm:
                        </div>
                        <ul className="text-xs space-y-2 list-none mb-3">
                          <li className="flex gap-2 text-slate-600"><b>PVC-U:</b> Suy giảm áp suất bắt đầu từ &gt; 25°C. Ở 40°C, áp suất làm việc chỉ còn ~60% PN.</li>
                          <li className="flex gap-2 text-slate-600"><b>HDPE:</b> Bắt đầu suy giảm từ &gt; 20°C. Ở 40°C, áp suất làm việc còn ~74% PN.</li>
                          <li className="flex gap-2 text-slate-600"><b>PP-R:</b> Chịu nhiệt độ cao tốt hơn (áp dụng cho đường ống nóng lạnh). Tuy nhiên vẫn bị suy giảm khi lên đến 50 - 60°C.</li>
                        </ul>
                        <p className="text-xs text-blue-700 italic font-medium bg-blue-50 p-2 rounded border border-blue-100">
                          Hệ số suy giảm trong hệ thống này: {results.deratingFactor} × PN (với PN = {inputs.pn} bar) = <strong>PN Thực tế {results.operatingPn} bar</strong>.
                        </p>

                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mt-6">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          5. Tiêu chuẩn áp suất xung kích & Mỏi vật liệu
                        </h3>
                        <p>Theo tài liệu kỹ thuật của <b>Georg Fischer (GF)</b> và <b>Tiêu chuẩn nhựa ISO/DIN</b>:</p>
                        <blockquote className="border-l-4 border-amber-200 pl-4 py-2 italic text-slate-500 text-xs bg-slate-50 rounded-r-lg">
                          "Short-term pressure surges up to <b>1.3–1.5 × PN</b> are permissible provided they are infrequent. Repeated surges above PN must be avoided to prevent material fatigue."
                        </blockquote>
                        <p className="text-xs mt-2 text-slate-600">
                          Phần mềm này áp dụng hệ số <b>{MATERIALS[inputs.material].surgeFactor}x PN Thực tế</b> làm giới hạn vật lý xung kích <b>ngắn hạn</b> (infrequent).
                        </p>
                        <p className="text-xs mt-2 text-slate-600 mb-4">
                          Tuy nhiên, nếu tần suất dao động áp suất liên tục (đóng/bơm xảy ra thường xuyên), đặc tính cơ học của vật liệu polymer (PVC, HDPE, PP-R) sẽ bị suy giảm theo thời gian, gọi là hiện tượng <b>mỏi vật liệu (Fatigue)</b>. Khi đó, biên độ xung kích ($\Delta P$) phải được giới hạn chặt chẽ (hoặc sử dụng hệ số giảm xóc mỏi $f_f \le 1.0$) để đảm bảo tuổi thọ thiết kế 50 năm.
                        </p>

                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mt-6">
                          <Activity className="w-5 h-5 text-blue-500" />
                          6. Tính toán mỏi vật liệu (Fatigue Calculation)
                        </h3>
                        <p className="mb-2">Số chu kỳ hoạt động (Cycles) trong tuổi thọ thiết kế 50 năm:</p>
                        <div className="bg-slate-50 p-4 rounded-xl font-mono text-blue-700 text-center border border-slate-100 relative group mb-4">
                          <span className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold">CYCLES</span>
                          N = N_day × 365 × 50
                        </div>
                        <ul className="text-xs space-y-2 list-none mb-3">
                          <li className="flex gap-2 text-slate-600"><b>N_day:</b> Tần suất đóng/mở van hoặc số lần bơm chạy trong 1 ngày.</li>
                          <li className="flex gap-2 text-slate-600"><b>N:</b> Tổng số chu kỳ trong 50 năm.</li>
                        </ul>
                        <p className="text-xs mb-2">Dựa trên tổng chu kỳ $N$, xác định hệ số mỏi $f_f$ (tham khảo tiêu chuẩn thiết kế ống nhựa):</p>
                        <div className="overflow-hidden rounded-lg border border-slate-200 mb-3 text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                              <tr>
                                <th className="py-2 px-3">Tổng số chu kỳ (N)</th>
                                <th className="py-2 px-3 text-center">Hệ số mỏi (f_f)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                              <tr><td className="py-2 px-3">N ≤ 10^5</td><td className="py-2 px-3 text-center">1.0</td></tr>
                              <tr><td className="py-2 px-3">10^5 &lt; N ≤ 5×10^5</td><td className="py-2 px-3 text-center">0.9</td></tr>
                              <tr><td className="py-2 px-3">5×10^5 &lt; N ≤ 10^6</td><td className="py-2 px-3 text-center">0.8</td></tr>
                              <tr><td className="py-2 px-3">10^6 &lt; N ≤ 5×10^6</td><td className="py-2 px-3 text-center">0.7</td></tr>
                              <tr><td className="py-2 px-3">5×10^6 &lt; N ≤ 10^7</td><td className="py-2 px-3 text-center">0.6</td></tr>
                              <tr><td className="py-2 px-3">N &gt; 10^7</td><td className="py-2 px-3 text-center">0.5</td></tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs pb-2 mt-2">Biên độ áp suất xung kích lớn nhất cho phép để đảm bảo bền mỏi:</p>
                        <div className="bg-slate-50 p-4 rounded-xl font-mono text-blue-700 text-center border border-slate-100 relative group">
                          <span className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold">FATIGUE_MAX</span>
                          P_surge_max = PN_thựctế × f_f
                        </div>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Thời gian tới hạn</p>
                   <p className="text-xl font-bold text-blue-600">{results.criticalTime} giây</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-400 font-mono">2L / a</p>
                   <p className="text-[11px] font-medium text-slate-500">Dưới mức này là đóng van tức thời</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại Water Hammer</p>
                   <p className={cn("text-xl font-bold", results.isInstant ? "text-rose-500" : "text-amber-500")}>
                      {results.isInstant ? "Đóng Tức Thời" : "Đóng Chậm"}
                   </p>
                   <p className="text-[10px] font-bold text-slate-400">Công thức: {results.formulaUsed}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-400 font-mono">{inputs.closureTime}s vs {results.criticalTime}s</p>
                   <p className="text-[11px] font-medium text-slate-500">{results.isInstant ? "Áp suất không phụ thuộc L" : "Áp suất tỉ lệ thuận với L"}</p>
                </div>
              </div>
            </div>

          </main>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center space-y-2 pb-8">
           <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Hỗ trợ kỹ thuật: 24/7 Thủy Lực Học</p>
           <p className="text-slate-300 text-[10px]">© 2026 Engineering Calculator. Tất cả kết quả mang tính chất tham khảo kỹ thuật.</p>
        </footer>
      </div>
    </div>
  );
}
