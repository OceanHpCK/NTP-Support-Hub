export enum WeldingType {
  BUTT_FUSION = 'BUTT_FUSION',
  SOCKET_FUSION = 'SOCKET_FUSION',
  HOME = 'HOME'
}

export interface SocketFusionData {
  diameter: number;
  heatingTime: number; // seconds
  processingTime: number; // seconds
  coolingTime: number; // minutes
  insertionDepth: number; // mm
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ButtFusionParams {
  pipeDiameter: number; // mm
  sdr: number; // Standard Dimension Ratio
  dragPressure: number; // bar
  machineCylinderArea: number; // cm2 (Total effective piston area)
}

export interface ButtFusionResult {
  beadUpPressure: number;
  heatSoakPressure: number;
  heatSoakTime: number;
  changeOverTime: number;
  fusingPressure: number;
  coolingTime: number;
  beadHeight: number;
}
