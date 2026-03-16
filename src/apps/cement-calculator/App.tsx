import React, { useState } from 'react';
import { Calculator, Droplet, Info, Package, ArrowRight, CheckCircle2, Plus, Trash2, ListPlus, Wrench } from 'lucide-react';

const pipeData: Record<number, number> = {
  21: 1, 27: 1, 34: 1, 42: 2, 48: 2, 60: 4, 75: 6, 90: 8, 110: 11,
  125: 13, 140: 16, 160: 20, 180: 25, 200: 30, 225: 37, 250: 45,
  280: 55, 315: 68, 355: 86, 400: 107, 450: 141, 500: 173, 560: 263,
  630: 391, 710: 485, 800: 558
};

const packagingSizes = [
  { label: 'Tuýp 15g', value: 15 },
  { label: 'Tuýp 30g', value: 30 },
  { label: 'Tuýp 50g', value: 50 },
  { label: 'Lon 100g', value: 100 },
  { label: 'Lon 200g', value: 200 },
  { label: 'Lon 500g', value: 500 },
  { label: 'Lon 1000g (1kg)', value: 1000 },
];

interface ProjectItem {
  id: string;
  pipeSize: number;
  joints: number;
}

interface FittingItem {
  id: string;
  pipeSize: number;
  sockets: number;
  quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'calc-cement' | 'calc-joints' | 'calc-project' | 'calc-fittings'>('calc-cement');
  const [showTable, setShowTable] = useState(false);
  
  // State for Mode 1: Calculate Cement
  const [m1PipeSize, setM1PipeSize] = useState<number>(21);
  const [m1Joints, setM1Joints] = useState<number>(100);
  const [m1PackageSize, setM1PackageSize] = useState<number>(500);

  // State for Mode 2: Calculate Joints
  const [m2PipeSize, setM2PipeSize] = useState<number>(21);
  const [m2Amount, setM2Amount] = useState<number>(500); // in grams

  // State for Mode 3: Calculate Project
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([
    { id: '1', pipeSize: 21, joints: 100 }
  ]);
  const [m3PackageSize, setM3PackageSize] = useState<number>(500);

  // State for Mode 4: Calculate Fittings
  const [fittingItems, setFittingItems] = useState<FittingItem[]>([
    { id: '1', pipeSize: 21, sockets: 2, quantity: 10 }
  ]);
  const [m4PackageSize, setM4PackageSize] = useState<number>(500);

  // Calculations
  const m1TotalGrams = pipeData[m1PipeSize] * m1Joints;
  const m1PackagesNeeded = Math.ceil(m1TotalGrams / m1PackageSize);

  const m2TotalJoints = Math.floor(m2Amount / pipeData[m2PipeSize]);

  const addProjectItem = () => {
    setProjectItems([
      ...projectItems, 
      { id: Date.now().toString(), pipeSize: 21, joints: 10 }
    ]);
  };

  const removeProjectItem = (id: string) => {
    if (projectItems.length > 1) {
      setProjectItems(projectItems.filter(item => item.id !== id));
    }
  };

