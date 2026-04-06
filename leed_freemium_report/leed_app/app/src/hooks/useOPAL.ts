import type { AnalysisResult } from '@/types';

// ─── OPAL — Oman Sustainability Program for Assessment and Labeling ───────────
// Oman's official green building rating system (Ministry of Housing)

export interface OPALCredit {
  id: string;
  category: string;
  title: string;
  titleAr: string;
  maxPoints: number;
  earnedPoints: number;
  status: 'earned' | 'partial' | 'potential' | 'na';
  leedEquivalent: string;
  basis: string;
  action?: string;
}

export interface OPALResult {
  totalPoints: number;
  maxPoints: number;
  stars: number;
  starLabel: string;
  starLabelAr: string;
  categories: { name: string; nameAr: string; earned: number; max: number; credits: OPALCredit[] }[];
  ministryReady: boolean;
  ministryNote: string;
  incentive: string;
}

function opalStars(pts: number): { stars: number; label: string; labelAr: string } {
  if (pts >= 70) return { stars: 5, label: 'Five Stars — Exceptional', labelAr: '5 نجوم — استثنائي' };
  if (pts >= 60) return { stars: 4, label: 'Four Stars — Excellent', labelAr: '4 نجوم — ممتاز' };
  if (pts >= 50) return { stars: 3, label: 'Three Stars — Very Good', labelAr: '3 نجوم — جيد جداً' };
  if (pts >= 40) return { stars: 2, label: 'Two Stars — Good', labelAr: '2 نجوم — جيد' };
  if (pts >= 30) return { stars: 1, label: 'One Star — Certified', labelAr: '1 نجمة — معتمد' };
  return { stars: 0, label: 'Not Rated', labelAr: 'غير مُصنَّف' };
}

