import React, { useState } from 'react';
import { Ruler, Clock, Thermometer, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { SocketFusionData } from '../types';

// Standard data reference (approximate DVS 2207-11 / Manufacturer standards)
const SOCKET_DATA: SocketFusionData[] = [
  { diameter: 20, heatingTime: 5, processingTime: 4, coolingTime: 2, insertionDepth: 14 },
  { diameter: 25, heatingTime: 7, processingTime: 4, coolingTime: 2, insertionDepth: 16 },
  { diameter: 32, heatingTime: 8, processingTime: 6, coolingTime: 4, insertionDepth: 20 },
  { diameter: 40, heatingTime: 12, processingTime: 6, coolingTime: 4, insertionDepth: 22 },
  { diameter: 50, heatingTime: 18, processingTime: 6, coolingTime: 4, insertionDepth: 24 },
  { diameter: 63, heatingTime: 24, processingTime: 8, coolingTime: 6, insertionDepth: 26 },
  { diameter: 75, heatingTime: 30, processingTime: 8, coolingTime: 8, insertionDepth: 28 },
  { diameter: 90, heatingTime: 40, processingTime: 8, coolingTime: 8, insertionDepth: 31 },
  { diameter: 110, heatingTime: 50, processingTime: 10, coolingTime: 8, insertionDepth: 33 },
];

const SocketFusion: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<number>(25);

  const currentData = SOCKET_DATA.find(d => d.diameter === selectedSize) || SOCKET_DATA[0];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Hàn Lồng (Socket Fusion)</h2>
        <p className="text-slate-600">Áp dụng cho ống PPR và HDPE đường kính nhỏ (≤ 110mm)</p>
      </div>

      {/* Selector & Dashboard */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-6 h-6" />
            <span className="font-semibold text-lg">Chọn Đường Kính Ống (mm):</span>
          </div>
          <select 
            value={selectedSize}
            onChange={(e) => setSelectedSize(Number(e.target.value))}
            className="bg-blue-700 text-white border border-blue-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white font-mono text-lg"
          >
            {SOCKET_DATA.map((d) => (
              <option key={d.diameter} value={d.diameter}>DN {d.diameter}</option>
            ))}
          </select>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-slate-500 text-sm">Thời gian gia nhiệt</span>
            <span className="text-3xl font-bold text-slate-800">{currentData.heatingTime} <span className="text-lg font-normal">giây</span></span>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-amber-500 mb-2" />
            <span className="text-slate-500 text-sm">Thời gian thao tác tối đa</span>
            <span className="text-3xl font-bold text-slate-800">{currentData.processingTime} <span className="text-lg font-normal">giây</span></span>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-blue-500 mb-2" />
            <span className="text-slate-500 text-sm">Thời gian làm nguội</span>
            <span className="text-3xl font-bold text-slate-800">{currentData.coolingTime} <span className="text-lg font-normal">phút</span></span>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
            <Ruler className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="text-slate-500 text-sm">Chiều sâu lồng ống</span>
            <span className="text-3xl font-bold text-slate-800">{currentData.insertionDepth} <span className="text-lg font-normal">mm</span></span>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex flex-col items-center justify-center text-center lg:col-span-4">
            <Thermometer className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-slate-500 text-sm">Nhiệt độ hàn khuyến nghị</span>
            <span className="text-2xl font-bold text-blue-800">250 - 270 °C</span>
            <span className="text-xs text-blue-600 font-medium mt-1">Tối ưu: 255 - 260 °C (Áp dụng cho cả PPR & HDPE)</span>
          </div>
        </div>
      </div>

      {/* Visual Guide Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-600" /> Quy trình chuẩn bị
          </h3>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">1.</span>
              Cắt ống vuông góc bằng kéo cắt chuyên dụng.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">2.</span>
              Vệ sinh sạch bề mặt ống và phụ kiện bằng cồn hoặc khăn sạch.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">3.</span>
              Đánh dấu chiều sâu lồng ống <strong>({currentData.insertionDepth}mm)</strong> lên đầu ống.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">4.</span>
              Kiểm tra nhiệt độ máy hàn (Khuyến nghị: 250 - 270°C cho cả PPR và HDPE).
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" /> Lưu ý quan trọng
          </h3>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              Không xoay ống khi đưa vào đầu hàn hoặc khi rút ra.
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              Nếu gia nhiệt quá lâu, ống sẽ bị biến dạng gây tắc nghẽn dòng chảy.
            </li>
            <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              Giữ cố định mối hàn trong suốt thời gian làm nguội.
            </li>
             <li className="flex gap-2">
              <span className="text-orange-500">•</span>
              Không dùng nước để làm nguội nhanh mối hàn.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SocketFusion;
