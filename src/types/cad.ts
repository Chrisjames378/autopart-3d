export type PartType =
  | 'bolt'
  | 'hoseBarb'
  | 'gasket'
  | 'knob'
  | 'bracket'
  | 'bushing'
  | 'oring'
  | 'connector';

export type FilamentMaterial = 'petg' | 'asa' | 'abs' | 'tpu' | 'nylon' | 'cfpc';

export interface MaterialInfo {
  id: FilamentMaterial;
  name: string;
  maxTemp: string;
  oilResistance: string;
  uvRating: string;
  tensileStrength: string;
  density: number; // g/cm³
  costPerKg: number; // $ USD / kg
  nozzleTemp: string;
  bedTemp: string;
  color: string;
  roughness: number;
  metalness: number;
  description: string;
}

export interface BoltParams {
  headType: 'hex' | 'socket' | 'flange';
  diameter: number; // mm
  pitch: number; // mm
  shaftLength: number; // mm
  headHeight: number; // mm
  headWidth: number; // mm
  washerFace: boolean;
}

export interface HoseBarbParams {
  innerDiameter: number; // mm
  outerDiameter: number; // mm
  length: number; // mm
  barbCount: number;
  barbDepth: number; // mm
  wallThickness: number; // mm
  hexGrip: boolean;
}

export interface GasketParams {
  innerDiameter: number; // mm
  outerDiameter: number; // mm
  thickness: number; // mm
  boltHoleDiameter: number; // mm
  boltHoles: number;
  pcd: number; // mm (pitch circle diameter)
}

export interface KnobParams {
  diameter: number; // mm
  height: number; // mm
  shaftDiameter: number; // mm
  shaftType: 'd-shaft' | 'round' | 'knurled';
  gripRibs: number;
  indicatorDot: boolean;
}

export interface BracketParams {
  length: number; // mm
  width: number; // mm
  height: number; // mm
  thickness: number; // mm
  holeDiameter: number; // mm
  holeSpacing: number; // mm
  gusset: boolean;
}

export interface BushingParams {
  innerDiameter: number; // mm
  outerDiameter: number; // mm
  length: number; // mm
  flangeDiameter: number; // mm
  flangeThickness: number; // mm
}

export interface OringParams {
  innerDiameter: number; // mm
  outerDiameter: number; // mm
  thickness: number; // mm
  grooveDepth: number; // mm
  grooveWidth: number; // mm
}

export interface ConnectorParams {
  pinCount: number;
  rows: number;
  length: number; // mm
  wireDiameter: number; // mm
  latchClip: boolean;
}

export type AllPartParams = {
  bolt: BoltParams;
  hoseBarb: HoseBarbParams;
  gasket: GasketParams;
  knob: KnobParams;
  bracket: BracketParams;
  bushing: BushingParams;
  oring: OringParams;
  connector: ConnectorParams;
};

export interface ISOThreadPreset {
  id: string;
  label: string;
  diameter: number;
  pitch: number;
  recommendedHeadHeight: number;
  recommendedHeadWidth: number;
}

export interface GarageVehicle {
  id: string;
  name: string;
  engine: string;
  year?: string;
  partsCount: number;
  icon: string;
}

export interface VaultPart {
  id: string;
  vehicleId: string;
  name: string;
  partType: PartType;
  params: any;
  filamentMaterial: FilamentMaterial;
  toleranceOffset: number;
  date: string;
  notes: string;
}

export interface SlicerConfig {
  layerHeight: number; // e.g. 0.2 mm
  slicePercentage: number; // 0 to 100
  infillDensity: number; // 10 to 100 %
  infillPattern: 'gyroid' | 'honeycomb' | 'grid' | 'concentric';
  showInfill: boolean;
}

export interface PartStats {
  boundingBox: { x: number; y: number; z: number };
  volumeMm3: number;
  weightGrams: number;
  filamentLengthMeters: number;
  estimatedCostUsd: number;
  estimatedPrintTimeMins: number;
  triangleCount: number;
}
