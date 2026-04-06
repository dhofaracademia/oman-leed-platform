import { useState } from 'react';
import type { OPALResult } from '@/hooks/useOPAL';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface OPALMappingProps { opal: OPALResult }

function StarRow({ stars, max }: { stars: number; max: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map(function(_, i) {
        return <Star key={i} className={'w-5 h-5 ' + (i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200')} />;
      })}
    </div>
  );
}

function CreditRow({ credit }: { credit: OPALResult['categories'][0]['credits'][0] }) {
  var _o = useState(false); var open = _o[0], setOpen = _o[1];
  var statusIcon = credit.status === 'earned'
    ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
    : credit.status === 'partial'
    ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
    : <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />;
  var bg = credit.status === 'earned' ? 'bg-green-50 border-green-200' : credit.status === 'partial' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200';

  return (
    <div className={'border rounded-lg overflow-hidden mb-2 ' + bg}>
      <button className="w-full flex items-center gap-3 p-3 text-right" onClick={function() { setOpen(!open); }}>
        {statusIcon}
        <div className="flex-1">
          <div className="font-semibold text-sm text-slate-900">{credit.titleAr}</div>
          <div className="text-xs text-slate-500">{credit.id} · {credit.leedEquivalent}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-[#1a5d3c]">{credit.earnedPoints}/{credit.maxPoints}</span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-current border-opacity-10 space-y-2 pt-2">
          <div className="text-xs text-slate-600"><span className="font-semibold">الأساس: </span>{credit.basis}</div>
          {credit.action && (
            <div className="p-2 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/15">
              <div className="text-xs text-[#1a5d3c] font-semibold mb-0.5">الإجراء المطلوب:</div>
              <div className="text-xs text-slate-700">{credit.action}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OPALMapping({ opal }: OPALMappingProps) {
  return (
    <div className="space-y-4" dir="rtl">

      {/* Header score */}
      <div className={'p-4 rounded-xl border-2 ' + (opal.ministryReady ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300')}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">برنامج OPAL — وزارة الإسكان عُمان</div>
            <div className={'text-lg font-black ' + (opal.ministryReady ? 'text-green-800' : 'text-amber-800')}>{opal.starLabelAr}</div>
            <StarRow stars={opal.stars} max={5} />
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-[#1a5d3c]">{opal.totalPoints}</div>
            <div className="text-xs text-slate-500">من {opal.maxPoints} نقطة</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-700 font-medium">{opal.ministryNote}</div>
        {opal.incentive && <div className="mt-1 text-xs font-bold text-[#1a5d3c]">🏛️ {opal.incentive}</div>}
      </div>

      {/* Category summaries */}
      <div className="grid grid-cols-3 gap-2">
        {opal.categories.map(function(cat) {
          var pct = Math.round(cat.earned / cat.max * 100);
          return (
            <div key={cat.name} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 mb-1 leading-tight">{cat.nameAr}</div>
              <div className="text-xl font-black text-[#1a5d3c]">{cat.earned}</div>
              <div className="text-xs text-slate-400">/{cat.max}</div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-[#1a5d3c]" style={{ width: pct + '%' }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credits by category */}
      {opal.categories.map(function(cat) {
        return (
          <div key={cat.name}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-sm text-slate-900">{cat.nameAr}</h3>
              <span className="text-xs text-slate-400">{cat.earned}/{cat.max} نقطة</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            {cat.credits.map(function(c) { return <CreditRow key={c.id} credit={c} />; })}
          </div>
        );
      })}

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-700">نظام OPAL هو التصنيف الأخضر الرسمي لسلطنة عُمان المعتمد من وزارة الإسكان. التصنيف 3 نجوم وما فوق يمنح تخفيضاً في رسوم الخدمات الحكومية. هذا تقييم مبدئي — التحقق الرسمي يتطلب مراجعة استشاري OPAL معتمد.</div>
      </div>
    </div>
  );
}
