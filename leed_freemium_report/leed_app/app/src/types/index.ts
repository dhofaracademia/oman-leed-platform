// Location Types
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
  dataSource?: string;
}

export interface WindData {
  averageSpeed: number;
  energyDensity: number;
  prevailingDirection: string;
  maxSpeed: number;
  turbineSuitability: 'excellent' | 'good' | 'moderate' | 'poor';
  annualHours: number;
}

export interface ClimateData {
  relativeHumidity: number;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  rainfall: number;
  climateZone: string;
  sunshineHours: number;
}

export interface SoilData {
  type: string;
  texture: string;
  bearingCapacity: number;
  drainage: 'excellent' | 'good' | 'moderate' | 'poor';
  phLevel: number;
  organicCarbon: number;
  clayContent: number;
  sandContent: number;
  siltContent: number;
  contaminationRisk: 'low' | 'moderate' | 'high';
  depth: number;
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

export interface OBCRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'current' | 'future' | 'na';
  priority: 'high' | 'medium' | 'low';
  obcReference: string;
  leedReference: string;
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
  soil: SoilData;
  landAssessment: LandAssessment;
  obcRecommendations: OBCRecommendation[];
  futureImprovements: FutureImprovement[];
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

export interface SoilGridsResponse {
  properties: {
    layers: Array<{
      name: string;
      depth: string;
      unit: string;
      values: { mean: number };
    }>;
  };
}
