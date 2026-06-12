import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Calculator, FileDown, Settings, Droplets, Anchor, AlertTriangle, Weight, ListChecks, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import { calculateSinkingParameters, PipeParams } from './lib/calculations';
import { PrintableReport } from './components/PrintableReport';
import { VisualSimulation } from './components/VisualSimulation';

export default function App() {
  const [projectName, setProjectName] = useState('Dự án Đánh chìm ống HDPE');
  const [activeTab, setActiveTab] = useState<'calculator' | 'procedure' | 'simulation'>('calculator');
  const [params, setParams] = useState<PipeParams>({
    outerDiameter: 500,
    sdr: 26,
    material: 'PE80',
    eModShort: 800,
    eModLong: 150,
    sigmaAllow: 5.0,
    maxDepth: 50,
    waterDensity: 1025,
    concreteDensity: 2400,
    peDensity: 950,
    vCurrent: 1.0,
    airFillingRate: 25,
    frictionCoeff: 0.65,
    cD: 1.0,
    cL: 0.2,
    kOval: 0.65,
    nu: 0.4,
    weightSpacing: 3,
  });

  const results = calculateSinkingParameters(params);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bao_Cao_HDPE_${projectName.replace(/\s+/g, '_')}`,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <Anchor size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">HDPE Sinking Calculator</h1>
              <p className="text-slate-500 text-sm">Tính toán thông số đánh chìm ống nhựa PE dưới biển/sông</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <a
              href="/Tai_lieu_tham_khao_HDPE.md"
              download="Tai_lieu_tham_khao_HDPE.md"
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              <BookOpen size={18} />
              Tài liệu tham khảo
            </a>
            <button
              onClick={() => handlePrint()}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              <FileDown size={18} />
              Xuất báo cáo PDF
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-white text-indigo-600 border-t border-l border-r border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calculator size={18} />
            Tính toán thông số
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-white text-indigo-600 border-t border-l border-r border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers size={18} />
            Mô phỏng hình ảnh
          </button>
          <button
            onClick={() => setActiveTab('procedure')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'procedure'
                ? 'bg-white text-indigo-600 border-t border-l border-r border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ListChecks size={18} />
            Phương án thi công
          </button>
        </div>

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: MODULE 1 (INPUTS) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <Settings className="text-slate-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">MODULE 1: THÔNG SỐ ĐẦU VÀO</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên dự án</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>

                  {/* 1. Pipe Data */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm">1. Thông số ống (Pipe Data)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Đường kính ngoài (mm)</label>
                        <input type="number" name="outerDiameter" value={params.outerDiameter} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">SDR</label>
                        <input type="number" name="sdr" value={params.sdr} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Vật liệu</label>
                        <select name="material" value={params.material} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white">
                          <option value="PE80">PE80</option>
                          <option value="PE100">PE100</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Mật độ PE (kg/m³)</label>
                        <input type="number" name="peDensity" value={params.peDensity} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">E_short (MPa)</label>
                        <input type="number" name="eModShort" value={params.eModShort} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">E_long (MPa)</label>
                        <input type="number" name="eModLong" value={params.eModLong} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Sigma_allow (MPa)</label>
                        <input type="number" name="sigmaAllow" value={params.sigmaAllow} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Hệ số Poisson (ν)</label>
                        <input type="number" name="nu" value={params.nu} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* 2. Environment Data */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm">2. Thông số môi trường</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Độ sâu H_max (m)</label>
                        <input type="number" name="maxDepth" value={params.maxDepth} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Vận tốc dòng (m/s)</label>
                        <input type="number" name="vCurrent" value={params.vCurrent} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Tỷ trọng nước (kg/m³)</label>
                        <input type="number" name="waterDensity" value={params.waterDensity} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Tỷ trọng bê tông (kg/m³)</label>
                        <input type="number" name="concreteDensity" value={params.concreteDensity} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Loading Data */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm">3. Thông số gia tải</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Tỷ lệ điền khí a_a (%)</label>
                        <input type="number" name="airFillingRate" value={params.airFillingRate} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Khoảng cách quả tải (m)</label>
                        <input type="number" name="weightSpacing" value={params.weightSpacing} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Hệ số ma sát (μ)</label>
                        <input type="number" name="frictionCoeff" value={params.frictionCoeff} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Hệ số ô-van (k_oval)</label>
                        <input type="number" name="kOval" value={params.kOval} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Hệ số cản (C_D)</label>
                        <input type="number" name="cD" value={params.cD} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Hệ số nâng (C_L)</label>
                        <input type="number" name="cL" value={params.cL} onChange={handleInputChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Column: MODULE 2 & 3 (RESULTS) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* MODULE 2: SINKING CALCULATION */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <Calculator className="text-indigo-500" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">MODULE 2: TÍNH TOÁN THI CÔNG ĐÁNH CHÌM</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="text-indigo-600 text-xs font-semibold mb-1 uppercase tracking-wider">Lực kéo (P)</div>
                    <div className="text-2xl font-bold text-indigo-900">{results.pullingForce.toFixed(1)} <span className="text-sm font-medium text-indigo-500">kN</span></div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="text-indigo-600 text-xs font-semibold mb-1 uppercase tracking-wider">Lực căng max (T)</div>
                    <div className="text-2xl font-bold text-indigo-900">{results.maxTensionForce.toFixed(1)} <span className="text-sm font-medium text-indigo-500">kN</span></div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="text-indigo-600 text-xs font-semibold mb-1 uppercase tracking-wider">Áp suất khí (p)</div>
                    <div className="text-2xl font-bold text-indigo-900">{results.internalPressureBar.toFixed(2)} <span className="text-sm font-medium text-indigo-500">bar</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lực đơn vị */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Lực đơn vị</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">w1 (Trọng lượng chìm tịnh)</span>
                        <span className="font-medium text-sm">{results.w1.toFixed(1)} N/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">w2 (Lực nổi tịnh đoạn khí)</span>
                        <span className="font-medium text-sm">{results.w2.toFixed(1)} N/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Bán kính uốn cong (R_min)</span>
                        <span className="font-medium text-sm">{results.minBendingRadius.toFixed(1)} m</span>
                      </div>
                    </div>
                  </div>

                  {/* Quả tải bê tông */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Quả tải bê tông</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Trọng lượng ống (khô)</span>
                        <span className="font-medium text-sm">{results.pipeWeightAir.toFixed(1)} N/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Trọng lượng ống (chìm)</span>
                        <span className="font-medium text-sm">{results.pipeWeightSub.toFixed(1)} N/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Quả tải yêu cầu (chìm)</span>
                        <span className="font-medium text-sm">{results.concreteWeightSubRequired.toFixed(1)} N/m</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-slate-800 font-medium text-sm">Trọng lượng mỗi quả tải</span>
                        <span className="font-bold text-indigo-700">{results.concreteWeightPerBlockAir.toFixed(2)} kN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODULE 3: STABILITY & STRENGTH */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                  <ShieldCheck className="text-emerald-500" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">MODULE 3: KIỂM TRA ỔN ĐỊNH VÀ BỀN</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ổn định trượt */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Ổn định trượt (Sliding)</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Lực cản dòng chảy (F_D)</span>
                        <span className="font-medium text-sm">{results.fD.toFixed(1)} N/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Lực nâng (F_L)</span>
                        <span className="font-medium text-sm">{results.fL.toFixed(1)} N/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Lực nén đáy (F_N)</span>
                        <span className="font-medium text-sm">{results.fN.toFixed(1)} N/m</span>
                      </div>
                      <div className={`pt-2 border-t border-slate-200 flex justify-between items-center ${results.sfSliding >= 1.1 ? 'text-emerald-600' : 'text-red-600'}`}>
                        <span className="font-medium text-sm">Hệ số an toàn (SF)</span>
                        <span className="font-bold">{results.sfSliding.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Độ bền móp ống */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Độ bền móp ống (Buckling)</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Áp suất tới hạn (P_buckling)</span>
                        <span className="font-medium text-sm">{results.pBucklingBar.toFixed(2)} bar</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Áp suất ngoài (P_external)</span>
                        <span className="font-medium text-sm">{(params.maxDepth / 10).toFixed(2)} bar</span>
                      </div>
                      <div className={`pt-2 border-t border-slate-200 flex justify-between items-center mt-6 ${results.sfBuckling >= 2.0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        <span className="font-medium text-sm">Hệ số an toàn (SF)</span>
                        <span className="font-bold">{results.sfBuckling.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'procedure' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Phương Án Thi Công Đánh Chìm (Sinking Procedure)</h2>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">1</div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Chuẩn bị & Tổ hợp ống</h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600">
                    <li>Hàn nối các ống PE thành từng đoạn dài (thường từ 400m - 600m) trên bờ hoặc khu vực mặt nước khuất sóng gió.</li>
                    <li>Lắp đặt các khối gia tải (quả tải bê tông) vào ống theo khoảng cách đã tính toán ({params.weightSpacing}m). Sử dụng đệm cao su (EPDM) giữa ống và khối bê tông để tránh xước và tăng ma sát.</li>
                    <li>Lắp mặt bích mù (blind flange) ở hai đầu đoạn ống. Đầu ngoài cùng lắp thêm hệ thống van xả khí, van cấp nước và kết nối với máy nén khí.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">2</div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Lai dắt & Định vị</h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600">
                    <li>Bơm khí vào ống để ống nổi hoàn toàn trên mặt nước.</li>
                    <li>Dùng tàu kéo (tugboat) lai dắt đoạn ống ra vị trí lắp đặt. Tuyến ống phải được đánh dấu sẵn bằng phao nổi trên mặt nước.</li>
                    <li>Kết nối đầu trong của ống với hố ga/mặt bích chờ sẵn trên bờ.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">3</div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Quá trình đánh chìm (Sinking)</h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600">
                    <li>Tác dụng lực kéo (P = {results.pullingForce.toFixed(1)} kN) liên tục ở đầu ngoài cùng của ống bằng tàu kéo để duy trì bán kính uốn cong (R &gt; {results.minBendingRadius.toFixed(1)} m), tránh gập gãy ống.</li>
                    <li>Bơm áp suất khí bên trong (p = {results.internalPressureBar.toFixed(2)} bar) tương ứng với độ sâu để cân bằng lực nổi và trọng lượng, tránh ống chìm quá nhanh.</li>
                    <li>Mở van xả khí từ từ ở đầu ngoài, đồng thời cho nước đi vào từ đầu trong.</li>
                    <li>Kiểm soát quá trình đánh chìm tạo thành hình chữ S (S-bend) từ mặt nước xuống đáy.</li>
                    <li className="text-red-600 font-medium">Lưu ý quan trọng: Quá trình đánh chìm phải diễn ra liên tục. Nếu phải dừng, cần bơm khí ngược lại trong vòng 15 phút để ống nổi lên, tránh mỏi vật liệu gây gập ống.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">4</div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Tiếp đáy & Hoàn thiện</h3>
                  <ul className="list-disc pl-5 space-y-2 text-slate-600">
                    <li>Khi đoạn ống cuối cùng chạm đáy, giảm dần lực kéo (P) về 0.</li>
                    <li>Thợ lặn tiến hành tháo mặt bích mù và hệ thống van.</li>
                    <li>Tiến hành lấp hào (nếu có thiết kế) hoặc cố định các vị trí cần thiết.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <VisualSimulation params={params} results={results} />
        )}

      </div>

      {/* Hidden Printable Component */}
      <div className="hidden">
        <PrintableReport 
          ref={printRef} 
          params={params} 
          results={results} 
          projectName={projectName} 
        />
      </div>
    </div>
  );
}
