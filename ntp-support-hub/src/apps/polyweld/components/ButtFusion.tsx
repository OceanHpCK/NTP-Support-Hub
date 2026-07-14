import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Settings, Info, Activity, Thermometer, Ruler, Gauge, Clock, Layers, AlertTriangle } from 'lucide-react';
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

const SDR_VALUES = [6, 7.4, 9, 11, 13.6, 17, 21, 26, 33, 41];

const PN_MAP: Record<string, Record<number, number>> = {
  PE100: {
    25: 7.4,
    20: 9,
    16: 11,
    12.5: 13.6,
    10: 17,
    8: 21,
    6: 26
  },
  PE80: {
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

type ButtFusionMaterial = 'PE100' | 'PE80' | 'PP-R';

const SURFACE_PRESSURE_RECOMMENDATIONS: Record<ButtFusionMaterial, number> = {
  PE100: 0.15,
  PE80: 0.15,
  'PP-R': 0.10,
};

const getRecommendedSurfacePressure = (currentMaterial: ButtFusionMaterial) =>
  SURFACE_PRESSURE_RECOMMENDATIONS[currentMaterial];

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70';

const ButtFusion: React.FC = () => {
  const [inputMode, setInputMode] = useState<'SDR' | 'PN'>('SDR');
  const [material, setMaterial] = useState<ButtFusionMaterial>('PE100');
  const [selectedPN, setSelectedPN] = useState<number>(16);

  const [params, setParams] = useState<ButtFusionParams>({
    pipeDiameter: 200,
    sdr: 11,
    dragPressure: 0,
    machineCylinderArea: 10,
    surfacePressureNPerMm2: getRecommendedSurfacePressure('PE100'),
  });

  const [result, setResult] = useState<ButtFusionResult | null>(null);
  const recommendedSurfacePressure = getRecommendedSurfacePressure(material);
  const isSurfacePressureValid =
    Number.isFinite(params.surfacePressureNPerMm2) && params.surfacePressureNPerMm2 > 0;
  const showSurfacePressureWarning =
    isSurfacePressureValid &&
    Math.abs(params.surfacePressureNPerMm2 - recommendedSurfacePressure) > 0.0001;
  const surfacePressureError = isSurfacePressureValid
    ? ''
    : 'Áp suất bề mặt phải là số lớn hơn 0.';

  useEffect(() => {
    if (inputMode === 'PN') {
      const map = PN_MAP[material];
      const newSDR = map[selectedPN];
      if (newSDR) {
        setParams(prev => ({ ...prev, sdr: newSDR }));
      } else {
        const possiblePNs = Object.keys(map).map(Number).sort((a, b) => b - a);
        if (possiblePNs.length > 0) {
          setSelectedPN(possiblePNs[0]);
          setParams(prev => ({ ...prev, sdr: map[possiblePNs[0]] }));
        }
      }
    }
  }, [inputMode, material, selectedPN]);

  const calculateParams = () => {
    if (!isSurfacePressureValid) {
      return;
    }

    const outerDiameter = params.pipeDiameter;
    const thickness = outerDiameter / params.sdr;
    const innerDiameter = outerDiameter - 2 * thickness;
    const areaWelding = (Math.PI * (Math.pow(outerDiameter / 10, 2) - Math.pow(innerDiameter / 10, 2))) / 4;
    const interfacialPressure = params.surfacePressureNPerMm2 * 10;
    const pressureTheory = (areaWelding * interfacialPressure) / params.machineCylinderArea;
    const gaugePressure = params.dragPressure + pressureTheory;

    let heatSoakTime = 0;
    let coolingTime = 0;
    let beadHeight = 0;
    let changeOver = 0;
    let heatSoakPressure = params.dragPressure;

    if (material === 'PP-R') {
      heatSoakTime = Math.ceil(thickness * 14 + 60);
      coolingTime = Math.ceil(thickness * 1.2 + 10);

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

      heatSoakPressure = params.dragPressure + 0.1;
    } else {
      heatSoakTime = Math.ceil(thickness * 12);
      coolingTime = Math.ceil(thickness * 1.5);
      beadHeight = 0.5 + 0.1 * thickness;
      if (outerDiameter <= 200) changeOver = 10;
      else changeOver = 20;
    }

    setResult({
      beadUpPressure: Number(gaugePressure.toFixed(1)),
      heatSoakPressure: Number(heatSoakPressure.toFixed(1)),
      heatSoakTime,
      changeOverTime: changeOver,
      fusingPressure: Number(gaugePressure.toFixed(1)),
      coolingTime,
      beadHeight: Number(beadHeight.toFixed(1))
    });
  };

  useEffect(() => {
    calculateParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, material]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValue = value === '' ? Number.NaN : Number(value);
    setParams(prev => ({ ...prev, [name]: nextValue }));
  };

  const chartData = useMemo(() => {
    if (!result) return [];

    const p1 = result.beadUpPressure;
    const p2Visual = Math.max(result.heatSoakPressure, p1 * 0.15);
    const p3 = result.fusingPressure;

    return [
      { x: 0, pVisual: 0, pActual: 0, label: '' },
      { x: 0.5, pVisual: p1, pActual: p1, label: 'p1' },
      { x: 3.5, pVisual: p1, pActual: p1, label: '' },
      { x: 3.6, pVisual: p2Visual, pActual: result.heatSoakPressure, label: 'p2' },
      { x: 9.6, pVisual: p2Visual, pActual: result.heatSoakPressure, label: '' },
      { x: 9.7, pVisual: 0, pActual: 0, label: '' },
      { x: 11, pVisual: 0, pActual: 0, label: '' },
      { x: 12.5, pVisual: p3, pActual: p3, label: 'p3' },
      { x: 20.5, pVisual: p3, pActual: p3, label: '' },
      { x: 20.6, pVisual: 0, pActual: 0, label: '' },
      { x: 24, pVisual: 0, pActual: 0, label: '' },
    ];
  }, [result]);

  const metricCards = result ? [
    { label: 'P1, P3 (Hàn)', value: result.fusingPressure, unit: 'bar', note: '', accent: 'text-blue-600', icon: Gauge },
    { label: 'P2 (Gia nhiệt)', value: '> 0', unit: `≤ P_cản (${params.dragPressure} bar)`, note: 'Áp suất duy trì tiếp xúc, không vượt áp suất cản', accent: 'text-amber-600', icon: Activity },
    { label: 't2 (Gia nhiệt)', value: result.heatSoakTime, unit: 'giây', note: '', accent: 'text-orange-600', icon: Clock },
    { label: 't5 (Làm nguội)', value: result.coolingTime, unit: 'phút', note: `= ${(result.coolingTime * 60).toLocaleString('vi-VN')} giây`, accent: 'text-emerald-600', icon: Clock },
  ] : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm shadow-slate-200/70 md:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">ISO 21307</span>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">DVS 2207-11</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Hàn Mặt Đầu (Butt Fusion)</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Tính toán áp suất, thời gian gia nhiệt, chuyển đổi và làm nguội cho ống HDPE/PPR theo thông số máy hàn.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs font-semibold text-slate-500">Vật liệu hiện tại</p>
            <p className="text-xl font-black text-slate-950">{material}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`lg:col-span-4 ${panelClass} h-fit`}>
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">Thông số đầu vào</h3>
              <p className="text-xs text-slate-500">Nhập thông tin ống và máy hàn</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-bold">
              <button
                onClick={() => setInputMode('SDR')}
                className={`rounded-lg py-2 transition ${inputMode === 'SDR' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Theo SDR
              </button>
              <button
                onClick={() => setInputMode('PN')}
                className={`rounded-lg py-2 transition ${inputMode === 'PN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Theo PN
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Vật liệu ống</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PE100', 'PE80', 'PP-R'] as ButtFusionMaterial[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMaterial(m);
                      setParams(prev => ({
                        ...prev,
                        surfacePressureNPerMm2: getRecommendedSurfacePressure(m),
                      }));
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      material === m
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Ruler className="h-4 w-4 text-slate-400" />
                Đường kính ống (OD) - mm
              </label>
              <input type="number" name="pipeDiameter" value={params.pipeDiameter} onChange={handleInputChange} className={inputClass} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {inputMode === 'SDR' ? 'Chỉ số SDR' : `Chỉ số PN (bar) - ${material}`}
              </label>
              {inputMode === 'SDR' ? (
                <div className="grid grid-cols-4 gap-2">
                  {SDR_VALUES.map(val => (
                    <button
                      key={val}
                      onClick={() => setParams(p => ({ ...p, sdr: val }))}
                      className={`rounded-xl border px-2 py-2 text-sm font-bold transition ${
                        params.sdr === val
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {Object.keys(PN_MAP[material]).map(Number).sort((a, b) => b - a).map((pn) => (
                    <option key={pn} value={pn}>PN {pn} (SDR {PN_MAP[material][pn]})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Áp suất bề mặt - N/mm²</label>
              <input
                type="number"
                name="surfacePressureNPerMm2"
                value={Number.isNaN(params.surfacePressureNPerMm2) ? '' : params.surfacePressureNPerMm2}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className={`${inputClass} ${surfacePressureError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
              />
              {surfacePressureError && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{surfacePressureError}</p>
              )}
              {showSurfacePressureWarning && (
                <div className="mt-2 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Giá trị đã khác mức khuyến nghị cho vật liệu này. Hãy kiểm tra tiêu chuẩn và thông số nhà sản xuất trước khi hàn.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  P<sub>cản</sub> - bar
                </label>
                <input type="number" name="dragPressure" value={params.dragPressure} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  S<sub>xy-lanh</sub> - cm²
                </label>
                <input type="number" name="machineCylinderArea" value={params.machineCylinderArea} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>

            <button
              onClick={calculateParams}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <Calculator size={19} /> Tính toán ngay
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className={panelClass}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">Biểu đồ chu trình hàn</h3>
                  <p className="text-xs text-slate-500">Mô phỏng áp suất theo thời gian</p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">Áp suất (bar)</span>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 28, left: 8, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.78} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="x" type="number" domain={[0, 'dataMax']} tick={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (!data.label && data.pActual === 0) return null;
                        return (
                          <div className="rounded-xl bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
                            Áp suất: <span className="font-black text-blue-200">{data.pActual} bar</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="linear" dataKey="pVisual" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorPressure)" animationDuration={900}>
                    <LabelList dataKey="label" position="top" offset={10} fill="#0f172a" fontSize={12} fontWeight="bold" />
                  </Area>
                  <ReferenceLine x={2} stroke="none" label={{ value: 't1', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                  <ReferenceLine x={6.5} stroke="none" label={{ value: 't2', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                  <ReferenceLine x={10.3} stroke="none" label={{ value: 't3', position: 'insideBottom', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine x={11.7} stroke="none" label={{ value: 't4', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                  <ReferenceLine x={16.5} stroke="none" label={{ value: 't5', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                  <ReferenceLine x={22.5} stroke="none" label={{ value: 't6', position: 'insideBottom', fill: '#64748b', fontSize: 12 }} />
                  <ReferenceLine x={4.01} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine x={9.7} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine x={11} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine x={12.5} stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine x={20.6} stroke="#94a3b8" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {result && (
            <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-300/40 overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <Info className="text-blue-300" /> Kết quả tính toán
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-400/10 px-3 py-1 font-bold text-blue-100 ring-1 ring-blue-300/20">SDR {params.sdr}</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 font-bold text-emerald-100 ring-1 ring-emerald-300/20">T = {(params.pipeDiameter / params.sdr).toFixed(1)} mm</span>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
                {metricCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                      <div className="mb-3 flex flex-col items-center gap-2">
                        <Icon className="h-5 w-5 text-slate-500" />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
                      </div>
                      <p className={`text-3xl font-black tracking-tight ${card.accent}`}>{card.value}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{card.unit}</p>
                      {card.note && (
                        <p className="mx-auto mt-2 max-w-[13rem] text-[11px] font-medium leading-4 text-slate-500">{card.note}</p>
                      )}
                    </div>
                  );
                })}

                <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-4 text-center shadow-lg shadow-blue-950/30 md:col-span-2 xl:col-span-2">
                  <div className="mb-3 flex items-center justify-center gap-2 text-cyan-100">
                    <Thermometer size={16} className="shrink-0" />
                    <p className="whitespace-nowrap text-xs font-black uppercase tracking-wide">Nhiệt độ hàn</p>
                  </div>
                  <p className="whitespace-nowrap text-3xl font-black tracking-tight text-white">200 - 230 °C</p>
                  <span className="mt-3 inline-flex w-fit items-center rounded-full bg-cyan-300/15 px-3 py-1.5 text-[11px] font-bold text-cyan-100 ring-1 ring-cyan-200/30">
                    Tối ưu: 210 - 220 °C
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={panelClass}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">Chi tiết các bước thực hiện</h3>
                <p className="text-xs text-slate-500">Quy trình thao tác theo các pha t1 đến t5</p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { title: 't1. Tạo gờ (Bead-up)', desc: `Tăng áp suất lên P1 = ${result?.beadUpPressure} bar. Đợi đến khi gờ tiếp xúc đạt ${result?.beadHeight} mm.` },
                { title: 't2. Gia nhiệt (Heat Soak)', desc: `Giảm nhanh áp suất về P2 > 0 và P2 ≤ P_cản (${params.dragPressure} bar). Duy trì ${result?.heatSoakTime} giây.` },
                { title: 't3. Chuyển đổi (Change-over)', desc: `Tách đĩa nhiệt tối đa ${result?.changeOverTime}s.` },
                { title: 't4. Tăng áp (Ramp-up)', desc: `Tăng áp đều từ 0 lên P3 = ${result?.fusingPressure} bar.` },
                { title: 't5. Làm nguội (Cooling)', desc: `Giữ nguyên áp suất P3 = ${result?.fusingPressure} bar trong ${result?.coolingTime} phút (${((result?.coolingTime ?? 0) * 60).toLocaleString('vi-VN')} giây).` },
              ].map((step, idx) => (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-blue-700 ring-1 ring-slate-200">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-black text-slate-900">{step.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.desc}</p>
                  </div>
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
