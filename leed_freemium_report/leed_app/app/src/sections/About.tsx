import { useEffect, useRef, useState } from 'react';
import { 
  Target, 
  Eye, 
  Heart, 
  Sun, 
  Wind, 
  Droplets,
  MapPin,
  Building2,
  CheckCircle2,
  Linkedin,
  Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const visionPoints = [
  {
    icon: Eye,
    title: 'Vision',
    description: 'Every land transaction in Oman begins with a comprehensive sustainability assessment, enabling Vision 2040.',
  },
  {
    icon: Target,
    title: 'Mission',
    description: 'Unify and enhance government data to transform it into actionable insights, facilitating sustainability decisions.',
  },
  {
    icon: Heart,
    title: 'Value Proposition',
    description: 'We complement government platforms by transforming raw data into intelligent urban development insights.',
  },
];

const partners = [
  { name: 'MOHUP', fullName: 'Ministry of Housing & Urban Planning' },
  { name: 'NASA POWER', fullName: 'NASA Prediction of Worldwide Energy Resources' },
  { name: 'ISRIC', fullName: 'World Soil Information' },
  { name: 'USGBC', fullName: 'U.S. Green Building Council' },
];

const omanStats = [
  { value: '5th', label: 'Global Ranking', sublabel: 'Sunshine Hours' },
  { value: '3,493', label: 'Annual Sunshine', sublabel: 'Hours per Year' },
  { value: '5.8', label: 'Solar Irradiance', sublabel: 'kWh/m²/day' },
  { value: '320', label: 'Sunny Days', sublabel: 'Days per Year' },
];

export function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-20 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            About UrbanEX
          </h2>
        </div>

        {/* Developer Card */}
        <div className="mb-16">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 bg-gradient-to-br from-[#0f172a] to-[#1a5d3c] text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#1a5d3c] flex items-center justify-center">
                    <span className="text-white font-bold text-xl">TA</span>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">Developed by</div>
                    <h3 className="text-2xl font-bold">Dr. Tariq Al Amri</h3>
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed mb-6">
                  UrbanEX is developed by Dr. Tariq Al Amri, bringing expertise in sustainable 
                  urban development, building codes, and environmental assessment to create 
                  a comprehensive land sustainability intelligence platform for Oman.
                </p>
                <a 
                  href="https://www.linkedin.com/in/tariq-alamri" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  Connect on LinkedIn
                </a>
              </div>
              <div className="p-8 bg-white">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#d4af37]" />
                  Platform Credentials
                </h4>
                <ul className="space-y-3">
                  {[
                    'Aligned with Oman Vision 2040',
                    'Based on Oman Energy Efficiency & Sustainability Code',
                    'LEED v4.1 certification standards',
                    'NASA POWER climate data integration',
                    'ISRIC SoilGrids global soil database',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#1a5d3c] flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Vision 2040 Banner */}
        <div className="mb-16 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#1a5d3c] to-[#0f172a] p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37] rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#1a5d3c] rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Target className="w-4 h-4 text-[#d4af37]" />
              <span className="text-white/80 text-sm">Aligned with Oman Vision 2040</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Supporting Sustainable Development Goals
            </h3>
          </div>
        </div>

        {/* Oman Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {omanStats.map((stat, index) => (
            <div 
              key={index}
              className={`p-6 bg-white rounded-xl shadow-sm border border-slate-200 text-center transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl md:text-4xl font-bold text-[#1a5d3c]">{stat.value}</div>
              <div className="text-slate-700 text-sm font-medium mt-1">{stat.label}</div>
              <div className="text-slate-500 text-xs mt-1">{stat.sublabel}</div>
            </div>
          ))}
        </div>

        {/* Vision, Mission, Value */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {visionPoints.map((point, index) => (
            <Card 
              key={index}
              className={`group hover:shadow-lg transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 4) * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a5d3c] to-[#d4af37] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <point.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {point.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {point.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              Why UrbanEX?
            </h3>
            <div className="space-y-4">
              {[
                'Instant pre-purchase sustainability assessment',
                'Data-driven decisions reduce risk and cost',
                'Full compliance with Oman Building Code',
                'LEED certification pathway guidance',
                'Climate-optimized design recommendations',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1a5d3c] flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              Data Sources
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Sun, label: 'Solar Radiation', source: 'NASA POWER' },
                { icon: Wind, label: 'Wind Data', source: 'NASA POWER' },
                { icon: Droplets, label: 'Humidity', source: 'NASA POWER' },
                { icon: MapPin, label: 'Soil Data', source: 'ISRIC SoilGrids' },
                { icon: Building2, label: 'Building Code', source: 'MOHUP' },
                { icon: Target, label: 'LEED Standards', source: 'USGBC' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-white rounded-lg border border-slate-200 hover:border-[#1a5d3c]/30 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-[#1a5d3c] mb-2" />
                  <div className="text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Partners */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Strategic Partners
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="px-6 py-3 bg-white rounded-lg border border-slate-200 shadow-sm"
              >
                <div className="font-semibold text-slate-900">{partner.name}</div>
                <div className="text-xs text-slate-500">{partner.fullName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
