import { useState, useEffect } from 'react';
import type { AnalysisResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, BarChart3, MapPin, Plus, X, Check, AlertTriangle } from 'lucide-react';
import { loadPortfolio, saveProject, deleteProject, clearPortfolio, compareProjects } from '@/hooks/usePortfolio';
import type { SavedProject, ComparisonField } from '@/hooks/usePortfolio';

interface PortfolioManagerProps {
  analysis: AnalysisResult | null;
  projectType: string;
  projectGFA: string;
  projectFloors: string;
}

function getLEEDLabel(score: number): string {
  if (score >= 80) return 'بلاتيني';
  if (score >= 60) return 'ذهبي';
  if (score >= 50) return 'فضي';
  if (score >= 40) return 'معتمد';
  return 'أقل من الحد';
}

function ComparisonTable({ fields, projects }: { fields: ComparisonField[]; projects: SavedProject[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#1a5d3c] text-white">
            <th className="p-2 text-right font-semibold sticky right-0 bg-[#1a5d3c] min-w-[120px]">المعيار</th>
            {projects.map(function(p) {
              return <th key={p.id} className="p-2 text-center font-semibold min-w-[100px]">{p.name}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {fields.map(function(f, fi) {
            return (
              <tr key={fi} className={fi % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                <td className="p-2 font-semibold text-slate-700 sticky right-0" style={{ background: fi % 2 === 0 ? '#f8fafc' : 'white' }}>
                  <div>{f.labelAr}</div>
                  {f.unit && <div className="text-xs text-slate-400 font-normal">{f.unit}</div>}
                </td>
                {f.values.map(function(v, vi) {
                  var isBest = f.best === vi;
                  return (
                    <td key={vi} className={'p-2 text-center ' + (isBest ? 'font-black text-[#1a5d3c]' : 'text-slate-600')}>
                      <div className="flex items-center justify-center gap-1">
                        {isBest && <span className="text-green-500 text-xs">★</span>}
                        <span>{typeof v === 'number' ? v.toLocaleString() : v}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PortfolioManager({ analysis, projectType, projectGFA, projectFloors }: PortfolioManagerProps) {
  var _projects = useState<SavedProject[]>([]); var projects = _projects[0], setProjects = _projects[1];
  var _name = useState(''); var projectName = _name[0], setProjectName = _name[1];
  var _saved = useState(false); var justSaved = _saved[0], setJustSaved = _saved[1];
  var _compare = useState<string[]>([]); var compareIds = _compare[0], setCompareIds = _compare[1];
  var _showCompare = useState(false); var showCompare = _showCompare[0], setShowCompare = _showCompare[1];

  useEffect(function() {
    setProjects(loadPortfolio());
  }, []);

  var handleSave = function() {
    if (!analysis || !projectName.trim()) return;
    saveProject(analysis, projectName.trim(), projectType, parseFloat(projectGFA) || 500, parseFloat(projectFloors) || 2);
    setProjects(loadPortfolio());
    setProjectName('');
    setJustSaved(true);
    setTimeout(function() { setJustSaved(false); }, 2000);
  };

  var handleDelete = function(id: string) {
    deleteProject(id);
    setProjects(loadPortfolio());
    setCompareIds(compareIds.filter(function(cid) { return cid !== id; }));
  };

  var handleClearAll = function() {
    if (confirm('هل أنت متأكد من حذف جميع المشاريع المحفوظة؟')) {
      clearPortfolio();
      setProjects([]);
      setCompareIds([]);
    }
  };

  var toggleCompare = function(id: string) {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(function(cid) { return cid !== id; }));
    } else if (compareIds.length < 4) {
      setCompareIds([].concat(compareIds as string[], [id]));
    }
  };

  var comparedProjects = projects.filter(function(p) { return compareIds.includes(p.id); });
  var comparisonFields = comparedProjects.length >= 2 ? compareProjects(comparedProjects) : [];

  return (
    <div className="space-y-4" dir="rtl">

      {/* Save current analysis */}
      {analysis && (
        <Card className="border-[#1a5d3c]/30 bg-[#1a5d3c]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Save className="w-4 h-4 text-[#1a5d3c]" />
              حفظ التحليل الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={projectName}
                onChange={function(e) { setProjectName(e.target.value); }}
                placeholder="اسم المشروع (مثال: أرض صلالة — البليد)"
                className="flex-1"
                onKeyDown={function(e) { if (e.key === 'Enter') handleSave(); }}
              />
              <Button
                onClick={handleSave}
                disabled={!projectName.trim()}
                className={justSaved ? 'bg-green-600' : 'bg-[#1a5d3c] hover:bg-[#143d29]'}
              >
                {justSaved ? <><Check className="w-4 h-4 ml-1" />تم الحفظ</> : <><Plus className="w-4 h-4 ml-1" />حفظ</>}
              </Button>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {analysis.location.lat.toFixed(4)}N, {analysis.location.lng.toFixed(4)}E · LEED: {analysis.landAssessment.maxPossibleScore}/110 · {projectType}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved projects list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">المشاريع المحفوظة ({projects.length})</CardTitle>
            <div className="flex gap-2">
              {compareIds.length >= 2 && (
                <Button size="sm" onClick={function() { setShowCompare(!showCompare); }} className="gap-1 bg-[#d4af37] hover:bg-[#b8960e] text-xs">
                  <BarChart3 className="w-3 h-3" />{showCompare ? 'إخفاء المقارنة' : 'قارن ' + compareIds.length + ' مشاريع'}
                </Button>
              )}
              {projects.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleClearAll} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-3 h-3 ml-1" />حذف الكل
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Save className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <div className="text-sm">لا توجد مشاريع محفوظة بعد</div>
              <div className="text-xs mt-1">شغّل التحليل واحفظ المشروع لتتمكن من المقارنة لاحقاً</div>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(function(p) {
                var isSelected = compareIds.includes(p.id);
                var leedLabel = getLEEDLabel(p.leedMaxScore);
                return (
                  <div key={p.id} className={'p-3 rounded-lg border transition-all cursor-pointer ' + (isSelected ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-slate-200 hover:border-[#1a5d3c]/30')}
                    onClick={function() { toggleCompare(p.id); }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ' + (isSelected ? 'border-[#d4af37] bg-[#d4af37]' : 'border-slate-300')}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-slate-900">{p.name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className="text-xs bg-slate-100 text-slate-700"><MapPin className="w-3 h-3 ml-0.5" />{p.location.lat.toFixed(3)}, {p.location.lng.toFixed(3)}</Badge>
                            <Badge className="text-xs bg-[#1a5d3c]/10 text-[#1a5d3c]">LEED {p.leedMaxScore} ({leedLabel})</Badge>
                            <Badge className="text-xs bg-slate-100 text-slate-600">{p.projectType} · {p.gfa}m²</Badge>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">{new Date(p.savedAt).toLocaleDateString('ar-OM', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        </div>
                      </div>
                      <button onClick={function(e) { e.stopPropagation(); handleDelete(p.id); }} className="text-slate-300 hover:text-red-500 p-1 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {projects.length > 0 && compareIds.length < 2 && (
            <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="text-xs text-blue-700">اختر مشروعين على الأقل بالنقر عليهما للمقارنة (حد أقصى 4 مشاريع)</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison table */}
      {showCompare && comparisonFields.length > 0 && (
        <Card className="border-[#d4af37]/40">
          <CardHeader className="pb-2 bg-[#d4af37]/5">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#d4af37]" />
              مقارنة {comparedProjects.length} مشاريع — جنباً إلى جنب
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ComparisonTable fields={comparisonFields} projects={comparedProjects} />
          </CardContent>
        </Card>
      )}

      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
        المشاريع محفوظة في متصفحك (localStorage). مسح بيانات المتصفح سيحذف المشاريع. الحد الأقصى 20 مشروع.
      </div>
    </div>
  );
}
