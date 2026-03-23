// Location Types
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

// NASA POWER API Data Types
export interface SolarData {
  ghi: number; // Global Horizontal Irradiance (kWh/m²/day)
  dni: number; // Direct Normal Irradiance (kWh/m²/day)
  dhi: number; // Diffuse Horizontal Irradiance (kWh/m²/day)
  etr: number; // Extraterrestrial Radiation
  optimalTilt: number;
  optimalAzimuth: number;
  yearlyGHI: number;
  pvProductionPotential: number;
  dustImpact: 'low' | 'moderate' | 'high';
  dustImpactValue: number;
}

export interface WindData {
  averageSpeed: number; // m/s
  energyDensity: number; // W/m²
  prevailingDirection: string;
  maxSpeed: number;
  turbineSuitability: 'excellent' | 'good' | 'moderate' | 'poor';
  annualHours: number;
}

export interface ClimateData {
  relativeHumidity: number; // %
  avgTemperature: number; // °C
  maxTemperature: number;
  minTemperature: number;
  rainfall: number; // mm/year
  climateZone: string;
  sunshineHours: number;
}

// ISRIC SoilGrids API Data Types
export interface SoilData {
  type: string;
  texture: string;
  bearingCapacity: number; // kPa
  drainage: 'excellent' | 'good' | 'moderate' | 'poor';
  phLevel: number;
  organicCarbon: number; // %
  clayContent: number; // %
  sandContent: number; // %
  siltContent: number; // %
  contaminationRisk: 'low' | 'moderate' | 'high';
  depth: number;
}

// LEED Assessment Types - Current Land Status Only
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

// Oman Building Code Recommendations
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

// Future Improvement Types
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

// Analysis Result Types
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

// UI Types
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

// API Response Types
export interface NASAPowerResponse {
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN?: number[];
      ALLSKY_SFC_SW_DNI?: number[];
      ALLSKY_SFC_SW_DIFF?: number[];
      WS10M?: number[];
      WS10M_MAX?: number[];
      RH2M?: number[];
      T2M?: number[];
      T2M_MAX?: number[];
      T2M_MIN?: number[];
      PRECTOTCORR?: number[];
    };
  };
}

export interface SoilGridsResponse {
  properties: {
    layers: Array<{
      name: string;
      depth: string;
      unit: string;
      values: {
        mean: number;
      };
    }>;
  };
}
