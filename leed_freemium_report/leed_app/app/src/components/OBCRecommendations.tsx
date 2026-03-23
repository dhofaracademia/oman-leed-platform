import { useState } from 'react';
import { 
  ChevronDown, 
  Clock,
  TrendingUp,
  DollarSign,
  Sun,
  Wind,
  Droplets,
  Layers,
  Home,
  Cpu,
  MapPin,
  BookOpen,
  Award,
  HardHat,
  Ruler
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OBCRecommendation } from '@/types';

interface OBCRecommendationsProps {
  recommendations: OBCRecommendation[];
}

const categoryIcons: Record<string, React.ElementType> = {
  'Orientation & Solar Design': Sun,
  'Building Envelope': Home,
  'Renewable Energy': Sun,
  'Water Conservation': Droplets,
  'Sustainable Materials': Layers,
  'Indoor Environmental Quality': Wind,
  'Building Performance': Cpu,
  'Sustainable Sites': MapPin,
  'Location & Transportation': MapPin,
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

const getPhaseIcon = (phase: string) => {
  switch (phase) {
    case 'Design':
      return Ruler;
    case 'Construction':
      return HardHat;
    case 'Design & Construction':
      return HardHat;
    default:
      return Clock;
  }
};

const getCostColor = (cost: string) => {
  switch (cost) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
};

function RecommendationItem({ recommendation }: { recommendation: OBCRecommendation }) {
  const [isOpen, setIsOpen] = useState(false);
  const CategoryIcon = categoryIcons[recommendation.category] || BookOpen;
  const PhaseIcon = getPhaseIcon(recommendation.implementationPhase);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-[#1a5d3c]/10 flex items-center justify-center flex-shrink-0">
          <CategoryIcon className="w-5 h-5 text-[#1a5d3c]" />
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{recommendation.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
              {recommendation.priority} priority
            </Badge>
            <Badge variant="outline" className={getPhaseColor(recommendation.implementationPhase)}>
              <PhaseIcon className="w-3 h-3 mr-1" />
              {recommendation.implementationPhase}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-[#d4af37]" />
              <span className="font-semibold text-[#d4af37]">+{recommendation.potentialScoreIncrease}</span>
              <span className="text-slate-500">LEED pts</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${getCostColor(recommendation.implementationCost)}`}>
              <DollarSign className="w-3 h-3" />
              {recommendation.implementationCost} cost
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-1">Description</h4>
              <p className="text-slate-600">{recommendation.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
                <BookOpen className="w-4 h-4 text-[#1a5d3c]" />
                <div>
                  <div className="text-xs text-slate-500">OBC Reference</div>
                  <div className="text-sm font-medium text-slate-900">{recommendation.obcReference}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
                <Award className="w-4 h-4 text-[#d4af37]" />
                <div>
                  <div className="text-xs text-slate-500">LEED Reference</div>
                  <div className="text-sm font-medium text-slate-900">{recommendation.leedReference}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:hidden">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">LEED Points</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-semibold text-[#d4af37]">+{recommendation.potentialScoreIncrease}</span>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Implementation Cost</div>
                <div className={`flex items-center gap-1 ${getCostColor(recommendation.implementationCost)}`}>
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold capitalize">{recommendation.implementationCost}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OBCRecommendations({ recommendations }: OBCRecommendationsProps) {
  const [filter, setFilter] = useState<'all' | 'Design' | 'Construction' | 'Design & Construction'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredRecommendations = recommendations.filter(r => {
    const phaseMatch = filter === 'all' || r.implementationPhase === filter;
    const priorityMatch = priorityFilter === 'all' || r.priority === priorityFilter;
    return phaseMatch && priorityMatch;
  });

  const totalPotentialPoints = recommendations.reduce((sum, r) => sum + r.potentialScoreIncrease, 0);
  const designPoints = recommendations.filter(r => r.implementationPhase.includes('Design')).reduce((sum, r) => sum + r.potentialScoreIncrease, 0);
  const constructionPoints = recommendations.filter(r => r.implementationPhase.includes('Construction')).reduce((sum, r) => sum + r.potentialScoreIncrease, 0);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-[#1a5d3c]/10 to-[#d4af37]/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1a5d3c]" />
              Oman Building Code Recommendations
            </CardTitle>
            <p className="text-slate-600 mt-1">
              Based on Oman Energy Efficiency & Sustainability Code and LEED guidelines
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#1a5d3c]/20">
            <TrendingUp className="w-5 h-5 text-[#d4af37]" />
            <div>
              <div className="text-sm text-slate-500">Total Potential</div>
              <div className="text-xl font-bold text-[#d4af37]">+{totalPotentialPoints} LEED pts</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Phase Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Ruler className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Design Phase</span>
            </div>
            <div className="text-2xl font-bold text-purple-800">+{designPoints} pts</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <HardHat className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Construction Phase</span>
            </div>
            <div className="text-2xl font-bold text-orange-800">+{constructionPoints} pts</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-slate-500 self-center mr-2">Phase:</span>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#1a5d3c]' : ''}
          >
            All
          </Button>
          <Button
            variant={filter === 'Design' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Design')}
            className={filter === 'Design' ? 'bg-purple-600' : ''}
          >
            <Ruler className="w-3 h-3 mr-1" />
            Design
          </Button>
          <Button
            variant={filter === 'Construction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Construction')}
            className={filter === 'Construction' ? 'bg-orange-600' : ''}
          >
            <HardHat className="w-3 h-3 mr-1" />
            Construction
          </Button>
          <Button
            variant={filter === 'Design & Construction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Design & Construction')}
            className={filter === 'Design & Construction' ? 'bg-indigo-600' : ''}
          >
            Both
          </Button>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-slate-500 self-center mr-2">Priority:</span>
          <Button
            variant={priorityFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriorityFilter('all')}
            className={priorityFilter === 'all' ? 'bg-[#1a5d3c]' : ''}
          >
            All
          </Button>
          <Button
            variant={priorityFilter === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriorityFilter('high')}
            className={priorityFilter === 'high' ? 'bg-red-600' : ''}
          >
            High
          </Button>
          <Button
            variant={priorityFilter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriorityFilter('medium')}
            className={priorityFilter === 'medium' ? 'bg-yellow-600' : ''}
          >
            Medium
          </Button>
          <Button
            variant={priorityFilter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriorityFilter('low')}
            className={priorityFilter === 'low' ? 'bg-blue-600' : ''}
          >
            Low
          </Button>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationItem 
              key={recommendation.id} 
              recommendation={recommendation} 
            />
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No recommendations match the selected filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
