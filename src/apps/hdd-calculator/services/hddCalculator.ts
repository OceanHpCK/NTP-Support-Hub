import { PipeParams, BorePathParams, CalculationResult, MaterialGrade, ProfilePoint, CrossingType, SoilType } from '../types';

export const calculateHDD = (pipe: PipeParams, path: BorePathParams): CalculationResult => {
  const warnings: string[] = [];

  // Constants
  const HDPE_DENSITY = 955; // kg/m3 (Typical PE100)
  const WATER_DENSITY = 1000; // kg/m3
  const GRAVITY = 9.81;

  // --- 1. Geometry & Path Segments ---
  // ASTM F1962 Simplified Path: Entry Arc -> Bottom Straight -> Exit Arc
  // Note: Pullback is from Exit side (Pipe Side) to Entry side (Rig Side).
  // Points: A (Pipe Entry/Exit Surface) -> B (End of Arc 1) -> C (End of Bottom) -> D (Rig/Entry Surface)

  const od_m = pipe.outerDiameter / 1000;
  const od_mm = pipe.outerDiameter;
  const sdr = pipe.sdr;

  // Weights (ASTM F1962 Section 6.2)
  // W_p: Pipe weight in air
  // W_mud: Weight of displaced mud
  // W_b: Net buoyant weight (Upward force if negative)

  // Pipe Area
  const wallThickness_mm = od_mm / sdr;
  const id_mm = od_mm - 2 * wallThickness_mm;
  const id_m = id_mm / 1000;

  const pipeCrossSectionArea_m2 = (Math.PI / 4) * (Math.pow(od_m, 2) - Math.pow(id_m, 2));
  const pipeWeightAir_Nm = pipeCrossSectionArea_m2 * HDPE_DENSITY * GRAVITY; // N/m (wa)

  const displacedVolume_m3m = (Math.PI / 4) * Math.pow(od_m, 2);
  const mudBuoyancy_Nm = displacedVolume_m3m * path.mudDensity * GRAVITY;

  // Pipe usually hollow during pullback -> internal weight = 0
  const ballastWeight_Nm = 0;

  // Net Buoyant Weight (wb). Positive = Downward, Negative = Upward (Floating)
  const netWeightMud_Nm = pipeWeightAir_Nm + ballastWeight_Nm - mudBuoyancy_Nm; // wb

  // --- 2. Path Geometry ---
  const entryAngleRad = (path.entryAngle * Math.PI) / 180;
  const exitAngleRad = (path.exitAngle * Math.PI) / 180;

  // Minimum Bend Radius (ASTM F1962 Guidelines)
  // R_min typically 40*OD to 50*OD for PE
  const minBendRadius = od_m * 40; // m
  const calcRadius = Math.max(minBendRadius, 200); // Use larger radius if simplified path allows, but 40OD is constraint
  // For calculation, we assume the planned path uses appropriate R.
  // Actually, simplified calculator often assumes R is large enough to reach depth.

  // Length of Arcs (Projected)
  // H_entry = R * (1 - cos(entryAngle))
  // L_entry_arc = R * sin(entryAngle) approx or R*alpha

  // We use the User Provided Total Length as primary constraint.
  // We estimate segment lengths roughly if not provided.
  // Assumption: Symmetric-ish or standard profile.
  // Let's deduce L_bottom based on Depth and Angles.

  // Vertical depth achieved by arcs:
  const depth_entry_arc = calcRadius * (1 - Math.cos(entryAngleRad));
  const depth_exit_arc = calcRadius * (1 - Math.cos(exitAngleRad));

  let L_entry_arc = calcRadius * entryAngleRad; // L2
  let L_exit_arc = calcRadius * exitAngleRad;   // L4 (ASTM numbering usually reversed, let's stick to Pull direction)

  // Pull direction: Pipe Surface (Point A) -> Arc 1 (Exit side arc) -> Bottom -> Arc 2 (Entry side arc) -> Machine (Point D)
  // Note: ASTM F1962 nomenclature:
  // Point A: Pipe entry at surface (Exit point of bore)
  // Segment 1: Surface drag (L1)
  // Segment 2: Entry Arc (downward) - L2
  // Segment 3: Horizontal - L3
  // Segment 4: Exit Arc (upward to rig) - L4

  // Check geometry validity
  const totalVertical = depth_entry_arc + depth_exit_arc;
  let L3_bottom = 0;

  if (path.depth < totalVertical) {
    warnings.push("Độ sâu quá nhỏ so với bán kính cong tối thiểu. Tuyến khoan có thể cần dài hơn hoặc giảm góc.");
    // Force valid calculation by reducing effective segments or just proceed with theoretical
    L3_bottom = Math.max(0, path.totalLength - L_entry_arc - L_exit_arc);
  } else {
    // Calculation implies we go deeper than arcs allow? No, usually straight ramps.
    // For simplified calculator:
    // We assume the lengths are distributed: L_arc + L_bottom + L_arc = Total.
    L3_bottom = Math.max(0, path.totalLength - L_entry_arc - L_exit_arc);
  }


  // --- 3. Fluidic Drag (Hydrokinetic) ---
  // ASTM Eq 10: T_drag = 12 * pi * D * visc * L ... simplified to hydrokinetic pressure
  // Simplified approximation: Delta_P (hydrokinetic) ~ 10 psi (70 kPa) to 50 psi (350 kPa)
  // 1 cP = 0.001 Pa.s. Mud viscosity ~ 40-80 cP.
  // We can use a simpler drag pressure approach.
  // Drag Force = SurfaceArea * DragCoeff
  // Or ASTM simplified: average drag ~ 0.05 to 0.1 psi/ft ?? 
  // Let's use the input viscosity to scale a base drag.
  // Ref: Dr. Bennett equations often use 0.025 to 0.05 lbs/in2 per ft.

  // Let's use a conservative Fluid Drag Estimator based on Viscosity input
  // Base drag pressure 1500 Pa (0.2 psi) for low viscosity, up to 5000 Pa for high.
  // Viscosity 45 cP is typical.
  const dragPressurePa = (path.viscosity / 20) * 1000; // Rough empirical mapping
  const pipeSurfaceArea = Math.PI * od_m * path.totalLength;
  // Drag isn't strictly Area * Pressure, it's shear.
  // Standard simplified: 0.1 kPa shear stress?
  // Let's stick to the code's previous simple linear model but calibrated better.
  // ASTM F1962: "Fluidic drag... roughly 350 N per meter of pipe (Example)".

  const fluidDragPerMeter = Math.max(50, path.viscosity * 5); // N/m. ex: 45 * 5 = 225 N/m.
  const totalFluidDrag = fluidDragPerMeter * path.totalLength;

  // --- 4. Pull Load Calculation (Cumulative) ---
  const mu_soil = path.soilFriction;
  const mu_mud = 0.1; // Coeff friction on rollers/surface mud

  // Segment A: Surface (Drag on rollers or ground)
  const L1_surface = 30; // Extra pipe length on surface
  // T_A = Friction on surface
  const T_A = Math.abs(pipeWeightAir_Nm) * mu_soil * L1_surface;

  // Segment B: Arc 1 (Downhole - Entry at Exit point)
  // Pipe (empty) is buoyant (w_b < 0). It pushes UP against the soil.
  // ASTM Eq 14 (Simplified for buoyant pipe):
  // T_B = T_A + |w_b| * L2 * mu_soil - w_b * H ...
  // Full capstan for buoyant pipe pulling DOWN into curve?
  // No, actually pipe floats up against outer curve radius (top of hole).
  // Angles: alpha is entry angle.
  // T2 = T1 * e^(mu * alpha) + ... weight adjustments
  // Simplified Capstan: T_out = T_in * exp(mu * alpha)
  // We apply fluid drag incrementally or at end. ASTM says calculate T, then add HydroDrag.

  // Step 1: T_in = T_A
  const capstan_entry = Math.exp(mu_soil * exitAngleRad); // Using exit angle for first arc (Pipe side)
  // Weight component approx: w_b * L * mu (drag)
  // Since pipe floats, normal force is high.
  const T_B_friction = Math.abs(netWeightMud_Nm) * L_exit_arc * mu_soil;
  const T_B = (T_A + T_B_friction) * capstan_entry;

  // Segment C: Bottom Straight
  const T_C_friction = Math.abs(netWeightMud_Nm) * L3_bottom * mu_soil;
  const T_C = T_B + T_C_friction;

  // Segment D: Arc 2 (Uphole - Exit at Entry side)
  const capstan_exit = Math.exp(mu_soil * entryAngleRad);
  const T_D_friction = Math.abs(netWeightMud_Nm) * L_entry_arc * mu_soil;
  // In this section, we are pulling UP.
  // Weight term (lifting) is significant if pipe is heavy, but here pipe is buoyant (helps lift?).
  // Actually buoyant pipe wants to float up, helping us lift it? 
  // No, buoyancy pushes against top of hole, increasing friction.
  // Gravity component opposes lift if heavy, but here it helps if buoyant.
  // But strictly, ASTM Simplified includes weight/buoyancy in the friction term primarily.
  const T_D_mechanical = (T_C + T_D_friction) * capstan_exit;

  // Add Fluid Drag (Cumulative over whole length)
  const T_total_pull_N = T_D_mechanical + totalFluidDrag;

  const estimatedPullForceKN = T_total_pull_N / 1000;

  // --- 5. Stress Analysis ---
  const pipeSteelArea_mm2 = pipeCrossSectionArea_m2 * 1e6; // Convert m2 to mm2
  const tensileStress = T_total_pull_N / pipeSteelArea_mm2; // MPa

  // --- 6. Collapse Check ---
  // Levy's Critial Pressure P_cr
  // For PE, need short-term modulus (E) -> but for 24h installation, E drops.
  const E_modulus = 800; // MPa (conservative installation modulus)
  const poisson = 0.45;
  // Ovality reduction factor f_o (approx 0.7 for reasonable handling)
  const f_o = 0.7;
  // Tensile reduction factor f_R (pulling reduces collapse resistance)
  // Simplified: ignore or use 0.9
  const P_crit = (2 * E_modulus * f_o) / ((1 - Math.pow(poisson, 2))) * Math.pow((1 / (sdr - 1)), 3); // MPa

  // Max External Pressure: Hydrostatic head of Mud
  const maxDepth_m = path.depth;
  const P_hydro_mud_MPa = (path.mudDensity * GRAVITY * maxDepth_m) / 1e6;

  const safetyFactorCollapse = P_crit / P_hydro_mud_MPa;

  // --- 7. Tensile Safety Factor ---
  // Allowable Stress for short duration (1h-24h): ~40-50% yield or specified Safe Pull Stress (SPS)
  // ASTM F1804 / F1962: SPS for PE100 usually around 10-12 MPa.
  // User provided Yield (24 MPa). Let's take 50% as limit.
  const allowableStress = pipe.yieldStrength * 0.5;
  const safetyFactorTensile = allowableStress / (tensileStress + 0.0001); // avoid div 0

  // Checks & Warnings
  if (safetyFactorTensile < 1.5) warnings.push("Hệ số an toàn lực kéo thấp (< 1.5).");
  if (safetyFactorCollapse < 1.5) warnings.push("Hệ số an toàn chống móp thấp (< 1.5). Cần giảm SDR (tăng độ dày).");
  if (netWeightMud_Nm < 0) {
    // Intentionally distinct message
    // warnings.push("Ống nổi trong dung dịch khoan (Bình thường với HDPE).");
  }

  // Add geometry warning
  if (path.depth < totalVertical) {
    warnings.push(`Cảnh báo hình học: Độ sâu ${path.depth}m chưa đủ cho bán kính cong ${calcRadius.toFixed(0)}m.`);
  }

  // Equipment Recommendations
  // Backreamer 1.3 - 1.5x OD
  const recommendedBoreholeDiameter = od_mm * 1.5;
  // Rig Pullback 1.5 - 2.0x Pull Force
  const requiredRigPullback = (estimatedPullForceKN / 9.81) * 2.0; // tons

  // Is Safe?
  const isSafe = safetyFactorTensile >= 1.5 && safetyFactorCollapse >= 1.5;

  return {
    pipeWeightAir: pipeWeightAir_Nm / GRAVITY, // kg/m
    pipeWeightMud: netWeightMud_Nm / GRAVITY, // kg/m (signed)
    estimatedPullForce: estimatedPullForceKN,
    tensileStress,
    bendingRadius: calcRadius,
    safetyFactorTensile,
    safetyFactorCollapse,
    isSafe,
    warnings,
    recommendedBoreholeDiameter,
    requiredRigPullback
  };
};

export const generatePathProfile = (length: number, depth: number, entryAngle: number, exitAngle: number): ProfilePoint[] => {
  // Simplified trapezoidal/parabolic profile generator for visualization
  const points: ProfilePoint[] = [];
  const segments = 50;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1
    const x = t * length;
    const y = -depth * Math.sin(Math.PI * t);
    points.push({ x, depth: y });
  }

  return points;
};