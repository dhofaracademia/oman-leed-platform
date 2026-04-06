import type { AnalysisResult } from '@/types';

// ─── Battery Storage Calculator ──────────────────────────────────────────────
// Calculates optimal battery size for peak shaving based on CDD, solar, and tariff

// OPWP tariff structure (Oman)
var TARIFF_PEAK   = 0.040;  // OMR/kWh (commercial peak)
var TARIFF_OFFPEAK = 0.025; // OMR/kWh (residential/off-peak)
var BATTERY_COST_PER_KWH = 185; // OMR/kWh (LFP 2025 landed Oman)
var BATTERY_LIFECYCLE_YRS = 15;
var DEGRADATION_ANNUAL = 0.02; // 2% per year
var CYCLES_PER_YEAR = 300;     // 1 cycle/day × ~300 usable days

export interface BatteryResult {
  recommendedSizeKWh: number;
  systemCostOMR: number;
  annualSavingsOMR: number;
  paybackYears: number;
  lifetimeSavingsOMR: number;
  peakShavingKW: number;
  dailyDischargeKWh: number;
  cyclesPerYear: number;
  totalLifecycleCycles: number;
  co2OffsetTons: number;
  gridReliabilityBenefit: string;
  gridReliabilityBenefitAr: string;
  recommendation: string;
  recommendationAr: string;
  breakdown: BatteryBreakdownItem[];
  viable: boolean;
}

export interface BatteryBreakdownItem {
  label: string;
  labelAr: string;
  value: string;
  detail: string;
}