export function calculateOPAL(a: AnalysisResult): OPALResult {
  var credits: OPALCredit[] = [];

  // ─── CATEGORY 1: Site & Transport (max 15) ─────────────────────────────────
  var isDevZone = (a.location.lat > 23.5 && a.location.lng > 58.3) || (a.location.lat > 16.5 && a.location.lat < 17.5);
  credits.push({ id: 'ST-1', category: 'Site & Transport', title: 'Sustainable Site Selection', titleAr: 'اختيار موقع مستدام', maxPoints: 3, earnedPoints: isDevZone ? 3 : 1, status: isDevZone ? 'earned' : 'partial', leedEquivalent: 'LT: High Priority Site', basis: isDevZone ? 'موقع في منطقة تطوير Vision 2040' : 'موقع عام — تحقق من تصنيف الولاية', action: isDevZone ? undefined : 'تحقق من تصنيف المنطقة في خطة التطوير العُمانية' });
  credits.push({ id: 'ST-2', category: 'Site & Transport', title: 'Wadi & Flood Protection', titleAr: 'حماية الأودية والفيضانات', maxPoints: 3, earnedPoints: a.rainfall.wadiFloodRisk === 'low' ? 3 : a.rainfall.wadiFloodRisk === 'moderate' ? 1 : 0, status: a.rainfall.wadiFloodRisk === 'low' ? 'earned' : 'partial', leedEquivalent: 'SS: Sensitive Land', basis: 'مخاطر الوادي: ' + a.rainfall.wadiFloodRisk + ' | الارتفاع: ' + a.rainfall.elevation + 'م', action: a.rainfall.wadiFloodRisk !== 'low' ? a.rainfall.stormDrainageRequirement : undefined });
  credits.push({ id: 'ST-3', category: 'Site & Transport', title: 'Sabkha & Soil Protection', titleAr: 'حماية السبخة والتربة', maxPoints: 3, earnedPoints: a.soil.sabkhaRisk ? 0 : 3, status: a.soil.sabkhaRisk ? 'potential' : 'earned', leedEquivalent: 'SS: Sensitive Land', basis: 'نوع التربة: ' + a.soil.type + ' | مخاطر السبخة: ' + (a.soil.sabkhaRisk ? 'نعم' : 'لا'), action: a.soil.sabkhaRisk ? 'تحسين التربة إلزامي قبل البناء — خرسانة مقاومة للكبريتات' : undefined });
  credits.push({ id: 'ST-4', category: 'Site & Transport', title: 'Heat Island Reduction', titleAr: 'تخفيف جزيرة الحرارة', maxPoints: 3, earnedPoints: 0, status: 'potential', leedEquivalent: 'SS: Heat Island', basis: 'متوسط درجة الحرارة: ' + a.climate.avgTemperature + 'C | CDD: ' + a.climate.cdd, action: 'سطح عاكس (SRI≥78)، مواقف مظللة، نباتات محلية (غاف، سدر)' });
  credits.push({ id: 'ST-5', category: 'Site & Transport', title: 'Accessible Transport', titleAr: 'إمكانية الوصول للنقل', maxPoints: 3, earnedPoints: 0, status: 'potential', leedEquivalent: 'LT: Access to Transit', basis: 'يعتمد على القرب من الطرق الرئيسية والنقل العام', action: 'توثيق المسافة من أقرب طريق رئيسي ومواقف النقل العام' });

  // ─── CATEGORY 2: Energy Efficiency (max 35) ──────────────────────────────────
  var pvGood = a.solar.pvProductionPotential > 1400;
  var cdd = a.climate.cdd;
  credits.push({ id: 'EE-1', category: 'Energy Efficiency', title: 'Building Envelope — Wall', titleAr: 'غلاف حراري — جدران', maxPoints: 6, earnedPoints: 0, status: 'potential', leedEquivalent: 'EA: Optimize Energy — OEESC Art 3.2', basis: 'U-wall مطلوب: ' + a.climate.recommendedUValues.wall + ' W/m²K | CDD: ' + cdd, action: 'تطبيق OEESC Art. 3.2: U ≤ ' + a.climate.recommendedUValues.wall + ' W/m²K' });
  credits.push({ id: 'EE-2', category: 'Energy Efficiency', title: 'Building Envelope — Roof', titleAr: 'غلاف حراري — سقف', maxPoints: 6, earnedPoints: 0, status: 'potential', leedEquivalent: 'EA: Optimize Energy — OEESC Art 3.3', basis: 'U-roof مطلوب: ' + a.climate.recommendedUValues.roof + ' W/m²K | ساعات الإشعاع الشمسي: ' + a.climate.sunshineHours, action: 'تطبيق OEESC Art. 3.3: U ≤ ' + a.climate.recommendedUValues.roof + ' W/m²K + سطح عاكس' });
  credits.push({ id: 'EE-3', category: 'Energy Efficiency', title: 'Glazing & Shading', titleAr: 'نسب الزجاج والظلال', maxPoints: 6, earnedPoints: 0, status: 'potential', leedEquivalent: 'EA: OEESC Art 3.4-3.5', basis: 'U-glazing: ' + a.climate.recommendedUValues.glazing + ' W/m²K | WWR: N=' + a.solar.recommendedWWR.north + '% E/W=' + a.solar.recommendedWWR.east + '%', action: 'تطبيق WWR: شمال ≤' + a.solar.recommendedWWR.north + '% شرق/غرب ≤' + a.solar.recommendedWWR.east + '%' });
  credits.push({ id: 'EE-4', category: 'Energy Efficiency', title: 'Efficient HVAC System', titleAr: 'نظام HVAC كفء', maxPoints: 8, earnedPoints: 0, status: 'potential', leedEquivalent: 'EA: OEESC Art 4.2', basis: 'CDD ' + cdd + ' — نظام عالي الكفاءة إلزامي | ساعات الإشعاع الشمسي: ' + a.climate.sunshineHours, action: 'COP ≥ 3.5 | VRF أو مبرد مركزي | تعريف OEESC Art. 4.2' });
  credits.push({ id: 'EE-5', category: 'Energy Efficiency', title: 'Renewable Energy On-site', titleAr: 'طاقة متجددة محلية', maxPoints: 5, earnedPoints: pvGood ? 3 : 1, status: pvGood ? 'partial' : 'potential', leedEquivalent: 'EA: Renewable Energy + OEESC Art 4.3', basis: 'PV yield: ' + a.solar.pvProductionPotential + ' kWh/kWp/yr | زاوية مثلى: ' + a.solar.optimalTilt + 'deg', action: 'تركيب ألواح شمسية — إنتاجية ممتازة في هذا الموقع' });
  credits.push({ id: 'EE-6', category: 'Energy Efficiency', title: 'Natural Ventilation', titleAr: 'تهوية طبيعية', maxPoints: 4, earnedPoints: a.wind.ventilationScore > 60 ? 3 : a.wind.ventilationScore > 40 ? 2 : 1, status: a.wind.ventilationScore > 60 ? 'partial' : 'partial', leedEquivalent: 'EQ: IAQ + OEESC Art 5.1', basis: 'درجة التهوية: ' + a.wind.ventilationScore + '/100 | الاتجاه السائد: ' + a.wind.prevailingDirection, action: 'توجيه الفتحات نحو ' + a.wind.crossVentilationAngle + 'deg للتهوية المتقاطعة' });

  // ─── CATEGORY 3: Water Efficiency (max 20) ────────────────────────────────────
  credits.push({ id: 'WE-1', category: 'Water Efficiency', title: 'Outdoor Water Reduction', titleAr: 'ترشيد مياه الري', maxPoints: 5, earnedPoints: a.rainfall.annualTotal < 100 ? 4 : 2, status: 'partial', leedEquivalent: 'WE: Outdoor Water Use', basis: 'هطول سنوي: ' + a.rainfall.annualTotal + 'mm | شُح مائي: نعم', action: 'ري بالتنقيط + نباتات محلية + مستشعرات رطوبة التربة' });
  credits.push({ id: 'WE-2', category: 'Water Efficiency', title: 'Indoor Water Fixtures', titleAr: 'تجهيزات المياه الداخلية', maxPoints: 6, earnedPoints: 0, status: 'potential', leedEquivalent: 'WE: Indoor Water Use Reduction', basis: 'هطول: ' + a.rainfall.annualTotal + 'mm — شحيح جداً', action: 'أجهزة WaterSense (هدف 35% تخفيض) + عدادات فرعية لكل نظام' });
  credits.push({ id: 'WE-3', category: 'Water Efficiency', title: 'Rainwater Harvesting', titleAr: 'تجميع مياه الأمطار', maxPoints: 5, earnedPoints: a.rainfall.rainwaterHarvestingPotential > 10 ? 3 : a.rainfall.rainwaterHarvestingPotential > 5 ? 2 : 1, status: 'partial', leedEquivalent: 'SS: Rainwater Management + OEESC Art 6.1', basis: 'إمكانية الحصاد: ' + a.rainfall.rainwaterHarvestingPotential + ' م³/سنة', action: 'تركيب خزان تجميع بسعة ≥ ' + Math.round(a.rainfall.rainwaterHarvestingPotential * 0.3) + ' م³' });
  credits.push({ id: 'WE-4', category: 'Water Efficiency', title: 'Cooling Tower Water', titleAr: 'مياه أبراج التبريد', maxPoints: 4, earnedPoints: 0, status: 'potential', leedEquivalent: 'WE: Cooling Tower — OEESC Art 4.2', basis: 'CDD ' + cdd + ' — حمل تبريد مرتفع يستلزم مياه تبريد', action: '10 دورات تركيز كحد أدنى | نظام معالجة مياه آلي' });

  // ─── CATEGORY 4: Indoor Environment (max 15) ─────────────────────────────────
  var avgComfort = Math.round(a.climate.comfortHours.reduce(function(s, c) { return s + c.percentage; }, 0) / 12);
  credits.push({ id: 'IE-1', category: 'Indoor Environment', title: 'Thermal Comfort Control', titleAr: 'التحكم في الراحة الحرارية', maxPoints: 5, earnedPoints: 0, status: 'potential', leedEquivalent: 'EQ: Thermal Comfort', basis: 'متوسط ساعات الراحة: ' + avgComfort + '% | CDD: ' + cdd + ' | ساعات إشعاع حراري: ' + a.climate.overheatingHours, action: 'تحكم فردي في درجة الحرارة + ASHRAE 55 + قياس رضا الشاغلين' });
  credits.push({ id: 'IE-2', category: 'Indoor Environment', title: 'Air Quality & Ventilation', titleAr: 'جودة الهواء الداخلي', maxPoints: 5, earnedPoints: a.wind.ventilationScore > 50 ? 2 : 1, status: 'partial', leedEquivalent: 'EQ: Enhanced IAQ', basis: 'درجة التهوية: ' + a.wind.ventilationScore + '/100 | خطر تلوث الهواء: ' + (a.wind.windDrivenRainRisk === 'high' ? 'مرتفع' : 'منخفض'), action: 'MERV-13 فلاتر + معدل تهوية ASHRAE 62.1' });
  credits.push({ id: 'IE-3', category: 'Indoor Environment', title: 'Daylight & Views', titleAr: 'الإضاءة الطبيعية والمشاهد', maxPoints: 5, earnedPoints: a.solar.yearlyGHI > 1800 ? 2 : 1, status: 'partial', leedEquivalent: 'EQ: Daylight + Views', basis: 'GHI السنوي: ' + a.solar.yearlyGHI + ' kWh/m² — إضاءة طبيعية ممتازة', action: 'WWR شمال: ' + a.solar.recommendedWWR.north + '% + رفوف إضاءة + تحكم تلقائي' });

  // ─── CATEGORY 5: Materials & Resources (max 10) ───────────────────────────────
  credits.push({ id: 'MR-1', category: 'Materials & Resources', title: 'Local & Sustainable Materials', titleAr: 'مواد محلية ومستدامة', maxPoints: 5, earnedPoints: 2, status: 'partial', leedEquivalent: 'MR: Building Products', basis: 'الموقع في منطقة ' + a.soil.type + ' — المواد المحلية متوفرة', action: 'حجر الجير العُماني + الجبص الطبيعي + الرمل المحلي ≥ 20% من المواد' });
  credits.push({ id: 'MR-2', category: 'Materials & Resources', title: 'Construction Waste Management', titleAr: 'إدارة نفايات البناء', maxPoints: 5, earnedPoints: 0, status: 'potential', leedEquivalent: 'MR: C&D Waste', basis: 'يتطلب خطة إدارة مخلفات مكتوبة', action: 'تحويل 75%+ من مخلفات البناء عن المكب — سحق الخرسانة كردم' });

  // ─── CATEGORY 6: Innovation & Management (max 5) ─────────────────────────────
  var isDhofar = a.location.lat >= 16.5 && a.location.lat <= 18.5;
  credits.push({ id: 'IN-1', category: 'Innovation', title: 'Oman-Specific Innovation', titleAr: 'ابتكار خاص بعُمان', maxPoints: 3, earnedPoints: isDhofar ? 3 : 1, status: isDhofar ? 'earned' : 'partial', leedEquivalent: 'Innovation Credits', basis: isDhofar ? 'موقع ظفار — تصميم استجابة لمناخ الخريف الفريد' : 'فرصة لاستراتيجيات التبريد السلبي التقليدية', action: isDhofar ? undefined : 'تطبيق تقنيات عُمانية تقليدية: مكيف هواء طبيعي، فريج، سدة' });
  credits.push({ id: 'IN-2', category: 'Innovation', title: 'OPAL Professional', titleAr: 'متخصص OPAL معتمد', maxPoints: 2, earnedPoints: 0, status: 'potential', leedEquivalent: 'LEED AP', basis: 'وجود استشاري OPAL معتمد في الفريق', action: 'تعيين استشاري OPAL معتمد من هيئة التقييس والمواصفات العُمانية' });

  // Aggregate by category
  var catNames = [
    { key: 'Site & Transport',    ar: 'الموقع والنقل',         max: 15 },
    { key: 'Energy Efficiency',   ar: 'كفاءة الطاقة',           max: 35 },
    { key: 'Water Efficiency',    ar: 'كفاءة المياه',           max: 20 },
    { key: 'Indoor Environment',  ar: 'البيئة الداخلية',        max: 15 },
    { key: 'Materials & Resources', ar: 'المواد والموارد',      max: 10 },
    { key: 'Innovation',          ar: 'الابتكار والإدارة',      max: 5  },
  ];

  var categories = catNames.map(function(cat) {
    var catCredits = credits.filter(function(c) { return c.category === cat.key; });
    var earned = catCredits.reduce(function(s, c) { return s + c.earnedPoints; }, 0);
    return { name: cat.key, nameAr: cat.ar, earned, max: cat.max, credits: catCredits };
  });

  var totalPoints = credits.reduce(function(s, c) { return s + c.earnedPoints; }, 0);
  var maxPoints   = 100;
  var level       = opalStars(totalPoints);
  var ministryReady = totalPoints >= 30 && !a.soil.sabkhaRisk;

  return {
    totalPoints, maxPoints,
    stars: level.stars, starLabel: level.label, starLabelAr: level.labelAr,
    categories,
    ministryReady,
    ministryNote: ministryReady
      ? 'التطبيق جاهز لتقديم طلب شهادة OPAL لوزارة الإسكان — الحد الأدنى 30 نقطة محقق'
      : 'يتطلب مزيداً من التحسينات للوصول للحد الأدنى (30 نقطة) لشهادة OPAL',
    incentive: level.stars >= 3 ? 'مؤهل لتخفيض رسوم الخدمات الحكومية 15-20% من وزارة الإسكان' : level.stars >= 1 ? 'مؤهل للحصول على شهادة OPAL الأساسية' : 'لم يصل للحد الأدنى بعد',
  };
}
