# Pipe Stiffness Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new NTP Hub module for calculating pipe ring stiffness and pipe weight from the provided Excel workbook.

**Architecture:** Add a self-contained React app under `src/apps/pipe-stiffness/`, with pure calculation logic separated into `lib/calculations.ts`. Register the module in `src/registry.ts` so the existing shell, sidebar, and dashboard pick it up automatically.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS utility classes, Lucide React icons, existing NTP Hub app registry.

## Global Constraints

- Use the Excel workbook formula convention, including `PI = 3.142`, not `Math.PI`.
- Do not add a new runtime dependency for this module.
- Keep all calculations client-side and deterministic.
- Preserve the current Vite/React module pattern used by `src/apps/*`.
- Verify output against the Excel workbook sample rows before deploying.
- Deploy target remains Cloudflare Worker using the existing `server/public` asset workflow.

---

## File Structure

- Create: `src/apps/pipe-stiffness/types.ts`
  - Owns TypeScript interfaces for inputs, outputs, and material presets.
- Create: `src/apps/pipe-stiffness/lib/calculations.ts`
  - Owns `PI_FOR_EXCEL_MATCH = 3.142`, material presets, `calculatePipeStiffness()`, and number formatting helpers.
- Create: `src/apps/pipe-stiffness/App.tsx`
  - Owns the module UI: input panel, result summary, calculation detail cards, and notes.
- Modify: `src/registry.ts`
  - Adds the new app registry entry.
- Modify: `src/components/Sidebar.tsx`
  - Only if a new icon key is needed. Preferred implementation uses the existing `calculator` icon and does not modify this file.

---

### Task 1: Add calculation model and Excel-matching formulas

**Files:**
- Create: `src/apps/pipe-stiffness/types.ts`
- Create: `src/apps/pipe-stiffness/lib/calculations.ts`

**Interfaces:**
- Produces:
  - `PipeMaterialPreset`
  - `PipeStiffnessInput`
  - `PipeStiffnessResult`
  - `PIPE_MATERIAL_PRESETS`
  - `calculatePipeStiffness(input: PipeStiffnessInput): PipeStiffnessResult`
  - `formatNumber(value: number, digits?: number): string`

- [ ] **Step 1: Create the type definitions**

Create `src/apps/pipe-stiffness/types.ts`:

```ts
export interface PipeMaterialPreset {
  id: string;
  material: string;
  grade: string;
  youngModulusMpa: number;
  densityKgM3: number;
  mrsMpa?: number | null;
}

export interface PipeStiffnessInput {
  material: string;
  grade: string;
  outsideDiameterMm: number;
  sdr: number;
  youngModulusMpa: number;
  densityKgM3: number;
  mrsMpa?: number | null;
}

export interface PipeStiffnessResult {
  wallThicknessMm: number;
  averageDiameterMm: number;
  momentOfInertiaMm4PerMm: number;
  ringStiffnessKpa: number;
  crossSectionAreaM2: number;
  minimumWeightKgM: number;
  averageWeightKgM: number;
  longTermRingStiffnessRangeKpa: {
    min: number;
    max: number;
  };
}
```

- [ ] **Step 2: Create calculation logic**

Create `src/apps/pipe-stiffness/lib/calculations.ts`:

