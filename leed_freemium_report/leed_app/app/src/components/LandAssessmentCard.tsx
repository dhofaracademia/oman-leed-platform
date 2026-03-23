import { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  TreePine, 
  Droplets, 
  Zap, 
  Recycle, 
  Wind, 
  Lightbulb, 
  Award,
  TrendingUp,
  Target,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LandAssessment } from '@/types';

interface LandAssessmentCardProps {
  assessment: LandAssessment;
}

const iconMap: Record<string, React.ElementType> = {
  MapPin,
  TreePine,
  Droplets,
  Zap,
  Recycle,
  Wind,
  Lightbulb,
  Award,
};

// Circular Progress Component for Current Score
function CircularProgress({ 
  current, 
  potential, 
  max, 
  size = 200, 
  strokeWidth = 12 
}: { 
  current: number; 
  potential: number;
  max: number; 
  size?: number; 
  strokeWidth?: number;
}) {
  const [animatedCurrent, setAnimatedCurrent] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const currentPercent = (animatedCurrent / max) * 100;
  const potentialPercent = (potential / max) * 100;
  
  const currentOffset = circumference - (currentPercent / 100) * circumference;
  const potentialEnd = ((currentPercent + potentialPercent) / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = current / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setAnimatedCurrent(current);
        clearInterval(timer);
      } else {
        setAnimatedCurrent(Math.floor(increment * step));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [current]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Potential progress circle (dashed) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d4af37"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${potentialEnd} ${circumference}`}
          strokeDashoffset={-currentOffset}
          opacity={0.4}
          style={{ transition: 'all 1.5s ease-out' }}
        />
        {/* Current progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a5d3c" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{animatedCurrent}</span>
        <span className="text-xs text-slate-500">Current</span>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm font-semibold text-[#d4af37]">+{potential}</span>
          <span className="text-xs text-slate-400">potential</span>
        </div>
      </div>
    </div>
  );
}

export function LandAssessmentCard({ assessment }: LandAssessmentCardProps) {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <TooltipProvider>
      <div ref={sectionRef}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0f172a] to-[#1a5d3c] text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Award className="w-6 h-6 text-[#d4af37]" />
                  Land Sustainability Assessment
                </CardTitle>
                <p className="text-white/70 mt-1">
                  Current land status based on climate and soil data
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-help">
                    <Info className="w-5 h-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>This assessment evaluates the current land status only. Points shown in gold represent potential LEED points achievable during design and construction phases.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Score Circle */}
              <div className="flex flex-col items-center justify-center">
                <CircularProgress 
                  current={assessment.currentScore} 
                  potential={assessment.potentialScore}
                  max={110} 
                />
                <div className="mt-6 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-[#1a5d3c]" />
                    <span className="text-slate-600">Current Land Status</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-[#d4af37]" />
                    <span className="text-slate-600">Potential (Design/Construction)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <div className="text-sm text-slate-500">Maximum Possible</div>
                    <div className="text-xl font-bold text-slate-900">{assessment.maxPossibleScore} points</div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#1a5d3c]" />
                  LEED Category Breakdown
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {assessment.categories.map((category, index) => {
                    const Icon = iconMap[category.icon] || Award;
                    const currentPercent = (category.currentPoints / category.maxPoints) * 100;
                    const potentialPercent = ((category.possiblePoints - category.currentPoints) / category.maxPoints) * 100;
                    
                    return (
                      <div 
                        key={category.name}
                        className={`p-4 rounded-lg border border-slate-200 hover:border-[#1a5d3c]/30 hover:shadow-md transition-all ${
                          isVisible ? 'animate-fade-up' : 'opacity-0'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#1a5d3c]/10 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-[#1a5d3c]" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-slate-900">{category.name}</div>
                              <div className="text-xs text-slate-500">{category.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              <span className="text-[#1a5d3c]">{category.currentPoints}</span>
                              <span className="text-[#d4af37]">+{category.possiblePoints - category.currentPoints}</span>
                              <span className="text-slate-400 text-sm">/{category.maxPoints}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-[#1a5d3c] rounded-full transition-all duration-1000"
                            style={{ 
                              width: isVisible ? `${currentPercent}%` : '0%',
                              transitionDelay: `${index * 100 + 500}ms`
                            }}
                          />
                          <div 
                            className="absolute h-full bg-[#d4af37]/50 rounded-full"
                            style={{ 
                              width: `${potentialPercent}%`,
                              left: `${currentPercent}%`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1a5d3c]/5 rounded-xl border border-[#1a5d3c]/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1a5d3c] flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">Current Status</span>
                </div>
                <div className="text-3xl font-bold text-[#1a5d3c]">{assessment.currentScore}</div>
                <div className="text-sm text-slate-500">LEED points from land characteristics</div>
              </div>

              <div className="p-4 bg-[#d4af37]/10 rounded-xl border border-[#d4af37]/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">Future Potential</span>
                </div>
                <div className="text-3xl font-bold text-[#d4af37]">+{assessment.potentialScore}</div>
                <div className="text-sm text-slate-500">Points achievable in design/construction</div>
              </div>

              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">Maximum</span>
                </div>
                <div className="text-3xl font-bold text-slate-700">{assessment.maxPossibleScore}</div>
                <div className="text-sm text-slate-500">Total possible LEED points</div>
              </div>
            </div>

            {/* Certification Path */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-4">LEED Certification Path</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: 'Certified', min: 40, color: 'bg-[#1a5d3c]' },
                  { name: 'Silver', min: 50, color: 'bg-slate-400' },
                  { name: 'Gold', min: 60, color: 'bg-yellow-500' },
                  { name: 'Platinum', min: 80, color: 'bg-emerald-500' },
                ].map((level) => {
                  const currentReachable = assessment.currentScore >= level.min;
                  const potentialReachable = assessment.maxPossibleScore >= level.min;
                  
                  return (
                    <div 
                      key={level.name}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
                        currentReachable 
                          ? 'border-green-300 bg-green-50' 
                          : potentialReachable
                            ? 'border-[#d4af37] bg-[#d4af37]/10'
                            : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${level.color}`} />
                      <span className={`text-sm font-medium ${
                        currentReachable ? 'text-green-800' : potentialReachable ? 'text-[#d4af37]' : 'text-slate-500'
                      }`}>
                        {level.name}
                      </span>
                      <span className="text-xs text-slate-400">({level.min}+)</span>
                      {currentReachable && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Achievable Now</Badge>
                      )}
                      {!currentReachable && potentialReachable && (
                        <Badge className="bg-[#d4af37]/20 text-[#d4af37] text-xs">With Design</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
