# Editable Surface Pressure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an editable "Ap suat be mat" input to PolyWeld Pro Butt Fusion so users can use the material recommendation or enter their own value safely.

**Architecture:** Keep the change scoped to the integrated PolyWeld Butt Fusion module. Store surface pressure in `N/mm2` in `ButtFusionParams`, convert to `bar` only inside the existing calculation, and show inline validation or warning copy directly below the new input.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS utility classes.

## Global Constraints

- Scope is `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld`; rebuild the static output in `C:\project\SupportTechnical\ntp-support-hub\server\public\polyweld-pro` after implementation.
- The field label must be `Áp suất bề mặt`.
- The field unit must be `N/mm²`.
- The number input step must be `0.01`.
- Recommended PE100 and PE80 value is `0.15 N/mm²`.
- Recommended PP-R value is `0.10 N/mm²`.
- Changing material resets the field to the new material's recommended value.
- Users may edit away from the recommendation.
- A valid non-recommended value shows this warning: `Giá trị đã khác mức khuyến nghị cho vật liệu này. Hãy kiểm tra tiêu chuẩn và thông số nhà sản xuất trước khi hàn.`
- The warning is non-blocking.
- Empty, zero, negative, or non-numeric input shows an error and must not update the result from the invalid value.
- Store state in `N/mm2` and convert with `interfacialPressureBar = surfacePressureNPerMm2 * 10`.
- Do not change time, bead-height, drag-pressure, or heat-soak formulas.

---

## File Structure

- Modify `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\types.ts`
  - Add `surfacePressureNPerMm2: number` to `ButtFusionParams`.
- Modify `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\components\ButtFusion.tsx`
  - Add material recommendation mapping.
  - Initialize and reset `surfacePressureNPerMm2`.
  - Validate the new input.
  - Convert valid `N/mm2` to `bar` in the existing calculation.
  - Render the input, warning, and error.
- No new runtime dependencies.

### Task 1: Add Surface Pressure State and Calculation Hook

**Files:**
- Modify: `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\types.ts`
- Modify: `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\components\ButtFusion.tsx`

**Interfaces:**
- Consumes: existing `ButtFusionParams` and `calculateParams()`.
- Produces: `ButtFusionParams.surfacePressureNPerMm2: number` and `getRecommendedSurfacePressure(material: 'PE100' | 'PE80' | 'PP-R'): number`.

- [ ] **Step 1: Add the param field**

In `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\types.ts`, change `ButtFusionParams` to:

```ts
export interface ButtFusionParams {
  pipeDiameter: number; // mm
  sdr: number; // Standard Dimension Ratio
  dragPressure: number; // bar
  machineCylinderArea: number; // cm2 (Total effective piston area)
  surfacePressureNPerMm2: number; // N/mm2
}
```

- [ ] **Step 2: Add recommendation constants**

In `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\components\ButtFusion.tsx`, above `const ButtFusion`, add:

```ts
type ButtFusionMaterial = 'PE100' | 'PE80' | 'PP-R';

const SURFACE_PRESSURE_RECOMMENDATIONS: Record<ButtFusionMaterial, number> = {
  PE100: 0.15,
  PE80: 0.15,
  'PP-R': 0.10,
};

const getRecommendedSurfacePressure = (currentMaterial: ButtFusionMaterial) =>
  SURFACE_PRESSURE_RECOMMENDATIONS[currentMaterial];
```

- [ ] **Step 3: Use the material type and initialize the param**

In `ButtFusion.tsx`, change the material state and initial params to:

```ts
const [material, setMaterial] = useState<ButtFusionMaterial>('PE100');
```

```ts
const [params, setParams] = useState<ButtFusionParams>({
  pipeDiameter: 200,
  sdr: 11,
  dragPressure: 0,
  machineCylinderArea: 10,
  surfacePressureNPerMm2: getRecommendedSurfacePressure('PE100'),
});
```

- [ ] **Step 4: Convert the editable value inside the existing formula**

Replace:

```ts
const interfacialPressure = material === 'PP-R' ? 1.0 : 1.5; // bar (0.10 N/mm2 for PP-R, 0.15 N/mm2 for PE)
```

with:

```ts
const interfacialPressure = params.surfacePressureNPerMm2 * 10;
```

- [ ] **Step 5: Run TypeScript build**

Run: `npm run build`

Expected: The build may fail before Task 2 if the UI can still set invalid values directly. Continue to Task 2 before final verification.

### Task 2: Add Reset, Validation, Warning, and UI

**Files:**
- Modify: `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\components\ButtFusion.tsx`

**Interfaces:**
- Consumes: `getRecommendedSurfacePressure(material)`.
- Produces: inline editable input named `surfacePressureNPerMm2`, yellow warning copy for valid non-recommended values, and red error copy for invalid values.

- [ ] **Step 1: Reset pressure when material changes**

Replace the material button click handler:

```tsx
onClick={() => setMaterial(m as any)}
```

with:

```tsx
onClick={() => {
  const nextMaterial = m as ButtFusionMaterial;
  setMaterial(nextMaterial);
  setParams(prev => ({
    ...prev,
    surfacePressureNPerMm2: getRecommendedSurfacePressure(nextMaterial),
  }));
}}
```

- [ ] **Step 2: Add validation helpers inside the component**

Add these constants after `const [result, setResult] = useState<ButtFusionResult | null>(null);`:

