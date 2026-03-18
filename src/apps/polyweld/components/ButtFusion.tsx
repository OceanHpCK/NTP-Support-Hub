import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Settings, Info, Activity, Thermometer, ArrowLeft } from 'lucide-react';
import { ButtFusionParams, ButtFusionResult } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  ComposedChart,
  LabelList
} from 'recharts';

// Data Mappings
const SDR_VALUES = [6, 7.4, 9, 11, 13.6, 17, 21, 26, 33, 41];

// PN Mapping based on ISO 4427 / DIN 8074 / DVS 2207-11
// Approximate mapping for standard usage
const PN_MAP: Record<string, Record<number, number>> = {
  'PE100': {
    25: 7.4,
    20: 9,
    16: 11,
    12.5: 13.6,
    10: 17,
    8: 21,
    6: 26
  },
  'PE80': {
    20: 7.4,
    16: 9,
    12.5: 11,
    10: 13.6,
    8: 17,
    6: 21,
    4: 33
  },
  'PP-R': {
    20: 6,
    16: 7.4,
    12.5: 9,
    10: 11
  }
};

const ButtFusion: React.FC = () => {
  // UI State
  const [inputMode, setInputMode] = useState<'SDR' | 'PN'>('SDR');
  const [material, setMaterial] = useState<'PE100' | 'PE80' | 'PP-R'>('PE100');
  const [selectedPN, setSelectedPN] = useState<number>(16);

  // Calculation Params
  const [params, setParams] = useState<ButtFusionParams>({
    pipeDiameter: 200,
    sdr: 11,
    dragPressure: 0, // Default changed to 0
    machineCylinderArea: 10,
  });

  const [result, setResult] = useState<ButtFusionResult | null>(null);

  // Sync PN selection to SDR
  useEffect(() => {
    if (inputMode === 'PN') {
      const map = PN_MAP[material];
      const newSDR = map[selectedPN];
      if (newSDR) {
        setParams(prev => ({ ...prev, sdr: newSDR }));
      } else {
        // Fallback if PN not found in map (switch material)
        const possiblePNs = Object.keys(map).map(Number).sort((a,b) => b-a);
        if (possiblePNs.length > 0) {
            setSelectedPN(possiblePNs[0]);
            setParams(prev => ({ ...prev, sdr: map[possiblePNs[0]] }));
        }
      }
    }
  }, [inputMode, material, selectedPN]);

  const calculateParams = () => {
    const outerDiameter = params.pipeDiameter;
    const thickness = outerDiameter / params.sdr;
    const innerDiameter = outerDiameter - 2 * thickness;
    
    // Annular Area (cm2)
    const areaWelding = (Math.PI * (Math.pow(outerDiameter/10, 2) - Math.pow(innerDiameter/10, 2))) / 4;

    // Interfacial Pressure
    const interfacialPressure = material === 'PP-R' ? 1.0 : 1.5; // bar (0.10 N/mm2 for PP-R, 0.15 N/mm2 for PE)

    // Theoretical Pressure
    const pressureTheory = (areaWelding * interfacialPressure) / params.machineCylinderArea;

    // Total Gauge Pressure
    const gaugePressure = params.dragPressure + pressureTheory;

    // Times & Heights
    let heatSoakTime = 0;
    let coolingTime = 0;
    let beadHeight = 0;
    let changeOver = 0;
    let heatSoakPressure = params.dragPressure;

    if (material === 'PP-R') {
      // DVS 2207-11 for PP-R
      heatSoakTime = Math.ceil(thickness * 14 + 60); // Approx heating time
      coolingTime = Math.ceil(thickness * 1.2 + 10); // Approx cooling time in minutes
      
      if (thickness <= 3) beadHeight = 0.5;
      else if (thickness <= 10) beadHeight = 1.0;
      else if (thickness <= 20) beadHeight = 1.5;
      else beadHeight = 2.0;

      if (thickness <= 4.5) changeOver = 4;
      else if (thickness <= 7) changeOver = 5;
      else if (thickness <= 12) changeOver = 6;
      else if (thickness <= 19) changeOver = 8;
      else if (thickness <= 26) changeOver = 10;
      else if (thickness <= 37) changeOver = 12;
      else changeOver = 16;

      // Heat soak pressure for PP-R is <= 0.01 N/mm2 (0.1 bar) + drag pressure
      heatSoakPressure = params.dragPressure + 0.1;
    } else {
      // ISO 21307 / DVS 2207-1 for PE
      heatSoakTime = Math.ceil(thickness * 12); 
      coolingTime = Math.ceil(thickness * 1.5); 
      beadHeight = 0.5 + 0.1 * thickness;
      if (outerDiameter <= 200) changeOver = 10;
      else changeOver = 20;
    }

    setResult({
      beadUpPressure: Number(gaugePressure.toFixed(1)),
      heatSoakPressure: Number(heatSoakPressure.toFixed(1)),
      heatSoakTime: heatSoakTime,
      changeOverTime: changeOver,
      fusingPressure: Number(gaugePressure.toFixed(1)),
      coolingTime: coolingTime,
      beadHeight: Number(beadHeight.toFixed(1))
    });
  };

  useEffect(() => {
    calculateParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, material]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: Number(value) }));
  };

  // Generate Graph Data (Schematic matching the user image)
  const chartData = useMemo(() => {
    if (!result) return [];
    
    const p1 = result.beadUpPressure;
    // Ensure p2 is visually distinct from 0 (t3) in the chart
    const p2Visual = Math.max(result.heatSoakPressure, p1 * 0.15); 
    const p3 = result.fusingPressure;

    // Schematic X coordinates (not to scale of seconds, but to scale of visual representation)
    // 0 -> Start
    // 1 -> End of ramp up to P1
    // 4 -> End of t1 (Bead Up)
    // 4.01 -> Drop to P2
    // 10 -> End of t2 (Heat Soak)
    // 10.01 -> Drop to 0
    // 11.5 -> End of t3 (Change Over)
    // 13 -> End of t4 (Ramp Up)
    // 21 -> End of t5 (Cooling)
    // 21.01 -> Drop to 0
    // 24 -> End of t6
    
    return [
      { x: 0, pVisual: 0, pActual: 0, label: '' },
      { x: 0.5, pVisual: p1, pActual: p1, label: 'p1' },         // Rise to P1
      { x: 3.5, pVisual: p1, pActual: p1, label: '' },           // Hold P1 (t1)
      { x: 3.6, pVisual: p2Visual, pActual: result.heatSoakPressure, label: 'p2' }, // Drop to P2
      { x: 9.6, pVisual: p2Visual, pActual: result.heatSoakPressure, label: '' },   // Hold P2 (t2)
      { x: 9.7, pVisual: 0, pActual: 0, label: '' },            // Drop to 0 for t3
      { x: 11, pVisual: 0, pActual: 0, label: '' },             // Hold 0 (t3 - Changeover)
      { x: 12.5, pVisual: p3, pActual: p3, label: 'p3' },        // Linear Rise to P3 (t4)
      { x: 20.5, pVisual: p3, pActual: p3, label: '' },          // Hold P3 (t5 - Cooling)
      { x: 20.6, pVisual: 0, pActual: 0, label: '' },           // Drop to 0
      { x: 24, pVisual: 0, pActual: 0, label: '' },             // End (t6)
    ];
  }, [result]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 animate-fade-in">
       <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Hàn Mặt Đầu (Butt Fusion)</h2>
        <p className="text-slate-600">Tiêu chuẩn ISO 21307 (PE) & DVS 2207-11 (PP-R)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: INPUT PANEL */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-6 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <Settings className="text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Thông số đầu vào</h3>
          </div>

          <div className="space-y-5">
            {/* Input Mode Toggles */}
            <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
              <button 
                onClick={() => setInputMode('SDR')}
                className={`flex-1 py-2 rounded-md transition ${inputMode === 'SDR' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Theo SDR
              </button>
              <button 
                onClick={() => setInputMode('PN')}
                className={`flex-1 py-2 rounded-md transition ${inputMode === 'PN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Theo PN (Áp lực)
              </button>
            </div>

            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vật liệu ống</label>
              <div className="flex gap-2">
                {['PE100', 'PE80', 'PP-R'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMaterial(m as any)}
                    className={`flex-1 py-2 px-3 border rounded text-sm font-medium transition ${
                      material === m 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đường kính ống (OD) - mm</label>
              <input 
                type="number" name="pipeDiameter" value={params.pipeDiameter} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-lg"
              />
            </div>

            {/* Dynamic SDR/PN Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {inputMode === 'SDR' ? 'Chỉ số SDR' : `Chỉ số PN (bar) - ${material}`}
              </label>
              
              {inputMode === 'SDR' ? (
                <div className="grid grid-cols-4 gap-2">
                  {SDR_VALUES.map(val => (
                    <button 
                      key={val}
                      onClick={() => setParams(p => ({...p, sdr: val}))}
                      className={`px-2 py-2 text-sm rounded border transition ${
                        params.sdr === val 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              ) : (
                <select 
                  value={selectedPN}
                  onChange={(e) => setSelectedPN(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                >
                  {Object.keys(PN_MAP[material]).map(Number).sort((a,b) => b-a).map((pn) => (
                    <option key={pn} value={pn}>PN {pn} (SDR {PN_MAP[material][pn]})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  P<sub>cản</sub> (drag) - bar
                </label>
                <input 
                  type="number" name="dragPressure" value={params.dragPressure} onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  S<sub>xy-lanh</sub> - cm²
                </label>
                <input 
                  type="number" name="machineCylinderArea" value={params.machineCylinderArea} onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button 
              onClick={calculateParams}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 font-bold shadow-md active:transform active:scale-95"
            >
              <Calculator size={20} /> Tính Toán Ngay
            </button>
          </div>
        </div>

        {/* RIGHT: RESULTS & GRAPH */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Graph Section */}
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Activity className="text-blue-600" /> Biểu Đồ Chu Trình Hàn
                </h3>
                <span className="text-xs text-slate-500 italic">Mô phỏng áp suất theo thời gian</span>
             </div>
             
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="x" 
                      type="number" 
                      domain={[0, 'dataMax']} 
                      tick={false} 
                      axisLine={{ stroke: '#94a3b8' }}
                    />
                    <YAxis 
                      label={{ value: 'Áp suất (bar)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          if (!data.label && data.pActual === 0) return null; // Don't show tooltip for 0 baseline mostly
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-xs">
                              <p>Áp suất: <span className="text-blue-300 font-bold">{data.pActual} bar</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Main Area with Linear shape (ramps included) */}
                    <Area 
                      type="linear" 
                      dataKey="pVisual" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorPressure)" 
                      animationDuration={1500}
                    >
                      <LabelList dataKey="label" position="top" offset={10} fill="#1e293b" fontSize={12} fontWeight="bold" />
                    </Area>
                    
                    {/* Time Phase Annotations */}
                    <ReferenceLine x={2} stroke="none" label={{ value: 't1', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                    <ReferenceLine x={6.5} stroke="none" label={{ value: 't2', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                    <ReferenceLine x={10.3} stroke="none" label={{ value: 't3', position: 'insideBottom', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine x={11.7} stroke="none" label={{ value: 't4', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                    <ReferenceLine x={16.5} stroke="none" label={{ value: 't5', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                    <ReferenceLine x={22.5} stroke="none" label={{ value: 't6', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />

                    {/* Phase Dividers */}
                    <ReferenceLine x={4.01} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceLine x={9.7} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceLine x={11} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceLine x={12.5} stroke="#94a3b8" strokeDasharray="3 3" />
                    <ReferenceLine x={20.6} stroke="#94a3b8" strokeDasharray="3 3" />

                  </ComposedChart>
                </ResponsiveContainer>
             </div>
             
             <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs text-center text-slate-500 border-t pt-2">
                <div><strong>t1:</strong> Tạo gờ<br/>(Bead up)</div>
                <div><strong>t2:</strong> Gia nhiệt<br/>(Heat soak)</div>
                <div><strong>t3:</strong> Chuyển đổi<br/>(Change over)</div>
                <div><strong>t4:</strong> Tăng áp<br/>(Ramp up)</div>
                <div><strong>t5:</strong> Làm nguội<br/>(Cooling)</div>
                <div><strong>t6:</strong> Kết thúc</div>
             </div>
          </div>

          {/* 2. Results Cards */}
          {result && (
            <div className="bg-slate-900 text-white rounded-xl shadow-xl overflow-hidden">
               <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Info className="text-blue-400" /> Kết Quả Tính Toán
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded border border-blue-800">SDR {params.sdr}</span>
                    <span className="bg-emerald-900/50 text-emerald-200 px-2 py-1 rounded border border-emerald-800">T = {(params.pipeDiameter / params.sdr).toFixed(1)}mm</span>
                  </div>
               </div>
               
               <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">P<sub>1</sub>, P<sub>3</sub> (Hàn)</p>
                    <p className="text-3xl font-bold text-blue-400">{result.fusingPressure}</p>
                    <p className="text-xs text-slate-500">bar</p>
                  </div>
                  <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">P<sub>2</sub> (Gia nhiệt)</p>
                    <p className="text-3xl font-bold text-amber-400">{result.heatSoakPressure}</p>
                    <p className="text-xs text-slate-500">bar (= P<sub>cản</sub>)</p>
                  </div>
                   <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">t<sub>2</sub> (Gia nhiệt)</p>
                    <p className="text-3xl font-bold text-amber-400">{result.heatSoakTime}</p>
                    <p className="text-xs text-slate-500">giây</p>
                  </div>
                   <div className="space-y-1 bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">t<sub>5</sub> (Làm nguội)</p>
                    <p className="text-3xl font-bold text-emerald-400">{result.coolingTime}</p>
                    <p className="text-xs text-slate-500">phút</p>
                  </div>
                  <div className="space-y-1 bg-blue-900/30 p-3 rounded-lg border border-blue-500/20">
                    <p className="text-blue-300 text-xs uppercase tracking-wider flex items-center gap-1">
                      <Thermometer size={12} /> Nhiệt độ hàn
                    </p>
                    <p className="text-2xl font-bold text-white">200 - 230 °C</p>
                    <p className="text-[10px] text-blue-200/70">Tối ưu: 210 - 220 °C</p>
                  </div>
               </div>
            </div>
          )}

          {/* 3. Detailed Process Text */}
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Chi tiết các bước thực hiện</h3>
            <div className="space-y-6 relative border-l-2 border-slate-200 ml-3 pl-8 pb-2">
              {[
                { title: 't1. Tạo gờ (Bead-up)', desc: `Tăng áp suất lên P1 = ${result?.beadUpPressure} bar. Đợi đến khi gờ tiếp xúc đạt ${result?.beadHeight}mm.`, icon: 'params' },
                { title: 't2. Gia nhiệt (Heat Soak)', desc: `Giảm nhanh áp suất về P2 = P_cản = ${params.dragPressure} bar. Duy trì ${result?.heatSoakTime} giây.`, icon: 'clock' },
                { title: 't3. Chuyển đổi (Change-over)', desc: `Tách đĩa nhiệt tối đa ${result?.changeOverTime}s.`, icon: 'action' },
                { title: 't4. Tăng áp (Ramp-up)', desc: `Tăng áp đều từ 0 lên P3 = ${result?.fusingPressure} bar.`, icon: 'pressure' },
                { title: 't5. Làm nguội (Cooling)', desc: `Giữ nguyên áp suất P3 = ${result?.fusingPressure} bar trong ${result?.coolingTime} phút.`, icon: 'cool' },
              ].map((step, idx) => (
                <div key={idx} className="relative group">
                  <span className="absolute -left-[41px] top-0 bg-white text-slate-400 group-hover:text-blue-600 group-hover:border-blue-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-slate-200 shadow-sm">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-slate-800 text-md group-hover:text-blue-700 transition-colors">{step.title}</h4>
                  <p className="text-slate-600 text-sm mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ButtFusion;