```ts
import type { PipeMaterialPreset, PipeStiffnessInput, PipeStiffnessResult } from '../types';

export const PI_FOR_EXCEL_MATCH = 3.142;

export const PIPE_MATERIAL_PRESETS: PipeMaterialPreset[] = [
  { id: 'upvc', material: 'uPVC', grade: 'N/A', youngModulusMpa: 3000, densityKgM3: 1460, mrsMpa: null },
  { id: 'pe80-md', material: 'PE80 (MD)', grade: 'ME3440', youngModulusMpa: 800, densityKgM3: 950, mrsMpa: null },
  { id: 'pe100', material: 'PE100', grade: 'HE3490-LS', youngModulusMpa: 1100, densityKgM3: 960, mrsMpa: 10 },
  { id: 'pp-b', material: 'PP-B', grade: 'BA415E', youngModulusMpa: 1500, densityKgM3: 900, mrsMpa: null },
  { id: 'pp-hm', material: 'PP-HM', grade: 'BA212E', youngModulusMpa: 1700, densityKgM3: 900, mrsMpa: null },
  { id: 'pp-r', material: 'PP-R', grade: 'R200P', youngModulusMpa: 850, densityKgM3: 900, mrsMpa: null },
];

export const DEFAULT_PIPE_STIFFNESS_INPUT: PipeStiffnessInput = {
  material: 'PE100',
  grade: 'HE3490-LS',
  outsideDiameterMm: 225,
  sdr: 21,
  youngModulusMpa: 1100,
  densityKgM3: 960,
  mrsMpa: 10,
};

export function calculatePipeStiffness(input: PipeStiffnessInput): PipeStiffnessResult {
  const wallThicknessMm = input.outsideDiameterMm / input.sdr;
  const averageDiameterMm = input.outsideDiameterMm - wallThicknessMm;
  const momentOfInertiaMm4PerMm = wallThicknessMm ** 3 / 12;
  const ringStiffnessKpa =
    (input.youngModulusMpa * momentOfInertiaMm4PerMm / averageDiameterMm ** 3) * 1000;
  const crossSectionAreaM2 =
    (PI_FOR_EXCEL_MATCH / 4) *
    (input.outsideDiameterMm ** 2 - (input.outsideDiameterMm - 2 * wallThicknessMm) ** 2) /
    1_000_000;
  const minimumWeightKgM = crossSectionAreaM2 * input.densityKgM3;
  const averageWeightKgM = minimumWeightKgM * 1.05;

  return {
    wallThicknessMm,
    averageDiameterMm,
    momentOfInertiaMm4PerMm,
    ringStiffnessKpa,
    crossSectionAreaM2,
    minimumWeightKgM,
    averageWeightKgM,
    longTermRingStiffnessRangeKpa: {
      min: ringStiffnessKpa * 0.2,
      max: ringStiffnessKpa * 0.25,
    },
  };
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}
```

- [ ] **Step 3: Verify formulas manually with a temporary Node command**

Run:

```powershell
node --input-type=module -e "const OD=225, SDR=21, E=1100, density=960, PI=3.142; const e=OD/SDR; const Dav=OD-e; const I=e**3/12; const SN=(E*I/Dav**3)*1000; const area=(PI/4*(OD**2-(OD-2*e)**2))/1000000; const minW=area*density; const avW=minW*1.05; console.log({e,Dav,I,SN,area,minW,avW});"
```

Expected approximate output:

```text
SN: 11.458333333333334
avW: 7.271485714285711
```

- [ ] **Step 4: Commit Task 1**

Run:

```powershell
git add src/apps/pipe-stiffness/types.ts src/apps/pipe-stiffness/lib/calculations.ts
git commit -m "feat: add pipe stiffness calculations"
```

---

### Task 2: Build the Pipe Stiffness UI

**Files:**
- Create: `src/apps/pipe-stiffness/App.tsx`

**Interfaces:**
- Consumes:
  - `PIPE_MATERIAL_PRESETS`
  - `DEFAULT_PIPE_STIFFNESS_INPUT`
  - `calculatePipeStiffness(input)`
  - `formatNumber(value, digits)`
- Produces:
  - default React component exported from `src/apps/pipe-stiffness/App.tsx`

- [ ] **Step 1: Create the module UI**

Create `src/apps/pipe-stiffness/App.tsx`:

```tsx
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
```

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: Vite build exits `0`. Existing chunk-size warning may appear and is acceptable.

- [ ] **Step 3: Commit Task 2**

Run:

```powershell
git add src/apps/pipe-stiffness/App.tsx
git commit -m "feat: add pipe stiffness UI"
```

---

### Task 3: Register the module in NTP Hub

**Files:**
- Modify: `src/registry.ts`

**Interfaces:**
- Consumes:
  - `src/apps/pipe-stiffness/App.tsx` default export
- Produces:
  - New registry app with `id: 'pipe-stiffness'` and `path: 'pipe-stiffness'`

- [ ] **Step 1: Add registry entry**

Modify `APP_REGISTRY` in `src/registry.ts` by inserting this object near `pipecalc` or other pipe calculation tools:

