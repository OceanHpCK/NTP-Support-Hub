import React, { useMemo, useState } from 'react';
import { Activity, Calculator, Gauge, Layers, Ruler, Scale, Settings, Sigma } from 'lucide-react';
import type { PipeStiffnessInput } from './types';
import {
  DEFAULT_PIPE_STIFFNESS_INPUT,
  PIPE_MATERIAL_PRESETS,
  calculatePipeStiffness,
  formatNumber,
} from './lib/calculations';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const labelClass = 'mb-2 block text-sm font-bold text-slate-700';

const App: React.FC = () => {
  const [input, setInput] = useState<PipeStiffnessInput>(DEFAULT_PIPE_STIFFNESS_INPUT);

  const result = useMemo(() => calculatePipeStiffness(input), [input]);

  const updateNumber = (field: keyof PipeStiffnessInput, value: string) => {
    const parsed = Number(value);
    setInput((current) => ({
      ...current,
      [field]: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
    }));
  };

  const selectPreset = (presetId: string) => {
    const preset = PIPE_MATERIAL_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setInput((current) => ({
      ...current,
      material: preset.material,
      grade: preset.grade,
      youngModulusMpa: preset.youngModulusMpa,
      densityKgM3: preset.densityKgM3,
      mrsMpa: preset.mrsMpa,
    }));
  };

  const selectedPresetId =
    PIPE_MATERIAL_PRESETS.find(
      (preset) =>
        preset.material === input.material &&
        preset.grade === input.grade &&
        preset.youngModulusMpa === input.youngModulusMpa &&
        preset.densityKgM3 === input.densityKgM3,
    )?.id ?? 'custom';

  const isValid =
    input.outsideDiameterMm > 0 &&
    input.sdr > 0 &&
    input.youngModulusMpa > 0 &&
    input.densityKgM3 > 0;

  const resultCards = [
    {
      label: 'SN ngắn hạn',
      value: formatNumber(result.ringStiffnessKpa, 2),
      unit: 'kPa',
      icon: Gauge,
      accent: 'text-blue-700',
    },
    {
      label: 'Chiều dày e',
      value: formatNumber(result.wallThicknessMm, 2),
      unit: 'mm',
      icon: Ruler,
      accent: 'text-cyan-700',
    },
    {
      label: 'Khối lượng TB',
      value: formatNumber(result.averageWeightKgM, 2),
      unit: 'kg/m',
      icon: Scale,
      accent: 'text-emerald-700',
    },
    {
      label: 'SN dài hạn tham khảo',
      value: `${formatNumber(result.longTermRingStiffnessRangeKpa.min, 2)} - ${formatNumber(result.longTermRingStiffnessRangeKpa.max, 2)}`,
      unit: 'kPa',
      icon: Activity,
      accent: 'text-amber-700',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/80">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
              <Sigma className="h-4 w-4" />
              Pipe stiffness & weight
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Tính toán độ cứng vòng ống
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Chuyển đổi bảng Excel “Pipe Stiffness & Weight Spreadsheet” thành công cụ tính nhanh SN,
              chiều dày thành ống và khối lượng theo OD, SDR, mô đun đàn hồi E và khối lượng riêng.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Công thức chính</p>
            <p className="mt-3 text-2xl font-black">SN = E × I / Dav³ × 1000</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Dùng π = 3.142 để khớp phương pháp tính trong file Excel gốc.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/80 lg:col-span-4">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Thông số đầu vào</h2>
              <p className="text-xs text-slate-500">Các ô màu vàng trong Excel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Vật liệu / Grade</label>
              <select value={selectedPresetId} onChange={(event) => selectPreset(event.target.value)} className={inputClass}>
                {PIPE_MATERIAL_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.material} - {preset.grade}
                  </option>
                ))}
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>OD (mm)</label>
                <input type="number" min="1" value={input.outsideDiameterMm} onChange={(event) => updateNumber('outsideDiameterMm', event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>SDR</label>
                <input type="number" min="1" step="0.1" value={input.sdr} onChange={(event) => updateNumber('sdr', event.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>E (MPa)</label>
                <input type="number" min="1" value={input.youngModulusMpa} onChange={(event) => updateNumber('youngModulusMpa', event.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Density (kg/m³)</label>
                <input type="number" min="1" value={input.densityKgM3} onChange={(event) => updateNumber('densityKgM3', event.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          {!isValid && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Vui lòng nhập OD, SDR, E và Density lớn hơn 0 để kết quả có ý nghĩa.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {resultCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{card.label}</p>
                  </div>
                  <p className={`text-2xl font-black tracking-tight ${card.accent}`}>{card.value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">{card.unit}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/80">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Chi tiết tính toán</h2>
                <p className="text-xs text-slate-500">Theo cấu trúc cột trong file Excel</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['e - Chiều dày thành ống', `${formatNumber(result.wallThicknessMm, 3)} mm`],
                ['Dav - Đường kính trung bình', `${formatNumber(result.averageDiameterMm, 3)} mm`],
                ['I - Moment quán tính', `${formatNumber(result.momentOfInertiaMm4PerMm, 3)} mm⁴/mm`],
                ['X-Area - Diện tích thành ống', `${formatNumber(result.crossSectionAreaM2, 6)} m²`],
                ['Min. Weight', `${formatNumber(result.minimumWeightKgM, 3)} kg/m`],
                ['Av. Weight', `${formatNumber(result.averageWeightKgM, 3)} kg/m`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <div className="flex gap-3">
              <Layers className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <p>
                Ghi chú từ Excel: độ cứng vòng dài hạn thường khoảng 20% - 25% độ cứng vòng ngắn hạn.
                Giá trị này chỉ là tham khảo kỹ thuật, không thay thế tiêu chuẩn thiết kế riêng của từng dự án.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
