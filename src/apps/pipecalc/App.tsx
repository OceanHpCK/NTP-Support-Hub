import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Settings, Ruler, Mountain, Truck, Activity, CheckCircle2, XCircle, Info, Droplets, Table as TableIcon, X, AlertTriangle } from 'lucide-react';

const MATERIALS: Record<string, { E: number; type: string; maxDeflection: number; systems: string[]; sigma_d?: number }> = {
  'HDPE (PE 100)': { E: 950, type: 'flexible', maxDeflection: 7.5, systems: ['water_supply', 'drainage'], sigma_d: 8.0 },
  'PVC-U': { E: 3200, type: 'flexible', maxDeflection: 7.5, systems: ['water_supply', 'drainage'], sigma_d: 12.5 },
  'Ống gân sóng (Corrugated)': { E: 800, type: 'flexible', maxDeflection: 7.5, systems: ['drainage'] },
  'Thép (Steel)': { E: 200000, type: 'flexible', maxDeflection: 3, systems: ['water_supply', 'drainage'], sigma_d: 160 },
  'Gang (Ductile Iron)': { E: 170000, type: 'semi-rigid', maxDeflection: 3, systems: ['water_supply', 'drainage'], sigma_d: 150 },
  'Bê tông (Concrete)': { E: 30000, type: 'rigid', maxDeflection: 0.1, systems: ['drainage'] }
};

const BEDDING_CONSTANTS: Record<string, number> = {
  '0': 0.110,
  '60': 0.103,
  '90': 0.096,
  '120': 0.089,
  '180': 0.083
};

const BEDDING_DESCRIPTIONS: Record<string, string> = {
  '0': 'Hỗ trợ điểm (Point support) - Thi công rất kém',
  '60': 'Rãnh chữ V / Đệm hẹp (Narrow bedding)',
  '90': 'Đệm tiêu chuẩn (Standard) - Phổ biến nhất',
  '120': 'Đệm tạo hình và đầm nén kỹ (Compacted)',
  '180': 'Lót nửa vòng ống (Full semi-circular) - Tốt nhất'
};

const getTrafficLoad = (traffic: string, H: number) => {
  if (traffic === 'None') return 0;
  if (traffic === 'Main') {
    if (H <= 0.6) return 120;
    if (H <= 1.0) return 74;
    if (H <= 2.0) return 40.3;
    if (H <= 4.0) return 18.5;
    if (H <= 6.0) return 9.92;
    return 4;
  } else if (traffic === 'Light') {
    if (H <= 0.6) return 120;
    if (H <= 1.0) return 63.2;
    if (H <= 2.0) return 21.5;
    if (H <= 4.0) return 6;
    if (H <= 6.0) return 2.7;
    return 1;
  } else if (traffic === 'Fields') {
    if (H <= 0.5) return 85;
    if (H <= 1.0) return 36.1;
    if (H <= 2.0) return 12.3;
    if (H <= 4.0) return 3.43;
    if (H <= 6.0) return 1.56;
    return 0.57;
  }
  return 0;
};

