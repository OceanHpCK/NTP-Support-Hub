import React, { useState, useEffect } from 'react';
import { 
  Calculator, Cylinder, Droplets, ShieldAlert, Info, Settings, 
  BookOpen, Wrench, ClipboardList, Layers, CheckCircle2, AlertTriangle,
  Disc
} from 'lucide-react';

// --- DATA: BS EN ISO 1452 (PVC-U pressure pipes) ---
const pvcStandards = [
  { od: 110, pns: [ {level: 6, e: 3.2}, {level: 8, e: 4.2}, {level: 10, e: 5.3}, {level: 12.5, e: 6.6}, {level: 16, e: 8.1}, {level: 25, e: 12.3} ] },
  { od: 125, pns: [ {level: 6, e: 3.7}, {level: 8, e: 4.8}, {level: 10, e: 6.0}, {level: 12.5, e: 7.4}, {level: 16, e: 9.2}, {level: 25, e: 14.0} ] },
  { od: 140, pns: [ {level: 6, e: 4.1}, {level: 8, e: 5.4}, {level: 10, e: 6.7}, {level: 12.5, e: 8.3}, {level: 16, e: 10.3}, {level: 25, e: 15.7} ] },
  { od: 160, pns: [ {level: 6, e: 4.7}, {level: 8, e: 6.2}, {level: 10, e: 7.7}, {level: 12.5, e: 9.5}, {level: 16, e: 11.8}, {level: 25, e: 17.9} ] },
  { od: 200, pns: [ {level: 6, e: 5.9}, {level: 8, e: 7.7}, {level: 10, e: 9.6}, {level: 12.5, e: 11.9}, {level: 16, e: 14.7} ] },
  { od: 225, pns: [ {level: 6, e: 6.6}, {level: 8, e: 8.6}, {level: 10, e: 10.8}, {level: 12.5, e: 13.4}, {level: 16, e: 16.6} ] },
  { od: 250, pns: [ {level: 6, e: 7.3}, {level: 8, e: 9.6}, {level: 10, e: 11.9}, {level: 12.5, e: 14.8}, {level: 16, e: 18.4} ] },
  { od: 280, pns: [ {level: 6, e: 8.2}, {level: 8, e: 10.7}, {level: 10, e: 13.4}, {level: 12.5, e: 16.6}, {level: 16, e: 20.6} ] },
  { od: 315, pns: [ {level: 6, e: 9.2}, {level: 8, e: 12.1}, {level: 10, e: 15.0}, {level: 12.5, e: 18.7}, {level: 16, e: 23.2} ] },
  { od: 355, pns: [ {level: 6, e: 10.4}, {level: 8, e: 13.6}, {level: 10, e: 16.9}, {level: 12.5, e: 21.1}, {level: 16, e: 26.1} ] },
  { od: 400, pns: [ {level: 6, e: 11.7}, {level: 8, e: 15.3}, {level: 10, e: 19.1}, {level: 12.5, e: 23.7} ] },
];

const drillBits = [
  { size: 114, label: "4 1/2 inch (114mm)" },
  { size: 143, label: "5 5/8 inch (143mm)" },
  { size: 159, label: "6 1/4 inch (159mm)" },
  { size: 200, label: "7 7/8 inch (200mm)" },
  { size: 216, label: "8 1/2 inch (216mm)" },
  { size: 244, label: "9 5/8 inch (244mm)" },
  { size: 270, label: "10 5/8 inch (270mm)" },
  { size: 311, label: "12 1/4 inch (311mm)" },
  { size: 349, label: "13 3/4 inch (349mm)" },
  { size: 375, label: "14 3/4 inch (375mm)" },
  { size: 445, label: "17 1/2 inch (445mm)" },
];

const soilGeologyConfigs = [
  { id: 'hard_rock', label: 'Đá cứng / Đá liền khối', sg: 1.05, fs: 1.5, type: 'stable', minClearance: 30, maxClearance: 100, desc: 'Chỉ chịu áp lực thủy tĩnh.' },
  { id: 'fractured_rock', label: 'Đá nứt nẻ / Cuội sỏi', sg: 1.20, fs: 2.0, type: 'stable', minClearance: 40, maxClearance: 100, desc: 'Nguy cơ sạt lở, kẹt ống.' },
  { id: 'sand_gravel', label: 'Cát / Cát pha', sg: 1.30, fs: 2.0, type: 'stable', minClearance: 40, maxClearance: 90, desc: 'Áp lực ngang trung bình.' },
  { id: 'clay_stiff', label: 'Sét cứng / Nửa cứng', sg: 1.50, fs: 2.0, type: 'stable', minClearance: 50, maxClearance: 100, desc: 'Có xu hướng trương nở nhẹ.' },
  { id: 'clay_soft', label: 'Sét nhão / Bùn yếu', sg: 1.90, fs: 2.5, type: 'soft', minClearance: 70, maxClearance: 120, desc: 'Áp lực nén ngang rất lớn, kẹp ống.' },
];

// Quy đổi cấp ống (level = PN theo σs=10 trong dữ liệu) sang SDR chuẩn và PN tham khảo theo
// EN ISO 1452 (σs = 12,5 MPa, C = 2,0). SDR không phụ thuộc hệ số thiết kế nên dùng làm nhãn chính.
const PN_SDR_MAP: Record<string, { sdr: number; pnRef: number }> = {
  '6': { sdr: 33, pnRef: 8 },
  '8': { sdr: 26, pnRef: 10 },
  '10': { sdr: 21, pnRef: 12.5 },
  '12.5': { sdr: 17, pnRef: 16 },
  '16': { sdr: 13.6, pnRef: 20 },
  '25': { sdr: 9, pnRef: 31.5 },
};

const pipeClass = (level: number): { sdr: number; pnRef: number } => {
  const preset = PN_SDR_MAP[String(level)];
  if (preset) return preset;
  const sdr = Math.round((200 / level + 1) * 10) / 10;
  const pnRef = Math.round((250 / (sdr - 1)) * 10) / 10;
  return { sdr, pnRef };
};

