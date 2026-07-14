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
