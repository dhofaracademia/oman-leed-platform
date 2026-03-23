import { useEffect, useRef, useState } from 'react';
import { 
  Satellite, 
  Layers, 
  Award, 
  Building2, 
  Compass, 
  Brain,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Satellite,
    title: 'NASA POWER Integration',
    description: 'Real-time climate data from NASA satellites including solar radiation, wind speed, temperature, and humidity for any location in Oman.',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: Layers,
    title: 'ISRIC SoilGrids',
    description: 'Global soil database with detailed analysis of soil type, texture, bearing capacity, drainage, and contamination risk.',
    color: 'from-amber-600 to-amber-800',
  },
  {
    icon: Award,
    title: 'LEED v4.1 Assessment',
    description: 'International green building certification standard with comprehensive assessment of current land status and future potential.',
    color: 'from-green-500 to-green-700',
  },
  {
    icon: Building2,
    title: 'Oman Building Code',
    description: 'Full compliance with MOHUP regulations, Energy Efficiency & Sustainability Code, and alignment with Oman Vision 2040.',
    color: 'from-[#1a5d3c] to-[#143d29]',
  },
  {
    icon: Compass,
    title: '4-Side Perimeter Analysis',
    description: 'Comprehensive assessment of surroundings including access, density, infrastructure, and environmental factors.',
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Smart recommendations tailored to each location based on climate data, soil conditions, and building code requirements.',
    color: 'from-pink-500 to-pink-700',
  },
];

const stats = [
  { value: '40+', label: 'Wilayats' },
  { value: '309,500', label: 'km² Coverage' },
  { value: '8', label: 'Data Sources' },
  { value: '110', label: 'LEED Points' },
];

export function Features() {
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
    <section id="features" ref={sectionRef} className="py-20 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Platform Features
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mt-4">
            Comprehensive tools and data sources to evaluate land sustainability 
            and guide green building decisions in Oman.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl md:text-4xl font-bold text-[#d4af37]">{stat.value}</div>
              <div className="text-white/80 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`group bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 4) * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-6">
            Ready to assess your land's sustainability potential?
          </p>
          <a 
            href="#analysis"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1a5d3c] to-[#d4af37] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#1a5d3c]/30 transition-all"
          >
            Start Analysis
            <TrendingUp className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
