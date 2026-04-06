import type { BatteryResult } from '@/hooks/useBatteryCalc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Battery, TrendingUp, Zap, Info } from 'lucide-react';

interface BatteryStorageViewProps { battery: BatteryResult }

export function BatteryStorageView({ battery }: BatteryStorageViewProps) {
  var b = battery;
  var viableColor = b.viable ? 'bg-green-50 border-green-300 text-green-800' : 'bg-amber-50 border-amber-300 text-amber-800';

  return (
    <div className="space-y-4" dir="rtl">

      {/* Viability header */}
      <div className={'p-4 rounded-xl border-2 flex items-center justify-between flex-wrap gap-3 ' + viableColor}>
        <div>
          <div className="text-xs font-bold opacity-70 mb-1">تقييم تخزين الطاقة — بطاريات LFP</div>
          <div className="text-xl font-black">{b.viable ? 'استثمار مُجدٍ اقتصادياً' : 'غير مُجدٍ حالياً'}</div>
          <div className="text-xs mt-1">فترة الاسترداد: {b.paybackYears} سنة · عمر النظام: 15 سنة</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black">{b.recommendedSizeKWh}</div>
          <div className="text-xs font-bold">kWh مُوصى</div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#1a5d3c]/5 rounded-xl border border-[#1a5d3c]/20">
          <div className="flex items-center gap-1 mb-1"><Battery className="w-3 h-3 text-[#1a5d3c]" /><span className="text-xs text-[#1a5d3c] font-medium">حجم النظام</span></div>
          <div className="text-2xl font-black text-[#1a5d3c]">{b.recommendedSizeKWh}</div>
          <div className="text-xs text-[#1a5d3c]/70">kWh · قص ذروة {b.peakShavingKW} kW</div>
        </div>
        <div className="p-3 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/20">
          <div className="flex items-center gap-1 mb-1"><Zap className="w-3 h-3 text-[#d4af37]" /><span className="text-xs text-[#d4af37] font-medium">تكلفة النظام</span></div>
          <div className="text-2xl font-black text-[#d4af37]">{b.systemCostOMR.toLocaleString()}</div>
          <div className="text-xs text-[#d4af37]/70">ريال عُماني</div>
        </div>
        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-1 mb-1"><TrendingUp className="w-3 h-3 text-green-600" /><span className="text-xs text-green-700 font-medium">وفر سنوي</span></div>
          <div className="text-2xl font-black text-green-700">{b.annualSavingsOMR.toLocaleString()}</div>
          <div className="text-xs text-green-500">ريال/سنة</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-1 mb-1"><span className="text-xs text-blue-700 font-medium">صافي الربح (15 سنة)</span></div>
          <div className={'text-2xl font-black ' + (b.lifetimeSavingsOMR > 0 ? 'text-green-700' : 'text-red-600')}>{b.lifetimeSavingsOMR > 0 ? '+' : ''}{b.lifetimeSavingsOMR.toLocaleString()}</div>
          <div className="text-xs text-blue-500">ريال (بعد خصم تكلفة النظام)</div>
        </div>
      </div>

      {/* Payback visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1a5d3c]" />
            فترة الاسترداد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: Math.min(b.paybackYears / 15 * 100, 100) + '%', background: b.paybackYears <= 7 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : b.paybackYears <= 12 ? 'linear-gradient(90deg,#d4af37,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)' }}></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{b.paybackYears} سنة من أصل 15</div>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>0 سنة</span>
            <span>7 سنوات (ممتاز)</span>
            <span>15 سنة (عمر النظام)</span>
          </div>
        </CardContent>
      </Card>

      {/* Technical details */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">التفاصيل الفنية</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {b.breakdown.map(function(item, i) {
              return (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.labelAr}</div>
                    <div className="text-xs text-slate-400">{item.detail}</div>
                  </div>
                  <div className="text-sm font-bold text-[#1a5d3c] flex-shrink-0">{item.value}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center"><div className="text-xs text-slate-500">تفريغ يومي</div><div className="text-base font-bold text-slate-900">{b.dailyDischargeKWh} kWh</div></div>
            <div className="text-center"><div className="text-xs text-slate-500">دورات/سنة</div><div className="text-base font-bold text-slate-900">{b.cyclesPerYear}</div></div>
            <div className="text-center"><div className="text-xs text-slate-500">توفير CO₂</div><div className="text-base font-bold text-green-600">{b.co2OffsetTons} طن</div></div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <div className={'p-4 rounded-xl border ' + (b.viable ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200')}>
        <div className="text-sm font-bold text-slate-900 mb-1">التوصية</div>
        <div className="text-xs text-slate-700 leading-relaxed">{b.recommendationAr}</div>
        <div className="text-xs text-slate-500 mt-2">موثوقية الشبكة: <Badge className={b.gridReliabilityBenefit === 'high' ? 'bg-red-100 text-red-800 text-xs' : 'bg-green-100 text-green-800 text-xs'}>{b.gridReliabilityBenefitAr}</Badge></div>
      </div>

      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700">تقدير مبدئي لمرحلة ما قبل التصميم. أسعار بطاريات LFP لعام 2025 (185 ريال/kWh شامل التركيب). تعريفة OPWP الحالية. التدهور السنوي 2%. استشر مزود أنظمة طاقة شمسية معتمد للتصميم التفصيلي. مدعوم من Vision 2040.</div>
      </div>
    </div>
  );
}
