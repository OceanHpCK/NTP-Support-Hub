export enum MaterialGrade {
  PE100 = 'PE100',
  PE80 = 'PE80'
}

export enum CrossingType {
  Standard = 'Standard',
  River = 'River',
  Road = 'Road'
}

export enum SoilType {
  Clay = 'Clay',
  Sand = 'Sand',
  Gravel = 'Gravel',
  Rock = 'Rock'
}

export interface PipeParams {
  outerDiameter: number; // mm
  sdr: number; // Standard Dimension Ratio
  material: MaterialGrade;
  yieldStrength: number; // MPa
}

export interface BorePathParams {
  totalLength: number; // m
  depth: number; // m
  entryAngle: number; // degrees
  exitAngle: number; // degrees
  soilFriction: number; // coefficient
  mudDensity: number; // kg/m3
  viscosity: number; // centipoise (estimate for drag)
  crossingType: CrossingType;
  soilType: SoilType;
}

export interface CalculationResult {
  pipeWeightAir: number; // kg/m
  pipeWeightMud: number; // kg/m (buoyant weight)
  estimatedPullForce: number; // kN
  tensileStress: number; // MPa
  bendingRadius: number; // m (Minimum approximate)
  safetyFactorTensile: number;
  safetyFactorCollapse: number;
  isSafe: boolean;
  warnings: string[];
  recommendedBoreholeDiameter: number; // mm
  requiredRigPullback: number; // tons (metric)
}

export interface ProfilePoint {
  x: number;
  depth: number;
  label?: string;
}

export const SDR_VALUES = [7.4, 9, 11, 13.6, 17, 21, 26, 33, 41];