  const updateProjectItem = (id: string, field: keyof ProjectItem, value: number) => {
    setProjectItems(projectItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const m3TotalGrams = projectItems.reduce((total, item) => {
    return total + (pipeData[item.pipeSize] * item.joints);
  }, 0);
  
  const m3PackagesNeeded = Math.ceil(m3TotalGrams / m3PackageSize);

  const addFittingItem = () => {
    setFittingItems([
      ...fittingItems, 
      { id: Date.now().toString(), pipeSize: 21, sockets: 2, quantity: 10 }
    ]);
  };

  const removeFittingItem = (id: string) => {
    if (fittingItems.length > 1) {
      setFittingItems(fittingItems.filter(item => item.id !== id));
    }
  };

  const updateFittingItem = (id: string, field: keyof FittingItem, value: number) => {
    setFittingItems(fittingItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const m4TotalGrams = fittingItems.reduce((total, item) => {
    return total + (pipeData[item.pipeSize] * item.sockets * item.quantity);
  }, 0);
  
  const m4PackagesNeeded = Math.ceil(m4TotalGrams / m4PackageSize);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-8">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-4">
            <Droplet className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Tiền Phong Cement Calculator
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Phần mềm tính toán lượng keo dán ống Nhựa Tiền Phong dựa trên định mức tiêu chuẩn cho từng kích cỡ ống.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-wrap border-b border-slate-200">
            <button 
              className={`flex-1 py-4 px-3 md:px-6 text-sm md:text-base font-medium text-center transition-colors whitespace-nowrap ${activeTab === 'calc-cement' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('calc-cement')}
            >
              Tính 1 loại ống
            </button>
            <button 
              className={`flex-1 py-4 px-3 md:px-6 text-sm md:text-base font-medium text-center transition-colors whitespace-nowrap ${activeTab === 'calc-project' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('calc-project')}
            >
              Tính theo dự án
            </button>
            <button 
              className={`flex-1 py-4 px-3 md:px-6 text-sm md:text-base font-medium text-center transition-colors whitespace-nowrap ${activeTab === 'calc-fittings' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('calc-fittings')}
            >
              Tính theo dự án (2)
            </button>
            <button 
              className={`flex-1 py-4 px-3 md:px-6 text-sm md:text-base font-medium text-center transition-colors whitespace-nowrap ${activeTab === 'calc-joints' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('calc-joints')}
            >
              Tính số mối nối
            </button>
          </div>
          
          <div className="p-6 md:p-8">
            {activeTab === 'calc-cement' && (
              <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Đường kính ống (DN)</label>
                    <select 
                      className="w-full rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                      value={m1PipeSize}
                      onChange={(e) => setM1PipeSize(Number(e.target.value))}
                    >
                      {Object.keys(pipeData).map(size => (
                        <option key={size} value={size}>DN {size} mm</option>
                      ))}
                    </select>
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      Định mức: <span className="font-semibold text-emerald-600">{pipeData[m1PipeSize]}g / mối nối</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số lượng mối nối</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                      value={m1Joints}
                      onChange={(e) => setM1Joints(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quy cách đóng gói dự kiến</label>
                    <select 
                      className="w-full rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                      value={m1PackageSize}
                      onChange={(e) => setM1PackageSize(Number(e.target.value))}
                    >
                      {packagingSizes.map(pkg => (
                        <option key={pkg.value} value={pkg.value}>{pkg.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-emerald-50/50 rounded-2xl p-6 md:p-8 border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator className="w-24 h-24 text-emerald-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-emerald-900 mb-6 flex items-center gap-2 relative z-10">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    Kết quả tính toán
                  </h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-sm font-medium text-emerald-800/70 mb-2">Tổng lượng keo cần thiết</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-emerald-700 tracking-tight">{m1TotalGrams.toLocaleString()}</span>
                        <span className="text-xl font-medium text-emerald-700/70">gram</span>
                      </div>
                      {m1TotalGrams >= 1000 && (
                        <p className="text-sm text-emerald-600 font-medium mt-2 bg-emerald-100 inline-block px-2.5 py-1 rounded-md">
                          ~ {(m1TotalGrams / 1000).toFixed(2)} kg
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-6 border-t border-emerald-200/60">
                      <p className="text-sm font-medium text-emerald-800/70 mb-3">Tương đương khoảng</p>
                      <div className="flex items-center gap-4 bg-white/60 p-4 rounded-xl border border-emerald-100">
                        <div className="bg-emerald-100 p-2.5 rounded-lg">
                          <Package className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-emerald-900">{m1PackagesNeeded}</span>
                          <span className="text-emerald-700 font-medium ml-2">{packagingSizes.find(p => p.value === m1PackageSize)?.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calc-project' && (
              <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                {/* Inputs */}
                <div className="md:col-span-7 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <ListPlus className="w-5 h-5 text-emerald-600" />
                      Danh sách ống trong dự án
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Header for list */}
                    <div className="grid grid-cols-12 gap-4 px-2 text-sm font-medium text-slate-500 hidden sm:grid">
                      <div className="col-span-5">Đường kính ống (DN)</div>
                      <div className="col-span-5">Số lượng mối nối</div>
                      <div className="col-span-2 text-center">Xóa</div>
                    </div>

                    {projectItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end sm:items-center bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border border-slate-200 sm:border-none">
                        <div className="sm:col-span-5">
                          <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">Đường kính ống</label>
                          <select 
                            className="w-full rounded-xl border-slate-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                            value={item.pipeSize}
                            onChange={(e) => updateProjectItem(item.id, 'pipeSize', Number(e.target.value))}
                          >
                            {Object.keys(pipeData).map(size => (
                              <option key={size} value={size}>DN {size} mm ({pipeData[Number(size)]}g/mối)</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="sm:col-span-5">
                          <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">Số lượng mối nối</label>
                          <input 
                            type="number" 
                            min="1"
                            className="w-full rounded-xl border-slate-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                            value={item.joints}
                            onChange={(e) => updateProjectItem(item.id, 'joints', Number(e.target.value))}
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end sm:justify-center">
                          <button 
                            onClick={() => removeProjectItem(item.id)}
                            disabled={projectItems.length === 1}
                            className={`p-3 rounded-xl transition-colors ${projectItems.length === 1 ? 'text-slate-300 bg-slate-100 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 hover:text-red-600'}`}
                            title="Xóa mục này"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addProjectItem}
                    className="w-full py-3.5 border-2 border-dashed border-emerald-200 text-emerald-600 font-medium rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm loại ống khác
                  </button>

                  <div className="pt-6 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quy cách đóng gói dự kiến</label>
                    <select 
                      className="w-full rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                      value={m3PackageSize}
                      onChange={(e) => setM3PackageSize(Number(e.target.value))}
                    >
                      {packagingSizes.map(pkg => (
                        <option key={pkg.value} value={pkg.value}>{pkg.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                <div className="md:col-span-5 bg-emerald-50/50 rounded-2xl p-6 md:p-8 border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator className="w-24 h-24 text-emerald-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-emerald-900 mb-6 flex items-center gap-2 relative z-10">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    Tổng kết dự án
                  </h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-sm font-medium text-emerald-800/70 mb-2">Tổng lượng keo cho toàn dự án</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-emerald-700 tracking-tight">{m3TotalGrams.toLocaleString()}</span>
                        <span className="text-xl font-medium text-emerald-700/70">gram</span>
                      </div>
                      {m3TotalGrams >= 1000 && (
                        <p className="text-sm text-emerald-600 font-medium mt-2 bg-emerald-100 inline-block px-2.5 py-1 rounded-md">
                          ~ {(m3TotalGrams / 1000).toFixed(2)} kg
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-6 border-t border-emerald-200/60">
                      <p className="text-sm font-medium text-emerald-800/70 mb-3">Tương đương khoảng</p>
                      <div className="flex items-center gap-4 bg-white/60 p-4 rounded-xl border border-emerald-100">
                        <div className="bg-emerald-100 p-2.5 rounded-lg">
                          <Package className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-emerald-900">{m3PackagesNeeded}</span>
                          <span className="text-emerald-700 font-medium ml-2">{packagingSizes.find(p => p.value === m3PackageSize)?.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calc-fittings' && (
              <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                {/* Inputs */}
                <div className="md:col-span-7 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-emerald-600" />
                      Danh sách sản phẩm
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Header for list */}
                    <div className="grid grid-cols-12 gap-4 px-2 text-sm font-medium text-slate-500 hidden sm:grid">
                      <div className="col-span-4">Đường kính (DN)</div>
                      <div className="col-span-3">Số đầu nong</div>
                      <div className="col-span-3">Số lượng</div>
                      <div className="col-span-2 text-center">Xóa</div>
                    </div>

                    {fittingItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end sm:items-center bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border border-slate-200 sm:border-none">
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">Đường kính (DN)</label>
                          <select 
                            className="w-full rounded-xl border-slate-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                            value={item.pipeSize}
                            onChange={(e) => updateFittingItem(item.id, 'pipeSize', Number(e.target.value))}
                          >
                            {Object.keys(pipeData).map(size => (
                              <option key={size} value={size}>DN {size} mm</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">Số đầu nong (VD: Cút=2, Tê=3)</label>
                          <input 
                            type="number" 
                            min="1"
                            className="w-full rounded-xl border-slate-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                            value={item.sockets}
                            onChange={(e) => updateFittingItem(item.id, 'sockets', Number(e.target.value))}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">Số lượng sản phẩm</label>
                          <input 
                            type="number" 
                            min="1"
                            className="w-full rounded-xl border-slate-300 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                            value={item.quantity}
                            onChange={(e) => updateFittingItem(item.id, 'quantity', Number(e.target.value))}
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end sm:justify-center">
                          <button 
                            onClick={() => removeFittingItem(item.id)}
                            disabled={fittingItems.length === 1}
                            className={`p-3 rounded-xl transition-colors ${fittingItems.length === 1 ? 'text-slate-300 bg-slate-100 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 hover:text-red-600'}`}
                            title="Xóa mục này"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addFittingItem}
                    className="w-full py-3.5 border-2 border-dashed border-emerald-200 text-emerald-600 font-medium rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm sản phẩm khác
                  </button>

                  <div className="pt-6 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quy cách đóng gói dự kiến</label>
                    <select 
                      className="w-full rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                      value={m4PackageSize}
                      onChange={(e) => setM4PackageSize(Number(e.target.value))}
                    >
                      {packagingSizes.map(pkg => (
                        <option key={pkg.value} value={pkg.value}>{pkg.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                <div className="md:col-span-5 bg-emerald-50/50 rounded-2xl p-6 md:p-8 border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator className="w-24 h-24 text-emerald-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-emerald-900 mb-6 flex items-center gap-2 relative z-10">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    Tổng kết dự án
                  </h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-sm font-medium text-emerald-800/70 mb-2">Tổng lượng keo cho sản phẩm</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-emerald-700 tracking-tight">{m4TotalGrams.toLocaleString()}</span>
                        <span className="text-xl font-medium text-emerald-700/70">gram</span>
                      </div>
                      {m4TotalGrams >= 1000 && (
                        <p className="text-sm text-emerald-600 font-medium mt-2 bg-emerald-100 inline-block px-2.5 py-1 rounded-md">
                          ~ {(m4TotalGrams / 1000).toFixed(2)} kg
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-6 border-t border-emerald-200/60">
                      <p className="text-sm font-medium text-emerald-800/70 mb-3">Tương đương khoảng</p>
                      <div className="flex items-center gap-4 bg-white/60 p-4 rounded-xl border border-emerald-100">
                        <div className="bg-emerald-100 p-2.5 rounded-lg">
                          <Package className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-emerald-900">{m4PackagesNeeded}</span>
                          <span className="text-emerald-700 font-medium ml-2">{packagingSizes.find(p => p.value === m4PackageSize)?.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calc-joints' && (
              <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Đường kính ống (DN)</label>
                    <select 
                      className="w-full rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                      value={m2PipeSize}
                      onChange={(e) => setM2PipeSize(Number(e.target.value))}
                    >
                      {Object.keys(pipeData).map(size => (
                        <option key={size} value={size}>DN {size} mm</option>
                      ))}
                    </select>
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      Định mức: <span className="font-semibold text-emerald-600">{pipeData[m2PipeSize]}g / mối nối</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Lượng keo hiện có (gram)</label>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        min="1"
                        className="flex-1 rounded-xl border-slate-300 border p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                        value={m2Amount}
                        onChange={(e) => setM2Amount(Number(e.target.value))}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {packagingSizes.map(pkg => (
                        <button
                          key={pkg.value}
                          onClick={() => setM2Amount(pkg.value)}
                          className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors border border-transparent hover:border-emerald-200"
                        >
                          + {pkg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-emerald-50/50 rounded-2xl p-6 md:p-8 border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator className="w-24 h-24 text-emerald-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-emerald-900 mb-6 flex items-center gap-2 relative z-10">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    Kết quả tính toán
                  </h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-sm font-medium text-emerald-800/70 mb-2">Số mối nối có thể thực hiện</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold text-emerald-700 tracking-tight">{m2TotalJoints.toLocaleString()}</span>
                        <span className="text-xl font-medium text-emerald-700/70">mối nối</span>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-emerald-200/60">
                      <p className="text-sm font-medium text-emerald-800/80 flex items-start gap-2 bg-white/60 p-4 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Dựa trên định mức <strong>{pipeData[m2PipeSize]}g/mối</strong> cho ống <strong>DN {m2PipeSize}</strong>. Lượng keo dư: <strong>{m2Amount % pipeData[m2PipeSize]}g</strong>.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button 
            className="w-full p-5 md:p-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition-colors"
            onClick={() => setShowTable(!showTable)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Bảng tra cứu định mức keo dán (Tham khảo)</h2>
            </div>
            <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showTable ? 'rotate-90' : ''}`} />
          </button>
          
          {showTable && (
            <div className="p-5 md:p-6 border-t border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {Object.entries(pipeData).map(([dn, grams]) => (
                  <div key={dn} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:border-emerald-300 transition-colors">
                    <span className="font-medium text-slate-600 text-sm">DN {dn}</span>
                    <span className="text-emerald-600 font-bold">{grams}g</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Số liệu mang tính chất tham khảo dựa trên tiêu chuẩn của Nhựa Tiền Phong. Lượng keo thực tế có thể thay đổi tùy theo điều kiện thi công, nhiệt độ môi trường và tay nghề thợ.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