```ts
const recommendedSurfacePressure = getRecommendedSurfacePressure(material);
const isSurfacePressureValid =
  Number.isFinite(params.surfacePressureNPerMm2) && params.surfacePressureNPerMm2 > 0;
const showSurfacePressureWarning =
  isSurfacePressureValid &&
  Math.abs(params.surfacePressureNPerMm2 - recommendedSurfacePressure) > 0.0001;
const surfacePressureError = isSurfacePressureValid
  ? ''
  : 'Áp suất bề mặt phải là số lớn hơn 0.';
```

- [ ] **Step 3: Prevent invalid values from overwriting the current result**

At the start of `calculateParams`, before reading `outerDiameter`, add:

```ts
if (!isSurfacePressureValid) {
  return;
}
```

- [ ] **Step 4: Make number parsing preserve invalid empty input as invalid**

Replace `handleInputChange` with:

```ts
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  const nextValue = value === '' ? Number.NaN : Number(value);
  setParams(prev => ({ ...prev, [name]: nextValue }));
};
```

- [ ] **Step 5: Render the new input**

Insert this block between the SDR/PN input block and the drag/cylinder two-column grid:

```tsx
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Áp suất bề mặt - N/mm²
  </label>
  <input
    type="number"
    name="surfacePressureNPerMm2"
    value={Number.isNaN(params.surfacePressureNPerMm2) ? '' : params.surfacePressureNPerMm2}
    onChange={handleInputChange}
    step="0.01"
    min="0.01"
    className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:outline-none font-mono text-lg ${
      surfacePressureError
        ? 'border-red-300 focus:ring-red-500'
        : 'border-slate-300 focus:ring-blue-500'
    }`}
  />
  {surfacePressureError && (
    <p className="mt-1 text-xs text-red-600">{surfacePressureError}</p>
  )}
  {showSurfacePressureWarning && (
    <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
      Giá trị đã khác mức khuyến nghị cho vật liệu này. Hãy kiểm tra tiêu chuẩn và thông số nhà sản xuất trước khi hàn.
    </p>
  )}
</div>
```

- [ ] **Step 6: Run TypeScript build**

Run: `npm run build`

Expected: PASS. If TypeScript reports dependency issues in `useEffect`, update the dependency array to include `calculateParams` only if the function is memoized; otherwise keep the existing lint suppression and verify Vite build.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/apps/polyweld/types.ts src/apps/polyweld/components/ButtFusion.tsx
git commit -m "feat: make butt fusion surface pressure editable"
```

### Task 3: Rebuild Static PolyWeld Output

**Files:**
- Modify generated files under: `C:\project\SupportTechnical\ntp-support-hub\server\public\polyweld-pro`

**Interfaces:**
- Consumes: Vite build output from Task 2.
- Produces: refreshed static PolyWeld Pro assets served from `server/public/polyweld-pro`.

- [ ] **Step 1: Run the project build**

Run: `npm run build`

Expected: PASS and generated files in `C:\project\SupportTechnical\ntp-support-hub\dist`.

- [ ] **Step 2: Inspect generated output path**

Run: `Get-ChildItem -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\dist' -Force`

Expected: output contains `assets` and `index.html`, or another Vite output folder documented by the current config.

- [ ] **Step 3: Refresh the static folder**

Run:

```powershell
$source = Resolve-Path -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\dist'
$target = Resolve-Path -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\server\public\polyweld-pro'
if (-not $target.Path.StartsWith((Resolve-Path -LiteralPath 'C:\project\SupportTechnical\ntp-support-hub\server\public').Path)) { throw 'Target outside public folder' }
Get-ChildItem -LiteralPath $target.Path -Force | Remove-Item -Recurse -Force
Copy-Item -LiteralPath (Join-Path $source.Path '*') -Destination $target.Path -Recurse -Force
```

Expected: `server/public/polyweld-pro` contains the rebuilt `index.html` and `assets`.

- [ ] **Step 4: Verify static folder changed**

Run: `git status --short server/public/polyweld-pro`

Expected: generated asset changes are visible if build hashes changed.

- [ ] **Step 5: Commit**

Run:

```bash
git add server/public/polyweld-pro
git commit -m "build: refresh polyweld static assets"
```

### Task 4: Final Verification

**Files:**
- Read: `C:\project\SupportTechnical\ntp-support-hub\src\apps\polyweld\components\ButtFusion.tsx`
- Read: `C:\project\SupportTechnical\ntp-support-hub\server\public\polyweld-pro\index.html`

**Interfaces:**
- Consumes: completed source and generated static assets.
- Produces: verified implementation ready for user handoff.

- [ ] **Step 1: Run final build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 2: Check source for required copy and constants**

Run: `rg "Áp suất bề mặt|N/mm²|0\\.15|0\\.10|Giá trị đã khác mức khuyến nghị" src/apps/polyweld/components/ButtFusion.tsx`

Expected: matches include the input label, unit, both recommendations, and the exact warning.

- [ ] **Step 3: Check generated static output contains the feature copy**

Run: `rg "Áp suất bề mặt|Giá trị đã khác mức khuyến nghị" server/public/polyweld-pro`

Expected: matches in generated assets.

- [ ] **Step 4: Review git status**

Run: `git status --short`

Expected: no uncommitted source changes except any intentionally uncommitted build artifacts if the repository policy excludes them.

- [ ] **Step 5: Commit any verification-only generated changes if needed**

If Task 4 Step 1 changed generated files after Task 3, run:

```bash
git add server/public/polyweld-pro
git commit -m "build: update polyweld verification assets"
```

Expected: either a commit is created for generated changes, or Git reports nothing to commit.
