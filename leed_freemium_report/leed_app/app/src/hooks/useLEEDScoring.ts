import { useCallback } from 'react';
import type {
  SolarData, WindData, ClimateData, RainfallData,
  SoilData, SeismicData, LandAssessment, LEEDCategory,
  OBCRecommendation, FutureImprovement, Location
} from '@/types';

// ─── LEED v4.1 BD+C Level thresholds ────────────────────────────────────────
export function getLEEDLevel(score: number): 'none' | 'certified' | 'silver' | 'gold' | 'platinum' {
  if (score >= 80) return 'platinum';
  if (score >= 60) return 'gold';
  if (score >= 50) return 'silver';
  if (score >= 40) return 'certified';
  return 'none';
}

export function getLEEDLevelAr(score: number): string {
  if (score >= 80) return 'بلاتيني';
  if (score >= 60) return 'ذهبي';
  if (score >= 50) return 'فضي';
  if (score >= 40) return 'معتمد';
  return 'لا يوجد';
}

// ─── Credit item type ─────────────────────────────────────────────────────────
export interface LEEDCreditItem {
  name: string;
  maxPoints: number;
  currentPoints: number;
  possiblePoints: number;
  status: 'earned' | 'partial' | 'potential' | 'manual' | 'na';
  recommendation?: string;
  oeescRef?: string;
  obcRef?: string;
  costImpact?: 'low' | 'medium' | 'high';
}

export interface LEEDCategoryFull {
  name: string;
  icon: string;
  description: string;
  maxPoints: number;
  currentPoints: number;
  possiblePoints: number;
  credits: LEEDCreditItem[];
}

// ─── Input types ──────────────────────────────────────────────────────────────
interface ScoringInputs {
  location: Location;
  solar: SolarData;
  wind: WindData;
  climate: ClimateData;
  rainfall: RainfallData;
  soil: SoilData;
  seismic: SeismicData;
}

