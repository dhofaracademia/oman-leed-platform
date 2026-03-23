import { useState } from 'react';
import { Check, Zap, Building2, Landmark, ArrowRight, Star, Shield, Globe } from 'lucide-react';

const CONTENT = {
  en: {
    dir: 'ltr',
    badge: 'Simple, Transparent Pricing',
    title: 'Invest Once.',
    titleAccent: 'Save Thousands.',
    subtitle: 'A single LEED consultant charges OMR 500–2,000 per assessment. Our platform delivers the same pre-assessment in minutes — at a fraction of the cost.',
    monthly: 'Monthly',
    annual: 'Annual',
    annualSave: 'Save 20%',
    popular: 'Most Popular',
    getStarted: 'Get Started',
    contactUs: 'Contact Sales',
    perReport: 'per report',
    perMonth: '/ month',
    perYear: '/ year',
    currency: 'OMR',
    plans: [
      {
        icon: Zap,
        name: 'Pay-per-Report',
        nameAr: 'دفع لكل تقرير',
        price: '15',
        priceAnnual: '15',
        description: 'Perfect for individual consultants or one-off assessments',
        color: '#2d8f5e',
        features: [
          'Full LEED v4.1 assessment',
          'NASA POWER solar & wind data',
          'SoilGrids soil analysis',
          'OBC recommendations',
          'Arabic + English PDF report',
          'Valid for 30 days',
        ],
        cta: 'Buy Report',
        highlight: false,
      },
      {
        icon: Building2,
        name: 'Professional',
        nameAr: 'احترافي',
        price: '149',
        priceAnnual: '119',
        description: 'For engineering firms and real estate developers',
        color: '#d4af37',
        features: [
          'Unlimited assessments',
          'Claude AI chat per report',
          'Auto Arabic executive summary',
          'AI-powered recommendations',
          'Team access (3 users)',
          'Priority email support',
          'Exportable PDF reports',
          'Usage analytics dashboard',
        ],
        cta: 'Start Free Trial',
        highlight: true,
      },
      {
        icon: Landmark,
        name: 'Enterprise',
        nameAr: 'مؤسسي',
        price: '490',
        priceAnnual: '390',
        description: 'For government agencies, large developers & white-label',
        color: '#1a5d3c',
        features: [
          'Everything in Professional',
          'Unlimited team members',
          'White-label branding',
          'Custom OBC rule engine',
          'API access',
          'Dedicated account manager',
          'On-site training (Muscat)',
          'SLA + priority support',
          'Government tender documentation',
        ],
        cta: 'Contact Sales',
        highlight: false,
      },
    ],
    comparison: 'vs. Traditional LEED Consultant',
    compRows: [
      { label: 'Cost per assessment', traditional: 'OMR 500 – 2,000', platform: 'OMR 15 – Free (subscription)' },
      { label: 'Turnaround time', traditional: '2 – 4 weeks', platform: '< 5 minutes' },
      { label: 'Arabic report', traditional: 'Extra cost', platform: 'Included' },
      { label: 'Oman-specific OBC', traditional: 'Depends on firm', platform: 'Built-in' },
      { label: 'AI recommendations', traditional: '❌', platform: '✅ Claude-powered' },
      { label: 'Revision requests', traditional: 'Charged separately', platform: 'Unlimited' },
    ],
    faqTitle: 'Common Questions',
    faqs: [
      {
        q: 'Is this a certified LEED assessment?',
        a: 'No — this is a pre-assessment and feasibility screening tool. It gives you an indicative LEED score and actionable recommendations before engaging a licensed LEED consultant. Think of it as due diligence before the formal process.',
      },
      {
        q: 'What data sources are used?',
        a: 'Solar and climate data comes from NASA POWER satellite (real-time, location-specific). Soil data from ISRIC SoilGrids (250m resolution). LEED scoring follows the official LEED v4.1 BD+C algorithm.',
      },
      {
        q: 'Can I use this for government tenders in Oman?',
        a: 'Yes — the Enterprise plan includes documentation formatted for Omani government sustainability requirements and Vision 2040 compliance frameworks.',
      },
      {
        q: 'Is there a free trial?',
        a: 'The Professional plan includes a 7-day free trial with 3 full assessments. No credit card required to start.',
      },
    ],
  },
  ar: {
    dir: 'rtl',
    badge: 'أسعار شفافة وواضحة',
    title: 'استثمر مرة واحدة.',
    titleAccent: 'وفّر الآلاف.',
    subtitle: 'الاستشاري المعتمد لتقييم LEED يتقاضى 500–2,000 ريال عُماني لكل تقرير. منصتنا تقدم نفس التقييم المسبق في دقائق — بجزء بسيط من التكلفة.',
    monthly: 'شهري',
    annual: 'سنوي',
    annualSave: 'وفر 20%',
    popular: 'الأكثر طلباً',
    getStarted: 'ابدأ الآن',
    contactUs: 'تواصل معنا',
    perReport: 'لكل تقرير',
    perMonth: '/ شهر',
    perYear: '/ سنة',
    currency: 'ر.ع.',
    plans: [
      {
        icon: Zap,
        name: 'Pay-per-Report',
        nameAr: 'دفع لكل تقرير',
        price: '15',
        priceAnnual: '15',
        description: 'مثالي للمستشارين الأفراد أو التقييمات المنفردة',
        color: '#2d8f5e',
        features: [
          'تقييم LEED v4.1 كامل',
          'بيانات الطاقة الشمسية والرياح من NASA',
          'تحليل التربة من SoilGrids',
          'توصيات كود البناء العُماني',
          'تقرير PDF عربي وإنجليزي',
          'صالح لمدة 30 يوماً',
        ],
        cta: 'اشترِ تقريراً',
        highlight: false,
      },
      {
        icon: Building2,
        name: 'Professional',
        nameAr: 'احترافي',
        price: '149',
        priceAnnual: '119',
        description: 'للشركات الهندسية والمطورين العقاريين',
        color: '#d4af37',
        features: [
          'تقييمات غير محدودة',
          'محادثة Claude AI لكل تقرير',
          'ملخص تنفيذي عربي تلقائي',
          'توصيات مدعومة بالذكاء الاصطناعي',
          'وصول الفريق (3 مستخدمين)',
          'دعم بريد إلكتروني مُقدَّم',
          'تقارير PDF قابلة للتصدير',
          'لوحة تحليلات الاستخدام',
        ],
        cta: 'ابدأ التجربة المجانية',
        highlight: true,
      },
      {
        icon: Landmark,
        name: 'Enterprise',
        nameAr: 'مؤسسي',
        price: '490',
        priceAnnual: '390',
        description: 'للجهات الحكومية والمطورين الكبار والعلامة التجارية الخاصة',
        color: '#1a5d3c',
        features: [
          'كل مميزات الخطة الاحترافية',
          'أعضاء فريق غير محدودين',
          'علامة تجارية خاصة',
          'محرك قواعد OBC مخصص',
          'وصول API',
          'مدير حساب مخصص',
          'تدريب ميداني في مسقط',
          'SLA + دعم ذو أولوية',
          'وثائق المناقصات الحكومية',
        ],
        cta: 'تواصل مع المبيعات',
        highlight: false,
      },
    ],
    comparison: 'مقارنة مع الاستشاري التقليدي',
    compRows: [
      { label: 'تكلفة كل تقييم', traditional: '500 – 2,000 ر.ع.', platform: '15 ر.ع. – مجاني (اشتراك)' },
      { label: 'وقت التسليم', traditional: 'أسبوعان – شهر', platform: 'أقل من 5 دقائق' },
      { label: 'تقرير عربي', traditional: 'تكلفة إضافية', platform: 'مضمّن' },
      { label: 'كود OBC العُماني', traditional: 'يعتمد على الشركة', platform: 'مدمج' },
      { label: 'توصيات بالذكاء الاصطناعي', traditional: '❌', platform: '✅ مدعوم بـ Claude' },
      { label: 'طلبات المراجعة', traditional: 'تُحسب بشكل منفصل', platform: 'غير محدودة' },
    ],
    faqTitle: 'أسئلة شائعة',
    faqs: [
      {
        q: 'هل هذا تقييم LEED معتمد رسمياً؟',
        a: 'لا — هذه أداة للتقييم المسبق وفحص الجدوى. تعطيك درجة LEED استرشادية وتوصيات قابلة للتنفيذ قبل التعاقد مع مستشار LEED مرخص. فكر فيها كمرحلة العناية الواجبة قبل العملية الرسمية.',
      },
      {
        q: 'ما مصادر البيانات المستخدمة؟',
        a: 'بيانات الطاقة الشمسية والمناخ من قمر NASA POWER الاصطناعي (فورية، محددة الموقع). بيانات التربة من ISRIC SoilGrids (دقة 250 متر). يتبع تسجيل LEED خوارزمية LEED v4.1 BD+C الرسمية.',
      },
      {
        q: 'هل يمكن استخدامها في المناقصات الحكومية بعُمان؟',
        a: 'نعم — تتضمن خطة Enterprise وثائق مُنسَّقة وفق متطلبات الاستدامة الحكومية العُمانية وأطر رؤية 2040.',
      },
      {
        q: 'هل هناك تجربة مجانية؟',
        a: 'تتضمن الخطة الاحترافية تجربة مجانية لمدة 7 أيام مع 3 تقييمات كاملة. لا تحتاج إلى بطاقة ائتمانية للبدء.',
      },
    ],
  },
};