// --- REUSABLE COMPONENTS ---
const InputField = ({ label, value, onChange, unit, step = "1", hint }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative rounded-md shadow-sm">
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border outline-none px-3"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <span className="text-gray-500 sm:text-sm">{unit}</span>
      </div>
    </div>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

const SelectField = ({ label, value, onChange, options, hint }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        onChange(isNaN(Number(val)) ? val : parseFloat(val));
      }}
      className="block w-full rounded-md border-gray-300 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border outline-none bg-white"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

const ResultRow = ({ label, value, unit, highlight = false, subtext = "" }: any) => (
  <div className={`flex justify-between py-2 border-b border-gray-200 last:border-0 ${highlight ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
    <div className="flex flex-col">
      <span>{label}</span>
      {subtext && <span className="text-xs text-gray-500 font-normal">{subtext}</span>}
    </div>
    <span className="flex items-center text-right">{value} {unit}</span>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'check' | 'reverse' | 'docs'>('check');

  // --- STATE: CHECK TAB ---
  const [holeDiaMm, setHoleDiaMm] = useState<number>(311); // ~12.25 inches
  const [selectedOD, setSelectedOD] = useState<number>(160);
  const [selectedPN, setSelectedPN] = useState<number>(10);
  
  const [totalDepth, setTotalDepth] = useState<number>(100);
  const [casingDepth, setCasingDepth] = useState<number>(95); // Deepened to allow sump
  
  const [gravelTop, setGravelTop] = useState<number>(30);
  const [safetyFactorGravel, setSafetyFactorGravel] = useState<number>(1.2);

  // Seal State
  const [sealType, setSealType] = useState<'cement' | 'clay'>('clay');
  const [sealBottom, setSealBottom] = useState<number>(10);
  const [sealTop, setSealTop] = useState<number>(1); // Leave 1m for concrete pad
  const [slurryPerBag, setSlurryPerBag] = useState<number>(43.6); // Only used if cement
  const [waterPerBag, setWaterPerBag] = useState<number>(28.4);

  const [extSg, setExtSg] = useState<number>(1.30); // Default for sand
  const [intSg, setIntSg] = useState<number>(1.0);
  const [collapseDepth, setCollapseDepth] = useState<number>(95);
  const [geology, setGeology] = useState<string>('sand_gravel');
  const [loweringSpeed, setLoweringSpeed] = useState<number>(0.2);

  // Handle geology changes in Check Tab
  const handleGeologyChange = (val: string) => {
    setGeology(val);
    const config = soilGeologyConfigs.find(g => g.id === val);
    if (config) {
      setExtSg(config.sg);
    }
  };

  // Auto-adjust PN if OD changes
  useEffect(() => {
    const pipeData = pvcStandards.find(p => p.od === selectedOD);
    if (pipeData && !pipeData.pns.find(p => p.level === selectedPN)) {
      setSelectedPN(pipeData.pns[0].level);
    }
  }, [selectedOD]);

  // Handle casing depth change to sync with collapse depth
  const handleCasingDepthChange = (val: number) => {
    setCasingDepth(val);
    setCollapseDepth(val); // Tạm thời bằng nhau theo yêu cầu user
  };

  const currentPipe = pvcStandards.find(p => p.od === selectedOD)?.pns.find(p => p.level === selectedPN);
  const pvcThickness = currentPipe ? currentPipe.e : 1;

  // --- CALCULATIONS: CHECK TAB ---
  const SDR = selectedOD / pvcThickness;
  const calculatedCollapseResistance = 70126 * Math.pow(pvcThickness / Math.max(1, selectedOD - pvcThickness), 3);

  const boreVol = (Math.PI * Math.pow(holeDiaMm, 2)) / 4000;
  const casingVol = (Math.PI * Math.pow(selectedOD, 2)) / 4000;
  const annularVol = Math.max(0, boreVol - casingVol);

  const gravelUncasedVol = boreVol * Math.max(0, totalDepth - casingDepth) * safetyFactorGravel;
  const gravelAnnulusVol = annularVol * Math.max(0, casingDepth - gravelTop) * safetyFactorGravel;
  const totalGravel = gravelUncasedVol + gravelAnnulusVol;

  // Tránh chia cho 0 khi người dùng xoá trắng ô chiều sâu (chỉ dùng cho bản vẽ minh hoạ)
  const schematicDepth = Math.max(1, totalDepth);

  const totalSealVol = annularVol * Math.max(0, sealBottom - sealTop); 
  const cementBags = totalSealVol / slurryPerBag;
  const totalWater = cementBags * waterPerBag;

  const currentGeology = soilGeologyConfigs.find(g => g.id === geology) || soilGeologyConfigs[2];
  const targetFS = currentGeology.fs;
  const effectiveExtSg = currentGeology.type === 'soft' ? Math.max(extSg, 1.9) : extSg;
  const staticExtPressure = effectiveExtSg * collapseDepth / 10;
  const intPressure = intSg * collapseDepth / 10;

  // Surge Pressure Calculation
  const nominalClearance = (holeDiaMm - selectedOD) / 2;
  const effectiveClearance = holeDiaMm > 0 ? Math.max(1, (holeDiaMm * (currentGeology.type === 'soft' ? 0.85 : 1.0) - selectedOD) / 2) : 50;
  const surgePressure = holeDiaMm > 0 ? (loweringSpeed * effectiveExtSg * collapseDepth / effectiveClearance) * 0.8 : 0;

  const totalExtPressure = staticExtPressure + surgePressure;
  const diffPressure = Math.max(0, totalExtPressure - intPressure);
  
  const collapseSafety = diffPressure > 0 ? calculatedCollapseResistance / diffPressure : Infinity;
  const isSafe = collapseSafety >= targetFS;

  // --- STATE: REVERSE TAB ---
  const [revOD, setRevOD] = useState<number>(160);
  const [revHoleDiaMm, setRevHoleDiaMm] = useState<number>(216); // Default 8.5 inch
  const [revDepth, setRevDepth] = useState<number>(100);
  const [revExtSg, setRevExtSg] = useState<number>(1.8);
  const [revIntSg, setRevIntSg] = useState<number>(0.0);
  const [revFS, setRevFS] = useState<number>(2.0);
  const [revGeology, setRevGeology] = useState<string>('sand_gravel');
  const [revLoweringSpeed, setRevLoweringSpeed] = useState<number>(0.2);

  const handleRevGeologyChange = (val: string) => {
    setRevGeology(val);
    const config = soilGeologyConfigs.find(g => g.id === val);
    if (config) {
      setRevExtSg(config.sg);
      setRevFS(config.fs);
    }
  };

  // --- CALCULATIONS: REVERSE TAB ---
  const currentRevGeology = soilGeologyConfigs.find(g => g.id === revGeology) || soilGeologyConfigs[2];
  const revEffectiveExtSg = currentRevGeology.type === 'soft' ? Math.max(revExtSg, 1.9) : revExtSg;
  const revStaticExtPressure = revEffectiveExtSg * revDepth / 10;
  const revIntPressure = revIntSg * revDepth / 10;

  const revEffectiveClearance = revHoleDiaMm > 0 ? Math.max(1, (revHoleDiaMm * (currentRevGeology.type === 'soft' ? 0.85 : 1.0) - revOD) / 2) : 50;
  const revSurgePressure = revHoleDiaMm > 0 ? (revLoweringSpeed * revEffectiveExtSg * revDepth / revEffectiveClearance) * 0.8 : 0;
  
  const revTotalExtPressure = revStaticExtPressure + revSurgePressure;
  const revDiffPressure = Math.max(0, revTotalExtPressure - revIntPressure);
  
  const revReqPc = revDiffPressure * revFS;
  const tempX = Math.pow(revReqPc / 70126, 1 / 3);
  const reqE = (tempX * revOD) / (1 + tempX);
  
  const recommendedPipe = pvcStandards.find(p => p.od === revOD)?.pns.find(p => p.e >= reqE);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tính toán Khoan giếng Ống PVC-U</h1>
              <p className="text-gray-500 text-sm">Hệ thống chuẩn hệ mét - Ống Nhựa Tiền Phong PVC-U</p>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('check')}
            className={`flex items-center px-4 py-3 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'check' ? 'bg-white text-blue-600 border-t border-x border-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Kiểm tra An toàn & Khối lượng thi công
          </button>
          <button 
            onClick={() => setActiveTab('reverse')}
            className={`flex items-center px-4 py-3 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'reverse' ? 'bg-white text-emerald-600 border-t border-x border-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <Wrench className="w-4 h-4 mr-2" /> Tính ngược Tối ưu Thiết kế
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`flex items-center px-4 py-3 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'docs' ? 'bg-white text-gray-900 border-t border-x border-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <BookOpen className="w-4 h-4 mr-2" /> Tài liệu & Cở sở lý thuyết
          </button>
        </div>

        {/* TAB 1: KIỂM TRA AN TOÀN */}
        {activeTab === 'check' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cấu hình Giếng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-indigo-900">Thông số Giếng & Chọn Ống PVC (BS EN ISO 1452)</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InputField label="Tổng chiều sâu lỗ khoan" value={totalDepth} onChange={setTotalDepth} unit="m" />
                  <InputField label="Chiều sâu đặt đáy ống PVC" value={casingDepth} onChange={handleCasingDepthChange} unit="m" />
                </div>
                <div className="space-y-4">
                  <SelectField 
                    label="Đường kính ngoài PVC (OD)" 
                    value={selectedOD} 
                    onChange={setSelectedOD} 
                    options={pvcStandards.map(p => ({ value: p.od, label: `DN ${p.od}` }))} 
                  />
                  <SelectField
                    label="Cấp ống (SDR / PN)"
                    value={selectedPN}
                    onChange={setSelectedPN}
                    options={pvcStandards.find(p => p.od === selectedOD)?.pns.map(p => {
                      const c = pipeClass(p.level);
                      return { value: p.level, label: `SDR ${c.sdr} — PN ${c.pnRef} (e ${p.e}mm)` };
                    }) || []}
                    hint={`PN tham khảo theo EN ISO 1452 (σs = 12,5 MPa). Chiều dày thực tế e = ${pvcThickness} mm`}
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col justify-center space-y-2 border border-gray-100">
                  <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Đặc tính cơ học ống được chọn</h3>
                  <ResultRow label="Chiều dày thành ống (e)" value={pvcThickness} unit="mm" />
                  <ResultRow label="Tỷ lệ chuẩn (SDR)" value={SDR.toFixed(1)} unit="-" subtext="SDR = OD / e" />
                  <ResultRow label="Áp suất danh định (PN)" value={pipeClass(selectedPN).pnRef} unit="bar" subtext="Tham khảo EN ISO 1452 (σs=12,5)" />
                  <ResultRow label="Áp suất chịu sập (Pc)" value={calculatedCollapseResistance.toFixed(2)} unit="bar" highlight={true} subtext="Lý thuyết theo Timoshenko" />
                </div>
              </div>
            </div>

            {/* Lựa chọn mũi khoan & Khoảng không vành khăn */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
              <div className="bg-teal-50 px-6 py-4 border-b border-teal-100 flex items-center space-x-2">
                <Disc className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-teal-900">Lựa chọn Mũi khoan & Đánh giá Vành khăn (Annulus)</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <SelectField 
                    label="Kích thước Mũi khoan (Drill Bit)" 
                    value={holeDiaMm} 
                    onChange={setHoleDiaMm} 
                    options={[
                      { value: 0, label: '-- Chọn mũi khoan --' },
                      ...drillBits.map(b => ({ value: b.size, label: b.label }))
                    ]} 
                  />
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ResultRow 
                      label="Khe hở vành khăn (Annular Clearance)" 
                      value={((holeDiaMm - selectedOD) / 2).toFixed(1)} 
                      unit="mm" 
                      subtext="(D_khoan - OD) / 2" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col justify-center">
                  {holeDiaMm === 0 ? (
                    <div className="p-4 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 text-sm flex items-start">
                      <Info className="w-5 h-5 mr-2 flex-shrink-0" />
                      Vui lòng chọn kích thước mũi khoan để đánh giá.
                    </div>
                  ) : ((holeDiaMm - selectedOD) / 2) < 0 ? (
                    <div className="p-4 bg-red-100 text-red-800 rounded-lg border border-red-200 text-sm flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Lỗi Thiết kế: Bất khả thi</strong>
                        <p className="mt-1">Đường kính mũi khoan nhỏ hơn cả ống PVC. Không thể hạ ống. Vui lòng chọn mũi khoan to hơn!</p>
                      </div>
                    </div>
                  ) : ((holeDiaMm - selectedOD) / 2) < currentGeology.minClearance ? (
                    <div className="p-4 bg-red-100 text-red-800 rounded-lg border border-red-200 text-sm flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Cảnh báo (Khe hở hẹp &lt; {currentGeology.minClearance}mm đối với {currentGeology.label}):</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li>Rủi ro kẹt ống khi hạ cực cao do đặc tính địa tầng.</li>
                          <li>Không thể chèn sỏi lọc an toàn, dễ gây hiện tượng "Cầu nghẽn" (Bridging).</li>
                          <li>Lớp vữa/đất sét trám quá mỏng, không đảm bảo cách ly nguồn nước bẩn bề mặt (Sanitary Seal).</li>
                        </ul>
                      </div>
                    </div>
                  ) : ((holeDiaMm - selectedOD) / 2) > currentGeology.maxClearance ? (
                    <div className="p-4 bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-sm flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Cảnh báo (Khe hở rộng &gt; {currentGeology.maxClearance}mm):</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li>Vận tốc trào ngược dung dịch (Annular Velocity) thấp, dễ kẹt mùn khoan.</li>
                          <li>Lãng phí lượng lớn vật tư (Cát sỏi, Bentonite, Vữa xi măng).</li>
                          <li>Nguy cơ sạt lở thành lỗ khoan cao hơn trước khi hạ ống.</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-100 text-green-800 rounded-lg border border-green-200 text-sm flex items-start">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Tối ưu (Đạt chuẩn {currentGeology.minClearance}mm - {currentGeology.maxClearance}mm cho {currentGeology.label}):</strong>
                        <p className="mt-1">Khe hở vành khăn lý tưởng cho loại đất này. Đảm bảo hạ ống an toàn, có không gian tạo lớp áo sỏi và tránh sạt lở kẹp ống.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Áp suất móp méo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
              <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-900">Đánh giá Rủi ro Móp méo Ống PVC (Collapse Pressure)</h2>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Chiều sâu đánh giá (H)" value={collapseDepth} onChange={setCollapseDepth} unit="m" />
                  <InputField label="Tốc độ hạ ống (v)" value={loweringSpeed} onChange={setLoweringSpeed} unit="m/s" step="0.1" hint="Tốc độ cao tạo Hiệu ứng Piston gây dâng áp" />
                  <div className="col-span-2">
                    <SelectField 
                      label="Mô tả địa tầng chính (Địa chất)" 
                      value={geology} 
                      onChange={handleGeologyChange} 
                      options={soilGeologyConfigs.map(g => ({ value: g.id, label: `${g.label} (Đề xuất: SG=${g.sg.toFixed(2)}, FS=${g.fs.toFixed(1)})` }))} 
                    />
                    <p className="text-sm text-gray-500 mt-1 mb-2 italic px-1">{currentGeology.desc}</p>
                  </div>
                  <InputField label="Tỷ trọng dung ngoài (SG)" value={extSg} onChange={setExtSg} unit="SG" step="0.05" hint={currentGeology.type === 'soft' ? "Áp lực thực tế ít nhất 1.9 do bùn/sét nén" : "Tự động gợi ý theo địa tầng"} />
                  <InputField label="Tỷ trọng dung trong (SG)" value={intSg} onChange={setIntSg} unit="SG" step="0.05" hint="Nước ngọt = 1.0, Rỗng = 0" />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col justify-center space-y-3">
                  <ResultRow label="Áp suất thủy tĩnh" value={Math.max(0, staticExtPressure - intPressure).toFixed(2)} unit="bar" subtext="(SG_ngoài - SG_trong) * H / 10" />
                  <ResultRow label="Áp suất dâng (Surge Pressure)" value={surgePressure.toFixed(2)} unit="bar" highlight={surgePressure > 1} subtext="Do hiệu ứng Piston khi hạ ống nhanh" />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                     <ResultRow label="Tổng áp suất chênh lệch" value={diffPressure.toFixed(2)} unit="bar" />
                     <ResultRow label="Hệ số an toàn (FS)" value={collapseSafety.toFixed(2)} unit="-" highlight={true} subtext={`Khuyến nghị ≥ ${targetFS.toFixed(1)}`} />
                  </div>
                  
                  {!isSafe ? (
                    <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200 flex items-start space-x-3 text-sm mt-2">
                      <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span><strong>Cảnh báo (FS &lt; {targetFS.toFixed(1)}):</strong> Ống có rủi ro móp sập cao.</span>
                        {currentGeology.type === 'soft' && <span className="mt-1 font-semibold text-red-900">- Đất yếu làm thu hẹp khe hở, đẩy áp suất dâng (Surge Pressure) tăng vọt.</span>}
                        {surgePressure > (diffPressure * 0.2) && <span className="mt-1 text-red-700">- Mẹo: Hãy giảm tốc độ hạ ống xuống dưới 0.1 m/s để tránh hiệu ứng Piston làm sập ống.</span>}
                        <span className="mt-1">Yêu cầu chọn cấp áp suất (PN) cao hơn hoặc luôn cấp đủ nước vào trong ống.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-100 text-green-800 rounded-lg border border-green-200 flex items-start space-x-3 text-sm mt-2">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span><strong>An toàn:</strong> Ống chịu được tổng áp lực kể cả khi đang hạ.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thể tích sỏi và xi măng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-amber-900">Tính toán Sỏi chèn (Gravel Pack)</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Đỉnh lớp sỏi chèn" value={gravelTop} onChange={setGravelTop} unit="m" />
                  <InputField label="Hệ số hao hụt" value={safetyFactorGravel} onChange={setSafetyFactorGravel} unit="-" step="0.1" />
                </div>
                <div className="mt-6 bg-gray-50 rounded-lg p-4 space-y-1">
                  <ResultRow label="Thể tích vành khuyên" value={annularVol.toFixed(1)} unit="L/m" />
                  <ResultRow label="Sỏi đáy giếng (không ống)" value={gravelUncasedVol.toFixed(0)} unit="Lít" />
                  <ResultRow label="Sỏi vành khuyên" value={gravelAnnulusVol.toFixed(0)} unit="Lít" />
                  <ResultRow label="Tổng thể tích sỏi" value={totalGravel.toFixed(0)} unit="Lít" highlight={true} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Cylinder className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Vật liệu Trám kín (Sanitary Seal)</h2>
                </div>
                {/* Toggle Switch */}
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  <button 
                    onClick={() => setSealType('clay')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sealType === 'clay' ? 'bg-[#b45309] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Đất sét / Bentonite
                  </button>
                  <button 
                    onClick={() => setSealType('cement')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sealType === 'cement' ? 'bg-slate-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Vữa Xi măng
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Đáy lớp trám" value={sealBottom} onChange={setSealBottom} unit="m" />
                  <InputField label="Đỉnh lớp trám" value={sealTop} onChange={setSealTop} unit="m" />
                  {sealType === 'cement' && (
                    <>
                      <InputField label="Vữa / bao xi măng (50kg)" value={slurryPerBag} onChange={setSlurryPerBag} unit="L" step="0.1" />
                      <InputField label="Nước / bao xi măng" value={waterPerBag} onChange={setWaterPerBag} unit="L" step="0.1" />
                    </>
                  )}
                </div>
                <div className="mt-6 bg-gray-50 rounded-lg p-4 space-y-1">
                  <ResultRow label="Thể tích khoảng trống cần trám" value={totalSealVol.toFixed(0)} unit="Lít" />
                  {sealType === 'cement' ? (
                    <>
                      <ResultRow label="Số lượng bao xi măng (50kg)" value={Math.ceil(cementBags)} unit="Bao" highlight={true} />
                      <ResultRow label="Tổng lượng nước cần pha" value={totalWater.toFixed(0)} unit="Lít" highlight={true} />
                    </>
                  ) : (
                    <ResultRow label="Lượng đất sét/Bentonite cần thiết" value={totalSealVol.toFixed(0)} unit="Lít" highlight={true} subtext="Nên đổ từ từ, kết hợp đo bằng dây dọi" />
                  )}
                </div>
              </div>
            </div>

            {/* Mô hình Giếng & Phương án thi công */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden xl:col-span-1 flex flex-col">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-blue-900">Bản vẽ Thiết kế</h2>
                  </div>
                </div>
                <div className="p-4 flex-grow flex justify-center items-center bg-stone-50 relative overflow-hidden font-sans">
                  
                  {/* Schematic Wrapper */}
                  <div className="relative w-[340px] h-[600px] flex justify-center mt-12 mb-6">
                    
                    {/* Ground level */}
                    <div className="absolute top-[40px] w-[150%] -left-[25%] h-[2px] bg-green-700 z-10"></div>
                    
                    {/* Trench (Cát đầm chặt) */}
                    <div className="absolute top-[40px] w-[260px] h-[90px] bg-[#d7ccc8] border-b-2 border-stone-400 z-0 flex justify-center overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 65% 100%, 35% 100%)' }}>
                       <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#5d4037 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
                    </div>

                    {/* Background Borehole */}
                    <div className="absolute top-[40px] w-[110px] h-[520px] bg-stone-200 border-x-2 border-b-2 border-stone-500 rounded-b-md overflow-hidden flex justify-center z-0">
                      
                      {/* 1. Gravel Pack Primary at bottom */}
                      <div className="absolute bottom-0 w-full bg-[#E5C158] opacity-90 flex justify-center overflow-hidden" 
                           style={{ height: `${((schematicDepth - gravelTop) / schematicDepth) * 100}%` }}>
                        <div className="w-full h-full opacity-40" style={{ backgroundImage: 'radial-gradient(#8b4513 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
                      </div>

                      {/* 2. Gravel Pack Secondary (Transition) */}
                      <div className="absolute w-full bg-[#fce68a] opacity-90 border-b border-yellow-600 flex justify-center overflow-hidden" 
                           style={{ 
                             bottom: `${((schematicDepth - gravelTop) / schematicDepth) * 100}%`,
                             height: `24px`
                           }}>
                        <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#8b4513 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
                      </div>

                      {/* 3. Seal Layer (Clay or Cement) */}
                      <div className="absolute w-full border-y border-stone-600/50"
                           style={{ 
                             top: `${(sealTop / schematicDepth) * 100}%`,
                             height: `${((sealBottom - sealTop) / schematicDepth) * 100}%`,
                             backgroundColor: sealType === 'cement' ? '#94a3b8' : '#b45309' 
                           }}>
                        {sealType === 'clay' && <div className="w-full h-full opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #451a03 4px, #451a03 5px)' }}></div>}
                      </div>

                    </div>
                    
                    {/* Concrete Pad */}
                    <div className="absolute top-[40px] w-[130px] h-[70px] bg-gray-400 border border-gray-600 z-10 flex justify-center items-center overflow-hidden">
                       <div className="w-full h-full opacity-50" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
                    </div>

                    {/* The PVC Casing (Ống vách, Ống lọc, Ống lắng) */}
                    <div className="absolute top-[10px] w-[56px] bg-blue-100/90 border-x-2 border-blue-600 flex flex-col items-center shadow-md z-20 rounded-b"
                         style={{ height: `calc(30px + ${(casingDepth / schematicDepth) * 520}px)` }}>
                      
                      {/* Nắp & Khóa */}
                      <div className="absolute -top-[6px] w-[64px] h-[6px] bg-slate-800 rounded-t-sm">
                         <div className="absolute -left-[8px] top-[1px] w-[6px] h-[6px] bg-slate-600 rounded-full"></div> {/* Khóa */}
                      </div>

                      {/* Ống nối / Thu nước */}
                      <div className="absolute top-[60px] -right-[60px] w-[60px] h-[20px] bg-blue-100 border-y-2 border-r-2 border-blue-600 flex items-center justify-end pr-1">
                         <div className="w-[12px] h-[12px] rounded-full bg-blue-500"></div> {/* Van */}
                      </div>

                      {/* Upper Blank Casing */}
                      <div className="w-full flex-grow relative overflow-hidden">
                         {/* Pump Cable */}
                         <div className="absolute top-0 left-[20%] w-px bg-slate-800 h-full"></div>
                         {/* Riser Pipe */}
                         <div className="absolute top-0 left-1/2 -ml-[4px] w-[8px] bg-gray-300 border-x border-gray-500 h-full"></div>
                      </div>

                      {/* Pump positioned near bottom of blank casing */}
                      <div className="w-[40px] h-[70px] bg-gray-700 rounded-sm mb-1 z-20 border border-gray-900 shadow-inner"></div>

                      {/* Screen Section (Ống lọc) - Lower 25% of casing approx */}
                      <div className="w-full h-[25%] border-y-2 border-blue-700 bg-blue-200/50 flex flex-col justify-evenly relative">
                        <div className="absolute w-full h-full opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #1d4ed8 4px, #1d4ed8 5px)' }}></div>
                      </div>

                      {/* Sump / Sand Trap (Ống lắng) */}
                      <div className="w-full h-[12%] bg-blue-100/90 relative">
                         <div className="absolute bottom-0 w-full h-[8px] bg-blue-800"></div> {/* Bịt đầu ống */}
                      </div>

                    </div>

                    {/* Annotations Lines & Labels */}
                    {/* Left Labels */}
                    <div className="absolute left-[-20px] top-[10px] text-[11px] font-semibold text-gray-800 text-right space-y-6 z-30">
                       <div className="relative group cursor-help pr-6">1. Ống bảo vệ<div className="absolute top-1/2 right-0 w-4 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[20px] group cursor-help pr-6">2. Vữa bê tông<div className="absolute top-1/2 right-0 w-4 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[20px] group cursor-help pr-6">3. Cát đầm chặt<div className="absolute top-1/2 right-0 w-12 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[120px] group cursor-help pr-6">6. {sealType === 'cement' ? 'Vữa XM - Bentonit' : 'Đất sét / Bentonite'}<div className="absolute top-1/2 right-0 w-4 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[40px] group cursor-help pr-6">7. Ống chống<div className="absolute top-1/2 right-0 w-8 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[80px] group cursor-help pr-6">8. Cát lọc thứ cấp<div className="absolute top-1/2 right-0 w-4 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[20px] group cursor-help pr-6">9. Cát lọc sơ cấp<div className="absolute top-1/2 right-0 w-4 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[30px] group cursor-help pr-6">10. Ống lọc<div className="absolute top-1/2 right-0 w-8 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[60px] group cursor-help pr-6">11. Ống lắng<div className="absolute top-1/2 right-0 w-8 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[20px] group cursor-help pr-6">12. Nút đáy<div className="absolute top-1/2 right-0 w-8 h-px bg-gray-600"></div></div>
                    </div>

                    {/* Right Labels */}
                    <div className="absolute right-[0px] top-[70px] text-[11px] font-semibold text-gray-800 text-left z-30">
                       <div className="relative pl-6">4. Ống thu nước<div className="absolute top-1/2 left-0 w-4 h-px bg-gray-600"></div></div>
                       <div className="relative mt-[200px] pl-6 text-blue-800">Cáp điện bơm</div>
                       <div className="relative mt-[10px] pl-6 text-blue-800">Ống bơm lên</div>
                       <div className="relative mt-[40px] pl-6 text-blue-800">Bơm chìm</div>
                       <div className="relative mt-[140px] pl-6 text-stone-600">13. Đáy lỗ khoan<div className="absolute top-1/2 left-0 w-8 h-px bg-stone-600"></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Plan - Hidden if unsafe */}
              <div className="xl:col-span-2">
                {!isSafe ? (
                  <div className="bg-red-50 p-8 h-full rounded-xl border border-red-200 text-red-800 flex flex-col justify-center items-center text-center shadow-sm">
                    <div className="p-4 bg-red-100 rounded-full mb-4">
                      <AlertTriangle className="w-12 h-12 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Không khả thi / Khóa Phương án</h3>
                    <p className="text-red-700 max-w-md">
                      Hệ số an toàn của ống hiện tại là <strong>{collapseSafety.toFixed(2)}</strong> (nhỏ hơn mức tối thiểu {targetFS.toFixed(1)}).
                      Thiết kế này tiềm ẩn rủi ro cực cao về móp méo/sập ống trong quá trình thi công.
                    </p>
                    <div className="mt-6 text-sm text-left bg-white p-4 rounded border border-red-100 w-full max-w-md">
                      <span className="font-bold block mb-2 text-gray-800">Để mở khóa, vui lòng thực hiện:</span>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Chọn ống có cấp áp suất (PN) cao hơn ở Tab trên.</li>
                        <li>Đổi phương án từ "Vữa xi măng" sang "Đất sét / Bentonite" để giảm tỷ trọng tác dụng từ bên ngoài.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                    <div className="bg-cyan-50 px-6 py-4 border-b border-cyan-100 flex items-center space-x-2">
                      <ClipboardList className="w-5 h-5 text-cyan-600" />
                      <h2 className="text-lg font-semibold text-cyan-900">Phương án Thi công Đề xuất (An toàn)</h2>
                    </div>
                    <div className="p-6 space-y-6 text-gray-700 h-full overflow-y-auto">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">1</div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">Khoan tạo lỗ & Làm sạch</h3>
                          <p className="text-sm mt-1">Sử dụng mũi khoan <strong>{holeDiaMm} mm</strong>. Khoan đến tổng chiều sâu <strong>{totalDepth} m</strong>. Đảm bảo tuần hoàn dung dịch làm sạch mùn khoan trước khi hạ ống.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">2</div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">Hạ tổ hợp Ống PVC (Vách - Lọc - Lắng)</h3>
                          <p className="text-sm mt-1">Lắp ráp tổ hợp ống <strong>DN {selectedOD} - PN {selectedPN}</strong>. Đóng bịt đáy ở đoạn ống lắng. Chiều sâu hạ tổ hợp: <strong>{casingDepth} m</strong>. Bố trí đoạn ống lọc (Screen) đúng tầng chứa nước mục tiêu.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">3</div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">Đổ sỏi chèn (Gravel Packing)</h3>
                          <p className="text-sm mt-1">Đổ <strong>{Math.ceil(totalGravel)} lít</strong> sỏi lọc vào vành khuyên từ đáy lỗ ({totalDepth} m) lên đến độ cao <strong>{gravelTop} m</strong>. Liên tục dùng dây dọi kiểm tra tránh kẹt sỏi lơ lửng.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">4</div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">Cách ly bề mặt ({sealType === 'cement' ? 'Trám Xi măng' : 'Chèn Đất sét/Bentonite'})</h3>
                          <p className="text-sm mt-1">
                            {sealType === 'cement' ? 
                              `Dùng ${Math.ceil(cementBags)} bao xi măng (50kg) pha ${Math.ceil(totalWater)} lít nước để trám từ ${sealBottom}m lên ${sealTop}m. CẦN THIẾT: Bơm đầy nước lạnh vào trong ống PVC để tản nhiệt thủy hóa.` :
                              `Sử dụng viên sét nở (Bentonite Pellets) hoặc đất sét nện chèn từ ${sealBottom}m lên ${sealTop}m. Phương pháp này rất an toàn cho ống PVC do không sinh nhiệt.`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">5</div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">Hoàn thiện bề mặt & Hạ Bơm</h3>
                          <p className="text-sm mt-1">Đổ bệ bê tông cổ giếng (từ 0m - 1m). Sau 24h, tiến hành súc rửa giếng (air-lifting). Cuối cùng, kết nối cáp treo, ống bơm và thả Bơm chìm vào vùng ống vách mù (phía trên ống lọc).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TÍNH NGƯỢC THIẾT KẾ */}
        {activeTab === 'reverse' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-emerald-900">Bài toán Thiết kế Tối ưu: Tìm Chiều dày và PN của Ống</h2>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="grid grid-cols-2 gap-4">
                <SelectField 
                  label="Đường kính ngoài dự kiến (OD)" 
                  value={revOD} 
                  onChange={setRevOD} 
                  options={pvcStandards.map(p => ({ value: p.od, label: `DN ${p.od}` }))} 
                />
                <SelectField 
                  label="Kích thước Mũi khoan dự kiến" 
                  value={revHoleDiaMm} 
                  onChange={setRevHoleDiaMm} 
                  options={[
                    { value: 0, label: '-- Bỏ qua (Tính lý thuyết) --' },
                    ...drillBits.map(b => ({ value: b.size, label: b.label }))
                  ]} 
                />
                <InputField label="Độ sâu nguy hiểm nhất (H)" value={revDepth} onChange={setRevDepth} unit="m" />
                <InputField label="Tốc độ hạ ống (v)" value={revLoweringSpeed} onChange={setRevLoweringSpeed} unit="m/s" step="0.1" />
                <div className="col-span-2">
                  <SelectField 
                    label="Mô tả địa tầng chính (Địa chất)" 
                    value={revGeology} 
                    onChange={handleRevGeologyChange} 
                    options={soilGeologyConfigs.map(g => ({ value: g.id, label: `${g.label} (Đề xuất: SG=${g.sg.toFixed(2)}, FS=${g.fs.toFixed(1)})` }))} 
                  />
                  <p className="text-sm text-gray-500 mt-1 mb-2 italic px-1">{currentRevGeology.desc}</p>
                </div>
                <InputField label="Tỷ trọng lưu chất ngoài" value={revExtSg} onChange={setRevExtSg} unit="SG" step="0.05" hint={currentRevGeology.type === 'soft' ? "Thực tế tối thiểu 1.9" : "Tự động gợi ý theo địa tầng"} />
                <InputField label="Tỷ trọng lưu chất trong" value={revIntSg} onChange={setRevIntSg} unit="SG" step="0.05" hint="Rỗng = 0 (xấu nhất)" />
                <div className="col-span-2 md:col-span-1">
                  <InputField label="Hệ số an toàn (FS) mong muốn" value={revFS} onChange={setRevFS} unit="-" step="0.1" hint="Tự động gợi ý theo địa tầng" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 flex flex-col justify-center space-y-4 border border-gray-200 shadow-inner">
                <h3 className="font-semibold text-emerald-800 border-b border-emerald-200 pb-2">KẾT QUẢ THIẾT KẾ</h3>
                <ResultRow label="Tổng áp suất chênh lệch" value={revDiffPressure.toFixed(2)} unit="bar" subtext={revSurgePressure > 0 ? `(Gồm ${revSurgePressure.toFixed(2)} bar Áp suất dâng)` : "Chỉ tính áp suất tĩnh"} />
                <ResultRow label="Áp suất sập mục tiêu cần đạt" value={revReqPc.toFixed(2)} unit="bar" subtext={`(Bao gồm FS = ${revFS})`} />
                <ResultRow label="Chiều dày ống tối thiểu (e)" value={reqE.toFixed(2)} unit="mm" highlight={true} subtext="Từ phương trình Timoshenko" />
                
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm PVC-U Tiền Phong khuyến nghị:</h4>
                  {recommendedPipe ? (
                    <div className="bg-emerald-100 text-emerald-800 p-4 rounded-md border border-emerald-300 font-bold text-center">
                      Ống DN {revOD} — SDR {pipeClass(recommendedPipe.level).sdr} (PN {pipeClass(recommendedPipe.level).pnRef}) <br/>
                      <span className="text-sm font-normal">(Chiều dày thực tế: {recommendedPipe.e} mm — PN tham khảo EN ISO 1452)</span>
                    </div>
                  ) : (
                    <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-300 font-bold text-center">
                      Cảnh báo: Yêu cầu độ dày quá lớn!<br/>
                      <span className="text-sm font-normal">Không có ống tiêu chuẩn nào (DN{revOD}) đạt chiều dày yêu cầu {reqE.toFixed(1)}mm. Cần chuyển sang ống thép hoặc cân bằng lại áp suất.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TÀI LIỆU THAM KHẢO */}
        {activeTab === 'docs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-800 px-6 py-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-gray-100" />
              <h2 className="text-lg font-semibold text-white">Tài liệu Kỹ thuật Tham khảo & Lý thuyết</h2>
            </div>
            <div className="p-6 text-gray-700 space-y-6">
              
              <div>
                <h3 className="font-bold text-lg text-gray-900 border-l-4 border-blue-500 pl-3">1. Phân biệt Áp suất danh định (PN) và Áp suất móp méo (Collapse)</h3>
                <p className="mt-2 text-justify">Ống nhựa PVC-U thường được phân loại theo cấp áp suất PN (Pressure Nominal), đánh giá khả năng chịu áp lực từ <strong>bên trong</strong> (Internal Burst Pressure) ra ngoài theo TCVN hoặc ISO. Tuy nhiên, rủi ro chính đối với ống chống giếng khoan lại là áp lực từ <strong>bên ngoài</strong> (External Collapse Pressure) do bùn nặng hoặc vữa xi măng ép vào thành ống, khiến ống bị sụp/móp méo.</p>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 border-l-4 border-blue-500 pl-3">2. Công thức Timoshenko tính Áp suất sập lý thuyết (Pc)</h3>
                <p className="mt-2">Để tính toán khả năng chịu móp (Collapse Resistance), tiêu chuẩn khoan áp dụng phương trình đàn hồi mất ổn định:</p>
                <div className="bg-gray-100 p-4 rounded text-center my-3 font-mono text-base border border-gray-300">
                  Pc = [2 * E / (1 - ν²)] * [e / (OD - e)]³
                </div>
                <ul className="list-disc pl-8 space-y-1">
                  <li><strong>Pc</strong>: Áp suất sập lý thuyết (MPa, 1 MPa = 10 Bar)</li>
                  <li><strong>E</strong>: Module đàn hồi (Modulus of Elasticity) của PVC-U (Sử dụng 3000 MPa)</li>
                  <li><strong>ν</strong> (nu): Hệ số Poisson của nhựa PVC (0.38)</li>
                  <li><strong>OD</strong>: Đường kính ngoài của ống (mm)</li>
                  <li><strong>e</strong>: Chiều dày thành ống (mm)</li>
                </ul>
                <p className="mt-2 text-red-600 font-medium">Quan trọng: Khả năng chịu sập tỷ lệ thuận với lập phương của độ dày. Giảm độ dày một chút sẽ làm suy giảm theo cấp số mũ độ bền của ống.</p>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 border-l-4 border-blue-500 pl-3">3. Hệ số an toàn (FS) và Tác động của Nhiệt độ</h3>
                <p className="mt-2">Hệ số an toàn (FS) khuyến nghị tối thiểu khi thiết kế giếng là <strong>2.0</strong> do các rủi ro trong thực tế:</p>
                <ul className="list-disc pl-8 mt-2 space-y-2">
                  <li><strong>Phản ứng thủy hóa xi măng tỏa nhiệt:</strong> Nếu đường kính lỗ khoan quá lớn, lớp vành khuyên xi măng sẽ rất dày và tỏa nhiệt mạnh (lên tới 60°C). Ở nhiệt độ này, Module đàn hồi E của PVC giảm chỉ còn <strong>22%</strong>. Ống có thể bị móp ngay lập tức.</li>
                  <li><strong>Biện pháp phòng ngừa:</strong> Bắt buộc phải duy trì việc bơm đầy nước lạnh vào trong ống PVC để tản nhiệt và tạo áp suất đối kháng thủy tĩnh cân bằng trong suốt quá trình trám xi măng.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 border-l-4 border-blue-500 pl-3">4. Dữ liệu Kích thước Ống PVC-U (Nguồn: BS EN ISO 1452)</h3>
                <p className="mt-2">Hệ thống mã hóa chiều dày (e) theo dãy SDR chuẩn; PN quy đổi tham khảo theo EN ISO 1452 (σs = 12,5 MPa, C = 2,0):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded">
                    <p className="font-bold border-b pb-1 mb-2">Ví dụ ống DN 110:</p>
                    <ul className="space-y-1 text-sm">
                      <li>SDR 33 (PN8) : e = 3.2 mm</li>
                      <li>SDR 26 (PN10) : e = 4.2 mm</li>
                      <li>SDR 21 (PN12.5) : e = 5.3 mm</li>
                      <li>SDR 17 (PN16) : e = 6.6 mm</li>
                      <li>SDR 13.6 (PN20) : e = 8.1 mm</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded">
                    <p className="font-bold border-b pb-1 mb-2">Ví dụ ống DN 160:</p>
                    <ul className="space-y-1 text-sm">
                      <li>SDR 33 (PN8) : e = 4.7 mm</li>
                      <li>SDR 26 (PN10) : e = 6.2 mm</li>
                      <li>SDR 21 (PN12.5) : e = 7.7 mm</li>
                      <li>SDR 17 (PN16) : e = 9.5 mm</li>
                      <li>SDR 13.6 (PN20) : e = 11.8 mm</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
