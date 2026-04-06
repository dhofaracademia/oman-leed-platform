import type { AnalysisResult } from '@/types';

// Oman grid emission factor: 0.45 kg CO2/kWh (OPWP data)
const GRID_EMISSION = 0.45;

// Embodied carbon (kg CO2/m²) by foundation type and seismic zone
const EMBODIED_BASE: Record<string, number> = {
  residential: 380, commercial: 480, industrial: 290, 'mixed-use': 430, hospitality: 550,
};

export interface CarbonResult {
  embodiedCarbonTons: number;
  operationalCarbonTons: number;
  totalLifecycleTons: number;
  pvOffsetTons: number;
  netCarbonTons: number;
  embodiedPerM2: number;
  operationalPerM2: number;
  omvision2040Target: number;
  compliancePercent: number;
  esgRating: string;
  esgRatingAr: string;
  monthlyOperational: number;
  annualOperational: number;
  recommendations: string[];
}

export function calculateCarbon(a: AnalysisResult, projectType: string, gfa: number, beiEstimated?: number): CarbonResult {
  var baseEmb = EMBODIED_BASE[projectType] || EMBODIED_BASE['residential'];

  // Embodied carbon adjustments
  var foundAdj = a.soil.recommendedFoundation === 'piles' ? 1.35 : a.soil.recommendedFoundation === 'raft' ? 1.15 : 1.0;
  var seismicAdj = 1 + a.seismic.zoneNumber * 0.08;  // more steel = more carbon
  var embodiedPerM2 = Math.round(baseEmb * foundAdj * seismicAdj);
  var embodiedTotal = Math.round(embodiedPerM2 * gfa / 1000);  // tonnes

  // Operational carbon (over 50 years) from BEI
  var bei = beiEstimated || (projectType === 'hospitality' ? 250 : projectType === 'commercial' ? 185 : 140);
  var annualKWh = bei * gfa;
  var annualOpCarbon = annualKWh * GRID_EMISSION / 1000;   // tonnes CO2/yr
  var lifetimeOpCarbon = Math.round(annualOpCarbon * 50);  // 50yr lifecycle

  // PV offset (using pvProductionPotential if available)
  var pvSystem = Math.min(Math.round(gfa * 0.13), 100);  // ~13% of GFA as PV, max 100 kWp
  var pvAnnual = pvSystem * a.solar.pvProductionPotential;
  var pvOffsetAnnual = pvAnnual * GRID_EMISSION / 1000;   // tonnes/yr
  var pvOffset50yr = Math.round(pvOffsetAnnual * 50);

  var totalLifecycle = embodiedTotal + lifetimeOpCarbon;
  var netCarbon = Math.max(0, totalLifecycle - pvOffset50yr);

  // Oman Vision 2040 target: 7% reduction by 2030, 50% by 2050 vs 2010 baseline
  var baseline2010 = 800;  // kg CO2/m²/yr industry baseline
  var omvision = Math.round(baseline2010 * 0.50);  // 50% by 2050 = 400 kg

  var compliancePercent = Math.round((1 - embodiedPerM2 / baseline2010) * 100);

  // ESG rating
  var esgRating = 'D', esgRatingAr = 'ضعيف';
  if (netCarbon < totalLifecycle * 0.30) { esgRating = 'A+'; esgRatingAr = 'ممتاز'; }
  else if (netCarbon < totalLifecycle * 0.50) { esgRating = 'A'; esgRatingAr = 'جيد جداً'; }
  else if (netCarbon < totalLifecycle * 0.65) { esgRating = 'B'; esgRatingAr = 'جيد'; }
  else if (netCarbon < totalLifecycle * 0.80) { esgRating = 'C'; esgRatingAr = 'مقبول'; }

  var recs: string[] = [];
  if (a.soil.recommendedFoundation === 'piles') recs.push('الأوتاد تزيد الكربون المتضمن 35% — تحقق من إمكانية استخدام تحسين التربة بدلاً من الأوتاد');
  recs.push('خرسانة منخفضة الكربون (SCM): استبدل 30% من الإسمنت بالرماد المتطاير — يوفر ' + Math.round(embodiedTotal * 0.12) + ' طن CO₂');
  recs.push('تركيب ' + pvSystem + ' kWp يوفر ' + Math.round(pvOffsetAnnual * 10) / 10 + ' طن CO₂/سنة من شبكة الكهرباء');
  if (a.climate.cdd > 3500) recs.push('تحسين الغلاف الحراري لـ OEESC يخفض الكربون التشغيلي ' + Math.round(annualOpCarbon * 0.20 * 10) / 10 + ' طن/سنة');

  return {
    embodiedCarbonTons: embodiedTotal,
    operationalCarbonTons: lifetimeOpCarbon,
    totalLifecycleTons: totalLifecycle,
    pvOffsetTons: pvOffset50yr,
    netCarbonTons: netCarbon,
    embodiedPerM2,
    operationalPerM2: Math.round(annualOpCarbon * 1000 / gfa),
    omvision2040Target: omvision,
    compliancePercent,
    esgRating, esgRatingAr,
    monthlyOperational: Math.round(annualOpCarbon / 12 * 10) / 10,
    annualOperational: Math.round(annualOpCarbon * 10) / 10,
    recommendations: recs,
  };
}