export function Pricing() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const c = CONTENT[lang];

  return (
    <section
      id="pricing"
      dir={c.dir}
      style={{ fontFamily: lang === 'ar' ? "'Noto Naskh Arabic', 'Cairo', serif" : "'Cormorant Garamond', 'Georgia', serif" }}
      className="relative overflow-hidden bg-[#0a1f14] py-24 px-4"
    >
      {/* Geometric background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, #d4af37 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto">

        {/* Lang Toggle */}
        <div className={`flex ${lang === 'ar' ? 'justify-start' : 'justify-end'} mb-8`}>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <button onClick={() => setLang('en')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${lang === 'en' ? 'bg-[#d4af37] text-[#0a1f14]' : 'text-white/60 hover:text-white'}`}>
              EN
            </button>
            <button onClick={() => setLang('ar')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${lang === 'ar' ? 'bg-[#d4af37] text-[#0a1f14]' : 'text-white/60 hover:text-white'}`}
              style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
              عربي
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 mb-6">
            <Star className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[#d4af37] text-sm tracking-widest uppercase" style={{ fontFamily: 'sans-serif', letterSpacing: '0.15em' }}>
              {c.badge}
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-2 leading-tight">
            {c.title}
          </h2>
          <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#d4af37' }}>
            {c.titleAccent}
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'sans-serif', fontSize: '1rem' }}>
            {c.subtitle}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1.5">
            <button onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full text-sm transition-all ${billing === 'monthly' ? 'bg-white text-[#0a1f14] font-semibold' : 'text-white/60 hover:text-white'}`}
              style={{ fontFamily: 'sans-serif' }}>
              {c.monthly}
            </button>
            <button onClick={() => setBilling('annual')}
              className={`px-6 py-2 rounded-full text-sm flex items-center gap-2 transition-all ${billing === 'annual' ? 'bg-white text-[#0a1f14] font-semibold' : 'text-white/60 hover:text-white'}`}
              style={{ fontFamily: 'sans-serif' }}>
              {c.annual}
              <span className="text-xs bg-[#d4af37] text-[#0a1f14] px-2 py-0.5 rounded-full font-bold">{c.annualSave}</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {c.plans.map((plan, i) => {
            const Icon = plan.icon;
            const price = billing === 'annual' ? plan.priceAnnual : plan.price;
            const period = plan.name === 'Pay-per-Report' ? c.perReport : (billing === 'annual' ? c.perYear : c.perMonth);

            return (
              <div key={i}
                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-[#d4af37]/15 to-[#d4af37]/5 border-2 border-[#d4af37]/50 shadow-2xl'
                    : 'bg-white/[0.03] border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-[#d4af37] text-[#0a1f14] text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase"
                      style={{ fontFamily: 'sans-serif' }}>
                      {c.popular}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                  <Icon className="w-6 h-6" style={{ color: plan.color }} />
                </div>

                {/* Plan name */}
                <h3 className="text-white font-bold text-xl mb-1">
                  {lang === 'ar' ? plan.nameAr : plan.name}
                </h3>
                <p className="text-white/40 text-sm mb-6" style={{ fontFamily: 'sans-serif', fontSize: '0.85rem' }}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-white/50 text-sm" style={{ fontFamily: 'sans-serif' }}>{c.currency}</span>
                    <span className="text-5xl font-bold" style={{ color: plan.highlight ? '#d4af37' : 'white' }}>
                      {price}
                    </span>
                    <span className="text-white/40 text-sm" style={{ fontFamily: 'sans-serif' }}>{period}</span>
                  </div>
                  {billing === 'annual' && plan.name !== 'Pay-per-Report' && (
                    <p className="text-[#2d8f5e] text-xs mt-1" style={{ fontFamily: 'sans-serif' }}>
                      {lang === 'ar' ? `بدلاً من ${plan.price} ر.ع. / شهر` : `Instead of ${c.currency} ${plan.price}/mo`}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: `${plan.color}20` }}>
                        <Check className="w-3 h-3" style={{ color: plan.color }} />
                      </div>
                      <span className="text-white/70 text-sm leading-relaxed" style={{ fontFamily: 'sans-serif', fontSize: '0.85rem' }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    plan.highlight
                      ? 'bg-[#d4af37] text-[#0a1f14] hover:bg-[#e5c84a] shadow-lg'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                  style={{ fontFamily: 'sans-serif' }}
                >
                  {plan.cta}
                  <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            {c.comparison}
          </h3>
          <div className="rounded-2xl overflow-hidden border border-white/10">
            <table className="w-full" style={{ fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-white/50 font-medium text-left">{lang === 'ar' ? 'المقارنة' : 'Feature'}</th>
                  <th className="px-6 py-4 text-white/50 font-medium text-center">{lang === 'ar' ? 'الاستشاري التقليدي' : 'Traditional Consultant'}</th>
                  <th className="px-6 py-4 text-[#d4af37] font-semibold text-center">{lang === 'ar' ? 'منصتنا' : 'Our Platform'}</th>
                </tr>
              </thead>
              <tbody>
                {c.compRows.map((row, i) => (
                  <tr key={i} className={`border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                    <td className="px-6 py-4 text-white/70">{row.label}</td>
                    <td className="px-6 py-4 text-white/40 text-center">{row.traditional}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[#2d8f5e] font-medium">{row.platform}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">{c.faqTitle}</h3>
          <div className="space-y-3">
            {c.faqs.map((faq, i) => (
              <div key={i}
                className="border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-white font-medium" style={{ fontFamily: 'sans-serif', fontSize: '0.9rem' }}>{faq.q}</span>
                  <span className={`text-[#d4af37] text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </div>
                {openFaq === i && (
                  <div className="px-6 pb-4 border-t border-white/5">
                    <p className="text-white/50 text-sm leading-relaxed pt-3" style={{ fontFamily: 'sans-serif' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {[
            { icon: Shield, label: lang === 'ar' ? 'بيانات آمنة ومشفرة' : 'Secure & Encrypted' },
            { icon: Globe, label: lang === 'ar' ? 'مُحسَّن لعُمان والخليج' : 'Oman & GCC Optimized' },
            { icon: Star, label: lang === 'ar' ? 'LEED v4.1 معتمد' : 'LEED v4.1 Compliant' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-white/40">
              <b.icon className="w-4 h-4 text-[#d4af37]" />
              <span style={{ fontFamily: 'sans-serif', fontSize: '0.85rem' }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="relative rounded-2xl overflow-hidden p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1a5d3c 0%, #0a3320 50%, #1a3a14 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ background: 'radial-gradient(circle at 70% 50%, #d4af37, transparent 60%)' }} />
          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-3">
              {lang === 'ar' ? 'جاهز لتقييم قطعتك؟' : 'Ready to assess your land?'}
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto" style={{ fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
              {lang === 'ar'
                ? 'ابدأ بتقرير واحد مجاناً. لا حاجة لبطاقة ائتمانية.'
                : 'Start with one free report. No credit card required.'}
            </p>
            <button className="bg-[#d4af37] hover:bg-[#e5c84a] text-[#0a1f14] font-bold px-8 py-4 rounded-xl inline-flex items-center gap-2 transition-all hover:scale-105 shadow-xl"
              style={{ fontFamily: 'sans-serif' }}>
              {lang === 'ar' ? 'ابدأ التقييم المجاني' : 'Start Free Assessment'}
              <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
