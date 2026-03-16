import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Droplets, Wind, Thermometer, Info, Shield, ArrowRight, Settings2, BookOpen, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { cn } from './lib/utils';

// --- Types & Constants ---
type PipeMaterial = 'HDPE' | 'PPR';
type InsulationMaterial = 'PU' | 'GlassWool' | 'Rubber';

const K_VALUES = {
  HDPE: 0.4,
  PPR: 0.24,
  PU: 0.025,
  GlassWool: 0.035,
  Rubber: 0.036,
};

const MATERIAL_LABELS = {
  HDPE: 'Nhựa HDPE',
  PPR: 'Nhựa PP-R',
  PU: 'PU Foam (Polyurethane)',
  GlassWool: 'Bông thủy tinh (Glass Wool)',
  Rubber: 'Cao su lưu hóa (Nitrile Rubber)',
};

// --- Calculation Logic ---
function calculateHeatLoss(
  pipeMaterial: PipeMaterial,
  outerDiameter: number, // mm
  thickness: number, // mm
  length: number, // m
  fluidTemp: number, // °C
  flowRate: number, // m³/h
  ambientTemp: number, // °C
  windSpeed: number, // m/s
  hasInsulation: boolean,
  insulationMaterial: InsulationMaterial,
  insulationThickness: number, // mm
  kPipe: number,
  kIns: number,
  hIn: number,
  hOutBase: number,
  hOutMultiplier: number,
  Cp: number
) {
  const dOut = outerDiameter / 1000;
  const tPipe = thickness / 1000;
  const dIn = dOut - 2 * tPipe;

  if (dIn <= 0) return null;

  const R_in = 1 / (Math.PI * dIn * hIn);
  const R_pipe = Math.log(dOut / dIn) / (2 * Math.PI * kPipe);

  let R_ins = 0;
  let dOutermost = dOut;

  if (hasInsulation && insulationThickness > 0) {
    const tIns = insulationThickness / 1000;
    dOutermost = dOut + 2 * tIns;
    R_ins = Math.log(dOutermost / dOut) / (2 * Math.PI * kIns);
  }

  const hOut = hOutBase + hOutMultiplier * windSpeed; // W/(m²K)
  const R_out = 1 / (Math.PI * dOutermost * hOut);

  const R_total = R_in + R_pipe + R_ins + R_out;
  const deltaT = fluidTemp - ambientTemp;

  const qL = deltaT / R_total; // W/m

  // Calculate bare pipe for comparison
  const R_out_bare = 1 / (Math.PI * dOut * hOut);
  const R_total_bare = R_in + R_pipe + R_out_bare;
  const qL_bare = deltaT / R_total_bare;

  let tempDrop = 0;
  let tOut = fluidTemp;
  let tOut_bare = fluidTemp;
  let Q_total = qL * length;
  let Q_total_bare = qL_bare * length;

  const profileData = [];
  const steps = 20;

  if (flowRate > 0) {
    const massFlow = (flowRate * 1000) / 3600; // kg/s
    
    tOut = ambientTemp + (fluidTemp - ambientTemp) * Math.exp(-length / (massFlow * Cp * R_total));
    tOut_bare = ambientTemp + (fluidTemp - ambientTemp) * Math.exp(-length / (massFlow * Cp * R_total_bare));
    
    tempDrop = fluidTemp - tOut;
    
    Q_total = massFlow * Cp * (fluidTemp - tOut);
    Q_total_bare = massFlow * Cp * (fluidTemp - tOut_bare);

    for (let i = 0; i <= steps; i++) {
      const x = (length * i) / steps;
      const t_x = ambientTemp + (fluidTemp - ambientTemp) * Math.exp(-x / (massFlow * Cp * R_total));
      const t_x_bare = ambientTemp + (fluidTemp - ambientTemp) * Math.exp(-x / (massFlow * Cp * R_total_bare));
      profileData.push({
        distance: x,
        insulatedTemp: t_x,
        bareTemp: t_x_bare
      });
    }
  } else {
    for (let i = 0; i <= steps; i++) {
      const x = (length * i) / steps;
      profileData.push({
        distance: x,
        insulatedTemp: ambientTemp,
        bareTemp: ambientTemp
      });
    }
  }

  const efficiency = hasInsulation
    ? ((qL_bare - qL) / qL_bare) * 100
    : 0;

  return {
    qL,
    Q_total,
    tempDrop,
    tOut,
    qL_bare,
    Q_total_bare,
    efficiency,
    profileData
  };
}