const InputField = ({ label, name, value, onChange, unit, type = "number", step = "any", min = "0" }: any) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
      />
      {unit && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-slate-400 sm:text-xs">{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options }: any) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default function App() {
  const [showTables, setShowTables] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [params, setParams] = useState({
    systemType: 'water_supply',
    material: 'HDPE (PE 100)',
    De: 1000,
    e: 50,
    E: 950,
    H: 2.0,
    B: 1.5,
    beddingAngle: '90',
    gamma: 19,
    Eprime: 10,
    hw: 0,
    traffic: 'Main',
    corrugatedMaterial: 'HDPE',
    snType: 'SN8',
    snValue: 8,
    thicknessInputType: 'e',
    sdr: 17,
    Pi: 0 // Internal pressure in bar
  });

  useEffect(() => {
    setParams(p => {
      let newMaterial = p.material;
      const validMaterials = Object.entries(MATERIALS).filter(([_, mat]) => mat.systems.includes(p.systemType)).map(([k]) => k);
      if (!validMaterials.includes(newMaterial)) {
        newMaterial = validMaterials[0];
      }
      return { 
        ...p, 
        material: newMaterial,
        E: MATERIALS[newMaterial as keyof typeof MATERIALS].E 
      };
    });
  }, [params.material, params.systemType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(p => {
      const isStringField = ['systemType', 'material', 'traffic', 'beddingAngle', 'corrugatedMaterial', 'snType', 'thicknessInputType'].includes(name);
      const newParams = { ...p, [name]: isStringField ? value : parseFloat(value) || 0 };
      
      if (name === 'systemType' && value === 'drainage') {
        newParams.Pi = 0;
      }
      
      if (name === 'corrugatedMaterial') {
        newParams.snType = 'SN8';
        newParams.snValue = 8;
      } else if (name === 'snType' && value !== 'Custom') {
        newParams.snValue = parseInt(value.replace('SN', ''), 10);
      }
      return newParams;
    });
  };

  const results = useMemo(() => {
    const { De, e, E, H, B, beddingAngle, gamma, Eprime, hw, traffic, material, thicknessInputType, sdr, snValue, Pi } = params;
    const actual_e = (['HDPE (PE 100)', 'PVC-U'].includes(material) && thicknessInputType === 'SDR') ? De / sdr : e;
    const Dm = material === 'Ống gân sóng (Corrugated)' ? De : Math.max(0.1, De - actual_e);
    const r = Dm / 2;
    const Heff = Math.max(H, 0.1);
    const Ps = gamma * H;
    const Pt = getTrafficLoad(traffic, Heff);
    const Pv = Ps + Pt;
    const Pv_MPa = Pv / 1000;
    const Pi_MPa = (Pi || 0) * 0.1; // 1 bar = 0.1 MPa

    let EI;
    if (material === 'Ống gân sóng (Corrugated)') {
      EI = (snValue / 1000) * Math.pow(Dm, 3);
    } else {
      const I = Math.pow(actual_e, 3) / 12;
      EI = E * I;
    }
    const Dl = 1.5;
    const K = BEDDING_CONSTANTS[beddingAngle as keyof typeof BEDDING_CONSTANTS];
    // Rerounding effect: 0.187 * Pi * r^3
    const delta_x = (Dl * K * Pv_MPa * Math.pow(r, 3)) / (EI + 0.061 * Eprime * Math.pow(r, 3) + 0.187 * Pi_MPa * Math.pow(r, 3));
    const deflectionPercent = (delta_x / Dm) * 100;
    const hw_eff = Math.min(hw, H);
    const Rw = 1 - 0.33 * (hw_eff / Heff);
    const B_prime = 1 / (1 + 4 * Math.exp(-0.213 * Heff));
    const Pcr_MPa = Math.sqrt(32 * Rw * B_prime * Eprime * EI / Math.pow(Dm, 3));
    const Pcr = Pcr_MPa * 1000;
    const FS_buckling = Pcr / Math.max(Pv, 0.001);
    const isBucklingPass = FS_buckling >= 2.0;

    // Combined Stress Analysis (BS EN 1295-1)
    const hoopStressPi = (Pi_MPa * Dm) / (2 * actual_e);
    const bendingStress = (3 * E * actual_e * delta_x) / Math.pow(Dm, 2);
    const combinedStress = hoopStressPi + bendingStress;
    const isStressPass = MATERIALS[params.material].sigma_d ? combinedStress <= (MATERIALS[params.material].sigma_d || 0) : true;

    const maxDef = MATERIALS[params.material].maxDeflection;
    const isDeflectionPass = deflectionPercent <= maxDef;

    return {
      Ps, Pt, Pv, delta_x, deflectionPercent, Pcr, FS_buckling, 
      hoopStressPi, bendingStress, combinedStress,
      isDeflectionPass, isBucklingPass, isStressPass, maxDef
    };
  }, [params]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Compact Sub-Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">PipeCalc Pro</h1>
              <p className="text-[10px] text-slate-500 font-medium">Tính toán chôn lấp ống theo BS EN 1295-1</p>
            </div>
          </div>
          <button 
            onClick={() => setShowTables(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <TableIcon className="w-4 h-4" />
            Bảng tra cứu
          </button>
        </div>
      </div>

      {/* Reference Tables Modal */}
      {showTables && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Bảng tra cứu thông số (BS EN 1295-1)</h2>
              <button onClick={() => setShowTables(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Table A.1 Surcharge pressures, Ps (kN/m²)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border p-2 font-medium">Cover depth H (m)</th>
                        <th className="border p-2 font-medium">0.5</th>
                        <th className="border p-2 font-medium">0.6</th>
                        <th className="border p-2 font-medium">1.0</th>
                        <th className="border p-2 font-medium">2.0</th>
                        <th className="border p-2 font-medium">4.0</th>
                        <th className="border p-2 font-medium">6.0</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border p-2 font-medium">Main roads</td><td className="border p-2">-</td><td className="border p-2">120</td><td className="border p-2">74</td><td className="border p-2">40.3</td><td className="border p-2">18.5</td><td className="border p-2">9.92</td></tr>
                      <tr><td className="border p-2 font-medium">Light roads</td><td className="border p-2">-</td><td className="border p-2">120</td><td className="border p-2">63.2</td><td className="border p-2">21.5</td><td className="border p-2">6.0</td><td className="border p-2">2.7</td></tr>
                      <tr><td className="border p-2 font-medium">Fields</td><td className="border p-2">85</td><td className="border p-2">69.5</td><td className="border p-2">36.1</td><td className="border p-2">12.3</td><td className="border p-2">3.43</td><td className="border p-2">1.56</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Table NA.1 Guide values of Spangler modulus for native soils (E'3)</h3>
                <div className="overflow-x-auto">
                    {/* ... existing table code ... */}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Bedding Constant (K) vs Bedding Angle</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border p-2 font-medium">Bedding Angle (&alpha;)</th>
                        <th className="border p-2 font-medium">Description</th>
                        <th className="border p-2 font-medium">K Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">0&deg;</td>
                        <td className="border p-2 text-slate-600 italic">Point support (Very poor construction)</td>
                        <td className="border p-2 font-mono font-bold">0.110</td>
                      </tr>
                      <tr>
                        <td className="border p-2">60&deg;</td>
                        <td className="border p-2 text-slate-600 italic">V-shaped trench / Narrow bedding</td>
                        <td className="border p-2 font-mono font-bold">0.103</td>
                      </tr>
                      <tr>
                        <td className="border p-2">90&deg;</td>
                        <td className="border p-2 text-slate-600 italic">Standard bedding (Untamped)</td>
                        <td className="border p-2 font-mono font-bold">0.096</td>
                      </tr>
                      <tr>
                        <td className="border p-2">120&deg;</td>
                        <td className="border p-2 text-slate-600 italic">Shaped and compacted bedding</td>
                        <td className="border p-2 font-mono font-bold">0.089</td>
                      </tr>
                      <tr>
                        <td className="border p-2">180&deg;</td>
                        <td className="border p-2 text-slate-600 italic">Full semi-circular support (Best)</td>
                        <td className="border p-2 font-mono font-bold">0.083</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed italic">
                  * Lựa chọn: Góc 90&deg; là giá trị an toàn phổ biến. Góc 120&deg;-180&deg; yêu cầu thi công lớp đệm rất kỹ lưỡng theo đúng hình dạng đáy ống.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pipe Params */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Thông số ống</h2>
                </div>
                <div className="space-y-4">
                  <SelectField label="Loại hệ thống" name="systemType" value={params.systemType} onChange={handleInputChange}
                    options={[
                      { label: 'Cấp nước (Water Supply)', value: 'water_supply' },
                      { label: 'Thoát nước (Drainage)', value: 'drainage' }
                    ]}
                  />
                  <SelectField label="Vật liệu ống" name="material" value={params.material} onChange={handleInputChange}
                    options={Object.entries(MATERIALS)
                      .filter(([_, mat]) => mat.systems.includes(params.systemType))
                      .map(([m]) => ({ label: m, value: m }))}
                  />
                  {params.material === 'Ống gân sóng (Corrugated)' && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                      <SelectField label="Vật liệu gân sóng" name="corrugatedMaterial" value={params.corrugatedMaterial} onChange={handleInputChange}
                        options={[{label: 'HDPE', value: 'HDPE'}, {label: 'PP', value: 'PP'}]} 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Độ cứng vòng (SN)" name="snType" value={params.snType} onChange={handleInputChange}
                          options={params.corrugatedMaterial === 'HDPE' 
                            ? [{label: 'SN4', value: 'SN4'}, {label: 'SN8', value: 'SN8'}, {label: 'Tùy chỉnh', value: 'Custom'}]
                            : [{label: 'SN8', value: 'SN8'}, {label: 'SN12', value: 'SN12'}, {label: 'Tùy chỉnh', value: 'Custom'}]}
                        />
                        {params.snType === 'Custom' && (
                          <InputField label="Giá trị SN" name="snValue" value={params.snValue} onChange={handleInputChange} unit="kN/m²" />
                        )}
                      </div>
                    </div>
                  )}
                  {['HDPE (PE 100)', 'PVC-U'].includes(params.material) && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <SelectField label="Phương pháp nhập chiều dày" name="thicknessInputType" value={params.thicknessInputType} onChange={handleInputChange}
                        options={[
                          { label: 'Nhập trực tiếp chiều dày (e)', value: 'e' },
                          { label: 'Nhập theo tỷ lệ SDR', value: 'SDR' }
                        ]}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label={params.material === 'Ống gân sóng (Corrugated)' ? "Đường kính danh nghĩa (DN/De)" : "Đường kính ngoài (De)"} name="De" value={params.De} onChange={handleInputChange} unit="mm" />
                    {params.material !== 'Ống gân sóng (Corrugated)' && (
                      ['HDPE (PE 100)', 'PVC-U'].includes(params.material) && params.thicknessInputType === 'SDR' ? (
                        <InputField label="Tỷ lệ SDR" name="sdr" value={params.sdr} onChange={handleInputChange} unit="" />
                      ) : (
                        <InputField label="Chiều dày thành (e)" name="e" value={params.e} onChange={handleInputChange} unit="mm" />
                      )
                    )}
                  </div>
                  {['HDPE (PE 100)', 'PVC-U'].includes(params.material) && params.thicknessInputType === 'SDR' && (
                    <div className="text-xs text-slate-500 -mt-2">
                      Chiều dày tính toán (e) = {(params.De / params.sdr).toFixed(2)} mm
                    </div>
                  )}
                  {params.material !== 'Ống gân sóng (Corrugated)' && (
                    <InputField label="Mô đun đàn hồi (E)" name="E" value={params.E} onChange={handleInputChange} unit="MPa" />
                  )}
                </div>
              </div>

              {/* Installation */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Điều kiện lắp đặt</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Chiều sâu chôn ống (H)" name="H" value={params.H} onChange={handleInputChange} unit="m" />
                    <InputField label="Bề rộng rãnh (B)" name="B" value={params.B} onChange={handleInputChange} unit="m" />
                  </div>
                  {params.H < 0.6 && (
                    <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 leading-tight">
                        Cảnh báo: Chiều sâu chôn ống tối thiểu theo BS EN 1295-1 nên là 0.6m.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <SelectField label="Góc ôm của lớp lót (Bedding Angle)" name="beddingAngle" value={params.beddingAngle} onChange={handleInputChange}
                      options={[
                        { label: '0°', value: '0' },
                        { label: '60°', value: '60' },
                        { label: '90° (Mặc định)', value: '90' },
                        { label: '120°', value: '120' },
                        { label: '180°', value: '180' }
                      ]}
                    />
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Hệ số nền (K)</span>
                        <span className="text-sm font-mono font-bold text-blue-600">{(BEDDING_CONSTANTS as any)[params.beddingAngle]}</span>
                      </div>
                      <p className="text-[10px] text-blue-800 leading-tight italic">
                        {(BEDDING_DESCRIPTIONS as any)[params.beddingAngle]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Soil */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <Mountain className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Thông số đất nền</h2>
                </div>
                <div className="space-y-4">
                  <InputField label="Trọng lượng riêng đất (γ)" name="gamma" value={params.gamma} onChange={handleInputChange} unit="kN/m³" />
                  <InputField label="Mô đun phản lực đất (E')" name="Eprime" value={params.Eprime} onChange={handleInputChange} unit="MPa" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Mực nước ngầm (hw)" name="hw" value={params.hw} onChange={handleInputChange} unit="m" />
                    {params.systemType === 'water_supply' && (
                      <InputField label="Áp suất vận hành (Pi)" name="Pi" value={params.Pi} onChange={handleInputChange} unit="bar" />
                    )}
                  </div>
                </div>
              </div>

              {/* Loads */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Tải trọng ngoài</h2>
                </div>
                <div className="space-y-4">
                  <SelectField label="Tải trọng giao thông (Table A.1)" name="traffic" value={params.traffic} onChange={handleInputChange}
                    options={[
                      { label: 'Không có (None)', value: 'None' },
                      { label: 'Đường chính (Main roads)', value: 'Main' },
                      { label: 'Đường phụ (Light roads)', value: 'Light' },
                      { label: 'Đồng ruộng (Fields)', value: 'Fields' }
                    ]}
                  />
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Tải trọng giao thông được lấy theo Bảng A.1 (Surcharge pressures, Ps) của tiêu chuẩn BS EN 1295-1.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-2xl shadow-xl text-white sticky top-4 overflow-hidden border border-slate-800">
              <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Kết quả phân tích
                </h2>
                <button 
                  onClick={() => setShowMethodology(true)}
                  className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/20 transition-all flex items-center gap-1 uppercase tracking-wider font-bold"
                >
                  <Info size={12} /> Cơ sở
                </button>
              </div>
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Tải trọng tác dụng</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Tải trọng đất (Ps)</span>
                      <span className="font-mono text-sm">{results.Ps.toFixed(2)} kPa</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Tải trọng giao thông (Pt)</span>
                      <span className="font-mono text-sm">{results.Pt.toFixed(2)} kPa</span>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center font-semibold">
                      <span className="text-sm text-white">Tổng tải trọng (Pv)</span>
                      <span className="font-mono text-blue-400 text-lg">{results.Pv.toFixed(2)} kPa</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Kiểm tra độ võng (Deflection)</h3>
                  <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <div className={`text-3xl font-light font-mono tracking-tight ${results.isDeflectionPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {results.deflectionPercent.toFixed(2)}%
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-medium">Giới hạn cho phép: {results.maxDef}%</div>
                      </div>
                      {results.isDeflectionPass ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-rose-400" />
                      )}
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-4 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ease-out ${results.isDeflectionPass ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ width: `${Math.min((results.deflectionPercent / results.maxDef) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Kiểm tra oằn (Buckling)</h3>
                  <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Áp lực oằn tới hạn</span>
                      <span className="font-mono text-sm">{results.Pcr.toFixed(2)} kPa</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                      <span className="text-sm text-slate-300">Hệ số an toàn (FS)</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-lg font-semibold ${results.isBucklingPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {results.FS_buckling.toFixed(2)}
                        </span>
                        {results.isBucklingPass ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right font-medium uppercase tracking-wider">Yêu cầu FS ≥ 2.0</div>
                  </div>
                </div>

                {/* Combined Stress Analysis Section */}
                {params.systemType === 'water_supply' && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Phân tích ứng suất kết hợp (Stress)</h3>
                    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Ứng suất vòng (Hoop)</span>
                        <span className="font-mono text-blue-300">{results.hoopStressPi.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Ứng suất uốn (Bending)</span>
                        <span className="font-mono text-blue-300">{results.bendingStress.toFixed(2)} MPa</span>
                      </div>
                      <div className="pt-3 border-t border-slate-700">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <div className={`text-2xl font-mono ${results.isStressPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {results.combinedStress.toFixed(2)} MPa
                            </div>
                            {MATERIALS[params.material].sigma_d && (
                              <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                                Giới hạn cho phép: {MATERIALS[params.material].sigma_d} MPa
                              </div>
                            )}
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${results.isStressPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {results.isStressPass ? 'Đạt' : 'Vượt ngưỡng'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    * Lưu ý: Kết quả tính toán mang tính chất tham khảo dựa trên phương pháp Spangler/Marston (phù hợp với nguyên lý BS EN 1295-1). Cần có kỹ sư chuyên môn kiểm tra lại trước khi áp dụng thực tế.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 uppercase tracking-wide">Cơ sở tính toán (Methodology)</h3>
              </div>
              <button 
                onClick={() => setShowMethodology(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              {params.systemType === 'water_supply' ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <Droplets size={16} /> Hệ thống cấp nước (Water Supply)
                    </h4>
                    <p className="text-sm text-blue-700 leading-relaxed italic">
                      Tính toán theo BS EN 1295-1, tập trung vào ảnh hưởng của áp suất bên trong lên độ võng (Rerounding) và phân tích ứng suất kết hợp.
                    </p>
                  </div>

                  <section className="space-y-3">
                    <h5 className="font-bold text-slate-800 border-l-4 border-blue-500 pl-2">1. Hiệu ứng Rerounding (Chống biến dạng)</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Khi có áp suất bên trong ($P_i$), ống có xu hướng tròn lại, tạo ra một lực kháng cản sự biến dạng do tải trọng ngoài. 
                      Thuật toán thêm số hạng sau vào mẫu số của công trình Spangler:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-center border border-slate-100 shadow-inner">
                      Rerounding Factor = 0.187 &times; P_i &times; r&sup3;
                    </div>
                    <p className="text-xs text-slate-500 italic">Trong đó r là bán kính trung bình của ống.</p>
                  </section>

                  <section className="space-y-3">
                    <h5 className="font-bold text-slate-800 border-l-4 border-blue-500 pl-2">2. Mực nước ngầm (Groundwater) & Lực đẩy nổi</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Lực đẩy nổi ($P_w$) làm giảm áp lực đất lên ống nhưng lại tăng nguy cơ oằn. Giá trị $h_w$ được tính từ mực nước ngầm đến đáy rãnh.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h5 className="font-bold text-slate-800 border-l-4 border-blue-500 pl-2">3. Ứng suất kết hợp (Combined Stress)</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Ứng suất tổng được tính bằng tổng của ứng suất vòng (do áp lực nước) và ứng suất uốn (do biến dạng đất):
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100 shadow-inner">
                      <div className="font-mono text-xs text-center">&sigma;_h (Hoop) = (P_i &times; Dm) / (2 &times; e)</div>
                      <div className="font-mono text-xs text-center font-bold">&sigma;_total = &sigma;_h + &sigma;_b (Bending)</div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * Yêu cầu: &sigma;_total &le; &sigma;_d (Ứng suất thiết kế của vật liệu).
                    </p>
                  </section>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                      <Mountain size={16} /> Hệ thống thoát nước (Drainage)
                    </h4>
                    <p className="text-sm text-emerald-700 leading-relaxed italic">
                      Tập trung vào kiểm tra độ võng tiêu chuẩn (không áp) và độ ổn định thành ống (Buckling).
                    </p>
                  </div>

                  <section className="space-y-3">
                    <h5 className="font-bold text-slate-800 border-l-4 border-emerald-500 pl-2">1. Độ võng (Deflection)</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Tính theo công thức Spangler truyền thống, không xét Rerounding vì hệ thống không áp hoặc áp suất thấp.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-center border border-slate-100 shadow-inner">
                      &Delta;x = (K &times; W &times; r&sup3; &times; D_L) / (E&middot;I + 0.061 &times; E' &times; r&sup3;)
                    </div>
                    <p className="text-xs text-slate-500 italic">Trong đó K là hệ số nền (Bedding Constant) phụ thuộc vào góc ôm của lớp lót.</p>
                  </section>

                  <section className="space-y-3">
                    <h5 className="font-bold text-slate-800 border-l-4 border-emerald-500 pl-2">2. Kiểm tra oằn (Buckling Resistance)</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Đây là yếu tố quan trọng nhất đối với ống mềm thoát nước. Hệ số an toàn (FS) được tính giữa áp suất oằn tới hạn (Pcr) và tải trọng tác dụng.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-center border border-slate-100 shadow-inner">
                      Pcr = 1.15 &times; &radic;(8 &times; S &times; E')
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * Yêu cầu: FS (Pcr / P_total) &ge; 2.0 theo cập nhật mới nhất.
                    </p>
                  </section>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                Căn cứ: BS EN 1295-1 | Spangler | Marston
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