// ─── CATEGORY 1 — Location & Transportation (max 16) ─────────────────────────
function scoreLocationTransportation(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // High Priority Site (2 pts) — Oman development zones
  const isDevZone = (
    (inp.location.lat > 23.5 && inp.location.lat < 24.0 && inp.location.lng > 58.3 && inp.location.lng < 58.7) ||
    (inp.location.lat > 19.5 && inp.location.lat < 20.0 && inp.location.lng > 57.0 && inp.location.lng < 57.5) ||
    (inp.location.lat > 16.5 && inp.location.lat < 17.5 && inp.location.lng > 53.5 && inp.location.lng < 55.0)
  );
  const devPts = isDevZone ? 2 : 0;
  credits.push({ name: 'High Priority Site', maxPoints: 2, currentPoints: devPts, possiblePoints: 2, status: isDevZone ? 'earned' : 'potential', recommendation: isDevZone ? undefined : 'Site in Oman special economic zone earns 2 pts (Muscat, Salalah, Duqm, Sohar). Verify zone status.', obcRef: 'Oman 2040 Development Zones' });
  current += devPts; possible += 2;

  // Sensitive Land Protection (1 pt)
  const safeLand = !inp.soil.sabkhaRisk;
  credits.push({ name: 'Sensitive Land Protection', maxPoints: 1, currentPoints: safeLand ? 1 : 0, possiblePoints: 1, status: safeLand ? 'earned' : 'potential', recommendation: inp.soil.sabkhaRisk ? 'Site has sabkha risk — remediation required before credit can be earned.' : undefined });
  current += safeLand ? 1 : 0; possible += 1;

  // Surrounding Density & Diverse Uses (5 pts) — design/location dependent
  credits.push({ name: 'Surrounding Density and Diverse Uses', maxPoints: 5, currentPoints: 0, possiblePoints: 3, status: 'manual', recommendation: 'Points depend on surrounding built density and mix of uses. Assess at design stage.', costImpact: 'low' });
  possible += 3;

  // Access to Quality Transit (5 pts)
  credits.push({ name: 'Access to Quality Transit', maxPoints: 5, currentPoints: 0, possiblePoints: 3, status: 'manual', recommendation: 'Assess proximity to bus routes and planned Oman transit infrastructure. Salalah and Muscat have active routes.', obcRef: 'OBC General Requirements', costImpact: 'low' });
  possible += 3;

  // Bicycle Facilities (1 pt)
  credits.push({ name: 'Bicycle Facilities', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential', recommendation: 'Provide covered bicycle storage and changing facilities. Low cost, easy 1 pt.', costImpact: 'low' });
  possible += 1;

  // Reduced Parking Footprint (1 pt)
  credits.push({ name: 'Reduced Parking Footprint', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential', recommendation: 'Reduce parking below Oman minimum by 20%. Supports walkable design.', costImpact: 'low' });
  possible += 1;

  // Green Vehicles (1 pt) — EV infrastructure
  credits.push({ name: 'Green Vehicles / EV Infrastructure', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential', recommendation: 'Install EV charging stations (minimum 5% of total spaces). Solar-powered preferred.', oeescRef: 'OEESC Art. 4.3', costImpact: 'low' });
  possible += 1;

  return { name: 'Location & Transportation', icon: 'MapPin', description: 'Sustainable site selection and transportation access', maxPoints: 16, currentPoints: current, possiblePoints: Math.min(possible, 16), credits };
}

// ─── CATEGORY 2 — Sustainable Sites (max 10) ─────────────────────────────────
function scoreSustainableSites(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // Site Assessment (1 pt) — earned by doing this analysis
  credits.push({ name: 'Site Assessment', maxPoints: 1, currentPoints: 1, possiblePoints: 1, status: 'earned' });
  current += 1; possible += 1;

  // Rainwater Management (3 pts)
  const hasHarvestingPotential = inp.rainfall.rainwaterHarvestingPotential > 5;
  const rainPts = hasHarvestingPotential ? 1 : 0;
  credits.push({
    name: 'Rainwater Management',
    maxPoints: 3, currentPoints: rainPts, possiblePoints: 3,
    status: rainPts > 0 ? 'partial' : 'potential',
    recommendation: 'Implement rainwater collection (' + inp.rainfall.rainwaterHarvestingPotential + ' m3/yr potential). On-site infiltration and retention basin per OBC Section 8. ' + inp.rainfall.stormDrainageRequirement,
    oeescRef: 'OEESC Art. 6.1', obcRef: 'OBC Section 8', costImpact: 'medium',
  });
  current += rainPts; possible += 3;

  // Heat Island Reduction (2 pts)
  const heatGainHigh = inp.solar.facadeHeatGain.east > 70 || inp.solar.facadeHeatGain.west > 70;
  credits.push({
    name: 'Heat Island Reduction', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'potential',
    recommendation: heatGainHigh
      ? 'Critical: East/West facade heat gain exceeds 70. Install high-albedo roofing (SRI >= 78), external vertical fins, deep overhangs, and shaded parking. Avg temp ' + inp.climate.avgTemperature + 'C makes this high priority.'
      : 'Use high-albedo roofing (SRI >= 78) and shade structures for hardscape. Avg temp ' + inp.climate.avgTemperature + 'C — essential for comfort.',
    oeescRef: 'OEESC Art. 3.6', costImpact: 'low',
  });
  possible += 2;

  // Light Pollution Reduction (1 pt)
  credits.push({ name: 'Light Pollution Reduction', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential', recommendation: 'Use full-cutoff luminaires and motion sensors. Protect night sky — especially in Dhofar tourism areas.', costImpact: 'low' });
  possible += 1;

  // Sensitive Land Protection — carried from category 1
  const safeLand = !inp.soil.sabkhaRisk;
  credits.push({ name: 'Sensitive Land Protection', maxPoints: 1, currentPoints: safeLand ? 1 : 0, possiblePoints: 1, status: safeLand ? 'earned' : 'potential', recommendation: inp.soil.sabkhaRisk ? 'Sabkha risk detected. Ground improvement required per OBC Section 4.' : undefined, obcRef: 'OBC Section 4' });
  current += safeLand ? 1 : 0; possible += 1;

  // Site Development / Restore Habitat (2 pts)
  credits.push({ name: 'Site Development - Restore Habitat', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'potential', recommendation: 'Restore 30%+ of disturbed area with native drought-resistant plants (Ghaf, Sidr, Acacia). Reduces heat island and supports biodiversity.', costImpact: 'medium' });
  possible += 2;

  return { name: 'Sustainable Sites', icon: 'TreePine', description: 'Site design, habitat protection and stormwater management', maxPoints: 10, currentPoints: current, possiblePoints: Math.min(possible, 10), credits };
}

// ─── CATEGORY 3 — Water Efficiency (max 11) ──────────────────────────────────
function scoreWaterEfficiency(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // Outdoor Water Use Reduction (2 pts) — critical in Oman
  const aridClimate = inp.climate.rainfall < 200;
  credits.push({
    name: 'Outdoor Water Use Reduction', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'potential',
    recommendation: aridClimate
      ? 'Annual rainfall only ' + inp.climate.rainfall + 'mm. Xeriscaping with native Omani plants (Ghaf, Sidr) is mandatory. Drip irrigation with soil moisture sensors. No lawn areas.'
      : 'Reduce outdoor water use 50% through native landscaping and efficient irrigation. Rainfall: ' + inp.climate.rainfall + 'mm/yr.',
    oeescRef: 'OEESC Art. 6.2', costImpact: 'low',
  });
  possible += 2;

  // Indoor Water Use Reduction (6 pts)
  credits.push({ name: 'Indoor Water Use Reduction', maxPoints: 6, currentPoints: 0, possiblePoints: 4, status: 'manual', recommendation: 'Install WaterSense-labeled fixtures. Target 35% reduction vs baseline. Greywater recycling adds up to 2 pts. CDD ' + inp.climate.cdd + ' means high cooling demand — prioritize cooling water too.', costImpact: 'low' });
  possible += 4;

  // Cooling Tower Water Use (2 pts) — highly relevant for Oman's CDD
  const highCDD = inp.climate.cdd > 3000;
  credits.push({
    name: 'Cooling Tower Water Use', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'potential',
    recommendation: highCDD
      ? 'CDD ' + inp.climate.cdd + ' means intensive cooling demand. Maximize cooling tower cycles of concentration (target 10+). Consider air-cooled condensers or VRF systems. High priority — water is scarce in Oman.'
      : 'Install water-efficient cooling systems. Maximize cycles of concentration.',
    oeescRef: 'OEESC Art. 4.2', costImpact: 'medium',
  });
  possible += 2;

  // Building-Level Water Metering (1 pt)
  credits.push({ name: 'Building-Level Water Metering', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential', recommendation: 'Install permanent water meters with sub-metering for irrigation, HVAC, and domestic uses. Easy 1 pt.', costImpact: 'low' });
  possible += 1;

  return { name: 'Water Efficiency', icon: 'Droplets', description: 'Water use reduction and efficiency — critical in arid Oman', maxPoints: 11, currentPoints: current, possiblePoints: Math.min(possible, 11), credits };
}

// ─── CATEGORY 4 — Energy & Atmosphere (max 33) ───────────────────────────────
function scoreEnergyAtmosphere(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // Optimize Energy Performance (18 pts) — data-driven score
  const solarAdv  = inp.solar.yearlyGHI > 2000 ? 3 : inp.solar.yearlyGHI > 1800 ? 2 : 1;
  const ventAdv   = inp.wind.ventilationScore > 60 ? 2 : inp.wind.ventilationScore > 40 ? 1 : 0;
  const uvalScore = inp.climate.cdd > 3500 ? 2 : inp.climate.cdd > 2500 ? 1 : 0;
  const sitePts   = solarAdv + ventAdv + uvalScore;
  credits.push({
    name: 'Optimize Energy Performance', maxPoints: 18, currentPoints: sitePts, possiblePoints: Math.min(sitePts + 8, 18), status: 'partial',
    recommendation: 'Solar GHI ' + inp.solar.yearlyGHI + ' kWh/m2/yr (excellent). CDD ' + inp.climate.cdd + ' — apply OEESC U-values: Wall ' + inp.climate.recommendedUValues.wall + ' W/m2K, Roof ' + inp.climate.recommendedUValues.roof + ' W/m2K, Glazing ' + inp.climate.recommendedUValues.glazing + ' W/m2K. Ventilation score ' + inp.wind.ventilationScore + '/100. Target 25% energy cost reduction vs baseline.',
    oeescRef: 'OEESC Art. 4.1-4.3', obcRef: 'OBC Section 10', costImpact: 'medium',
  });
  current += sitePts; possible += Math.min(sitePts + 8, 18);

  // Renewable Energy Production (3 pts) — PVGIS data
  const pvYield = inp.solar.pvProductionPotential;
  const pvPts   = pvYield > 1500 ? 2 : pvYield > 1200 ? 1 : 0;
  credits.push({
    name: 'Renewable Energy Production', maxPoints: 3, currentPoints: pvPts, possiblePoints: 3, status: pvPts > 0 ? 'partial' : 'potential',
    recommendation: 'PV yield potential: ' + pvYield + ' kWh/kWp/yr at optimal ' + inp.solar.optimalTilt + 'deg tilt. Dust loss: ' + inp.solar.dustImpactValue + '% — install automated cleaning system. BIPV or rooftop array recommended.',
    oeescRef: 'OEESC Art. 4.3', costImpact: 'high',
  });
  current += pvPts; possible += 3;

  // Enhanced Commissioning (6 pts)
  credits.push({ name: 'Enhanced Commissioning', maxPoints: 6, currentPoints: 0, possiblePoints: 4, status: 'manual', recommendation: 'Engage commissioning authority (CxA) early. Enhanced Cx adds 4 pts — critical for complex HVAC in hot climate.', costImpact: 'medium' });
  possible += 4;

  // Advanced Energy Metering (1 pt)
  credits.push({ name: 'Advanced Energy Metering', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential', recommendation: 'Install sub-meters for HVAC, lighting, plug loads, and renewables. Easy 1 pt with BMS.', costImpact: 'low' });
  possible += 1;

  // Demand Response (2 pts) — relevant with Oman grid
  credits.push({ name: 'Demand Response', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'potential', recommendation: 'Participate in OPAL/OPWP demand response program. Solar + battery storage enables peak load shifting.', costImpact: 'medium' });
  possible += 2;

  // Wind energy bonus
  if (inp.wind.turbineSuitability === 'excellent' || inp.wind.turbineSuitability === 'good') {
    credits.push({ name: 'Wind Energy Supplement', maxPoints: 2, currentPoints: 1, possiblePoints: 2, status: 'partial', recommendation: 'Wind speed ' + inp.wind.averageSpeed + ' m/s (' + inp.wind.turbineSuitability + ' suitability). Prevailing direction: ' + inp.wind.prevailingDirection + '. Small wind turbine installation viable for additional RE points.', oeescRef: 'OEESC Art. 4.3', costImpact: 'high' });
    current += 1; possible += 2;
  }

  return { name: 'Energy & Atmosphere', icon: 'Zap', description: 'Energy performance, renewables and commissioning', maxPoints: 33, currentPoints: current, possiblePoints: Math.min(possible, 33), credits };
}

// ─── CATEGORY 5 — Materials & Resources (max 13) ─────────────────────────────
function scoreMaterialsResources(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // Storage & Collection of Recyclables (prerequisite)
  credits.push({ name: 'Storage and Collection of Recyclables', maxPoints: 0, currentPoints: 0, possiblePoints: 0, status: 'potential', recommendation: 'Prerequisite: Provide dedicated recycling storage. Coordinate with Muscat Municipality or Dhofar Municipality collection program.' });

  // Building Life-Cycle Impact Reduction (5 pts)
  const localMat = inp.soil.type.includes('Sand') || inp.soil.type.includes('Loam');
  credits.push({ name: 'Building Life-Cycle Impact Reduction', maxPoints: 5, currentPoints: localMat ? 1 : 0, possiblePoints: 3, status: localMat ? 'partial' : 'manual', recommendation: 'Local Oman limestone, gypsum, and sand are excellent low-carbon materials. Soil type: ' + inp.soil.type + '. Conduct whole-building LCA. Avoid imported materials where local equivalents exist.', costImpact: 'medium' });
  current += localMat ? 1 : 0; possible += 3;

  // Building Product Disclosure (6 pts)
  credits.push({ name: 'Building Product Disclosure and Optimization - EPD', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'manual', recommendation: 'Specify at least 20 products with Environmental Product Declarations (EPDs). Many major cement/steel suppliers now provide these.', costImpact: 'low' });
  possible += 2;
  credits.push({ name: 'Building Product Disclosure - Sourcing of Raw Materials', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'manual', recommendation: 'Use materials with responsible extraction reports. Oman natural stone and aggregate suppliers.', costImpact: 'low' });
  possible += 2;
  credits.push({ name: 'Building Product Disclosure - Material Ingredients', maxPoints: 2, currentPoints: 0, possiblePoints: 1, status: 'manual', recommendation: 'Select low-VOC paints, adhesives, and sealants. Especially critical in hot climate with limited ventilation periods.', costImpact: 'low' });
  possible += 1;

  // C&D Waste Management (2 pts)
  credits.push({ name: 'Construction and Demolition Waste Management', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'manual', recommendation: 'Target 75% diversion from landfill. Coordinate with Beeah or similar licensed waste operators in Oman. Concrete crushing for backfill is common.', costImpact: 'low' });
  possible += 2;

  // Seismic bonus note
  if (inp.seismic.zoneNumber >= 2) {
    credits.push({ name: 'Structural Resilience Materials', maxPoints: 0, currentPoints: 0, possiblePoints: 0, status: 'na', recommendation: 'Seismic zone ' + inp.seismic.zone + ' requires ductile reinforcing steel (Grade 60 or higher). Factor into materials specification and LCA.' });
  }

  return { name: 'Materials & Resources', icon: 'Recycle', description: 'Sustainable material selection, sourcing and waste management', maxPoints: 13, currentPoints: current, possiblePoints: Math.min(possible, 13), credits };
}

// ─── CATEGORY 6 — Indoor Environmental Quality (max 16) ──────────────────────
function scoreIndoorQuality(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // Enhanced IAQ (2 pts) — ventilation score driven
  const goodVent = inp.wind.ventilationScore > 50;
  const ventPts  = goodVent ? 1 : 0;
  credits.push({
    name: 'Enhanced Indoor Air Quality Strategies', maxPoints: 2, currentPoints: ventPts, possiblePoints: 2, status: goodVent ? 'partial' : 'potential',
    recommendation: goodVent
      ? 'Ventilation score ' + inp.wind.ventilationScore + '/100. Prevailing wind: ' + inp.wind.prevailingDirection + '. Orient operable windows perpendicular to wind (cross-ventilation angle: ' + inp.wind.crossVentilationAngle + 'deg). Use ventilation during comfort hours: avg ' + Math.round(inp.climate.comfortHours.reduce(function(s, c) { return s + c.percentage; }, 0) / 12) + '% of time.'
      : 'Limited natural ventilation (score ' + inp.wind.ventilationScore + '/100). Mechanical ventilation with enhanced filtration (MERV-13+) required. HEPA units for dusty periods.',
    oeescRef: 'OEESC Art. 5.1', obcRef: 'OBC Section 7', costImpact: 'medium',
  });
  current += ventPts; possible += 2;

  // Low-Emitting Materials (3 pts)
  credits.push({ name: 'Low-Emitting Materials', maxPoints: 3, currentPoints: 0, possiblePoints: 3, status: 'manual', recommendation: 'Specify low-VOC paints, adhesives, carpet, and composite wood. Critical in air-tight buildings with high cooling loads. GREENGUARD or equivalent certification.', costImpact: 'low' });
  possible += 3;

  // Construction IAQ Management (1 pt)
  credits.push({ name: 'Construction Indoor Air Quality Management Plan', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'manual', recommendation: 'Develop SMACNA-compliant IAQ plan. Protect ductwork during construction — especially important in dusty Oman sites.', costImpact: 'low' });
  possible += 1;

  // IAQ Assessment (2 pts)
  credits.push({ name: 'Indoor Air Quality Assessment', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'manual', recommendation: 'Conduct flush-out or air testing before occupancy. Extended flush-out during cooler months (Oct-Mar) recommended.', costImpact: 'low' });
  possible += 2;

  // Thermal Comfort (1 pt) — comfort hours driven
  const avgComfort = Math.round(inp.climate.comfortHours.reduce(function(s, c) { return s + c.percentage; }, 0) / 12);
  credits.push({
    name: 'Thermal Comfort', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'potential',
    recommendation: 'Average comfort hours: ' + avgComfort + '% annually. CDD ' + inp.climate.cdd + ' — design HVAC for individual control per ASHRAE 55. Wet-bulb temperature peaks: ' + (inp.climate.psychrometric ? Math.max.apply(null, inp.climate.psychrometric.map(function(p) { return p.wetBulb; })).toFixed(1) : 'N/A') + 'C. Overheating hours: ' + inp.climate.overheatingHours + '/yr.',
    costImpact: 'medium',
  });
  possible += 1;

  // Interior Lighting (2 pts)
  credits.push({ name: 'Interior Lighting', maxPoints: 2, currentPoints: 0, possiblePoints: 2, status: 'manual', recommendation: 'Individual occupant lighting controls + automated daylight-responsive dimming. High solar availability means significant daylight hours.', oeescRef: 'OEESC Art. 4.1', costImpact: 'low' });
  possible += 2;

  // Daylight (3 pts) — GHI driven
  const goodSolar = inp.solar.yearlyGHI > 1800;
  const daylightPts = goodSolar ? 1 : 0;
  credits.push({
    name: 'Daylight', maxPoints: 3, currentPoints: daylightPts, possiblePoints: 3, status: goodSolar ? 'partial' : 'potential',
    recommendation: 'Yearly GHI: ' + inp.solar.yearlyGHI + ' kWh/m2 — excellent daylight resource. Use recommended WWR: North ' + inp.solar.recommendedWWR.north + '%, South ' + inp.solar.recommendedWWR.south + '%, East/West ' + inp.solar.recommendedWWR.east + '%. Add light shelves, glare control, and automated blinds for west facade (heat gain: ' + inp.solar.facadeHeatGain.west + '/100).',
    oeescRef: 'OEESC Art. 3.5', costImpact: 'low',
  });
  current += daylightPts; possible += 3;

  // Quality Views (1 pt)
  credits.push({ name: 'Quality Views', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'manual', recommendation: 'Provide direct line of sight to exterior for 75%+ of regularly occupied spaces. Oman\'s landscape (mountains, sea, desert) makes this achievable.', costImpact: 'low' });
  possible += 1;

  return { name: 'Indoor Environmental Quality', icon: 'Wind', description: 'Indoor air quality, thermal comfort and occupant wellness', maxPoints: 16, currentPoints: current, possiblePoints: Math.min(possible, 16), credits };
}

// ─── CATEGORY 7 — Innovation (max 6) ─────────────────────────────────────────
function scoreInnovation(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  const passiveOps: string[] = [];
  if (inp.wind.ventilationScore > 60) passiveOps.push('natural ventilation (score ' + inp.wind.ventilationScore + '/100)');
  if (inp.solar.yearlyGHI > 2000) passiveOps.push('passive solar shading (GHI ' + inp.solar.yearlyGHI + ' kWh/m2)');
  if (inp.rainfall.rainwaterHarvestingPotential > 10) passiveOps.push('rainwater harvesting (' + inp.rainfall.rainwaterHarvestingPotential + ' m3/yr)');
  if (inp.soil.corrosionRisk === 'high') passiveOps.push('corrosion-resistant design (soil: ' + inp.soil.corrosionRisk + ' risk)');

  const innovPts = Math.min(passiveOps.length, 3);
  credits.push({
    name: 'Innovation - Passive Climate Design', maxPoints: 5, currentPoints: innovPts, possiblePoints: Math.min(innovPts + 2, 5), status: innovPts > 0 ? 'partial' : 'potential',
    recommendation: passiveOps.length > 0
      ? 'Document these innovation credits: ' + passiveOps.join(', ') + '. Each unique passive strategy can earn 1 innovation pt with LEED reviewers.'
      : 'Explore wind catchers, passive cooling chimneys, or earth-contact cooling — traditional Omani techniques as innovation credits.',
    costImpact: 'low',
  });
  current += innovPts; possible += Math.min(innovPts + 2, 5);

  // LEED AP (1 pt)
  credits.push({ name: 'LEED Accredited Professional', maxPoints: 1, currentPoints: 0, possiblePoints: 1, status: 'manual', recommendation: 'Include a LEED AP BD+C on the project team. Required for official certification. Costs approximately OMR 500-1,500 for AP consultation.', costImpact: 'low' });
  possible += 1;

  // Khareef-specific innovation (Dhofar only)
  const isDhofar = inp.location.lat >= 16.5 && inp.location.lat <= 18.5;
  if (isDhofar) {
    credits.push({ name: 'Innovation - Khareef Monsoon Design', maxPoints: 1, currentPoints: 1, possiblePoints: 1, status: 'earned', recommendation: 'Dhofar location qualifies for unique Khareef climate adaptation credit. Document moisture management and monsoon-responsive design strategies.' });
    current += 1; possible += 1;
  }

  return { name: 'Innovation', icon: 'Lightbulb', description: 'Innovative design and performance beyond LEED credits', maxPoints: 6, currentPoints: current, possiblePoints: Math.min(possible, 6), credits };
}

// ─── CATEGORY 8 — Regional Priority (max 4) ──────────────────────────────────
function scoreRegionalPriority(inp: ScoringInputs): LEEDCategoryFull {
  const credits: LEEDCreditItem[] = [];
  let current = 0, possible = 0;

  // Renewable Energy (1 pt) — high priority for Oman Vision 2040
  const pvGood = inp.solar.pvProductionPotential > 1400;
  credits.push({
    name: 'Regional Priority: Renewable Energy', maxPoints: 1, currentPoints: pvGood ? 1 : 0, possiblePoints: 1,
    status: pvGood ? 'earned' : 'potential',
    recommendation: 'PV yield ' + inp.solar.pvProductionPotential + ' kWh/kWp/yr. Oman Vision 2040 targets 30% renewable by 2030. This credit supports national strategy and qualifies for OPAL green building incentives.',
  });
  current += pvGood ? 1 : 0; possible += 1;

  // Water Efficiency (1 pt) — critical for arid Oman
  const waterPriority = inp.climate.rainfall < 150;
  credits.push({
    name: 'Regional Priority: Water Efficiency', maxPoints: 1, currentPoints: waterPriority ? 1 : 0, possiblePoints: 1,
    status: waterPriority ? 'earned' : 'potential',
    recommendation: 'Annual rainfall: ' + inp.climate.rainfall + 'mm — extremely scarce. Oman faces severe water stress. Water efficiency is highest regional priority. Desalination dependency makes every m3 saved critical.',
  });
  current += waterPriority ? 1 : 0; possible += 1;

  // Energy Efficiency (1 pt) — Oman's high cooling loads
  const highEnergy = inp.climate.cdd > 2500;
  credits.push({
    name: 'Regional Priority: Energy Efficiency', maxPoints: 1, currentPoints: highEnergy ? 1 : 0, possiblePoints: 1,
    status: highEnergy ? 'earned' : 'potential',
    recommendation: 'CDD ' + inp.climate.cdd + ' — Oman has among the highest cooling loads in the world. OEESC compliance mandatory. This credit recognizes the regional challenge of energy-efficient design in extreme heat.',
  });
  current += highEnergy ? 1 : 0; possible += 1;

  // Seismic / Structural Resilience (1 pt) — unique regional priority
  credits.push({
    name: 'Regional Priority: Structural Resilience', maxPoints: 1, currentPoints: inp.seismic.zoneNumber >= 1 ? 1 : 0, possiblePoints: 1,
    status: inp.seismic.zoneNumber >= 1 ? 'earned' : 'potential',
    recommendation: 'Seismic zone: ' + inp.seismic.zone + ' (PGA ' + inp.seismic.pga + 'g). ' + inp.seismic.structuralRecommendation + ' Foundation: ' + inp.soil.recommendedFoundation + ' recommended for ' + inp.soil.type + '.',
    obcRef: 'OBC Section 6.6',
  });
  current += inp.seismic.zoneNumber >= 1 ? 1 : 0; possible += 1;

  return { name: 'Regional Priority', icon: 'Award', description: 'Oman Vision 2040 and GCC region-specific environmental priorities', maxPoints: 4, currentPoints: current, possiblePoints: Math.min(possible, 4), credits };
}

// ─── OBC Recommendations (linked to real data) ───────────────────────────────
function generateOBCRecs(inp: ScoringInputs, cats: LEEDCategoryFull[]): OBCRecommendation[] {
  const recs: OBCRecommendation[] = [];
  let id = 1;

  function addRec(category: string, title: string, description: string, priority: 'high' | 'medium' | 'low', obcRef: string, leedRef: string, pts: number, cost: 'low' | 'medium' | 'high', oeescRef?: string) {
    recs.push({ id: 'OBC-' + String(id++).padStart(3, '0'), category, title, description, status: 'future', priority, obcReference: obcRef, leedReference: leedRef, oeescReference: oeescRef, potentialScoreIncrease: pts, implementationCost: cost, implementationPhase: 'Design & Construction' });
  }

  addRec('Thermal Envelope', 'OEESC U-Value Compliance', 'CDD ' + inp.climate.cdd + '. Required: Wall ' + inp.climate.recommendedUValues.wall + ' W/m2K, Roof ' + inp.climate.recommendedUValues.roof + ' W/m2K, Glazing ' + inp.climate.recommendedUValues.glazing + ' W/m2K. Climate zone: ' + inp.climate.climateZone + '.', 'high', 'OBC Section 10', 'EA: Optimize Energy Performance', 8, 'medium', 'OEESC Art. 3.2-3.4');

  addRec('Solar Design', 'Building Orientation + PV at Optimal ' + inp.solar.optimalTilt + 'deg Tilt', 'Orient building long axis E-W for north-facing glazing. Install rooftop PV at ' + inp.solar.optimalTilt + 'deg. Yearly GHI: ' + inp.solar.yearlyGHI + ' kWh/m2. Dust loss ' + inp.solar.dustImpactValue + '% — install auto-cleaning.', 'high', 'OBC Section 10', 'EA: Renewable Energy Production', 5, 'medium', 'OEESC Art. 4.3');

  addRec('Facade Shading', 'WWR and Shading per OEESC', 'Recommended WWR: North ' + inp.solar.recommendedWWR.north + '%, South ' + inp.solar.recommendedWWR.south + '%, East/West ' + inp.solar.recommendedWWR.east + '%. West facade heat gain ' + inp.solar.facadeHeatGain.west + '/100 — external fins or deep overhangs required.', 'high', 'OBC Section 10', 'EQ: Daylight', 4, 'low', 'OEESC Art. 3.5');

  addRec('Water Conservation', 'Water Efficiency Systems for Arid Climate', 'Rainfall only ' + inp.climate.rainfall + 'mm/yr. Low-flow fixtures (35% reduction target). Greywater recycling for irrigation. Rainwater harvesting potential: ' + inp.rainfall.rainwaterHarvestingPotential + ' m3/yr.', 'high', 'OBC Plumbing', 'WE: Indoor + Outdoor Water Use', 6, 'low', 'OEESC Art. 6.1-6.2');

  addRec('Natural Ventilation', 'Wind Catcher Design for ' + inp.wind.prevailingDirection + ' Wind', 'Prevailing wind: ' + inp.wind.prevailingDirection + ' at avg ' + inp.wind.averageSpeed + ' m/s. Orient main ventilation openings to cross-ventilation angle ' + inp.wind.crossVentilationAngle + 'deg. Wind-driven rain risk: ' + inp.wind.windDrivenRainRisk + '.', 'medium', 'OBC Section 7', 'EQ: Enhanced IAQ', 3, 'low', 'OEESC Art. 5.1');

  addRec('Foundation & Structural', 'Foundation: ' + inp.soil.recommendedFoundation.charAt(0).toUpperCase() + inp.soil.recommendedFoundation.slice(1) + ' — Seismic Zone ' + inp.seismic.zone, 'Soil: ' + inp.soil.type + '. Bearing: ' + inp.soil.bearingRange.min + '-' + inp.soil.bearingRange.max + ' kPa. ' + (inp.soil.sabkhaRisk ? 'SABKHA RISK — ground improvement mandatory. ' : '') + 'Seismic: ' + inp.seismic.structuralRecommendation, inp.soil.sabkhaRisk ? 'high' : 'medium', 'OBC Section 4 + 6.6', 'SS: Sensitive Land Protection', 2, inp.soil.sabkhaRisk ? 'high' : 'medium');

  if (inp.climate.cdd > 3500) {
    addRec('HVAC', 'High-Efficiency VRF or District Cooling', 'CDD ' + inp.climate.cdd + ' is extreme. VRF or chiller plant with COP > 4.0 mandatory. Overheating hours: ' + inp.climate.overheatingHours + '/yr. Consider district cooling connection if available.', 'high', 'OBC Section 9', 'EA: Optimize Energy Performance', 4, 'high', 'OEESC Art. 4.2');
  }

  if (inp.rainfall.wadiFloodRisk !== 'low') {
    addRec('Drainage', 'Wadi Flood Risk Mitigation — ' + inp.rainfall.wadiFloodRisk.toUpperCase() + ' Risk', inp.rainfall.stormDrainageRequirement + ' Elevation: ' + inp.rainfall.elevation + 'm. Cyclone risk: ' + inp.rainfall.cycloneRiskLevel + '.', 'high', 'OBC Section 8', 'SS: Rainwater Management', 3, 'medium', 'OEESC Art. 6.1');
  }

  if (inp.soil.waterproofingRequired) {
    addRec('Waterproofing', 'Substructure Waterproofing Required', 'Corrosion risk: ' + inp.soil.corrosionRisk + '. Soil pH: ' + inp.soil.phLevel + '. ' + (inp.soil.sabkhaRisk ? 'Sabkha salts require tanking system. ' : '') + 'Crystalline waterproofing recommended for below-grade elements.', 'medium', 'OBC Section 4.5', 'MR: Durable Materials', 1, 'medium');
  }

  recs.sort(function(a, b) { return (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1) || b.potentialScoreIncrease - a.potentialScoreIncrease; });
  return recs;
}

// ─── Future Improvements ─────────────────────────────────────────────────────
function generateImprovements(inp: ScoringInputs): FutureImprovement[] {
  const imps: FutureImprovement[] = [];
  let id = 1;

  function add(title: string, description: string, currentStatus: string, potentialStatus: string, pts: number, cost: string, payback: string, priority: 'high' | 'medium' | 'low') {
    imps.push({ id: 'IMP-' + String(id++).padStart(3, '0'), title, description, currentStatus, potentialStatus, leedPointsIncrease: pts, estimatedCost: cost, paybackPeriod: payback, priority, implementationPhase: 'Design & Construction' });
  }

  add('BIPV Solar Rooftop', 'PV yield ' + inp.solar.pvProductionPotential + ' kWh/kWp/yr at optimal ' + inp.solar.optimalTilt + 'deg tilt. Add automated dust cleaning for ' + inp.solar.dustImpactValue + '% dust loss recovery.', 'No PV system', 'BIPV with 4hr battery storage', 5, 'OMR 20,000-40,000', '7-10 years', 'high');

  add('Greywater Recycling', 'Rainfall only ' + inp.climate.rainfall + 'mm/yr. Greywater recycling for toilet flushing and irrigation saves significant water in arid climate.', 'Standard plumbing', 'Treated greywater reuse', 3, 'OMR 5,000-10,000', '5-8 years', 'high');

  add('High-Performance Envelope', 'CDD ' + inp.climate.cdd + '. Upgrade to U-values: Wall ' + inp.climate.recommendedUValues.wall + ', Roof ' + inp.climate.recommendedUValues.roof + ', Glazing ' + inp.climate.recommendedUValues.glazing + ' W/m2K as required by OEESC.', 'Standard insulation', 'OEESC-compliant super-insulated envelope', 8, 'OMR 15,000-30,000', '6-10 years', 'high');

  if (inp.wind.turbineSuitability === 'good' || inp.wind.turbineSuitability === 'excellent') {
    add('Small Wind Turbine', 'Avg wind speed ' + inp.wind.averageSpeed + ' m/s from ' + inp.wind.prevailingDirection + '. Turbine suitability: ' + inp.wind.turbineSuitability + '. Shamal season avg: ' + inp.wind.seasonalWind.shamal.avgSpeed + ' m/s.', 'No wind generation', '10kW wind turbine', 2, 'OMR 8,000-15,000', '10-15 years', 'medium');
  }

  add('AI-Powered BMS', 'Predictive HVAC control linked to ERA5 weather forecast. Overheating hours: ' + inp.climate.overheatingHours + '/yr — AI can pre-cool during shoulder periods.', 'Basic BMS', 'AI-optimized building', 3, 'OMR 8,000-15,000', '4-7 years', 'medium');

  add('EV Charging Infrastructure', 'Install EV chargers (5% of parking minimum for LEED credit). Solar-powered preferred. Oman EV adoption accelerating with Vision 2040.', 'No EV infrastructure', '4x EV chargers with solar', 2, 'OMR 3,000-6,000', 'N/A (amenity)', 'medium');

  if (inp.soil.bearingCapacity > 150) {
    add('Extensive Green Roof', 'Reduces heat island effect in CDD ' + inp.climate.cdd + ' climate. Native Omani plants (Sidr, Ghaf) suited to arid conditions. Bearing capacity: ' + inp.soil.bearingCapacity + ' kPa supports green roof.', 'Standard roof', 'Extensive green roof (10cm)', 3, 'OMR 12,000-22,000', '10-15 years', 'low');
  }

  imps.sort(function(a, b) { return (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1); });
  return imps;
}

// ─── Construction Calendar (ERA5 driven) ─────────────────────────────────────
export interface SeasonalNote {
  month: string;
  season: string;
  riskLevel: 'low' | 'moderate' | 'high';
  considerations: string[];
}

export function generateSeasonalCalendar(inp: ScoringInputs): SeasonalNote[] {
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const isDhofar = inp.location.lat >= 16.5 && inp.location.lat <= 18.5;
  const seasons  = ['Winter','Winter','Spring','Spring','Pre-Summer','Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'];
  const kharifSeasons = ['Winter','Winter','Spring','Spring','Pre-Summer','Khareef','Khareef','Khareef','Late Khareef','Autumn','Autumn','Winter'];

  return MONTHS.map(function(month, i) {
    const season = isDhofar ? kharifSeasons[i] : seasons[i];
    const notes: string[] = [];
    let risk: 'low' | 'moderate' | 'high' = 'low';

    const t = inp.climate.monthlyTemperature && inp.climate.monthlyTemperature[i];
    if (t && t.max > 42) { notes.push('Extreme heat: avg max ' + t.max + 'C. Restrict outdoor concrete to early AM. Hydration mandatory.'); risk = 'high'; }
    else if (t && t.max > 36) { notes.push('High heat: avg max ' + t.max + 'C. Outdoor work restricted 11am-4pm.'); risk = 'moderate'; }

    const rain = inp.rainfall.monthly && inp.rainfall.monthly[i];
    if (rain && rain.precipitation > 30) { notes.push('High rainfall: ' + rain.precipitation + 'mm. Active site drainage required.'); if (risk === 'low') risk = 'moderate'; }

    if (season === 'Khareef' || season === 'Late Khareef') { notes.push('Khareef monsoon: persistent drizzle, fog, 80%+ humidity. Protect stored materials and reinforce temporary structures.'); if (risk === 'low') risk = 'moderate'; }

    if (inp.rainfall.cycloneSeasonRisk && i >= 5 && i <= 9) { notes.push('Cyclone season active. Monitor RAFO alerts. Arabian Sea tropical storm watch.'); risk = 'high'; }

    if (i >= 5 && i <= 7) notes.push('Shamal wind season: NW winds avg ' + inp.wind.seasonalWind.shamal.avgSpeed + ' m/s. Crane operations — check max wind limits.');

    const cf = inp.climate.comfortHours && inp.climate.comfortHours[i];
    if (cf && cf.percentage > 40) notes.push(cf.percentage + '% comfort hours — optimal for natural ventilation commissioning and facade testing.');

    const cond = inp.climate.condensationRisk && inp.climate.condensationRisk[i];
    if (cond && cond.risk === 'high') notes.push('High condensation risk. Ensure vapor barrier integrity before cladding closure.');

    if (notes.length === 0) notes.push('Favorable conditions for construction and site works.');

    return { month, season, riskLevel: risk, considerations: notes };
  });
}

// ─── REGIONAL BENCHMARKS ──────────────────────────────────────────────────────
import { OMAN_BENCHMARKS, getNearestRegion } from '@/constants/oman-data';
import type { BenchmarkData } from '@/types';

function getBenchmarks(inp: ScoringInputs): BenchmarkData[] {
  const nearest = getNearestRegion(inp.location.lat, inp.location.lng);
  return OMAN_BENCHMARKS.map(function(b) {
    return { region: b.region === nearest ? b.region + ' (Your Site)' : b.region, solarPotential: b.solarPotential, coolingLoad: b.coolingLoad, floodRisk: b.floodRisk, ventilationScore: b.ventilationScore };
  });
}

// ─── MAIN HOOK ────────────────────────────────────────────────────────────────
export function useLEEDScoring() {
  const calculateAssessment = useCallback(function(inp: ScoringInputs): LandAssessment & { categoryDetails: LEEDCategoryFull[]; seasonalCalendar: SeasonalNote[]; benchmarks: BenchmarkData[] } {
    const cats: LEEDCategoryFull[] = [
      scoreLocationTransportation(inp),
      scoreSustainableSites(inp),
      scoreWaterEfficiency(inp),
      scoreEnergyAtmosphere(inp),
      scoreMaterialsResources(inp),
      scoreIndoorQuality(inp),
      scoreInnovation(inp),
      scoreRegionalPriority(inp),
    ];

    const currentScore  = cats.reduce(function(s, c) { return s + c.currentPoints; }, 0);
    const potentialScore = cats.reduce(function(s, c) { return s + (c.possiblePoints - c.currentPoints); }, 0);
    const maxPossible   = cats.reduce(function(s, c) { return s + c.possiblePoints; }, 0);

    const leedCats: LEEDCategory[] = cats.map(function(c) {
      return { name: c.name, maxPoints: c.maxPoints, currentPoints: c.currentPoints, possiblePoints: c.possiblePoints, icon: c.icon, description: c.description };
    });

    return {
      currentScore,
      potentialScore,
      maxPossibleScore: maxPossible,
      categories: leedCats,
      categoryDetails: cats,
      seasonalCalendar: generateSeasonalCalendar(inp),
      benchmarks: getBenchmarks(inp),
    };
  }, []);

  const generateOBCRecommendations = useCallback(function(inp: ScoringInputs, cats: LEEDCategoryFull[]): OBCRecommendation[] {
    return generateOBCRecs(inp, cats);
  }, []);

  const generateFutureImprovements = useCallback(function(inp: ScoringInputs): FutureImprovement[] {
    return generateImprovements(inp);
  }, []);

  return { calculateAssessment, generateOBCRecommendations, generateFutureImprovements };
}
