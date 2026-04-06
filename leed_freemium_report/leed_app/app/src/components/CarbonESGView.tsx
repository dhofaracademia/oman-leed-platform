import type { CarbonResult } from '@/hooks/useCarbonCalc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Factory, Sun } from 'lucide-react';

interface CarbonESGViewProps { carbon: CarbonResult }

function PBar({ value, max, color, height }: { value: number; max: number; color: string; height?: number }) {
  return (
    <div className={'bg-slate-100 rounded-full overflow-hidden'} style={{ height: (height || 8) + 'px' }}>
      <div className="h-full rounded-full" style={{ width: Math.min(value / max * 100, 100) + '%', background: color }}></div>
    </div>
  );
}

export function CarbonESGView({ carbon }: CarbonESGViewProps) {
  var esgBg = carbon.esgRating.startsWith('A') ? 'bg-green-50 border-green-300 text-green-800' : carbon.esgRating === 'B' ? 'bg-blue-50 border-blue-300 text-blue-800' : carbon.esgRating === 'C' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-red-50 border-red-300 text-red-800';
  var maxBar = carbon.totalLifecycleTons * 1.1;

  return (
    <div className="space-y-4" dir="rtl">

      {/* ESG rating */}
      <div className={'p-4 rounded-xl border-2 flex items-center justify-between ' + esgBg}>
        <div>
          <div className="text-xs font-semibold opacity-70 mb-1">تقييم ESG الكربوني — دورة حياة 50 سنة</div>
          <div className="text-xl font-black">{carbon.esgRatingAr}</div>
          <div className="text-xs mt-1">{carbon.compliancePercent}% امتثال لأهداف Vision 2040</div>
        </div>
        <div className="text-5xl font-black opacity-80">{carbon.esgRating}</div>
      </div>

      {/* Carbon breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
          <div className="flex items-center gap-1 mb-1"><Factory className="w-3 h-3 text-orange-600" /><span className="text-xs text-orange-700 font-medium">كربون البناء (متضمن)</span></div>
          <div className="text-2xl font-black text-orange-700">{carbon.embodiedCarbonTons.toLocaleString()}</div>
          <div className="text-xs text-orange-500">طن CO₂ ({carbon.embodiedPerM2} kg/م²)</div>
        </div>
        <div className="p-3 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center gap-1 mb-1"><Leaf className="w-3 h-3 text-red-600" /><span className="text-xs text-red-700 font-medium">كربون التشغيل (50 سنة)</span></div>
          <div className="text-2xl font-black text-red-700">{carbon.operationalCarbonTons.toLocaleString()}</div>
          <div className="text-xs text-red-500">طن CO₂ ({carbon.annualOperational} طن/سنة)</div>
        </div>
        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-1 mb-1"><Sun className="w-3 h-3 text-green-600" /><span className="text-xs text-green-700 font-medium">توفير PV الشمسي (50 سنة)</span></div>
          <div className="text-2xl font-black text-green-700">-{carbon.pvOffsetTons.toLocaleString()}</div>
          <div className="text-xs text-green-500">طن CO₂ موفر</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-400">
          <div className="text-xs text-slate-500 mb-1 font-medium">صافي الكربون (50 سنة)</div>
          <div className="text-2xl font-black text-slate-900">{carbon.netCarbonTons.toLocaleString()}</div>
          <div className="text-xs text-slate-400">طن CO₂ إجمالي</div>
        </div>
      </div>

      {/* Visual comparison */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">مقارنة بصرية — أهداف Vision 2040</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold">الإجمالي (قبل الشمسي)</span><span className="font-bold text-red-600">{carbon.totalLifecycleTons.toLocaleString()} طن</span></div>
            <PBar value={carbon.totalLifecycleTons} max={maxBar} color="#dc2626" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold">صافي الكربون (بعد الشمسي)</span><span className="font-bold text-slate-700">{carbon.netCarbonTons.toLocaleString()} طن</span></div>
            <PBar value={carbon.netCarbonTons} max={maxBar} color="#64748b" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold">هدف Vision 2040 (50% خفض)</span><span className="font-bold text-green-600">{carbon.omvision2040Target} kg/م²/yr</span></div>
            <PBar value={carbon.embodiedPerM2} max={800} color="#16a34a" />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">فرص خفض الكربون</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {carbon.recommendations.map(function(r, i) {
              return (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</div>
                  <div className="text-xs text-slate-700 leading-relaxed">{r}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
            معامل انبعاثات شبكة الكهرباء العُمانية: 0.45 kg CO₂/kWh (بيانات OPWP 2024). حساب دورة الحياة معتمد على EN 15978.
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
