import type { CostResult } from '@/hooks/useCostEstimator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, TrendingUp, Info } from 'lucide-react';

interface CostEstimatorViewProps { cost: CostResult }

export function CostEstimatorView({ cost }: CostEstimatorViewProps) {
  var premium = cost.adjustedCostPerM2 - cost.baseCostPerM2;
  return (
    <div className="space-y-4" dir="rtl">

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">تكلفة البناء الأساسية</div>
          <div className="text-2xl font-black text-slate-700">{cost.baseCostPerM2}</div>
          <div className="text-xs text-slate-400">ريال/م² ({cost.buildingType})</div>
        </div>
        <div className="p-4 bg-[#1a5d3c]/5 rounded-xl border border-[#1a5d3c]/20">
          <div className="text-xs text-[#1a5d3c] font-medium">بعد تصحيح الموقع</div>
          <div className="text-2xl font-black text-[#1a5d3c]">{cost.adjustedCostPerM2}</div>
          <div className="text-xs text-[#1a5d3c]/70">ريال/م² (+{premium} علاوة موقع)</div>
        </div>
      </div>

      <Card className="border-[#d4af37]/40 bg-[#d4af37]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#d4af37]" />
            التكلفة الإجمالية — {cost.gfa.toLocaleString()} م²
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-slate-500">الحد الأدنى</div>
              <div className="text-xl font-black text-slate-700">{cost.rangeLow.toLocaleString()}</div>
              <div className="text-xs text-slate-400">ريال</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border-2 border-[#d4af37]">
              <div className="text-xs text-[#d4af37] font-bold">التقدير المُوصى به</div>
              <div className="text-2xl font-black text-[#1a5d3c]">{cost.totalWithContingency.toLocaleString()}</div>
              <div className="text-xs text-slate-400">ريال (+10% احتياطي)</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">الحد الأعلى</div>
              <div className="text-xl font-black text-slate-700">{cost.rangeHigh.toLocaleString()}</div>
              <div className="text-xs text-slate-400">ريال</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1a5d3c]" />
            تفصيل علاوات الموقع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cost.items.map(function(item, i) {
              var adj = item.adjustedOMR - item.baseOMR;
              var hasAdj = adj > 0;
              return (
                <div key={i} className={'flex items-start gap-3 p-3 rounded-lg ' + (hasAdj ? 'bg-orange-50 border border-orange-100' : 'bg-green-50 border border-green-100')}>
                  <div className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ' + (hasAdj ? 'bg-orange-500 text-white' : 'bg-green-500 text-white')}>
                    {hasAdj ? '+' : '✓'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{item.labelAr}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.reason}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={'text-sm font-black ' + (hasAdj ? 'text-orange-600' : 'text-green-600')}>{hasAdj ? '+' + adj : '0'} ريال/م²</div>
                    <div className="text-xs text-slate-400">{item.adjustedOMR} ريال/م² إجمالي</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div><div className="text-xs text-slate-500">تكلفة البناء (بدون احتياطي)</div><div className="text-base font-bold text-slate-900">{cost.totalAdjustedCost.toLocaleString()} ريال</div></div>
            <div><div className="text-xs text-slate-500">الاحتياطي 10%</div><div className="text-base font-bold text-[#d4af37]">{cost.contingency.toLocaleString()} ريال</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700">هذا تقدير مبدئي للمرحلة السابقة للتصميم. الأسعار مبنية على بيانات سوق عُمان 2025 (ريال/م² GFA). لا تشمل: الأرض، الخدمات الخارجية، رسوم الاستشارات، الأثاث والتجهيز. التحقق من المقاولين المحليين مطلوب.</div>
      </div>
    </div>
  );
}
