import type { AnalysisResult } from '@/types';

export interface CostItem { label: string; labelAr: string; baseOMR: number; adjustedOMR: number; reason: string }
export interface CostResult {
  baseCostPerM2: number;
  totalBaseCost: number;
  adjustedCostPerM2: number;
  totalAdjustedCost: number;
  contingency: number;
  totalWithContingency: number;
  items: CostItem[];
  rangeLow: number;
  rangeHigh: number;
  gfa: number;
  buildingType: string;
  currency: string;
}

const BASE_COST_PER_M2: Record<string, { omr: number; label: string }> = {
  'residential': { omr: 195, label: 'سكني فيلا/شقة' },
  'commercial':  { omr: 245, label: 'تجاري/مكاتب'   },
  'industrial':  { omr: 155, label: 'صناعي'          },
  'mixed-use':   { omr: 220, label: 'متعدد الاستخدام'},
  'hospitality': { omr: 290, label: 'فنادق/ضيافة'   },
};

export function calculateCost(a: AnalysisResult, projectType: string, gfa: number): CostResult {
  var base = BASE_COST_PER_M2[projectType] || BASE_COST_PER_M2['residential'];
  var items: CostItem[] = [];
  var totalAdj = 0;

  // 1. Foundation premium
  var foundAdj = 0, foundReason = '';
  if (a.soil.recommendedFoundation === 'piles') {
    foundAdj = a.soil.sabkhaRisk ? 55 : 40;
    foundReason = a.soil.sabkhaRisk ? 'أوتاد بسبب خطر السبخة — أوتاد مقاومة للكبريتات' : 'أوتاد بسبب ضعف التربة (قدرة تحمل ' + a.soil.bearingRange.max + ' kPa)';
  } else if (a.soil.recommendedFoundation === 'raft') {
    foundAdj = 18;
    foundReason = 'لبش مسلح (تربة: ' + a.soil.type + ')';
  } else {
    foundAdj = 0;
    foundReason = 'شرائط عادية — تربة صلبة (' + a.soil.bearingRange.min + '-' + a.soil.bearingRange.max + ' kPa)';
  }
  items.push({ label: 'Foundation System', labelAr: 'نظام الأساسات', baseOMR: 45, adjustedOMR: 45 + foundAdj, reason: foundReason });
  totalAdj += foundAdj;

  // 2. OEESC thermal envelope
  var envelopeAdj = 0;
  if (a.climate.cdd > 3500) { envelopeAdj = 28; }
  else if (a.climate.cdd > 2500) { envelopeAdj = 18; }
  else { envelopeAdj = 10; }
  items.push({ label: 'Thermal Insulation (OEESC)', labelAr: 'عزل حراري OEESC', baseOMR: 8, adjustedOMR: 8 + envelopeAdj, reason: 'CDD ' + a.climate.cdd + ' → U-wall ≤' + a.climate.recommendedUValues.wall + ' W/m²K' });
  totalAdj += envelopeAdj;

  // 3. Seismic structural upgrade
  var seismicAdj = 0;
  if (a.seismic.zoneNumber >= 3) { seismicAdj = 30; }
  else if (a.seismic.zoneNumber === 2) { seismicAdj = 15; }
  else if (a.seismic.zoneNumber === 1) { seismicAdj = 5; }
  if (seismicAdj > 0) {
    items.push({ label: 'Seismic Structural Upgrade', labelAr: 'تحسينات هيكلية زلزالية', baseOMR: 0, adjustedOMR: seismicAdj, reason: a.seismic.zone + ' — تسليح إضافي + اتصالات مطيلة' });
    totalAdj += seismicAdj;
  }

  // 4. Drainage & flood protection
  var drainAdj = 0;
  if (a.rainfall.wadiFloodRisk === 'high') { drainAdj = 35; }
  else if (a.rainfall.wadiFloodRisk === 'moderate') { drainAdj = 15; }
  if (drainAdj > 0) {
    items.push({ label: 'Flood & Drainage Protection', labelAr: 'حماية من الفيضانات والتصريف', baseOMR: 5, adjustedOMR: 5 + drainAdj, reason: 'مخاطر وادي ' + a.rainfall.wadiFloodRisk + ' — بلاطة مرتفعة + حوض احتجاز' });
    totalAdj += drainAdj;
  }

  // 5. Waterproofing (corrosive soil)
  if (a.soil.waterproofingRequired) {
    var wpAdj = a.soil.corrosionRisk === 'high' ? 20 : 12;
    items.push({ label: 'Waterproofing System', labelAr: 'نظام عازل الرطوبة', baseOMR: 0, adjustedOMR: wpAdj, reason: 'تآكل ' + a.soil.corrosionRisk + ' — نظام حبلوري + حديد مغلفن' });
    totalAdj += wpAdj;
  }

  // 6. Corrosion-resistant materials
  if (a.soil.corrosionRisk === 'high') {
    items.push({ label: 'Corrosion-Resistant Materials', labelAr: 'مواد مقاومة للتآكل', baseOMR: 0, adjustedOMR: 15, reason: 'حديد مطلي بالإيبوكسي + خرسانة كثيفة (w/c≤0.40) للمناطق الساحلية' });
    totalAdj += 15;
  }

  // 7. HVAC for extreme CDD
  if (a.climate.cdd > 4000) {
    items.push({ label: 'High-Efficiency HVAC Premium', labelAr: 'نظام تكييف فائق الكفاءة', baseOMR: 0, adjustedOMR: 25, reason: 'CDD ' + a.climate.cdd + ' — VRF أو تشيلر مركزي (COP≥4.0)' });
    totalAdj += 25;
  }

  var adjustedPerM2 = base.omr + totalAdj;
  var totalBase = Math.round(base.omr * gfa);
  var totalAdjusted = Math.round(adjustedPerM2 * gfa);
  var contingency = Math.round(totalAdjusted * 0.10);  // 10% contingency

  return {
    baseCostPerM2: base.omr,
    totalBaseCost: totalBase,
    adjustedCostPerM2: adjustedPerM2,
    totalAdjustedCost: totalAdjusted,
    contingency,
    totalWithContingency: totalAdjusted + contingency,
    items,
    rangeLow: Math.round(totalAdjusted * 0.88),
    rangeHigh: Math.round((totalAdjusted + contingency) * 1.12),
    gfa, buildingType: base.label, currency: 'ريال عُماني',
  };
}