export function calculateBattery(a: AnalysisResult, projectType: string, gfa: number, floors: number): BatteryResult {
  // Estimate daily consumption from CDD and building type
  var baseLoadKWhPerM2: Record<string, number> = {
    residential: 0.20, commercial: 0.35, industrial: 0.25,
    'mixed-use': 0.30, hospitality: 0.45,
  };
  var loadPerM2 = baseLoadKWhPerM2[projectType] || 0.25;

  // Adjust for CDD — higher cooling = higher peak
  var cddFactor = a.climate.cdd > 4000 ? 1.4 : a.climate.cdd > 3000 ? 1.2 : 1.0;
  var dailyConsumption = gfa * loadPerM2 * cddFactor;

  // Peak demand (kW) — roughly 30% of daily spread over 6 peak hours
  var peakDemandKW = Math.round((dailyConsumption * 0.30) / 6);

  // Optimal battery = shave top 4 peak hours at 70% of peak demand
  var optimalKWh = Math.round(peakDemandKW * 4 * 0.7);
  optimalKWh = Math.max(10, Math.min(optimalKWh, 500)); // Clamp 10-500 kWh

  // PV available for charging — use rooftop capacity
  var roofArea = Math.round(gfa / floors);
  var pvCapacityKWp = Math.min(Math.round(roofArea * 0.13), 100);
  var pvDailyKWh = (pvCapacityKWp * a.solar.pvProductionPotential) / 365;

  // Daily discharge (PV excess + peak shaving)
  var dailyDischarge = Math.min(optimalKWh * 0.9, pvDailyKWh * 0.6 + peakDemandKW * 2);

  // Financial
  var systemCost = optimalKWh * BATTERY_COST_PER_KWH;
  var tariffDiff = TARIFF_PEAK - TARIFF_OFFPEAK;
  var annualSavings = dailyDischarge * tariffDiff * CYCLES_PER_YEAR;

  // Add demand charge savings (commercial)
  if (projectType === 'commercial' || projectType === 'hospitality' || projectType === 'mixed-use') {
    annualSavings += peakDemandKW * 0.7 * 12 * 3.5; // demand charge savings
  }

  annualSavings = Math.round(annualSavings);
  var payback = annualSavings > 0 ? Math.round((systemCost / annualSavings) * 10) / 10 : 99;

  // Lifetime savings with degradation
  var lifetimeSavings = 0;
  for (var yr = 0; yr < BATTERY_LIFECYCLE_YRS; yr++) {
    lifetimeSavings += annualSavings * Math.pow(1 - DEGRADATION_ANNUAL, yr);
  }
  lifetimeSavings = Math.round(lifetimeSavings - systemCost);

  // CO2 offset
  var co2 = Math.round(dailyDischarge * CYCLES_PER_YEAR * 0.45 * BATTERY_LIFECYCLE_YRS / 1000); // tonnes

  // Grid reliability
  var isRemote = a.location.lat < 18.5 || (a.location.lat > 22 && a.location.lng < 55);
  var gridBenefit = isRemote ? 'high' : 'moderate';
  var gridBenefitAr = isRemote ? 'عالية — مناطق بعيدة عن الشبكة المركزية' : 'متوسطة — شبكة مستقرة';

  var viable = payback < 12 && optimalKWh >= 10;

  // Recommendation
  var recAr = '';
  var rec = '';
  if (payback <= 7) {
    recAr = 'استثمار ممتاز — فترة الاسترداد أقل من 7 سنوات. يُوصى بتركيب نظام ' + optimalKWh + ' kWh مع الألواح الشمسية.';
    rec = 'Excellent investment — payback under 7 years. Recommended ' + optimalKWh + ' kWh system paired with PV.';
  } else if (payback <= 12) {
    recAr = 'استثمار جيد — فترة الاسترداد ' + payback + ' سنوات. مناسب للمشاريع طويلة الأمد.';
    rec = 'Good investment — ' + payback + 'yr payback. Suitable for long-term projects.';
  } else {
    recAr = 'غير مجدٍ اقتصادياً حالياً. انتظر انخفاض أسعار البطاريات أو ارتفاع تعريفة الذروة.';
    rec = 'Not cost-effective currently. Wait for battery price drops or peak tariff increases.';
  }

  var breakdown: BatteryBreakdownItem[] = [
    { label: 'Daily Consumption', labelAr: 'الاستهلاك اليومي', value: Math.round(dailyConsumption) + ' kWh', detail: gfa + 'm² × ' + loadPerM2 + ' × CDD factor ' + cddFactor },
    { label: 'Peak Demand', labelAr: 'ذروة الطلب', value: peakDemandKW + ' kW', detail: '30% of daily load over 6 peak hours' },
    { label: 'PV Available for Charging', labelAr: 'الشمسي المتاح للشحن', value: Math.round(pvDailyKWh) + ' kWh/day', detail: pvCapacityKWp + ' kWp × ' + a.solar.pvProductionPotential + ' kWh/kWp/yr' },
    { label: 'Peak Tariff', labelAr: 'تعريفة الذروة', value: TARIFF_PEAK + ' OMR/kWh', detail: 'OPWP commercial peak rate' },
    { label: 'Off-Peak Tariff', labelAr: 'تعريفة خارج الذروة', value: TARIFF_OFFPEAK + ' OMR/kWh', detail: 'OPWP residential/off-peak rate' },
    { label: 'Battery Unit Cost', labelAr: 'تكلفة البطارية', value: BATTERY_COST_PER_KWH + ' OMR/kWh', detail: 'LFP technology, landed Oman 2025' },
  ];

  return {
    recommendedSizeKWh: optimalKWh,
    systemCostOMR: systemCost,
    annualSavingsOMR: annualSavings,
    paybackYears: payback,
    lifetimeSavingsOMR: lifetimeSavings,
    peakShavingKW: Math.round(peakDemandKW * 0.7),
    dailyDischargeKWh: Math.round(dailyDischarge),
    cyclesPerYear: CYCLES_PER_YEAR,
    totalLifecycleCycles: CYCLES_PER_YEAR * BATTERY_LIFECYCLE_YRS,
    co2OffsetTons: co2,
    gridReliabilityBenefit: gridBenefit,
    gridReliabilityBenefitAr: gridBenefitAr,
    recommendation: rec,
    recommendationAr: recAr,
    breakdown: breakdown,
    viable: viable,
  };
}
