export interface PipeParams {
  outerDiameter: number; // mm
  sdr: number;
  material: string;
  eModShort: number; // MPa
  eModLong: number; // MPa
  sigmaAllow: number; // MPa
  maxDepth: number; // m
  waterDensity: number; // kg/m3
  concreteDensity: number; // kg/m3
  peDensity: number; // kg/m3
  vCurrent: number; // m/s
  airFillingRate: number; // %
  frictionCoeff: number;
  cD: number;
  cL: number;
  kOval: number;
  nu: number;
  weightSpacing: number; // m
}

export interface CalculationResults {
  // Module 2: Sinking Calculation
  wallThickness: number; // mm
  innerDiameter: number; // mm
  pipeWeightAir: number; // N/m
  pipeWeightSub: number; // N/m
  buoyancy: number; // N/m
  concreteWeightSubRequired: number; // N/m
  concreteWeightAirRequired: number; // N/m
  concreteWeightPerBlockAir: number; // kN
  w1: number; // N/m
  w2: number; // N/m
  minBendingRadius: number; // m
  pullingForce: number; // kN
  maxTensionForce: number; // kN
  internalPressureBar: number; // bar
  
  // Module 3: Stability & Strength
  fD: number; // N/m
  fL: number; // N/m
  fN: number; // N/m
  sfSliding: number;
  pBucklingBar: number; // bar
  sfBuckling: number;
}

export function calculateSinkingParameters(params: PipeParams): CalculationResults {
  const { 
    outerDiameter, sdr, maxDepth, airFillingRate, waterDensity, 
    concreteDensity, peDensity, weightSpacing,
    eModShort, vCurrent, frictionCoeff, cD, cL, kOval, nu
  } = params;

  const g = 9.81;
  const D_m = outerDiameter / 1000;
  const s_m = D_m / sdr;
  const d_m = D_m - 2 * s_m;
  
  const wallThickness = s_m * 1000;
  const innerDiameter = d_m * 1000;

  // ==========================================
  // MODULE 2: SINKING CALCULATION
  // ==========================================
  
  // 1. Pipe Geometry & Weights
  const W_pipe_air = Math.PI * (D_m - s_m) * s_m * peDensity * g; // N/m
  const W_pipe_sub = Math.PI * (D_m - s_m) * s_m * (peDensity - waterDensity) * g; // N/m (negative)
  const F_buoyancy = Math.PI * Math.pow(D_m, 2) / 4 * waterDensity * g; // N/m
  const W_water_in = Math.PI * Math.pow(d_m, 2) / 4 * waterDensity * g; // N/m

  // 2. Forces w1 and w2
  const aa = airFillingRate / 100;
  const w1 = aa * W_water_in; // N/m
  const w2 = w1 * (1 - aa) / aa; // N/m

  // 3. Concrete Weights
  const W_cw_sub = w1 - W_pipe_sub - W_water_in + F_buoyancy; // N/m
  const W_cw_air = W_cw_sub * (concreteDensity / (concreteDensity - waterDensity)); // N/m
  const concreteWeightPerBlockAir = (W_cw_air * weightSpacing) / 1000; // kN

  // 4. Minimum Bending Radius (R_min)
  let bendingRatio = 34; // Default fallback
  if (sdr >= 33) bendingRatio = 44;
  else if (sdr >= 26) bendingRatio = 34;
  else if (sdr >= 22) bendingRatio = 28;
  else if (sdr >= 17) bendingRatio = 21;
  else if (sdr >= 11) bendingRatio = 13;
  else if (sdr >= 9) bendingRatio = 11;
  const minBendingRadius = bendingRatio * D_m;

  // 5. Sinking Forces & Pressures
  const pullingForce = (w2 * minBendingRadius) / 1000; // kN
  const maxTensionForce = pullingForce + (w1 * (1 - aa) * maxDepth) / 1000; // kN
  const internalPressureBar = (aa * maxDepth) / 10; // bar

  // ==========================================
  // MODULE 3: STABILITY & STRENGTH
  // ==========================================
  
  // 1. Current Forces
  const fD = 0.5 * cD * waterDensity * D_m * Math.pow(vCurrent, 2); // N/m
  const fL = 0.5 * cL * waterDensity * D_m * Math.pow(vCurrent, 2); // N/m
  
  // 2. Sliding Stability
  const fN = w1 - fL; // N/m
  const sfSliding = fD > 0 ? (frictionCoeff * fN) / fD : 999;

  // 3. Buckling Check
  const pBucklingMPa = (2 * eModShort / (1 - Math.pow(nu, 2))) * Math.pow(1 / (sdr - 1), 3) * kOval;
  const pBucklingBar = pBucklingMPa * 10; // 1 MPa = 10 bar
  const pExternalBar = maxDepth / 10; // approx 1 bar per 10m
  const sfBuckling = pBucklingBar / pExternalBar;

  return {
    wallThickness,
    innerDiameter,
    pipeWeightAir: W_pipe_air,
    pipeWeightSub: W_pipe_sub,
    buoyancy: F_buoyancy,
    concreteWeightSubRequired: W_cw_sub,
    concreteWeightAirRequired: W_cw_air,
    concreteWeightPerBlockAir,
    w1,
    w2,
    minBendingRadius,
    pullingForce,
    maxTensionForce,
    internalPressureBar,
    fD,
    fL,
    fN,
    sfSliding,
    pBucklingBar,
    sfBuckling
  };
}