// --- Components ---
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden", className)}>
    {children}
  </div>
);

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={cn("block text-sm font-medium text-slate-700 mb-1.5", className)}>
    {children}
  </label>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none",
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export default function App() {
  // State
  const [pipeMaterial, setPipeMaterial] = useState<PipeMaterial>('HDPE');
  const [outerDiameter, setOuterDiameter] = useState<number>(110);
  const [thickness, setThickness] = useState<number>(10);
  const [length, setLength] = useState<number>(100);

  const [fluidTemp, setFluidTemp] = useState<number>(60);
  const [flowRate, setFlowRate] = useState<number>(10);

  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [windSpeed, setWindSpeed] = useState<number>(2);

  const [hasInsulation, setHasInsulation] = useState<boolean>(true);
  const [insulationMaterial, setInsulationMaterial] = useState<InsulationMaterial>('PU');
  const [insulationThickness, setInsulationThickness] = useState<number>(30);

  // Advanced Coefficients State
  const [useCustomCoefficients, setUseCustomCoefficients] = useState<boolean>(false);
  const [kPipe, setKPipe] = useState<number>(K_VALUES.HDPE);
  const [kIns, setKIns] = useState<number>(K_VALUES.PU);
  const [hIn, setHIn] = useState<number>(1000);
  const [hOutBase, setHOutBase] = useState<number>(10);
  const [hOutMultiplier, setHOutMultiplier] = useState<number>(4);
  const [cpWater, setCpWater] = useState<number>(4184);

  // Sync coefficients when material changes
  useEffect(() => {
    setKPipe(K_VALUES[pipeMaterial]);
  }, [pipeMaterial]);

  useEffect(() => {
    setKIns(K_VALUES[insulationMaterial]);
  }, [insulationMaterial]);

  const activeKPipe = useCustomCoefficients ? kPipe : K_VALUES[pipeMaterial];
  const activeKIns = useCustomCoefficients ? kIns : K_VALUES[insulationMaterial];
  const activeHIn = useCustomCoefficients ? hIn : 1000;
  const activeHOutBase = useCustomCoefficients ? hOutBase : 10;
  const activeHOutMultiplier = useCustomCoefficients ? hOutMultiplier : 4;
  const activeCpWater = useCustomCoefficients ? cpWater : 4184;

  // Calculations
  const results = useMemo(() => {
    return calculateHeatLoss(
      pipeMaterial,
      outerDiameter,
      thickness,
      length,
      fluidTemp,
      flowRate,
      ambientTemp,
      windSpeed,
      hasInsulation,
      insulationMaterial,
      insulationThickness,
      activeKPipe,
      activeKIns,
      activeHIn,
      activeHOutBase,
      activeHOutMultiplier,
      activeCpWater
    );
  }, [
    pipeMaterial, outerDiameter, thickness, length,
    fluidTemp, flowRate, ambientTemp, windSpeed,
    hasInsulation, insulationMaterial, insulationThickness,
    activeKPipe, activeKIns, activeHIn, activeHOutBase, activeHOutMultiplier, activeCpWater
  ]);

  // Chart Data (Varying Ambient Temp)
  const chartData = useMemo(() => {
    const data = [];
    for (let t = -10; t <= 40; t += 5) {
      const res = calculateHeatLoss(
        pipeMaterial, outerDiameter, thickness, length, fluidTemp, flowRate,
        t, windSpeed, hasInsulation, insulationMaterial, insulationThickness,
        activeKPipe, activeKIns, activeHIn, activeHOutBase, activeHOutMultiplier, activeCpWater
      );
      if (res) {
        data.push({
          ambientTemp: t,
          insulated: Math.max(0, res.qL),
          bare: Math.max(0, res.qL_bare),
        });
      }
    }
    return data;
  }, [
    pipeMaterial, outerDiameter, thickness, length, fluidTemp, flowRate,
    windSpeed, hasInsulation, insulationMaterial, insulationThickness,
    activeKPipe, activeKIns, activeHIn, activeHOutBase, activeHOutMultiplier, activeCpWater
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Tính toán tổn thất nhiệt</h1>
            <p className="text-xs text-slate-500">Đường ống nhựa HDPE & PP-R</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Pipe Params */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Droplets className="w-5 h-5" />
                <h2 className="font-semibold text-slate-900">Thông số đường ống</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Vật liệu ống</Label>
                  <Select value={pipeMaterial} onChange={(e) => setPipeMaterial(e.target.value as PipeMaterial)}>
                    <option value="HDPE">Nhựa HDPE</option>
                    <option value="PPR">Nhựa PP-R</option>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Đường kính ngoài (mm)</Label>
                    <Input type="number" value={outerDiameter} onChange={(e) => setOuterDiameter(Number(e.target.value))} min={10} />
                  </div>
                  <div>
                    <Label>Độ dày thành ống (mm)</Label>
                    <Input type="number" value={thickness} onChange={(e) => setThickness(Number(e.target.value))} min={1} />
                  </div>
                </div>
                
                <div>
                  <Label>Chiều dài tuyến ống (m)</Label>
                  <Input type="number" value={length} onChange={(e) => setLength(Number(e.target.value))} min={1} />
                </div>
              </div>
            </Card>

            {/* Fluid & Ambient Params */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 text-amber-500">
                <Thermometer className="w-5 h-5" />
                <h2 className="font-semibold text-slate-900">Môi chất & Môi trường</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nhiệt độ nước (°C)</Label>
                    <Input type="number" value={fluidTemp} onChange={(e) => setFluidTemp(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Lưu lượng (m³/h)</Label>
                    <Input type="number" value={flowRate} onChange={(e) => setFlowRate(Number(e.target.value))} min={0} />
                  </div>
                </div>

                {pipeMaterial === 'HDPE' && fluidTemp > 50 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start text-red-700 text-sm animate-in fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p><strong>Cảnh báo:</strong> Không nên sử dụng do các tài liệu đều đưa khuyến cáo nhiệt độ tối đa khi sử dụng với ống HDPE là 50°C.</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <Label>Nhiệt độ MT (°C)</Label>
                    <Input type="number" value={ambientTemp} onChange={(e) => setAmbientTemp(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Tốc độ gió (m/s)</Label>
                    <Input type="number" value={windSpeed} onChange={(e) => setWindSpeed(Number(e.target.value))} min={0} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Insulation Params */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Shield className="w-5 h-5" />
                  <h2 className="font-semibold text-slate-900">Bọc bảo ôn</h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={hasInsulation} onChange={(e) => setHasInsulation(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              
              {hasInsulation ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <Label>Vật liệu bảo ôn</Label>
                    <Select value={insulationMaterial} onChange={(e) => setInsulationMaterial(e.target.value as InsulationMaterial)}>
                      <option value="PU">PU Foam (Polyurethane)</option>
                      <option value="GlassWool">Bông thủy tinh</option>
                      <option value="Rubber">Cao su lưu hóa</option>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Độ dày bảo ôn (mm)</Label>
                    <Input type="number" value={insulationThickness} onChange={(e) => setInsulationThickness(Number(e.target.value))} min={1} />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic py-2">
                  Ống trần, không sử dụng lớp bọc cách nhiệt.
                </div>
              )}
            </Card>

            {/* Advanced Coefficients */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <Settings2 className="w-5 h-5" />
                  <h2 className="font-semibold text-slate-900">Hệ số tính toán</h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={useCustomCoefficients} onChange={(e) => setUseCustomCoefficients(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
              
              {useCustomCoefficients ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>k ống (W/mK)</Label>
                      <Input type="number" step="0.01" value={kPipe} onChange={(e) => setKPipe(Number(e.target.value))} />
                    </div>
                    {hasInsulation && (
                      <div>
                        <Label>k bảo ôn (W/mK)</Label>
                        <Input type="number" step="0.001" value={kIns} onChange={(e) => setKIns(Number(e.target.value))} />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>h_in (W/m²K)</Label>
                      <Input type="number" value={hIn} onChange={(e) => setHIn(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>C_p nước (J/kg.K)</Label>
                      <Input type="number" value={cpWater} onChange={(e) => setCpWater(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Label className="mb-2">Hệ số h_out = a + b × v</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Hệ số a</Label>
                        <Input type="number" value={hOutBase} onChange={(e) => setHOutBase(Number(e.target.value))} />
                      </div>
                      <div>
                        <Label>Hệ số b</Label>
                        <Input type="number" value={hOutMultiplier} onChange={(e) => setHOutMultiplier(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic py-2">
                  Đang sử dụng các hệ số mặc định theo tiêu chuẩn. Bật tùy chỉnh để thay đổi.
                </div>
              )}
            </Card>

          </div>

          {/* Right Column: Results & Charts */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Results Grid */}
            {results ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-500">
                  <div className="text-sm text-slate-500 mb-1">Tổn thất nhiệt (1m)</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.qL.toFixed(2)} <span className="text-sm font-normal text-slate-500">W/m</span>
                  </div>
                  {hasInsulation && (
                    <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Giảm {(results.qL_bare - results.qL).toFixed(1)} W/m so với ống trần
                    </div>
                  )}
                </Card>
                
                <Card className="p-5 border-l-4 border-l-indigo-500">
                  <div className="text-sm text-slate-500 mb-1">Tổng tổn thất nhiệt</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {(results.Q_total / 1000).toFixed(2)} <span className="text-sm font-normal text-slate-500">kW</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Trên toàn tuyến {length}m
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-500">
                  <div className="text-sm text-slate-500 mb-1">Nhiệt độ đầu ra</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.tOut.toFixed(3)} <span className="text-sm font-normal text-slate-500">°C</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Giảm {results.tempDrop.toFixed(3)}°C so với đầu vào
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-500">
                  <div className="text-sm text-slate-500 mb-1">Hiệu suất bảo ôn</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {results.efficiency.toFixed(1)} <span className="text-sm font-normal text-slate-500">%</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {hasInsulation ? 'Tiết kiệm năng lượng' : 'Không có bảo ôn'}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center text-red-500">
                Thông số đường kính và độ dày không hợp lệ (Đường kính trong ≤ 0).
              </Card>
            )}

            {/* Chart */}
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Biểu đồ tổn thất nhiệt theo nhiệt độ môi trường</h3>
                <p className="text-sm text-slate-500">So sánh tổn thất nhiệt trên 1m ống (W/m) giữa ống có bảo ôn và ống trần.</p>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="ambientTemp" 
                      tickFormatter={(val) => `${val}°C`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(2)} W/m`, '']}
                      labelFormatter={(label) => `Nhiệt độ MT: ${label}°C`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    {hasInsulation && (
                      <Line 
                        type="monotone" 
                        dataKey="insulated" 
                        name="Có bảo ôn" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="bare" 
                      name="Ống trần (Không bảo ôn)" 
                      stroke="#f43f5e" 
                      strokeWidth={hasInsulation ? 2 : 3}
                      strokeDasharray={hasInsulation ? "5 5" : ""}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Temperature Profile */}
            {results && results.profileData.length > 0 && (
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Biểu đồ nhiệt độ dọc theo tuyến ống</h3>
                  <p className="text-sm text-slate-500">Sự thay đổi nhiệt độ của nước từ đầu vào (0m) đến đầu ra ({length}m).</p>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.profileData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="distance" 
                        tickFormatter={(val) => `${val.toFixed(0)}m`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dx={-10}
                        tickFormatter={(val) => `${val.toFixed(1)}°C`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toFixed(2)} °C`, '']}
                        labelFormatter={(label) => `Khoảng cách: ${Number(label).toFixed(1)}m`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      {hasInsulation && (
                        <Line 
                          type="monotone" 
                          dataKey="insulatedTemp" 
                          name="Nhiệt độ (Có bảo ôn)" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="bareTemp" 
                        name="Nhiệt độ (Ống trần)" 
                        stroke="#94a3b8" 
                        strokeWidth={hasInsulation ? 2 : 3}
                        strokeDasharray={hasInsulation ? "5 5" : ""}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Documentation */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6 text-slate-800">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Tài liệu tham khảo & Phương pháp tính</h2>
              </div>
              
              <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">1. Phương pháp tính toán</h3>
                  <p>Tính toán tổn thất nhiệt được thực hiện dựa trên nguyên lý truyền nhiệt ổn định (steady-state heat transfer) qua vách trụ nhiều lớp, tham khảo theo tiêu chuẩn <strong>ISO 12241:2008</strong> (Thermal insulation for building equipment and industrial installations — Calculation rules).</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">2. Các công thức áp dụng</h3>
                  <ul className="list-disc pl-5 space-y-3">
                    <li>
                      <strong>Điện trở nhiệt đối lưu mặt trong:</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">R<sub>in</sub> = 1 / (π · d<sub>in</sub> · h<sub>in</sub>)</code>
                    </li>
                    <li>
                      <strong>Điện trở nhiệt dẫn qua thành ống:</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">R<sub>pipe</sub> = ln(d<sub>out</sub> / d<sub>in</sub>) / (2π · k<sub>pipe</sub>)</code>
                    </li>
                    <li>
                      <strong>Điện trở nhiệt dẫn qua lớp bảo ôn:</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">R<sub>ins</sub> = ln(d<sub>outermost</sub> / d<sub>out</sub>) / (2π · k<sub>ins</sub>)</code>
                    </li>
                    <li>
                      <strong>Điện trở nhiệt đối lưu mặt ngoài:</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">R<sub>out</sub> = 1 / (π · d<sub>outermost</sub> · h<sub>out</sub>)</code>
                    </li>
                    <li>
                      <strong>Tổng điện trở nhiệt (m·K/W):</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">R<sub>total</sub> = R<sub>in</sub> + R<sub>pipe</sub> + R<sub>ins</sub> + R<sub>out</sub></code>
                    </li>
                    <li>
                      <strong>Tổn thất nhiệt trên 1m ống (W/m):</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">q<sub>L</sub> = (T<sub>fluid</sub> - T<sub>ambient</sub>) / R<sub>total</sub></code>
                    </li>
                    <li>
                      <strong>Nhiệt độ nước tại khoảng cách x (m):</strong><br/>
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600">T(x) = T<sub>ambient</sub> + (T<sub>fluid</sub> - T<sub>ambient</sub>) · e<sup>-x / (ṁ · C<sub>p</sub> · R<sub>total</sub>)</sup></code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">3. Chú thích các đại lượng</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>d<sub>in</sub>, d<sub>out</sub>, d<sub>outermost</sub>:</strong> Đường kính trong, ngoài của ống và ngoài cùng của lớp bảo ôn (m).</li>
                    <li><strong>k<sub>pipe</sub>, k<sub>ins</sub>:</strong> Hệ số dẫn nhiệt của vật liệu ống và bảo ôn (W/m·K).</li>
                    <li><strong>h<sub>in</sub>, h<sub>out</sub>:</strong> Hệ số tỏa nhiệt đối lưu mặt trong và ngoài (W/m²·K). h<sub>out</sub> = a + b·v (với v là tốc độ gió).</li>
                    <li><strong>ṁ:</strong> Lưu lượng khối lượng của nước (kg/s).</li>
                    <li><strong>C<sub>p</sub>:</strong> Nhiệt dung riêng của nước (J/kg·K).</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">4. Bảng thông số vật liệu ống tham khảo</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="border-b border-r border-slate-200 p-3 font-semibold">Vật liệu</th>
                          <th className="border-b border-r border-slate-200 p-3 font-semibold">Hệ số dẫn nhiệt k (W/m·K)</th>
                          <th className="border-b border-r border-slate-200 p-3 font-semibold">Nhiệt độ tối đa (°C)</th>
                          <th className="border-b border-slate-200 p-3 font-semibold">Đặc điểm & Ứng dụng</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr>
                          <td className="border-b border-r border-slate-200 p-3 font-medium text-slate-900">Nhựa HDPE</td>
                          <td className="border-b border-r border-slate-200 p-3">0.40</td>
                          <td className="border-b border-r border-slate-200 p-3 text-red-600 font-medium">50°C</td>
                          <td className="border-b border-slate-200 p-3">Dẫn nhiệt tốt hơn PP-R. Phù hợp cấp nước lạnh, nước sinh hoạt ngoài trời.</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="border-r border-slate-200 p-3 font-medium text-slate-900">Nhựa PP-R</td>
                          <td className="border-r border-slate-200 p-3">0.24</td>
                          <td className="border-r border-slate-200 p-3 text-emerald-600 font-medium">95°C</td>
                          <td className="p-3">Cách nhiệt tốt hơn HDPE. Chuyên dụng cho cấp nước nóng, hệ thống sưởi.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
