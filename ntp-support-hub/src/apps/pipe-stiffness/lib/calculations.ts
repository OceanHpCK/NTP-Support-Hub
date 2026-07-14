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
