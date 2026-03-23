import { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ArrowRight,
  Target,
  Lightbulb,
  Sun,
  Wind,
  Droplets,
  Home,
  Cpu,
  Zap,
  Leaf,
  Ruler,
  HardHat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FutureImprovement } from '@/types';

interface FutureImprovementsProps {
  improvements: FutureImprovement[];
}

const improvementIcons: Record<string, React.ElementType> = {
  'Advanced Solar Integration': Sun,
  'Small Wind Turbine': Wind,
  'Greywater Recycling System': Droplets,
  'High-Performance Building Envelope': Home,
  'EV Charging Infrastructure': Zap,
  'Green Roof System': Leaf,
  'AI-Powered Building Management': Cpu,
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-300';
  }
};

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'Design':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Construction':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Design & Construction':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-300';
  }
};

const getPriorityValue = (priority: string): number => {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

function ImprovementCard({ 
  improvement, 
  index 
}: { 
  improvement: FutureImprovement; 
  index: number;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const Icon = improvementIcons[improvement.title] || Lightbulb;

  return (
    <div 
      className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a5d3c]/10 to-[#d4af37]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-[#1a5d3c]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900">{improvement.title}</h3>
              </div>
              <p className="text-sm text-slate-600 mt-1">{improvement.description}</p>
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className={getPriorityColor(improvement.priority)}>
                  {improvement.priority} priority
                </Badge>
                <Badge variant="outline" className={getPhaseColor(improvement.implementationPhase)}>
                  {improvement.implementationPhase.includes('Design') && <Ruler className="w-3 h-3 mr-1" />}
                  {improvement.implementationPhase.includes('Construction') && <HardHat className="w-3 h-3 mr-1" />}
                  {improvement.implementationPhase}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{improvement.leedPointsIncrease} LEED pts
                </Badge>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-shrink-0"
          >
            {showDetails ? 'Less' : 'More'}
            <ArrowRight className={`w-4 h-4 ml-1 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Current Status</div>
                <div className="text-sm font-medium text-slate-700">{improvement.currentStatus}</div>
              </div>
              <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                <div className="text-xs text-[#1a5d3c] mb-1">Potential Status</div>
                <div className="text-sm font-medium text-slate-900">{improvement.potentialStatus}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <DollarSign className="w-3 h-3" />
                  Estimated Cost
                </div>
                <div className="text-sm font-semibold text-slate-900">{improvement.estimatedCost}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Clock className="w-3 h-3" />
                  Payback Period
                </div>
                <div className="text-sm font-semibold text-slate-900">{improvement.paybackPeriod}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FutureImprovements({ improvements }: FutureImprovementsProps) {
  const [sortBy, setSortBy] = useState<'priority' | 'points' | 'cost'>('priority');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'Design' | 'Construction' | 'Design & Construction'>('all');

  const filteredImprovements = phaseFilter === 'all' 
    ? improvements 
    : improvements.filter(i => i.implementationPhase === phaseFilter);

  const sortedImprovements = [...filteredImprovements].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return getPriorityValue(b.priority) - getPriorityValue(a.priority);
      case 'points':
        return b.leedPointsIncrease - a.leedPointsIncrease;
      case 'cost':
        const costOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
        const aCost = a.estimatedCost.includes('High') ? 'high' : a.estimatedCost.includes('Low') ? 'low' : 'medium';
        const bCost = b.estimatedCost.includes('High') ? 'high' : b.estimatedCost.includes('Low') ? 'low' : 'medium';
        return costOrder[aCost] - costOrder[bCost];
      default:
        return 0;
    }
  });

  const totalPotentialPoints = improvements.reduce((sum, imp) => sum + imp.leedPointsIncrease, 0);
  const highPriorityCount = improvements.filter(imp => imp.priority === 'high').length;
  const designPhasePoints = improvements.filter(i => i.implementationPhase.includes('Design')).reduce((s, i) => s + i.leedPointsIncrease, 0);
  const constructionPhasePoints = improvements.filter(i => i.implementationPhase.includes('Construction')).reduce((s, i) => s + i.leedPointsIncrease, 0);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-[#d4af37]/10 to-[#1a5d3c]/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#d4af37]" />
              Future Improvements
            </CardTitle>
            <p className="text-slate-600 mt-1">
              Recommended upgrades to increase LEED score during design and construction
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg border border-[#d4af37]/30">
              <div className="text-sm text-slate-500">Total Potential</div>
              <div className="text-2xl font-bold text-[#d4af37]">+{totalPotentialPoints} pts</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Phase Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-1">Design Phase Points</div>
            <div className="text-2xl font-bold text-purple-800">+{designPhasePoints}</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm font-medium text-orange-700 mb-1">Construction Phase Points</div>
            <div className="text-2xl font-bold text-orange-800">+{constructionPhasePoints}</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-slate-900">{improvements.length}</div>
            <div className="text-sm text-slate-500">Total Improvements</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
            <div className="text-sm text-slate-500">High Priority</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">+{totalPotentialPoints}</div>
            <div className="text-sm text-slate-500">LEED Points</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(totalPotentialPoints / improvements.length)}
            </div>
            <div className="text-sm text-slate-500">Avg Points/Item</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-slate-500 self-center mr-2">Phase:</span>
          <Button
            variant={phaseFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhaseFilter('all')}
            className={phaseFilter === 'all' ? 'bg-[#1a5d3c]' : ''}
          >
            All
          </Button>
          <Button
            variant={phaseFilter === 'Design' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhaseFilter('Design')}
            className={phaseFilter === 'Design' ? 'bg-purple-600' : ''}
          >
            <Ruler className="w-3 h-3 mr-1" />
            Design
          </Button>
          <Button
            variant={phaseFilter === 'Construction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhaseFilter('Construction')}
            className={phaseFilter === 'Construction' ? 'bg-orange-600' : ''}
          >
            <HardHat className="w-3 h-3 mr-1" />
            Construction
          </Button>
        </div>

        {/* Sort Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-slate-500 self-center mr-2">Sort by:</span>
          <Button
            variant={sortBy === 'priority' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('priority')}
            className={sortBy === 'priority' ? 'bg-[#1a5d3c]' : ''}
          >
            Priority
          </Button>
          <Button
            variant={sortBy === 'points' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('points')}
            className={sortBy === 'points' ? 'bg-[#1a5d3c]' : ''}
          >
            LEED Points
          </Button>
          <Button
            variant={sortBy === 'cost' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('cost')}
            className={sortBy === 'cost' ? 'bg-[#1a5d3c]' : ''}
          >
            Cost
          </Button>
        </div>

        {/* Improvements List */}
        <div className="space-y-4">
          {sortedImprovements.map((improvement, index) => (
            <ImprovementCard 
              key={improvement.id} 
              improvement={improvement} 
              index={index}
            />
          ))}
        </div>

        {sortedImprovements.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No improvements match the selected filter.
          </div>
        )}

        {/* Implementation Roadmap */}
        <div className="mt-8 p-6 bg-gradient-to-r from-[#0f172a] to-[#1a5d3c] rounded-xl text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#d4af37]" />
            Implementation Roadmap
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Phase 1: Quick Wins (Low Cost)</span>
                <span className="text-[#d4af37]">
                  +{improvements.filter(i => i.estimatedCost.includes('Low')).reduce((s, i) => s + i.leedPointsIncrease, 0)} pts
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Phase 2: Medium Investment</span>
                <span className="text-[#d4af37]">
                  +{improvements.filter(i => i.estimatedCost.includes('Medium') || i.estimatedCost.includes('medium')).reduce((s, i) => s + i.leedPointsIncrease, 0)} pts
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Phase 3: Major Investment</span>
                <span className="text-[#d4af37]">
                  +{improvements.filter(i => i.estimatedCost.includes('High')).reduce((s, i) => s + i.leedPointsIncrease, 0)} pts
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
