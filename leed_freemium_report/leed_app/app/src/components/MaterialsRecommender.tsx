import type { AnalysisResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MaterialsRecommenderProps {
  analysis: AnalysisResult;
}

interface Material {
  name: string; nameAr: string; use: string; useAr: string;
  source: string; leedCredit: string; note: string; local: boolean;
}

function getMaterials(a: AnalysisResult): Material[] {
  var mats: Material[] = [];
  var isDhofar  = a.location.lat < 19.5;
  var isCoastal = a.location.lng > 58.0 || isDhofar;
  var isHajar   = a.location.lat > 22.5 && a.location.lat < 24.5 && a.location.lng > 56.5 && a.location.lng < 59.0;

  // Structural
  if (a.soil.corrosionRisk === 'high') {
    mats.push({ name: 'Corrosion-Resistant Rebar', nameAr: 'حديد مقاوم للتآكل (إيبوكسي أو GFRP)', use: 'Structural', useAr: 'هيكلي', source: 'استيراد — موردون في صحار وصلالة', leedCredit: 'MR: Durable Materials', note: 'إلزامي لتآكل ' + a.soil.corrosionRisk + ' — يطيل عمر المنشأ 25+ سنة', local: false });
    mats.push({ name: 'Dense Concrete (w/c≤0.40)', nameAr: 'خرسانة كثيفة (نسبة ماء/إسمنت ≤ 0.40)', use: 'Structural', useAr: 'هيكلي', source: 'خلاطات خرسانة صحار/مسقط/صلالة', leedCredit: 'MR: Low-Impact Concrete', note: 'تقليل نفاذية الخرسانة في البيئات الساحلية — متوفر محلياً', local: true });
  }

  mats.push({ name: a.soil.recommendedFoundation === 'piles' ? 'Driven Steel Piles' : 'Mass Concrete Raft', nameAr: a.soil.recommendedFoundation === 'piles' ? 'أوتاد فولاذية مدفوعة' : 'لبش خرسانة كتلية', use: 'Foundation', useAr: 'أساسات', source: a.soil.recommendedFoundation === 'piles' ? 'استيراد/شركات وطادة خازوق' : 'محلي', leedCredit: 'MR: Building Life-Cycle', note: a.soil.recommendedFoundation + ' موصى به لتربة ' + a.soil.type, local: a.soil.recommendedFoundation !== 'piles' });

  // Local limestone
  if (isHajar) {
    mats.push({ name: 'Hajar Limestone', nameAr: 'حجر الجير من جبال الحجر', use: 'Cladding/Structural', useAr: 'تكسية وهيكلي', source: 'مقالع جبال الحجر — نزوى، إزكي، بهلاء', leedCredit: 'MR: Local Materials (≥50 miles)', note: 'قدرة تحمل ممتازة + جمالية محلية + يقلل البصمة الكربونية 40%', local: true });
  }

  // Thermal insulation
  mats.push({ name: 'Mineral Wool / PIR Board', nameAr: 'صوف معدني أو لوح PIR للعزل', use: 'Thermal Insulation', useAr: 'عزل حراري', source: 'موردون في مسقط وصحار (ROCKWOOL، Kingspan)', leedCredit: 'EA: OEESC Art 3.2-3.3', note: 'لتحقيق U-wall ≤' + a.climate.recommendedUValues.wall + ' W/m²K — CDD ' + a.climate.cdd, local: false });

  // AAC blocks
  mats.push({ name: 'AAC Blocks (Autoclaved)', nameAr: 'طابوق AAC خفيف الوزن', use: 'Masonry Walls', useAr: 'جدران', source: 'مصانع محلية — مسقط، البريمي', leedCredit: 'EA: Thermal Performance + MR: Local', note: 'كثافة 600 kg/m³ — توصيل حراري منخفض + خفيف + متوفر محلياً', local: true });

  // Gypsum
  mats.push({ name: 'Natural Gypsum Plaster', nameAr: 'جبص طبيعي عُماني', use: 'Interior Finishes', useAr: 'تشطيبات داخلية', source: 'منطقة الداخلية ونزوى — وفرة محلية', leedCredit: 'MR: Regional Materials + Low-VOC', note: 'الجبص العُماني يصدّر للخليج — استخدامه محلياً يخفض أميال النقل', local: true });

  // High-performance glazing
  mats.push({ name: 'Low-E Glazing (SHGC≤0.25)', nameAr: 'زجاج منخفض الانبعاث الحراري', use: 'Glazing', useAr: 'زجاج', source: 'موردون في مسقط — Saint-Gobain، Guardian', leedCredit: 'EA: OEESC Art 3.4 + EQ: Daylight', note: 'الواجهة الشرقية/الغربية (مؤشر حرارة ' + a.solar.facadeHeatGain.east + '/' + a.solar.facadeHeatGain.west + ') تتطلب SHGC≤0.25', local: false });

  // Dhofar specific
  if (isDhofar) {
    mats.push({ name: 'Teak / Local Hardwood', nameAr: 'خشب الساج والأخشاب الصلبة المحلية', use: 'Joinery/Exterior', useAr: 'نجارة وتشطيب خارجي', source: 'ظفار — أشجار مقاومة للرطوبة', leedCredit: 'MR: Sustainable Wood Products', note: 'مقاومة طبيعية لرطوبة الخريف المرتفعة — موصى به للأبواب والنوافذ', local: true });
  }

  // Recycled content
  mats.push({ name: 'Fly Ash Concrete (30% SCM)', nameAr: 'خرسانة بالرماد المتطاير (30% SCM)', use: 'Structural Concrete', useAr: 'خرسانة هيكلية', source: 'متوفر من محطات الكهرباء العُمانية', leedCredit: 'MR: EPD + Low Embodied Carbon', note: 'يخفض الكربون المتضمن للخرسانة 20-30% + يحسن الكثافة', local: true });

  return mats;
}

export function MaterialsRecommender({ analysis }: MaterialsRecommenderProps) {
  var materials = getMaterials(analysis);
  var localCount = materials.filter(function(m) { return m.local; }).length;

  return (
    <div className="space-y-4" dir="rtl">

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center">
          <div className="text-2xl font-black text-green-700">{localCount}</div>
          <div className="text-xs text-green-600">مواد محلية متوفرة</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <div className="text-2xl font-black text-blue-700">{materials.length - localCount}</div>
          <div className="text-xs text-blue-600">مواد مستوردة</div>
        </div>
        <div className="p-3 bg-[#1a5d3c]/5 rounded-xl border border-[#1a5d3c]/20 text-center">
          <div className="text-2xl font-black text-[#1a5d3c]">{materials.length}</div>
          <div className="text-xs text-[#1a5d3c]/80">إجمالي التوصيات</div>
        </div>
      </div>

      <div className="space-y-3">
        {materials.map(function(m, i) {
          return (
            <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#1a5d3c]/40 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-sm text-slate-900">{m.nameAr}</div>
                  <div className="text-xs text-slate-400">{m.name}</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Badge className={m.local ? 'bg-green-100 text-green-800 text-xs' : 'bg-blue-100 text-blue-800 text-xs'}>
                    {m.local ? '🇴🇲 محلي' : '🌍 مستورد'}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 text-xs">{m.useAr}</Badge>
                </div>
              </div>
              <div className="text-xs text-slate-600 mb-1"><span className="font-semibold text-[#1a5d3c]">المصدر: </span>{m.source}</div>
              <div className="text-xs text-slate-600 mb-1"><span className="font-semibold text-[#d4af37]">LEED: </span>{m.leedCredit}</div>
              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{m.note}</div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
        المواد المحلية تُقلل أميال النقل وتدعم LEED MR Credit. مسافة ≤800 كم تُعتبر محلية حسب LEED v4.1. اطلب من الموردين شهادات EPD و MSDS.
      </div>
    </div>
  );
}
