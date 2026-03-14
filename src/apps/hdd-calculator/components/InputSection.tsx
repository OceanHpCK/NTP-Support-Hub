import React from 'react';
import { PipeParams, BorePathParams, MaterialGrade, SDR_VALUES, CrossingType, SoilType } from '../types';

interface InputSectionProps {
  pipe: PipeParams;
  setPipe: (p: PipeParams) => void;
  path: BorePathParams;
  setPath: (p: BorePathParams) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ pipe, setPipe, path, setPath }) => {
  
  const handleChangePipe = (field: keyof PipeParams, value: any) => {
    setPipe({ ...pipe, [field]: value });
  };

  const handleChangePath = (field: keyof BorePathParams, value: any) => {
    setPath({ ...path, [field]: value });
  };

  const handleSoilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as SoilType;
    let friction = 0.3;
    // Auto-suggest friction based on soil type
    switch (type) {
        case SoilType.Clay: friction = 0.25; break;
        case SoilType.Sand: friction = 0.35; break;
        case SoilType.Gravel: friction = 0.45; break;
        case SoilType.Rock: friction = 0.55; break;
    }
    setPath({ ...path, soilType: type, soilFriction: friction });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Pipe Parameters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">1</span>
          Thông số ống HDPE
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vật liệu</label>
            <div className="flex gap-4">
              {[MaterialGrade.PE100, MaterialGrade.PE80].map((m) => (
                <button
                  key={m}
                  onClick={() => handleChangePipe('material', m)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${
                    pipe.material === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đường kính ngoài (mm)</label>
              <input
                type="number"
                value={pipe.outerDiameter}
                onChange={(e) => handleChangePipe('outerDiameter', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SDR</label>
              <select
                value={pipe.sdr}
                onChange={(e) => handleChangePipe('sdr', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SDR_VALUES.map((val) => (
                  <option key={val} value={val}>
                    SDR {val}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn chảy (MPa)</label>
             <input
                type="number"
                value={pipe.yieldStrength}
                onChange={(e) => handleChangePipe('yieldStrength', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">PE100 ~ 23-26 MPa. PE80 ~ 18-20 MPa.</p>
          </div>
        </div>
      </div>

      {/* Bore Path Parameters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 text-sm">2</span>
          Thông số tuyến khoan & Địa chất
        </h3>
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại vượt chướng ngại</label>
                <select
                    value={path.crossingType}
                    onChange={(e) => handleChangePath('crossingType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                >
                    <option value={CrossingType.Standard}>Thông thường</option>
                    <option value={CrossingType.River}>Vượt sông/Kênh (River Crossing)</option>
                    <option value={CrossingType.Road}>Vượt đường giao thông (Road Crossing)</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chất chủ đạo</label>
                <select
                    value={path.soilType}
                    onChange={handleSoilChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                >
                    <option value={SoilType.Clay}>Đất sét (Clay)</option>
                    <option value={SoilType.Sand}>Cát (Sand)</option>
                    <option value={SoilType.Gravel}>Sỏi/Đá dăm (Gravel)</option>
                    <option value={SoilType.Rock}>Đá cứng (Rock)</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chiều dài khoan (m)</label>
              <input
                type="number"
                value={path.totalLength}
                onChange={(e) => handleChangePath('totalLength', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Độ sâu max (m)</label>
              <input
                type="number"
                value={path.depth}
                onChange={(e) => handleChangePath('depth', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Góc vào (độ)</label>
              <input
                type="number"
                value={path.entryAngle}
                onChange={(e) => handleChangePath('entryAngle', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Góc ra (độ)</label>
              <input
                type="number"
                value={path.exitAngle}
                onChange={(e) => handleChangePath('exitAngle', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hệ số ma sát đất</label>
              <input
                type="number"
                step="0.05"
                value={path.soilFriction}
                onChange={(e) => handleChangePath('soilFriction', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Đề xuất: {path.soilType === SoilType.Clay ? '0.2-0.3' : path.soilType === SoilType.Sand ? '0.3-0.4' : path.soilType === SoilType.Rock ? '0.5-0.6' : '0.4-0.5'}</p>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ trọng dung dịch (kg/m3)</label>
              <input
                type="number"
                value={path.mudDensity}
                onChange={(e) => handleChangePath('mudDensity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Bentonite: 1050 - 1200</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSection;