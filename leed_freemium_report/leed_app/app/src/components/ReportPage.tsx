import { useState, useRef } from 'react';
import {
  MapPin, Sun, Thermometer, Droplets, Wind, Lock,
  CheckCircle2, AlertCircle, TrendingUp, Sparkles,
  FileText, Globe, ChevronRight, Download, Share2,
  Zap, TreePine, Recycle, Lightbulb, Award, Building2,
  ArrowRight, Star, Cpu
} from 'lucide-react';
import type { AnalysisResult } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function certInfo(score: number) {
  if (score >= 80) return { label: 'Platinum', labelAr: 'بلاتيني', color: '#8b5cf6', bg: '#8b5cf620', border: '#8b5cf640' };
  if (score >= 60) return { label: 'Gold',     labelAr: 'ذهبي',    color: '#d4af37', bg: '#d4af3720', border: '#d4af3740' };
  if (score >= 50) return { label: 'Silver',   labelAr: 'فضي',     color: '#94a3b8', bg: '#94a3b820', border: '#94a3b840' };
  return             { label: 'Certified',     labelAr: 'معتمد',   color: '#22c55e', bg: '#22c55e20', border: '#22c55e40' };
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Location & Transportation': MapPin,
  'Sustainable Sites': TreePine,
  'Water Efficiency': Droplets,
  'Energy & Atmosphere': Zap,
  'Materials & Resources': Recycle,
  'Indoor Environmental Quality': Wind,
  'Innovation': Lightbulb,
  'Regional Priority': Award,
};

// ─── Lock Overlay ─────────────────────────────────────────────────────────────
function LockedOverlay({ lang, onUpgrade }: { lang: 'en' | 'ar'; onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(10,31,20,0.82) 0%, rgba(26,93,60,0.75) 100%)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #d4af37, #f0c84a)' }}>
          <Lock className="w-5 h-5 text-[#0a1f14]" strokeWidth={2.5} />
        </div>
        <p className="text-white font-semibold text-sm">
          {lang === 'ar' ? 'محتوى حصري — الخطة المدفوعة' : 'Unlock in Full Report'}
        </p>
        <button onClick={onUpgrade}
          className="mt-1 px-5 py-2 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: '#d4af37', color: '#0a1f14' }}>
          {lang === 'ar' ? 'اشترك الآن →' : 'Upgrade Now →'}
        </button>
      </div>
    </div>
  );
}

