import { useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Sun, Wind, Droplets, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onNavigate: (section: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const children = content.children;
    Array.from(children).forEach((child, index) => {
      (child as HTMLElement).style.opacity = '0';
      (child as HTMLElement).style.transform = 'translateY(30px)';
      setTimeout(() => {
        (child as HTMLElement).style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        (child as HTMLElement).style.opacity = '1';
        (child as HTMLElement).style.transform = 'translateY(0)';
      }, 300 + index * 100);
    });
  }, []);

  const stats = [
    { value: '3,493', label: 'Sunshine Hours/Year', icon: Sun },
    { value: '5.8', label: 'kWh/m² Solar', icon: Sun },
    { value: '5.45', label: 'm/s Wind Speed', icon: Wind },
    { value: '40+', label: 'Wilayats Covered', icon: MapPin },
  ];

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-[#1a5d3c]" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#d4af37] rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#1a5d3c] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[72px]">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-72px)] py-12">
          {/* Content */}
          <div ref={contentRef} className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-white/80 text-sm">Aligned with Oman Vision 2040</span>
            </div>

            {/* Headlines */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Land Sustainability
                <span className="block text-[#d4af37]">Intelligence</span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg text-white/70 max-w-xl leading-relaxed">
              UrbanEX: Comprehensive land sustainability assessment platform using 
              NASA climate data, ISRIC soil analysis, and LEED certification standards 
              aligned with Oman Building Code and Vision 2040.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => onNavigate('analysis')}
                size="lg"
                className="bg-[#1a5d3c] hover:bg-[#143d29] text-white px-8 py-6 text-lg group animate-pulse-glow"
              >
                Analyze Land
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => onNavigate('about')}
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <stat.icon className="w-5 h-5 text-[#d4af37] mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Developer Attribution */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TA</span>
                </div>
                <div>
                  <div className="text-white/80 text-sm">Developed by</div>
                  <a 
                    href="https://www.linkedin.com/in/tariq-alamri" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white font-semibold flex items-center gap-2 hover:text-[#d4af37] transition-colors"
                  >
                    Dr. Tariq Al Amri
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main Circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a5d3c]/30 to-[#d4af37]/30 backdrop-blur-xl border border-white/10" />
              
              {/* Inner Circle */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1a5d3c]/50 border border-white/5" />
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#d4af37] to-[#1a5d3c] flex items-center justify-center">
                    <Sun className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-white font-bold text-xl">Oman</div>
                  <div className="text-[#d4af37] text-sm">5th Globally</div>
                  <div className="text-white/60 text-xs">in Sunshine Hours</div>
                </div>
              </div>

              {/* Orbiting Elements */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center shadow-lg shadow-[#d4af37]/30">
                  <Wind className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-8 h-8 rounded-full bg-[#1a5d3c] flex items-center justify-center shadow-lg shadow-[#1a5d3c]/30">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Decorative Rings */}
              <div className="absolute inset-[-20px] rounded-full border border-white/5" />
              <div className="absolute inset-[-40px] rounded-full border border-white/[0.03]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8fafc] to-transparent" />
    </section>
  );
}
