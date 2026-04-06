import type { AnalysisResult } from '@/types';

// ─── Portfolio — Save / Load / Compare Analyses ─────────────────────────────

var STORAGE_KEY = 'omansustain_portfolio';

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  location: { lat: number; lng: number };
  projectType: string;
  gfa: number;
  floors: number;
  leedScore: number;
  leedMaxScore: number;
  summary: ProjectSummary;
  fullResult?: AnalysisResult;
}

export interface ProjectSummary {
  solarGHI: number;
  pvYield: number;
  cdd: number;
  avgTemp: number;
  windSpeed: number;
  ventScore: number;
  soilType: string;
  foundation: string;
  sabkha: boolean;
  seismicZone: string;
  rainfall: number;
  wadiRisk: string;
  wallU: number;
  roofU: number;
}

export function generateProjectId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

export function extractSummary(a: AnalysisResult): ProjectSummary {
  return {
    solarGHI: a.solar.yearlyGHI,
    pvYield: a.solar.pvProductionPotential,
    cdd: a.climate.cdd,
    avgTemp: a.climate.avgTemperature,
    windSpeed: a.wind.averageSpeed,
    ventScore: a.wind.ventilationScore,
    soilType: a.soil.type,
    foundation: a.soil.recommendedFoundation,
    sabkha: a.soil.sabkhaRisk,
    seismicZone: a.seismic.zone,
    rainfall: a.rainfall.annualTotal,
    wadiRisk: a.rainfall.wadiFloodRisk,
    wallU: a.climate.recommendedUValues.wall,
    roofU: a.climate.recommendedUValues.roof,
  };
}

export function loadPortfolio(): SavedProject[] {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch (_e) {
    return [];
  }
}

export function saveProject(
  analysis: AnalysisResult,
  name: string,
  projectType: string,
  gfa: number,
  floors: number
): SavedProject {
  var projects = loadPortfolio();
  var project: SavedProject = {
    id: generateProjectId(),
    name: name,
    savedAt: new Date().toISOString(),
    location: { lat: analysis.location.lat, lng: analysis.location.lng },
    projectType: projectType,
    gfa: gfa,
    floors: floors,
    leedScore: analysis.landAssessment.currentScore,
    leedMaxScore: analysis.landAssessment.maxPossibleScore,
    summary: extractSummary(analysis),
  };
  projects.unshift(project); // newest first
  if (projects.length > 20) projects = projects.slice(0, 20); // max 20
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return project;
}

export function deleteProject(id: string): void {
  var projects = loadPortfolio().filter(function(p) { return p.id !== id; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function clearPortfolio(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface ComparisonField {
  label: string;
  labelAr: string;
  unit: string;
  values: (string | number)[];
  best: number; // index of best value (-1 if N/A)
  higher_is_better: boolean;
}

export function compareProjects(projects: SavedProject[]): ComparisonField[] {
  if (projects.length < 2) return [];

  var fields: ComparisonField[] = [];

  function addField(label: string, labelAr: string, unit: string, extractor: (s: ProjectSummary) => number, higherBetter: boolean) {
    var vals = projects.map(function(p) { return extractor(p.summary); });
    var bestIdx = -1;
    var bestVal = higherBetter ? -Infinity : Infinity;
    vals.forEach(function(v, i) {
      if (higherBetter ? v > bestVal : v < bestVal) { bestVal = v; bestIdx = i; }
    });
    fields.push({ label: label, labelAr: labelAr, unit: unit, values: vals, best: bestIdx, higher_is_better: higherBetter });
  }

  function addStringField(label: string, labelAr: string, extractor: (s: ProjectSummary) => string) {
    var vals = projects.map(function(p) { return extractor(p.summary); });
    fields.push({ label: label, labelAr: labelAr, unit: '', values: vals, best: -1, higher_is_better: false });
  }

  addField('LEED Score', 'درجة LEED', '/110', function(_s) { return 0; }, true);
  // Override with actual LEED scores from project level
  fields[fields.length - 1].values = projects.map(function(p) { return p.leedMaxScore; });
  var leedBest = 0; var leedMax = 0;
  fields[fields.length - 1].values.forEach(function(v, i) { if ((v as number) > leedMax) { leedMax = v as number; leedBest = i; } });
  fields[fields.length - 1].best = leedBest;

  addField('Solar GHI', 'الإشعاع الشمسي', 'kWh/m²/yr', function(s) { return s.solarGHI; }, true);
  addField('PV Yield', 'إنتاجية PV', 'kWh/kWp/yr', function(s) { return s.pvYield; }, true);
  addField('CDD', 'حمل التبريد', '', function(s) { return s.cdd; }, false);
  addField('Avg Temp', 'متوسط الحرارة', '°C', function(s) { return s.avgTemp; }, false);
  addField('Wind Speed', 'سرعة الرياح', 'm/s', function(s) { return s.windSpeed; }, true);
  addField('Ventilation', 'درجة التهوية', '/100', function(s) { return s.ventScore; }, true);
  addField('Rainfall', 'الأمطار', 'mm/yr', function(s) { return s.rainfall; }, true);
  addField('Wall U-value', 'U-جدار', 'W/m²K', function(s) { return s.wallU; }, false);
  addStringField('Soil', 'التربة', function(s) { return s.soilType; });
  addStringField('Foundation', 'الأساسات', function(s) { return s.foundation; });
  addStringField('Seismic', 'الزلازل', function(s) { return s.seismicZone; });
  addStringField('Wadi Risk', 'خطر الوادي', function(s) { return s.wadiRisk; });

  return fields;
}