// ─── Section Wrapper with lock ────────────────────────────────────────────────
function Section({
  title, titleAr, icon: Icon, children, locked, lang, onUpgrade, accent = '#1a5d3c'
}: {
  title: string; titleAr: string; icon: React.ElementType;
  children: React.ReactNode; locked: boolean; lang: 'en' | 'ar';
  onUpgrade: () => void; accent?: string;
}) {
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <h3 className="font-bold text-slate-800 text-base"
            style={{ fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', serif" : "'Cormorant Garamond', Georgia, serif" }}>
            {lang === 'ar' ? titleAr : title}
          </h3>
        </div>
        {locked ? (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border"
            style={{ color: '#d4af37', background: '#d4af3712', borderColor: '#d4af3730' }}>
            <Lock className="w-3 h-3" />
            {lang === 'ar' ? 'مدفوع' : 'Premium'}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border"
            style={{ color: '#16a34a', background: '#16a34a12', borderColor: '#16a34a30' }}>
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'ar' ? 'مجاني' : 'Free'}
          </span>
        )}
      </div>

      {/* Content with optional blur */}
      <div className="relative rounded-xl overflow-hidden border border-slate-100">
        <div style={locked ? { filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' } : {}}>
          {children}
        </div>
        {locked && <LockedOverlay lang={lang} onUpgrade={onUpgrade} />}
      </div>
    </div>
  );
}

// ─── Stat Cell ────────────────────────────────────────────────────────────────
function StatCell({ label, value, unit, accent = '#1a5d3c' }: {
  label: string; value: string | number; unit?: string; accent?: string;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="font-bold text-slate-800 text-lg leading-tight">
        {value}
        {unit && <span className="text-xs text-slate-400 font-normal ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// ─── LEED Bar ─────────────────────────────────────────────────────────────────
function LeedBar({ current, possible, max, color }: { current: number; possible: number; max: number; color: string }) {
  const currentPct = (current / max) * 100;
  const possiblePct = (possible / max) * 100;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full flex">
        <div className="h-full rounded-full transition-all" style={{ width: `${currentPct}%`, background: color }} />
        <div className="h-full rounded-full transition-all" style={{ width: `${possiblePct}%`, background: `${color}40` }} />
      </div>
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ lang, onClose }: { lang: 'en' | 'ar'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,31,20,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}>

        {/* Gold header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1a5d3c, #2d8f5e)' }}>
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {lang === 'ar' ? 'التقرير التفصيلي الكامل' : 'Full Detailed Report'}
          </h3>
          <p className="text-slate-500 text-sm">
            {lang === 'ar'
              ? 'احصل على تحليل LEED كامل مع توصيات مدعومة بـ Claude AI'
              : 'Complete LEED analysis with Claude AI-powered recommendations'}
          </p>
        </div>

        {/* What's included */}
        <div className="space-y-2 mb-6">
          {(lang === 'ar' ? [
            'تقسيم LEED الكامل لـ 8 فئات',
            'تحليل التربة التفصيلي',
            'توصيات كود البناء العُماني (OBC)',
            'خطة تحسينات مستقبلية بالتكاليف',
            'ملخص تنفيذي عربي احترافي',
            'توصيات Claude AI المخصصة',
          ] : [
            'Full LEED breakdown across 8 categories',
            'Detailed soil & wind analysis',
            'Oman Building Code (OBC) recommendations',
            'Future improvement plan with OMR costs',
            'Professional Arabic executive summary',
            'Custom Claude AI recommendations',
          ]).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-[#1a5d3c] flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="text-center mb-5 p-4 rounded-xl" style={{ background: '#d4af3710', border: '1px solid #d4af3730' }}>
          <div className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            <span className="text-lg text-slate-500">OMR </span>15
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {lang === 'ar' ? 'دفعة واحدة · تقرير واحد' : 'One-time · Single report'}
          </div>
        </div>

        <button className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] mb-3"
          style={{ background: 'linear-gradient(135deg, #1a5d3c, #2d8f5e)', color: 'white', fontFamily: 'sans-serif' }}>
          <Sparkles className="w-4 h-4" />
          {lang === 'ar' ? 'احصل على التقرير الكامل' : 'Get Full Report — OMR 15'}
        </button>

        <button onClick={onClose}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          style={{ fontFamily: 'sans-serif' }}>
          {lang === 'ar' ? 'ربما لاحقاً' : 'Maybe later'}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN REPORT PAGE ─────────────────────────────────────────────────────────
interface ReportPageProps {
  analysis: AnalysisResult;
  onClose?: () => void;
}

export function ReportPage({ analysis, onClose }: ReportPageProps) {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const cert = certInfo(analysis.landAssessment.maxPossibleScore);
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const arabicFont = "'Noto Naskh Arabic', 'Cairo', serif";
  const displayFont = "'Cormorant Garamond', 'Georgia', serif";

  // Fake blurred data for locked sections — realistic-looking but unreadable
  const fakeRecommendations = [
    { title: 'Building Orientation & Passive Solar Design', pts: 8, cost: 'Low', phase: 'Design' },
    { title: 'High-Performance Thermal Envelope (R-30+)', pts: 8, cost: 'Medium', phase: 'Design & Construction' },
    { title: 'Rooftop Solar PV Integration (BIPV)', pts: 5, cost: 'Medium', phase: 'Construction' },
    { title: 'Greywater Recycling & Low-Flow Fixtures', pts: 6, cost: 'Low', phase: 'Design' },
    { title: 'Heat Island Reduction (Cool Roof + Shade)', pts: 4, cost: 'Low', phase: 'Design' },
    { title: 'Smart BMS + Advanced Energy Metering', pts: 3, cost: 'Medium', phase: 'Construction' },
  ];

  return (
    <>
      {showUpgrade && <UpgradeModal lang={lang} onClose={() => setShowUpgrade(false)} />}

      <div
        ref={reportRef}
        dir={dir}
        style={{ fontFamily: isAr ? arabicFont : 'sans-serif' }}
        className="bg-white min-h-screen"
      >
        {/* ── REPORT HEADER ── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1f14 0%, #1a5d3c 60%, #0f3322 100%)' }}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #d4af37, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="relative px-6 pt-6 pb-8">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#d4af3720', border: '1px solid #d4af3740' }}>
                  <Globe className="w-4 h-4 text-[#d4af37]" />
                </div>
                <span className="text-white/70 text-sm tracking-widest uppercase" style={{ fontFamily: 'sans-serif', letterSpacing: '0.12em' }}>
                  LEED v4.1 Assessment
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Lang toggle */}
                <div className="flex items-center gap-0.5 bg-white/10 rounded-full p-0.5">
                  <button onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === 'en' ? 'bg-white text-[#0a1f14]' : 'text-white/60'}`}
                    style={{ fontFamily: 'sans-serif' }}>EN</button>
                  <button onClick={() => setLang('ar')}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${lang === 'ar' ? 'bg-white text-[#0a1f14] font-medium' : 'text-white/60'}`}
                    style={{ fontFamily: arabicFont }}>عربي</button>
                </div>
                {onClose && (
                  <button onClick={onClose}
                    className="text-white/40 hover:text-white/80 text-lg transition-colors ml-1"
                    style={{ fontFamily: 'sans-serif' }}>✕</button>
                )}
              </div>
            </div>

            {/* Main title block */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#d4af37]" />
                <span className="text-white/60 text-sm" style={{ fontFamily: 'sans-serif' }}>
                  {analysis.location.address || 'Oman'} · {analysis.location.lat.toFixed(4)}°N, {analysis.location.lng.toFixed(4)}°E
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: isAr ? arabicFont : displayFont }}>
                {isAr ? 'تقرير تقييم الأرض' : 'Land Sustainability Report'}
              </h1>
              <p className="text-white/40 text-sm" style={{ fontFamily: 'sans-serif' }}>
                {isAr ? `تاريخ التقييم: ${analysis.analysisDate}` : `Assessment Date: ${analysis.analysisDate}`}
              </p>
            </div>

            {/* Score hero */}
            <div className="flex items-stretch gap-4">
              {/* Main score */}
              <div className="flex-1 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-white/50 text-xs mb-2 uppercase tracking-widest" style={{ fontFamily: 'sans-serif' }}>
                  {isAr ? 'الدرجة القصوى المحتملة' : 'Max Achievable Score'}
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold text-white" style={{ fontFamily: displayFont, lineHeight: 1 }}>
                    {analysis.landAssessment.maxPossibleScore}
                  </span>
                  <span className="text-white/40 text-lg mb-1" style={{ fontFamily: 'sans-serif' }}>/110</span>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(analysis.landAssessment.maxPossibleScore / 110) * 100}%`, background: cert.color }} />
                  </div>
                </div>
              </div>

              {/* Cert badge */}
              <div className="w-36 rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                style={{ background: `${cert.color}18`, border: `1px solid ${cert.color}40` }}>
                <Star className="w-6 h-6 mb-2" style={{ color: cert.color }} />
                <div className="font-bold text-white text-xl mb-0.5" style={{ fontFamily: displayFont }}>
                  {isAr ? cert.labelAr : cert.label}
                </div>
                <div className="text-xs" style={{ color: cert.color, fontFamily: 'sans-serif' }}>
                  {isAr ? 'مستوى الشهادة' : 'Certification Level'}
                </div>
              </div>
            </div>

            {/* Current vs potential */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-2xl font-bold text-[#2d8f5e]" style={{ fontFamily: displayFont }}>
                  {analysis.landAssessment.currentScore}
                </div>
                <div className="text-white/40 text-xs" style={{ fontFamily: 'sans-serif' }}>
                  {isAr ? 'النقاط الحالية للأرض' : 'Current Land Points'}
                </div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-2xl font-bold text-[#d4af37]" style={{ fontFamily: displayFont }}>
                  +{analysis.landAssessment.potentialScore}
                </div>
                <div className="text-white/40 text-xs" style={{ fontFamily: 'sans-serif' }}>
                  {isAr ? 'نقاط إضافية ممكنة' : 'Additional Potential Points'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── REPORT BODY ── */}
        <div className="px-5 pt-7 pb-32 max-w-2xl mx-auto">

          {/* FREE: Climate Overview */}
          <Section title="Climate Overview" titleAr="نظرة عامة على المناخ"
            icon={Thermometer} locked={false} lang={lang} onUpgrade={() => setShowUpgrade(true)}>
            <div className="p-4 grid grid-cols-2 gap-3">
              <StatCell label={isAr ? 'المنطقة المناخية' : 'Climate Zone'}
                value={analysis.climate.climateZone.split(' ')[0]}
                unit={analysis.climate.climateZone.split(' ').slice(1).join(' ')} />
              <StatCell label={isAr ? 'متوسط الحرارة' : 'Avg Temperature'}
                value={analysis.climate.avgTemperature} unit="°C" />
              <StatCell label={isAr ? 'الإشعاع الشمسي السنوي' : 'Yearly Solar GHI'}
                value={analysis.solar.yearlyGHI} unit="kWh/m²" accent="#d4af37" />
              <StatCell label={isAr ? 'هطول الأمطار السنوي' : 'Annual Rainfall'}
                value={analysis.climate.rainfall} unit="mm" />
            </div>
            <div className="px-4 pb-4">
              <div className="p-3 rounded-lg text-xs" style={{ background: '#1a5d3c08', border: '1px solid #1a5d3c15' }}>
                <span className="font-semibold text-[#1a5d3c]">
                  {isAr ? '✓ المصدر: ' : '✓ Source: '}
                </span>
                <span className="text-slate-500">
                  {isAr ? 'بيانات حية من NASA POWER · دقة ±5%' : 'NASA POWER live satellite data · ±5% accuracy'}
                </span>
              </div>
            </div>
          </Section>

          {/* FREE: Solar Headline */}
          <Section title="Solar Potential" titleAr="إمكانات الطاقة الشمسية"
            icon={Sun} locked={false} lang={lang} onUpgrade={() => setShowUpgrade(true)} accent="#d4af37">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #d4af3710, #d4af3705)', border: '1px solid #d4af3730' }}>
                <div>
                  <div className="text-xs text-slate-400 mb-1">{isAr ? 'إمكانية إنتاج الطاقة الكهروضوئية' : 'PV Production Potential'}</div>
                  <div className="text-3xl font-bold text-slate-800" style={{ fontFamily: displayFont }}>
                    {analysis.solar.pvProductionPotential}
                    <span className="text-sm text-slate-400 font-normal ml-1">kWh/kWp/yr</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">{isAr ? 'الميل الأمثل' : 'Optimal Tilt'}</div>
                  <div className="text-2xl font-bold text-[#d4af37]" style={{ fontFamily: displayFont }}>
                    {analysis.solar.optimalTilt}°
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatCell label="GHI" value={analysis.solar.ghi} unit="kWh/m²" />
                <StatCell label="DNI" value={analysis.solar.dni} unit="kWh/m²" />
                <StatCell label={isAr ? 'فقد الغبار' : 'Dust Loss'} value={`${analysis.solar.dustImpactValue}%`} />
              </div>
            </div>
          </Section>

          {/* LOCKED: LEED Category Breakdown */}
          <Section title="LEED Score Breakdown" titleAr="تفصيل درجات LEED"
            icon={TrendingUp} locked={true} lang={lang} onUpgrade={() => setShowUpgrade(true)}>
            <div className="p-4 space-y-3">
              {analysis.landAssessment.categories.map((cat, i) => {
                const Icon = CATEGORY_ICONS[cat.name] || Building2;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[#1a5d3c]" />
                        <span className="text-xs text-slate-600">{cat.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {cat.currentPoints} / <span className="text-[#d4af37]">{cat.possiblePoints}</span>
                        <span className="text-slate-300 font-normal"> /{cat.maxPoints}</span>
                      </span>
                    </div>
                    <LeedBar current={cat.currentPoints} possible={cat.possiblePoints - cat.currentPoints} max={cat.maxPoints} color="#1a5d3c" />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* LOCKED: Soil Analysis */}
          <Section title="Soil Analysis" titleAr="تحليل التربة"
            icon={Globe} locked={true} lang={lang} onUpgrade={() => setShowUpgrade(true)} accent="#b45309">
            <div className="p-4 grid grid-cols-2 gap-3">
              <StatCell label="Soil Type" value={analysis.soil.type} />
              <StatCell label="Bearing Capacity" value={analysis.soil.bearingCapacity} unit="kPa" />
              <StatCell label="pH Level" value={analysis.soil.phLevel} />
              <StatCell label="Drainage" value={analysis.soil.drainage} />
              <StatCell label="Sand Content" value={`${analysis.soil.sandContent}%`} />
              <StatCell label="Clay Content" value={`${analysis.soil.clayContent}%`} />
            </div>
          </Section>

          {/* LOCKED: OBC Recommendations */}
          <Section title="OBC Recommendations" titleAr="توصيات كود البناء العُماني"
            icon={Building2} locked={true} lang={lang} onUpgrade={() => setShowUpgrade(true)}>
            <div className="p-4 space-y-3">
              {fakeRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ background: '#1a5d3c' }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm mb-1">{rec.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#d4af37] font-bold">+{rec.pts} pts</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">Cost: {rec.cost}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">{rec.phase}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* LOCKED: Wind Analysis */}
          <Section title="Wind Analysis" titleAr="تحليل الرياح"
            icon={Wind} locked={true} lang={lang} onUpgrade={() => setShowUpgrade(true)} accent="#3b82f6">
            <div className="p-4 grid grid-cols-2 gap-3">
              <StatCell label="Avg Speed" value={analysis.wind.averageSpeed} unit="m/s" />
              <StatCell label="Energy Density" value={analysis.wind.energyDensity} unit="W/m²" />
              <StatCell label="Direction" value={analysis.wind.prevailingDirection} />
              <StatCell label="Turbine Suitability" value={analysis.wind.turbineSuitability} />
              <StatCell label="Viable Hours" value={analysis.wind.annualHours} unit="hrs/yr" />
              <StatCell label="Max Speed" value={analysis.wind.maxSpeed} unit="m/s" />
            </div>
          </Section>

          {/* LOCKED: Future Improvements */}
          <Section title="Investment Roadmap" titleAr="خارطة طريق الاستثمار"
            icon={Sparkles} locked={true} lang={lang} onUpgrade={() => setShowUpgrade(true)} accent="#d4af37">
            <div className="p-4 space-y-3">
              {analysis.futureImprovements.slice(0, 4).map((imp, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-800">{imp.title}</span>
                    <span className="text-xs font-bold" style={{ color: '#d4af37' }}>+{imp.leedPointsIncrease} pts</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Cost: {imp.estimatedCost}</span>
                    <span>·</span>
                    <span>Payback: {imp.paybackPeriod}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* LOCKED: AI Analysis panel teaser */}
          <Section title="Claude AI Analysis" titleAr="تحليل الذكاء الاصطناعي"
            icon={Cpu} locked={true} lang={lang} onUpgrade={() => setShowUpgrade(true)} accent="#7c3aed">
            <div className="p-4 space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-5/6" />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          </Section>

        </div>

        {/* ── STICKY UPGRADE BANNER ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4"
          style={{ background: 'linear-gradient(to top, rgba(10,31,20,0.98) 70%, transparent)' }}>
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4 flex items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, #1a5d3c, #2d8f5e)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div>
                <div className="text-white font-bold text-sm mb-0.5"
                  style={{ fontFamily: isAr ? arabicFont : displayFont }}>
                  {isAr ? '🔒 5 أقسام مقفلة' : '🔒 5 Sections Locked'}
                </div>
                <div className="text-white/60 text-xs" style={{ fontFamily: 'sans-serif' }}>
                  {isAr ? 'احصل على التقرير الكامل مقابل 15 ر.ع. فقط' : 'Unlock everything for OMR 15'}
                </div>
              </div>
              <button onClick={() => setShowUpgrade(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{ background: '#d4af37', color: '#0a1f14', fontFamily: 'sans-serif' }}>
                {isAr ? 'اشترك' : 'Unlock'}
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
