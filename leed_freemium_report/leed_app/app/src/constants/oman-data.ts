// ─── Oman Soil Zones (from competitor app — 10 detailed zones) ────────────────
export interface OmanSoilZone {
  name: string;
  nameAr: string;
  sand: number;
  silt: number;
  clay: number;
  ph: number;
  organicCarbon: number;
  sabkhaRisk: boolean;
  expansiveClayRisk: boolean;
  corrosionRisk: 'low' | 'moderate' | 'high';
  bearingMin: number;
  bearingMax: number;
  foundation: 'strip' | 'raft' | 'piles';
  waterproofing: boolean;
  latMin: number; latMax: number; lngMin: number; lngMax: number;
}

export const OMAN_SOIL_ZONES: OmanSoilZone[] = [
  { name: 'Batinah Coast', nameAr: 'ساحل الباطنة', sand: 55, silt: 20, clay: 25, ph: 8.2, organicCarbon: 0.3, sabkhaRisk: true, expansiveClayRisk: false, corrosionRisk: 'high', bearingMin: 50, bearingMax: 150, foundation: 'piles', waterproofing: true, latMin: 23.2, latMax: 24.5, lngMin: 57.0, lngMax: 58.5 },
  { name: 'Muscat Urban', nameAr: 'مسقط الحضرية', sand: 45, silt: 25, clay: 30, ph: 7.8, organicCarbon: 0.5, sabkhaRisk: false, expansiveClayRisk: false, corrosionRisk: 'moderate', bearingMin: 100, bearingMax: 250, foundation: 'raft', waterproofing: true, latMin: 23.4, latMax: 23.75, lngMin: 58.1, lngMax: 58.7 },
  { name: 'Hajar Mountains', nameAr: 'جبال الحجر', sand: 35, silt: 30, clay: 35, ph: 8.0, organicCarbon: 0.2, sabkhaRisk: false, expansiveClayRisk: false, corrosionRisk: 'low', bearingMin: 200, bearingMax: 500, foundation: 'strip', waterproofing: false, latMin: 22.8, latMax: 24.0, lngMin: 56.5, lngMax: 59.0 },
  { name: 'Sharqiyah Coast', nameAr: 'ساحل الشرقية', sand: 65, silt: 15, clay: 20, ph: 8.4, organicCarbon: 0.2, sabkhaRisk: true, expansiveClayRisk: false, corrosionRisk: 'high', bearingMin: 60, bearingMax: 120, foundation: 'piles', waterproofing: true, latMin: 21.5, latMax: 23.2, lngMin: 58.5, lngMax: 59.9 },
  { name: 'Desert Interior', nameAr: 'الصحراء الداخلية', sand: 85, silt: 8, clay: 7, ph: 8.0, organicCarbon: 0.1, sabkhaRisk: false, expansiveClayRisk: false, corrosionRisk: 'low', bearingMin: 40, bearingMax: 100, foundation: 'raft', waterproofing: false, latMin: 19.0, latMax: 22.5, lngMin: 54.0, lngMax: 58.5 },
  { name: 'Dhofar / Salalah', nameAr: 'ظفار / صلالة', sand: 30, silt: 30, clay: 40, ph: 7.5, organicCarbon: 1.2, sabkhaRisk: false, expansiveClayRisk: true, corrosionRisk: 'moderate', bearingMin: 80, bearingMax: 180, foundation: 'raft', waterproofing: true, latMin: 16.5, latMax: 18.5, lngMin: 52.5, lngMax: 56.0 },
  { name: 'Duqm / Wusta', nameAr: 'الدقم / الوسطى', sand: 70, silt: 15, clay: 15, ph: 8.1, organicCarbon: 0.2, sabkhaRisk: true, expansiveClayRisk: false, corrosionRisk: 'moderate', bearingMin: 60, bearingMax: 140, foundation: 'raft', waterproofing: true, latMin: 19.5, latMax: 21.5, lngMin: 56.5, lngMax: 58.5 },
  { name: 'Sohar / North', nameAr: 'صحار / الشمال', sand: 50, silt: 22, clay: 28, ph: 8.0, organicCarbon: 0.4, sabkhaRisk: true, expansiveClayRisk: false, corrosionRisk: 'high', bearingMin: 70, bearingMax: 160, foundation: 'raft', waterproofing: true, latMin: 24.2, latMax: 24.8, lngMin: 56.4, lngMax: 57.2 },
  { name: 'Musandam Peninsula', nameAr: 'شبه جزيرة مسندم', sand: 30, silt: 25, clay: 45, ph: 7.9, organicCarbon: 0.3, sabkhaRisk: false, expansiveClayRisk: true, corrosionRisk: 'moderate', bearingMin: 120, bearingMax: 280, foundation: 'strip', waterproofing: false, latMin: 25.5, latMax: 26.5, lngMin: 56.0, lngMax: 56.8 },
  { name: 'Al Dakhliyah / Nizwa', nameAr: 'الداخلية / نزوى', sand: 40, silt: 30, clay: 30, ph: 7.7, organicCarbon: 0.4, sabkhaRisk: false, expansiveClayRisk: false, corrosionRisk: 'low', bearingMin: 120, bearingMax: 260, foundation: 'strip', waterproofing: false, latMin: 22.5, latMax: 23.2, lngMin: 56.8, lngMax: 57.8 },
];

