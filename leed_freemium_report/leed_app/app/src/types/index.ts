export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface SolarData {
  ghi: number;
  dni: number;
  dhi: number;
  etr: number;
  optimalTilt: number;
  optimalAzimuth: number;
  yearlyGHI: number;
  pvProductionPotential: number;
  dustImpact: 'low' | 'moderate' | 'high';
  dustImpactValue: number;
  facadeHeatGain: { north: number; south: number; east: number; west: number };
  recommendedWWR: { north: number; south: number; east: number; west: number };
  dataSource?: string;
}

export interface WindDirectionBin {
  direction: string;
  angle: number;
  frequency: number;
}

export interface WindData {
  averageSpeed: number;
  maxSpeed: number;
  energyDensity: number;
  prevailingDirection: string;
  prevailingAngle: number;
  windRose: WindDirectionBin[];
  annualHours: number;
  turbineSuitability: 'excellent' | 'good' | 'moderate' | 'poor';
  ventilationScore: number;
  crossVentilationAngle: number;
  windDrivenRainRisk: 'low' | 'moderate' | 'high';
  seasonalWind: {
    shamal: { direction: string; avgSpeed: number; months: string };
    kharif: { direction: string; avgSpeed: number; months: string };
  };
  dataSource?: string;
}

export interface MonthlyTemp {
  month: string;
  avg: number;
  max: number;
  min: number;
}

export interface ComfortHours {
  month: string;
  hours: number;
  percentage: number;
}

export interface Psychrometric {
  month: string;
  dryBulb: number;
  relativeHumidity: number;
  dewPoint: number;
  wetBulb: number;
}

export interface ClimateData {
  relativeHumidity: number;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  rainfall: number;
  climateZone: string;
  sunshineHours: number;
  cdd: number;
  hdd: number;
  overheatingHours: number;
  comfortHours: ComfortHours[];
  monthlyTemperature: MonthlyTemp[];
  psychrometric: Psychrometric[];
  condensationRisk: { month: string; risk: 'low' | 'moderate' | 'high' }[];
  recommendedUValues: { wall: number; roof: number; floor: number; glazing: number };
  dataSource?: string;
}

export interface RainfallData {
  monthly: { month: string; precipitation: number }[];
  annualTotal: number;
  cycloneSeasonRisk: boolean;
  cycloneRiskLevel: 'low' | 'moderate' | 'high';
  wadiFloodRisk: 'low' | 'moderate' | 'high';
  drainageGradient: number;
  elevation: number;
  rainwaterHarvestingPotential: number;
  stormDrainageRequirement: string;
}

export interface SoilData {
  type: string;
  texture: string;
  bearingCapacity: number;
  bearingRange: { min: number; max: number };
  drainage: 'excellent' | 'good' | 'moderate' | 'poor';
  phLevel: number;
  organicCarbon: number;
  clayContent: number;
  sandContent: number;
  siltContent: number;
  contaminationRisk: 'low' | 'moderate' | 'high';
  sabkhaRisk: boolean;
  expansiveClayRisk: boolean;
  corrosionRisk: 'low' | 'moderate' | 'high';
  recommendedFoundation: 'strip' | 'raft' | 'piles';
  waterproofingRequired: boolean;
  depth: number;
  dataSource?: string;
}

export interface SeismicData {
  pga: number;
  zone: string;
  zoneNumber: number;
  historicalEvents: number;
  maxMagnitude: number;
  structuralRecommendation: string;
  diaphragmContinuity: boolean;
  dataSource?: string;
}

export interface LEEDCategory {
  name: string;
  maxPoints: number;
  currentPoints: number;
  possiblePoints: number;
  icon: string;
  description: string;
}

export interface LandAssessment {
  currentScore: number;
  potentialScore: number;
  maxPossibleScore: number;
  categories: LEEDCategory[];
}

export interface BenchmarkData {
  region: string;
  solarPotential: number;
  coolingLoad: number;
  floodRisk: number;
  ventilationScore: number;
}

export interface OBCRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'current' | 'future' | 'na';
  priority: 'high' | 'medium' | 'low';
  obcReference: string;
  leedReference: string;
  oeescReference?: string;
  potentialScoreIncrease: number;
  implementationCost: 'low' | 'medium' | 'high';
  implementationPhase: 'Design' | 'Construction' | 'Design & Construction';
}

export interface FutureImprovement {
  id: string;
  title: string;
  description: string;
  currentStatus: string;
  potentialStatus: string;
  leedPointsIncrease: number;
  estimatedCost: string;
  paybackPeriod: string;
  priority: 'high' | 'medium' | 'low';
  implementationPhase: 'Design' | 'Construction' | 'Design & Construction';
}

export interface AnalysisResult {
  location: Location;
  solar: SolarData;
  wind: WindData;
  climate: ClimateData;
  rainfall: RainfallData;
  soil: SoilData;
  seismic: SeismicData;
  landAssessment: LandAssessment;
  obcRecommendations: OBCRecommendation[];
  futureImprovements: FutureImprovement[];
  benchmarks: BenchmarkData[];
  analysisDate: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
  unit?: string;
}

export interface NASAPowerResponse {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
      ALLSKY_SFC_SW_DNI?: Record<string, number>;
      ALLSKY_SFC_SW_DIFF?: Record<string, number>;
      WS10M?: Record<string, number>;
      WS10M_MAX?: Record<string, number>;
      RH2M?: Record<string, number>;
      T2M?: Record<string, number>;
      T2M_MAX?: Record<string, number>;
      T2M_MIN?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
    };
  };
}