```ts
  {
    id: 'pipe-stiffness',
    name: 'Tính toán độ cứng vòng',
    shortName: 'Độ cứng vòng',
    description: 'Tính SN, chiều dày thành ống và khối lượng ống theo OD, SDR, E và Density dựa trên bảng Excel kỹ thuật.',
    icon: 'calculator',
    color: 'violet',
    colorHex: '#7c3aed',
    path: 'pipe-stiffness',
    component: React.lazy(() => import('./apps/pipe-stiffness/App')),
  },
```

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: Vite build exits `0`.

- [ ] **Step 3: Commit Task 3**

Run:

```powershell
git add src/registry.ts
git commit -m "feat: register pipe stiffness module"
```

---

### Task 4: Verify Excel parity and production readiness

**Files:**
- Read-only verification of `src/apps/pipe-stiffness/lib/calculations.ts`
- Read-only verification of `dist/`

**Interfaces:**
- Consumes:
  - Built Vite app
  - Calculation formulas
- Produces:
  - Evidence that Excel sample values match expected outputs

- [ ] **Step 1: Verify PE100 sample from Excel row 9**

Run:

```powershell
node --input-type=module -e "const OD=225, SDR=21, E=1100, density=960, PI=3.142; const e=OD/SDR; const Dav=OD-e; const I=e**3/12; const SN=(E*I/Dav**3)*1000; const area=(PI/4*(OD**2-(OD-2*e)**2))/1000000; const minW=area*density; const avW=minW*1.05; console.log('SN', SN.toFixed(6)); console.log('AvWeight', avW.toFixed(6));"
```

Expected:

```text
SN 11.458333
AvWeight 7.271486
```

- [ ] **Step 2: Verify uPVC sample from Excel row 4**

Run:

```powershell
node --input-type=module -e "const OD=160, SDR=26, E=3000, density=1460, PI=3.142; const e=OD/SDR; const Dav=OD-e; const I=e**3/12; const SN=(E*I/Dav**3)*1000; const area=(PI/4*(OD**2-(OD-2*e)**2))/1000000; const minW=area*density; const avW=minW*1.05; console.log('SN', SN.toFixed(6)); console.log('AvWeight', avW.toFixed(6));"
```

Expected:

```text
SN 16.000000
AvWeight 4.560176
```

- [ ] **Step 3: Run final build**

Run:

```powershell
npm run build
```

Expected: Vite build exits `0`.

- [ ] **Step 4: Commit any final adjustments**

If Task 4 required no file changes, skip this step. If formatting or copy changes were needed, run:

```powershell
git add src/apps/pipe-stiffness src/registry.ts
git commit -m "chore: verify pipe stiffness module"
```

---

### Task 5: Deploy to Cloudflare and push GitHub

**Files:**
- Modify generated deployment assets under `server/public/`

**Interfaces:**
- Consumes:
  - `dist/` from `npm run build`
- Produces:
  - Cloudflare production deployment at `https://hotrokythuat.doandacduong.workers.dev/pipe-stiffness`
  - GitHub `main` updated with source commits

- [ ] **Step 1: Refresh Worker public assets**

Run:

```powershell
$source = Resolve-Path -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\dist'
$target = Resolve-Path -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\server\public'
$serverRoot = Resolve-Path -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\server'
if (-not $target.Path.StartsWith($serverRoot.Path)) { throw 'Target outside server folder' }
Get-ChildItem -LiteralPath $target.Path -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $source.Path '*') -Destination $target.Path -Recurse -Force
```

Expected: command exits `0`.

- [ ] **Step 2: Deploy Worker**

Run:

```powershell
npx wrangler deploy
```

Working directory:

```text
C:\project\SupportTechnical\ntp-support-hub\server
```

Expected: Wrangler reports a new `Current Version ID` and production URL.

- [ ] **Step 3: Verify production route**

Run:

```powershell
$html = Invoke-WebRequest -Uri 'https://hotrokythuat.doandacduong.workers.dev/pipe-stiffness?verify=1' -UseBasicParsing
$html.StatusCode
```

Expected:

```text
200
```

- [ ] **Step 4: Push GitHub**

Run:

```powershell
git push origin main
```

Expected: `main -> main`.