export function getOmanSoilZone(lat: number, lng: number): OmanSoilZone {
  for (const z of OMAN_SOIL_ZONES) {
    if (lat >= z.latMin && lat <= z.latMax && lng >= z.lngMin && lng <= z.lngMax) return z;
  }
  if (lat >= 16 && lat <= 27 && lng >= 51 && lng <= 60) return OMAN_SOIL_ZONES[4];
  return OMAN_SOIL_ZONES[4];
}

// ─── Regional Benchmarks ─────────────────────────────────────────────────────
export const OMAN_BENCHMARKS = [
  { region: 'Muscat Coastal',        solarPotential: 5.8, coolingLoad: 4200, floodRisk: 35, ventilationScore: 55 },
  { region: 'Batinah Plain',         solarPotential: 6.0, coolingLoad: 4500, floodRisk: 45, ventilationScore: 60 },
  { region: 'Interior (Nizwa/Ibri)', solarPotential: 6.2, coolingLoad: 4800, floodRisk: 25, ventilationScore: 40 },
  { region: 'Dhofar (Salalah)',      solarPotential: 5.2, coolingLoad: 3200, floodRisk: 55, ventilationScore: 70 },
  { region: 'Sharqiyah',            solarPotential: 6.1, coolingLoad: 4600, floodRisk: 30, ventilationScore: 50 },
];

export function getNearestRegion(lat: number, lng: number): string {
  if (lat >= 16.5 && lat <= 18.5 && lng >= 52.5 && lng <= 56.0) return 'Dhofar (Salalah)';
  if (lat >= 23.4 && lat <= 23.75 && lng >= 58.1 && lng <= 58.7) return 'Muscat Coastal';
  if (lat >= 23.2 && lat <= 24.5 && lng >= 57.0 && lng <= 58.5) return 'Batinah Plain';
  if (lat >= 21.5 && lat <= 23.2 && lng >= 58.5 && lng <= 59.9) return 'Sharqiyah';
  return 'Interior (Nizwa/Ibri)';
}

// ─── OEESC U-Value Requirements ───────────────────────────────────────────────
export const OEESC_UVALUES = {
  hotArid:   { wall: 0.34, roof: 0.22, floor: 0.36, glazing: 2.2, label: 'Hot Arid (CDD > 3500)' },
  hotHumid:  { wall: 0.34, roof: 0.22, floor: 0.36, glazing: 2.2, label: 'Hot Humid (coastal)' },
  moderate:  { wall: 0.45, roof: 0.30, floor: 0.45, glazing: 3.0, label: 'Moderate (CDD 2000-3500)' },
};

export function getUValues(cdd: number, isCoastal: boolean) {
  if (cdd > 3500) return isCoastal ? OEESC_UVALUES.hotHumid : OEESC_UVALUES.hotArid;
  return OEESC_UVALUES.moderate;
}
