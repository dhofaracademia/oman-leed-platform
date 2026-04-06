import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, Polyline, Tooltip, useMap } from 'react-leaflet';
import {
  MapPin, Crosshair, Search, Sun, Wind, Thermometer, Navigation,
  AlertTriangle, Loader2, Upload, FileText, X, CheckCircle2,
  Printer, Ruler, Info, Plus, Trash2, Layers, FileDown,
  FileSpreadsheet, Activity, Droplets, BarChart3, Calendar, Zap, Waves, Building2, Leaf as LeafIcon, Share2, Package, Globe2,
  LayoutDashboard, FileCheck, Leaf, WifiOff, Battery, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useClimateData } from '@/hooks/useClimateData';
import { useLEEDScoring, type SeasonalNote } from '@/hooks/useLEEDScoring';
import { generateOBCChecklist, type OBCChecklistResult } from '@/hooks/useOBCChecklist';
import type { Location, AnalysisResult } from '@/types';
import { LandAssessmentCard } from '@/components/LandAssessmentCard';
import { OBCRecommendations } from '@/components/OBCRecommendations';
import { FutureImprovements } from '@/components/FutureImprovements';
import { AIPanel } from '@/components/AIPanel';
import { ReportPage } from '@/components/ReportPage';
import { WindRoseChart } from '@/components/WindRoseChart';
import { ShadowStudy } from '@/components/ShadowStudy';
import { DataAccuracy, buildDataAccuracyItems } from '@/components/DataAccuracy';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { OBCChecklist } from '@/components/OBCChecklist';
import { LEEDRadarChart } from '@/components/LEEDRadarChart';
import { SeasonalCalendarView } from '@/components/SeasonalCalendarView';
import { parseKrookiText, utmToLatLng, calculateUtmArea, formatUtmCoordinates } from '@/utils/krookiParser';
import { calculateBEI, calculateSolarROI, calculateWaterDemand } from '@/hooks/useCalculators';
import type { BEIResult, SolarROIResult, WaterDemandResult } from '@/hooks/useCalculators';
import { BEICalculator } from '@/components/BEICalculator';
import { SolarROICalculator } from '@/components/SolarROICalculator';
import { WaterDemandCalculator } from '@/components/WaterDemandCalculator';
import { calculateOPAL } from '@/hooks/useOPAL';
import type { OPALResult } from '@/hooks/useOPAL';
import { calculateCost } from '@/hooks/useCostEstimator';
import type { CostResult } from '@/hooks/useCostEstimator';
import { calculateCarbon } from '@/hooks/useCarbonCalc';
import type { CarbonResult } from '@/hooks/useCarbonCalc';
import { OPALMapping } from '@/components/OPALMapping';
import { CostEstimatorView } from '@/components/CostEstimatorView';
import { CarbonESGView } from '@/components/CarbonESGView';
import { SharePanel } from '@/components/SharePanel';
import { MaterialsRecommender } from '@/components/MaterialsRecommender';
import { calculateBattery } from '@/hooks/useBatteryCalc';
import type { BatteryResult } from '@/hooks/useBatteryCalc';
import { BatteryStorageView } from '@/components/BatteryStorageView';
import { PortfolioManager } from '@/components/PortfolioManager';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

var DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const OMAN_BOUNDARY: [number, number][] = [
  [26.5,56.0],[26.5,56.5],[26.0,57.0],[25.5,58.0],[25.0,58.5],[24.5,59.0],[24.0,59.5],
  [23.5,60.0],[23.0,60.0],[22.0,59.5],[21.0,59.0],[20.0,58.5],[19.0,58.0],[18.0,57.0],
  [17.0,56.0],[16.5,55.0],[16.5,54.0],[17.0,53.5],[18.0,53.0],[19.0,52.5],[20.0,52.5],
  [21.0,53.0],[22.0,53.5],[23.0,54.0],[24.0,54.5],[25.0,55.0],[26.0,55.5],[26.5,56.0],
];

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: function(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  var map = useMap();
  useEffect(function() { if (lat && lng) { map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 }); } }, [lat, lng, map]);
  return null;
}

// ─── FIX: Updated accuracy disclaimer with correct sources ────────────────────
function AccuracyDisclaimer() {
  return (
    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Data Sources & Accuracy</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li><strong>Solar:</strong> PVGIS v5.2 (EU JRC) 2-5km resolution. Accuracy: ±4%. NASA POWER fallback if unavailable.</li>
            <li><strong>Wind & Climate:</strong> ERA5 via Open-Meteo, hourly reanalysis. Accuracy: ±3-5%.</li>
            <li><strong>Soil:</strong> OpenLandMap (250m) + 10-zone Oman calibration. Accuracy: ±15%. Field survey recommended.</li>
            <li><strong>Seismic:</strong> USGS Earthquake Hazards API, 500km radius, M3+. Regional estimate.</li>
            <li><strong>Elevation:</strong> Open-Meteo SRTM, 30m resolution. Accuracy: ±5m.</li>
            <li><strong>LEED Assessment:</strong> Based on pre-design site data. Professional certification requires full design review.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PrintReportButton({ analysisResult, krookiMetadata }: {
  analysisResult: AnalysisResult;
  krookiMetadata: { planNumber?: string; wilayat?: string; area?: number } | null;
}) {
  var handlePrint = function() {
    var printWindow = window.open('', '_blank');
    if (!printWindow) return;
    var date = new Date().toLocaleDateString('en-OM', { year: 'numeric', month: 'long', day: 'numeric' });
    var html = '<!DOCTYPE html><html><head><title>OmanSustain Report</title><style>' +
      '@page{size:A4;margin:20mm}body{font-family:Arial,sans-serif;line-height:1.6;color:#333}' +
      '.header{text-align:center;border-bottom:3px solid #1a5d3c;padding-bottom:20px;margin-bottom:30px}' +
      '.header h1{color:#1a5d3c;margin:0;font-size:28px}.section{margin-bottom:25px}' +
      '.section h2{color:#1a5d3c;border-bottom:2px solid #d4af37;padding-bottom:8px;font-size:18px}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.card{background:#f8fafc;padding:15px;border-radius:8px;border:1px solid #e2e8f0}' +
      '.card h3{margin:0 0 10px 0;font-size:14px;color:#64748b}.card .value{font-size:22px;font-weight:bold;color:#1a5d3c}' +
      '.rec{background:#f8fafc;padding:12px;margin-bottom:8px;border-radius:6px;border-left:4px solid #1a5d3c}' +
      '.accuracy-note{background:#fffbeb;border:1px solid #fcd34d;padding:15px;border-radius:8px;margin-top:20px;font-size:12px}' +
      '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8}' +
      '</style></head><body>' +
      '<div class="header"><h1>OmanSustain Land Sustainability Report</h1><p>LEED v4.1 Pre-Design Site Assessment</p><p>Date: ' + date + '</p>' +
      (krookiMetadata && krookiMetadata.planNumber ? '<p>Plan: ' + krookiMetadata.planNumber + '</p>' : '') +
      (krookiMetadata && krookiMetadata.wilayat ? '<p>Wilayat: ' + krookiMetadata.wilayat + '</p>' : '') +
      '</div><div class="section"><h2>Location</h2><div class="grid">' +
      '<div class="card"><h3>Coordinates (WGS84)</h3><div class="value">' + analysisResult.location.lat.toFixed(6) + ', ' + analysisResult.location.lng.toFixed(6) + '</div></div>' +
      '<div class="card"><h3>Climate Zone</h3><div class="value" style="font-size:14px">' + analysisResult.climate.climateZone + '</div></div>' +
      '</div></div><div class="section"><h2>LEED Score</h2><div class="grid">' +
      '<div class="card"><h3>Current Score</h3><div class="value">' + analysisResult.landAssessment.currentScore + '/110</div></div>' +
      '<div class="card"><h3>Max Achievable</h3><div class="value">' + analysisResult.landAssessment.maxPossibleScore + '/110</div></div>' +
      '</div></div><div class="section"><h2>Climate (ERA5 via Open-Meteo)</h2><div class="grid">' +
      '<div class="card"><h3>Avg Temperature</h3><div class="value">' + analysisResult.climate.avgTemperature + 'C</div></div>' +
      '<div class="card"><h3>CDD</h3><div class="value">' + analysisResult.climate.cdd + '</div></div>' +
      '<div class="card"><h3>Rainfall</h3><div class="value">' + analysisResult.climate.rainfall + ' mm</div></div>' +
      '<div class="card"><h3>Overheating hrs</h3><div class="value">' + analysisResult.climate.overheatingHours + '/yr</div></div>' +
      '</div></div><div class="section"><h2>Solar (PVGIS v5.2 EU JRC - +-4%)</h2><div class="grid">' +
      '<div class="card"><h3>Yearly GHI</h3><div class="value">' + analysisResult.solar.yearlyGHI + ' kWh/m2</div></div>' +
      '<div class="card"><h3>PV Yield Potential</h3><div class="value">' + analysisResult.solar.pvProductionPotential + ' kWh/kWp</div></div>' +
      '<div class="card"><h3>Optimal Tilt</h3><div class="value">' + analysisResult.solar.optimalTilt + 'deg</div></div>' +
      '<div class="card"><h3>Dust Loss</h3><div class="value">' + analysisResult.solar.dustImpactValue + '%</div></div>' +
      '</div></div><div class="section"><h2>Wind (ERA5 hourly - +-5%)</h2><div class="grid">' +
      '<div class="card"><h3>Average Speed</h3><div class="value">' + analysisResult.wind.averageSpeed + ' m/s</div></div>' +
      '<div class="card"><h3>Ventilation Score</h3><div class="value">' + analysisResult.wind.ventilationScore + '/100</div></div>' +
      '</div></div><div class="section"><h2>OEESC Envelope Requirements (per CDD ' + analysisResult.climate.cdd + ')</h2><div class="grid">' +
      '<div class="card"><h3>Wall U-value max</h3><div class="value">' + analysisResult.climate.recommendedUValues.wall + ' W/m2K</div></div>' +
      '<div class="card"><h3>Roof U-value max</h3><div class="value">' + analysisResult.climate.recommendedUValues.roof + ' W/m2K</div></div>' +
      '<div class="card"><h3>Glazing U-value max</h3><div class="value">' + analysisResult.climate.recommendedUValues.glazing + ' W/m2K</div></div>' +
      '<div class="card"><h3>Floor U-value max</h3><div class="value">' + analysisResult.climate.recommendedUValues.floor + ' W/m2K</div></div>' +
      '</div></div><div class="section"><h2>Seismic (USGS)</h2>' +
      '<div class="card"><h3>Zone</h3><div class="value" style="font-size:16px">' + analysisResult.seismic.zone + ' (PGA ' + analysisResult.seismic.pga + 'g)</div>' +
      '<p style="font-size:12px;color:#64748b;margin-top:8px">' + analysisResult.seismic.structuralRecommendation + '</p></div>' +
      '</div><div class="section"><h2>Soil (OpenLandMap + Oman zones)</h2><div class="grid">' +
      '<div class="card"><h3>Soil Type</h3><div class="value" style="font-size:14px">' + analysisResult.soil.type + '</div></div>' +
      '<div class="card"><h3>Foundation</h3><div class="value" style="font-size:16px">' + analysisResult.soil.recommendedFoundation + '</div></div>' +
      '<div class="card"><h3>Bearing Capacity</h3><div class="value">' + analysisResult.soil.bearingRange.min + '-' + analysisResult.soil.bearingRange.max + ' kPa</div></div>' +
      '<div class="card"><h3>Risks</h3><div class="value" style="font-size:12px">Sabkha: ' + (analysisResult.soil.sabkhaRisk ? 'YES' : 'No') + ' | Corrosion: ' + analysisResult.soil.corrosionRisk + '</div></div>' +
      '</div></div><div class="section"><h2>Top Recommendations</h2>' +
      analysisResult.obcRecommendations.slice(0, 6).map(function(r) {
        return '<div class="rec"><strong>' + r.title + '</strong> <span style="color:#d4af37">(+' + r.potentialScoreIncrease + ' pts)</span>' +
          '<p style="font-size:12px;margin:4px 0">' + r.description + '</p>' +
          '<p style="font-size:11px;color:#64748b">Priority: ' + r.priority + ' | Cost: ' + r.implementationCost + ' | ' + (r.oeescReference || r.obcReference) + '</p></div>';
      }).join('') +
      '</div><div class="accuracy-note"><h4>Data Sources</h4><ul>' +
      '<li>Solar: PVGIS v5.2 (EU JRC) +-4% accuracy</li>' +
      '<li>Wind & Climate: ERA5 via Open-Meteo hourly +-3-5%</li>' +
      '<li>Soil: OpenLandMap + Oman regional calibration +-15%</li>' +
      '<li>Seismic: USGS Earthquake Hazards API (regional)</li>' +
      '</ul></div>' +
      '<div class="footer"><p>Generated by OmanSustain.om — LEED v4.1 Land Assessment Platform</p>' +
      '<p>Report ID: ' + Date.now().toString(36).toUpperCase() + ' | Dr. Tariq Al Amri</p></div>' +
      '<div style="text-align:center;margin-top:30px"><button onclick="window.print()" style="padding:12px 24px;background:#1a5d3c;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px">Print Report</button></div>' +
      '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
  };
  return (
    <Button onClick={handlePrint} variant="outline" className="gap-2">
      <Printer className="w-4 h-4" />
      Print Report
    </Button>
  );
}

function ManualPolygonInput({ onPolygonComplete }: { onPolygonComplete: (coords: { northing: number; easting: number }[], polygon: [number, number][]) => void }) {
  var _pts = useState<{ northing: string; easting: string }[]>([{ northing: '', easting: '' }, { northing: '', easting: '' }, { northing: '', easting: '' }, { northing: '', easting: '' }]);
  var points = _pts[0], setPoints = _pts[1];
  var updatePoint = function(index: number, field: 'northing' | 'easting', value: string) { var p = [...points]; p[index][field] = value; setPoints(p); };
  var addPoint    = function() { setPoints([...points, { northing: '', easting: '' }]); };
  var removePoint = function(index: number) { if (points.length > 3) setPoints(points.filter(function(_, i) { return i !== index; })); };
  var handleSubmit = function() {
    var valid = points.filter(function(p) { return p.northing && p.easting; }).map(function(p) { return { northing: parseFloat(p.northing), easting: parseFloat(p.easting) }; });
    if (valid.length < 3) { alert('Please enter at least 3 valid coordinate points'); return; }
    var polygon: [number, number][] = valid.map(function(p) { var ll = utmToLatLng(p.northing, p.easting); return [ll.lat, ll.lng]; });
    onPolygonComplete(valid, polygon);
  };
  var calculatedArea = (function() {
    var valid = points.filter(function(p) { return p.northing && p.easting; }).map(function(p) { return { northing: parseFloat(p.northing), easting: parseFloat(p.easting) }; });
    return valid.length < 3 ? 0 : calculateUtmArea(valid);
  })();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Enter UTM coordinates (min 3 points)</p>
        <Button onClick={addPoint} variant="outline" size="sm" className="gap-1"><Plus className="w-3 h-3" />Add</Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {points.map(function(point, index) {
          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-6">{index + 1}</span>
              <Input type="number" placeholder="NORTHING" value={point.northing} onChange={function(e) { updatePoint(index, 'northing', e.target.value); }} className="flex-1 text-sm" />
              <Input type="number" placeholder="EASTING" value={point.easting} onChange={function(e) { updatePoint(index, 'easting', e.target.value); }} className="flex-1 text-sm" />
              {points.length > 3 && <button onClick={function() { removePoint(index); }} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>}
            </div>
          );
        })}
      </div>
      {calculatedArea > 0 && (
        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20 text-sm flex items-center gap-2">
          <Ruler className="w-4 h-4 text-[#1a5d3c]" />
          <span className="text-slate-600">Area:</span>
          <span className="font-semibold text-[#1a5d3c]">{calculatedArea.toLocaleString()} m² ({(calculatedArea / 10000).toFixed(2)} ha)</span>
        </div>
      )}
      <Button onClick={handleSubmit} className="w-full bg-[#1a5d3c] hover:bg-[#143d29]">
        <CheckCircle2 className="w-4 h-4 mr-2" />Draw Land Polygon
      </Button>
    </div>
  );
}

function KrookiUploader({ onCoordinatesDetected, onPolygonDetected }: { onCoordinatesDetected: (lat: number, lng: number, meta?: { planNumber?: string; wilayat?: string; area?: number }) => void; onPolygonDetected?: (polygon: [number, number][], area: number) => void; }) {
  var _drag = useState(false); var isDragging = _drag[0], setIsDragging = _drag[1];
  var _file = useState<File | null>(null); var uploadedFile = _file[0], setUploadedFile = _file[1];
  var _proc = useState(false); var isProcessing = _proc[0], setIsProcessing = _proc[1];
  var _text = useState(''); var extractedText = _text[0], setExtractedText = _text[1];
  var _manIn = useState(false); var showManualInput = _manIn[0], setShowManualInput = _manIn[1];
  var _polyIn = useState(false); var showPolygonInput = _polyIn[0], setShowPolygonInput = _polyIn[1];
  var _mN = useState(''); var manualNorthing = _mN[0], setManualNorthing = _mN[1];
  var _mE = useState(''); var manualEasting = _mE[0], setManualEasting = _mE[1];
  var fileInputRef = useRef<HTMLInputElement>(null);
  var handleFile = function(file: File) {
    if (!file.type.startsWith('image/')) { alert('Please upload an image file (JPG, PNG)'); return; }
    setUploadedFile(file); setIsProcessing(true);
    setTimeout(function() { setIsProcessing(false); setShowManualInput(true); }, 1000);
  };
  var handleManualSubmit = function() {
    var n = parseFloat(manualNorthing), e = parseFloat(manualEasting);
    if (isNaN(n) || isNaN(e)) { alert('Please enter valid UTM coordinates'); return; }
    var ll = utmToLatLng(n, e);
    onCoordinatesDetected(ll.lat, ll.lng, { planNumber: 'Manual Entry', wilayat: 'Unknown', area: 0 });
  };
  var handleTextExtract = function() {
    if (!extractedText.trim()) return;
    var krookiData = parseKrookiText(extractedText);
    if (krookiData) {
      onCoordinatesDetected(krookiData.centerPoint.lat, krookiData.centerPoint.lng, { planNumber: krookiData.planNumber, wilayat: krookiData.wilayat, area: krookiData.area });
      if (onPolygonDetected && krookiData.polygon.length >= 3) onPolygonDetected(krookiData.polygon, krookiData.area);
    } else { alert('Could not parse coordinates. Please check format or enter manually.'); }
  };
  var handlePolygonComplete = function(coords: { northing: number; easting: number }[], polygon: [number, number][]) {
    var area = calculateUtmArea(coords);
    if (onPolygonDetected) onPolygonDetected(polygon, area);
    var avgN = coords.reduce(function(s, c) { return s + c.northing; }, 0) / coords.length;
    var avgE = coords.reduce(function(s, c) { return s + c.easting; }, 0) / coords.length;
    var ll = utmToLatLng(avgN, avgE);
    onCoordinatesDetected(ll.lat, ll.lng, { planNumber: 'Manual Polygon', wilayat: 'Unknown', area });
    setShowPolygonInput(false);
  };
  return (
    <div className="space-y-4">
      <div onDragOver={function(e) { e.preventDefault(); setIsDragging(true); }} onDragLeave={function() { setIsDragging(false); }} onDrop={function(e) { e.preventDefault(); setIsDragging(false); var f = e.dataTransfer.files; if (f.length > 0) handleFile(f[0]); }} onClick={function() { fileInputRef.current?.click(); }} className={'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ' + (isDragging ? 'border-[#1a5d3c] bg-[#1a5d3c]/5' : 'border-slate-300 hover:border-[#1a5d3c]/50 hover:bg-slate-50')}>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={function(e) { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); }} />
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Upload Krooki / Plan Image</p>
        <p className="text-xs text-slate-500 mt-1">Drag & drop or click — JPG, PNG</p>
      </div>
      {isProcessing && <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-lg"><Loader2 className="w-5 h-5 animate-spin text-[#1a5d3c]" /><span className="text-sm text-slate-600">Processing...</span></div>}
      {uploadedFile && !isProcessing && (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <FileText className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800 flex-1 truncate">{uploadedFile.name}</span>
          <button onClick={function(e) { e.stopPropagation(); setUploadedFile(null); setShowManualInput(false); }} className="text-green-600 hover:text-green-800"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant={showManualInput && !showPolygonInput ? 'default' : 'outline'} size="sm" onClick={function() { setShowManualInput(true); setShowPolygonInput(false); }} className={showManualInput && !showPolygonInput ? 'bg-[#1a5d3c]' : ''}>Single Point</Button>
        <Button variant={showPolygonInput ? 'default' : 'outline'} size="sm" onClick={function() { setShowPolygonInput(true); setShowManualInput(false); }} className={showPolygonInput ? 'bg-[#1a5d3c]' : ''}><Ruler className="w-3 h-3 mr-1" />Polygon</Button>
      </div>
      {showManualInput && !showPolygonInput && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <p className="text-sm font-medium text-slate-700">Enter UTM Coordinates (Zone 40N)</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-slate-500">NORTHING</Label><Input type="number" placeholder="e.g. 1880419" value={manualNorthing} onChange={function(e) { setManualNorthing(e.target.value); }} className="mt-1" /></div>
            <div><Label className="text-xs text-slate-500">EASTING</Label><Input type="number" placeholder="e.g. 255925" value={manualEasting} onChange={function(e) { setManualEasting(e.target.value); }} className="mt-1" /></div>
          </div>
          <Button onClick={handleManualSubmit} className="w-full bg-[#1a5d3c] hover:bg-[#143d29]"><CheckCircle2 className="w-4 h-4 mr-2" />Apply Coordinates</Button>
        </div>
      )}
      {showPolygonInput && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <ManualPolygonInput onPolygonComplete={handlePolygonComplete} />
        </div>
      )}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
        <p className="text-sm font-medium text-slate-700">Or paste extracted text</p>
        <textarea value={extractedText} onChange={function(e) { setExtractedText(e.target.value); }} placeholder="Paste krooki text here... (UTM GRID, NORTHING, EASTING)" className="w-full h-24 p-3 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-[#1a5d3c]/20 focus:border-[#1a5d3c]" />
        <Button onClick={handleTextExtract} disabled={!extractedText.trim()} variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2" />Extract from Text</Button>
      </div>
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  var color = level === 'high' ? 'bg-red-100 text-red-800' : level === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
  return <Badge className={color + ' capitalize'}>{level}</Badge>;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function AnalysisDashboard() {
  var _loc = useState<Location>({ lat: 23.5859, lng: 58.4059 }); var location = _loc[0], setLocation = _loc[1];
  var _ilat = useState('23.5859'); var inputLat = _ilat[0], setInputLat = _ilat[1];
  var _ilng = useState('58.4059'); var inputLng = _ilng[0], setInputLng = _ilng[1];
  var _ar = useState<AnalysisResult | null>(null); var analysisResult = _ar[0], setAnalysisResult = _ar[1];
  var _sr = useState(false); var showReport = _sr[0], setShowReport = _sr[1];
  var _at = useState('summary'); var activeTab = _at[0], setActiveTab = _at[1];
  var _obc = useState<OBCChecklistResult | null>(null); var obcChecklist = _obc[0], setObcChecklist = _obc[1];
  var _cal = useState<SeasonalNote[]>([]); var seasonalCalendar = _cal[0], setSeasonalCalendar = _cal[1];
  var _toasts = useState<{ id: number; msg: string; type: 'error' | 'warn' | 'ok' }[]>([]); var toasts = _toasts[0], setToasts = _toasts[1];

  var _bei  = useState<BEIResult | null>(null);  var beiResult  = _bei[0],  setBeiResult  = _bei[1];
  var _roi  = useState<SolarROIResult | null>(null); var roiResult  = _roi[0],  setRoiResult  = _roi[1];
  var _wat  = useState<WaterDemandResult | null>(null); var waterResult = _wat[0], setWaterResult = _wat[1];
  var _opal   = useState<OPALResult | null>(null);  var opalResult   = _opal[0],   setOpalResult   = _opal[1];
  var _cost   = useState<CostResult | null>(null);   var costResult   = _cost[0],   setCostResult   = _cost[1];
  var _carbon = useState<CarbonResult | null>(null); var carbonResult = _carbon[0], setCarbonResult = _carbon[1];
  var _battery = useState<BatteryResult | null>(null); var batteryResult = _battery[0], setBatteryResult = _battery[1];
  var _wadi = useState(false); var showWadi = _wadi[0], setShowWadi = _wadi[1];
  var _wadiLines = useState<[number, number][][]>([]); var wadiLines = _wadiLines[0], setWadiLines = _wadiLines[1];

  var addToast = function(msg: string, type: 'error' | 'warn' | 'ok') {
    var id = Date.now();
    setToasts(function(prev) { return [...prev, { id, msg, type }]; });
    setTimeout(function() { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }, 5000);
  };
  var _km = useState<{ planNumber?: string; wilayat?: string; area?: number } | null>(null); var krookiMetadata = _km[0], setKrookiMetadata = _km[1];
  var _lp = useState<[number, number][] | null>(null); var landPolygon = _lp[0], setLandPolygon = _lp[1];
  var _pa = useState(0); var polygonArea = _pa[0], setPolygonArea = _pa[1];
  var _ml = useState<'street' | 'satellite'>('street'); var mapLayer = _ml[0], setMapLayer = _ml[1];
  var _sq = useState(''); var searchQuery = _sq[0], setSearchQuery = _sq[1];
  var _is = useState(false); var isSearching = _is[0], setIsSearching = _is[1];
  var _pt = useState('residential'); var projectType = _pt[0], setProjectType = _pt[1];
  var _gfa = useState('500'); var projectGFA = _gfa[0], setProjectGFA = _gfa[1];
  var _fl = useState('2'); var projectFloors = _fl[0], setProjectFloors = _fl[1];
  var reportRef = useRef<HTMLDivElement>(null);

  var { loading, error, fetchAllData } = useClimateData();
  var { calculateAssessment, generateOBCRecommendations, generateFutureImprovements } = useLEEDScoring();

  var handleMapClick = useCallback(function(lat: number, lng: number) {
    setLocation({ lat, lng }); setInputLat(lat.toFixed(6)); setInputLng(lng.toFixed(6)); setKrookiMetadata(null);
  }, []);

  var handleKrookiCoordinates = function(lat: number, lng: number, meta?: { planNumber?: string; wilayat?: string; area?: number }) {
    setLocation({ lat, lng }); setInputLat(lat.toFixed(6)); setInputLng(lng.toFixed(6));
    if (meta) setKrookiMetadata(meta);
  };

  var handleAnalyze = async function() {
    try {
      var roofArea = Math.round(parseFloat(projectGFA || '500') / parseFloat(projectFloors || '2'));
      var climateData = await fetchAllData(location, roofArea);
      if (!climateData) { addToast('Analysis failed — check your connection and try again.', 'error'); return; }

      var solar   = climateData.solar;
      var wind    = climateData.wind;
      var climate = climateData.climate;

      // Warn on fallback sources
      if (solar.dataSource && solar.dataSource.includes('fallback'))    addToast('Solar: PVGIS unavailable — using NASA POWER fallback (±12%).', 'warn');
      if (wind.dataSource && wind.dataSource.includes('fallback'))      addToast('Wind: ERA5 unavailable — using Oman average fallback.', 'warn');
      if (climate.dataSource && climate.dataSource.includes('fallback')) addToast('Climate: ERA5 unavailable — using regional average.', 'warn');

      var inp = { location, solar: climateData.solar, wind: climateData.wind, climate: climateData.climate, rainfall: climateData.rainfall, soil: climateData.soil, seismic: climateData.seismic };
      var landAssessment = calculateAssessment(inp);
      var obcRecommendations = generateOBCRecommendations(inp, landAssessment.categoryDetails);
      var futureImprovements = generateFutureImprovements(inp);
      var checklist = generateOBCChecklist({ location, solar: climateData.solar, wind: climateData.wind, climate: climateData.climate, rainfall: climateData.rainfall, soil: climateData.soil, seismic: climateData.seismic, landAssessment, obcRecommendations, futureImprovements, benchmarks: landAssessment.benchmarks, analysisDate: new Date().toISOString() });

      setObcChecklist(checklist);
      setSeasonalCalendar(landAssessment.seasonalCalendar);

      if (checklist.criticalCount > 0) {
        addToast(checklist.criticalCount + ' critical OBC compliance issues detected — see OBC Checklist tab.', 'error');
      }

      var gfaNum = parseFloat(projectGFA || '500') || 500;
      var flrNum = parseFloat(projectFloors || '2') || 2;
      var resultObj = { location, solar: climateData.solar, wind: climateData.wind, climate: climateData.climate, rainfall: climateData.rainfall, soil: climateData.soil, seismic: climateData.seismic, landAssessment, obcRecommendations, futureImprovements, benchmarks: landAssessment.benchmarks, analysisDate: new Date().toISOString() };
      setBeiResult(calculateBEI(resultObj, projectType, gfaNum));
      setRoiResult(calculateSolarROI(resultObj, projectType, gfaNum, flrNum));
      setWaterResult(calculateWaterDemand(resultObj, projectType, gfaNum));
      setCostResult(calculateCost(resultObj, projectType, gfaNum));
      setOpalResult(calculateOPAL(resultObj));
      setCarbonResult(calculateCarbon(resultObj, projectType, gfaNum));
      setBatteryResult(calculateBattery(resultObj, projectType, gfaNum, flrNum));
      setAnalysisResult(resultObj);
      setActiveTab('summary');
      addToast('Analysis complete — all data layers loaded.', 'ok');
    } catch (err) {
      addToast('Analysis error — check connection. ' + (err instanceof Error ? err.message : ''), 'error');
      console.error('Analysis error:', err);
    }
  };

  var handleMapSearch = async function() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      var res = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(searchQuery) + '&format=json&limit=1&countrycodes=om&accept-language=ar,en', { headers: { 'User-Agent': 'OmanSustain/1.0' } });
      var data = await res.json();
      if (data[0]) { var lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon); setLocation({ lat, lng }); setInputLat(lat.toFixed(6)); setInputLng(lng.toFixed(6)); }
    } catch (_e) { /* search failed */ } finally { setIsSearching(false); }
  };

  // --- FULL CSV export ---
  var handleCsvExport = function() {
    if (!analysisResult) return;
    var a = analysisResult;
    var lines: string[] = [];
    lines.push('OmanSustain LEED v4.1 Site Analysis Report');
    lines.push('Generated,' + a.analysisDate);
    lines.push('Coordinates,"' + a.location.lat + ', ' + a.location.lng + '"');
    lines.push('Project Type,' + projectType);
    lines.push('GFA (m2),' + projectGFA);
    lines.push('Floors,' + projectFloors);
    lines.push('');
    lines.push('SOLAR - PVGIS v5.2 EU JRC +-4%');
    lines.push('Yearly GHI,' + a.solar.yearlyGHI + ' kWh/m2/yr');
    lines.push('PV Yield Potential,' + a.solar.pvProductionPotential + ' kWh/kWp/yr');
    lines.push('Optimal Tilt,' + a.solar.optimalTilt + ' deg');
    lines.push('Dust Loss,' + a.solar.dustImpactValue + '%');
    lines.push('Facade Heat Gain N/S/E/W,' + a.solar.facadeHeatGain.north + '/' + a.solar.facadeHeatGain.south + '/' + a.solar.facadeHeatGain.east + '/' + a.solar.facadeHeatGain.west);
    lines.push('Recommended WWR N/S/E/W,' + a.solar.recommendedWWR.north + '%/' + a.solar.recommendedWWR.south + '%/' + a.solar.recommendedWWR.east + '%/' + a.solar.recommendedWWR.west + '%');
    lines.push('');
    lines.push('WIND - ERA5 via Open-Meteo hourly +-5%');
    lines.push('Average Speed,' + a.wind.averageSpeed + ' m/s');
    lines.push('Max Speed,' + a.wind.maxSpeed + ' m/s');
    lines.push('Energy Density,' + a.wind.energyDensity + ' W/m2');
    lines.push('Prevailing Direction,' + a.wind.prevailingDirection);
    lines.push('Ventilation Score,' + a.wind.ventilationScore + '/100');
    lines.push('Cross-Ventilation Angle,' + a.wind.crossVentilationAngle + ' deg');
    lines.push('Wind-Driven Rain Risk,' + a.wind.windDrivenRainRisk);
    lines.push('Shamal Jun-Aug avg,' + a.wind.seasonalWind.shamal.avgSpeed + ' m/s');
    lines.push('Kharif Jun-Sep avg,' + a.wind.seasonalWind.kharif.avgSpeed + ' m/s');
    lines.push('Turbine Suitability,' + a.wind.turbineSuitability);
    lines.push('');
    lines.push('CLIMATE - ERA5 via Open-Meteo hourly +-3%');
    lines.push('Climate Zone,' + a.climate.climateZone);
    lines.push('Avg Temperature,' + a.climate.avgTemperature + ' C');
    lines.push('Max Temperature,' + a.climate.maxTemperature + ' C');
    lines.push('Min Temperature,' + a.climate.minTemperature + ' C');
    lines.push('CDD (base 18C),' + a.climate.cdd);
    lines.push('HDD,' + a.climate.hdd);
    lines.push('Overheating Hours (T>35+RH>50),' + a.climate.overheatingHours + '/yr');
    lines.push('Rainfall,' + a.climate.rainfall + ' mm/yr');
    lines.push('Sunshine Hours,' + a.climate.sunshineHours + '/yr');
    lines.push('');
    if (a.climate.comfortHours && a.climate.comfortHours.length > 0) {
      lines.push('COMFORT HOURS BY MONTH');
      lines.push('Month,Hours,Percentage');
      a.climate.comfortHours.forEach(function(m) { lines.push(m.month + ',' + m.hours + ',' + m.percentage + '%'); });
      lines.push('');
    }
    if (a.climate.monthlyTemperature && a.climate.monthlyTemperature.length > 0) {
      lines.push('MONTHLY TEMPERATURES');
      lines.push('Month,Avg C,Max C,Min C');
      a.climate.monthlyTemperature.forEach(function(m) { lines.push(m.month + ',' + m.avg + ',' + m.max + ',' + m.min); });
      lines.push('');
    }
    lines.push('OEESC ENVELOPE REQUIREMENTS');
    lines.push('Wall U-value max,' + a.climate.recommendedUValues.wall + ' W/m2K - OEESC Art 3.2');
    lines.push('Roof U-value max,' + a.climate.recommendedUValues.roof + ' W/m2K - OEESC Art 3.3');
    lines.push('Glazing U-value max,' + a.climate.recommendedUValues.glazing + ' W/m2K - OEESC Art 3.4');
    lines.push('Floor U-value max,' + a.climate.recommendedUValues.floor + ' W/m2K - OEESC Art 3.2');
    lines.push('');
    lines.push('RAINFALL - ERA5 daily +-5%');
    lines.push('Annual Total,' + a.rainfall.annualTotal + ' mm/yr');
    lines.push('Elevation,' + a.rainfall.elevation + ' m');
    lines.push('Wadi Flood Risk,' + a.rainfall.wadiFloodRisk);
    lines.push('Cyclone Risk,' + a.rainfall.cycloneRiskLevel);
    lines.push('Rainwater Harvesting Potential,' + a.rainfall.rainwaterHarvestingPotential + ' m3/yr');
    if (a.rainfall.monthly && a.rainfall.monthly.length > 0) {
      lines.push('Monthly Precipitation (mm)');
      a.rainfall.monthly.forEach(function(m) { lines.push(m.month + ',' + m.precipitation); });
    }
    lines.push('');
    lines.push('SEISMIC - USGS Earthquake Hazards API');
    lines.push('Zone,' + a.seismic.zone);
    lines.push('PGA,' + a.seismic.pga + ' g');
    lines.push('Historical Events (500km M3+),' + a.seismic.historicalEvents);
    lines.push('Max Magnitude,' + a.seismic.maxMagnitude);
    lines.push('Diaphragm Continuity Required,' + a.seismic.diaphragmContinuity);
    lines.push('"Structural Recommendation","' + a.seismic.structuralRecommendation + '"');
    lines.push('');
    lines.push('SOIL - OpenLandMap + Oman regional zones');
    lines.push('Zone,' + a.soil.type);
    lines.push('Texture,' + a.soil.texture);
    lines.push('Bearing Range,' + a.soil.bearingRange.min + '-' + a.soil.bearingRange.max + ' kPa');
    lines.push('Recommended Foundation,' + a.soil.recommendedFoundation);
    lines.push('pH,' + a.soil.phLevel);
    lines.push('Organic Carbon,' + a.soil.organicCarbon + '%');
    lines.push('Sabkha Risk,' + a.soil.sabkhaRisk);
    lines.push('Expansive Clay Risk,' + a.soil.expansiveClayRisk);
    lines.push('Corrosion Risk,' + a.soil.corrosionRisk);
    lines.push('Waterproofing Required,' + a.soil.waterproofingRequired);
    lines.push('');
    lines.push('LEED v4.1 SCORES');
    lines.push('Current Score,' + a.landAssessment.currentScore);
    lines.push('Potential Improvement,+' + a.landAssessment.potentialScore);
    lines.push('Max Achievable,' + a.landAssessment.maxPossibleScore);
    lines.push('Category,Current,Possible,Max');
    a.landAssessment.categories.forEach(function(c) { lines.push('"' + c.name + '",' + c.currentPoints + ',' + c.possiblePoints + ',' + c.maxPoints); });
    lines.push('');
    lines.push('OBC/OEESC COMPLIANCE CHECKLIST');
    lines.push('ID,Category,Clause,OEESC,Title,Status,Priority,Action Required');
    if (obcChecklist) {
      obcChecklist.items.forEach(function(item) {
        lines.push(item.id + ',"' + item.category + '","' + item.clause + '","' + item.oeescArticle + '","' + item.title + '",' + item.status + ',' + item.priority + ',"' + (item.actionRequired || 'None') + '"');
      });
    }
    lines.push('');
    lines.push('RECOMMENDATIONS');
    lines.push('Title,Points,Priority,Cost,Reference');
    a.obcRecommendations.forEach(function(r) {
      lines.push('"' + r.title + '",+' + r.potentialScoreIncrease + ' pts,' + r.priority + ',' + r.implementationCost + ',"' + (r.oeescReference || r.obcReference) + '"');
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'omansustain-' + a.location.lat.toFixed(3) + '-' + a.location.lng.toFixed(3) + '-' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported — all data layers including OBC checklist.', 'ok');
  };

  // --- FULL PDF via structured HTML (captures all tabs + OBC checklist) ---
  var handlePdfExport = function() {
    if (!analysisResult) return;
    var a = analysisResult;
    var date = new Date().toLocaleDateString('en-OM', { year: 'numeric', month: 'long', day: 'numeric' });
    var certLabel = a.landAssessment.maxPossibleScore >= 80 ? 'PLATINUM' : a.landAssessment.maxPossibleScore >= 60 ? 'GOLD' : a.landAssessment.maxPossibleScore >= 50 ? 'SILVER' : 'CERTIFIED';
    var certColor = a.landAssessment.maxPossibleScore >= 80 ? '#7c3aed' : a.landAssessment.maxPossibleScore >= 60 ? '#b45309' : '#166534';

    var obcRows = obcChecklist ? obcChecklist.items.map(function(item) {
      var rowBg = item.status === 'met' ? '#f0fdf4' : item.status === 'requires_action' ? (item.priority === 'critical' ? '#fef2f2' : '#fffbeb') : '#f8fafc';
      var statusLabel = item.status === 'met' ? 'Met' : item.status === 'requires_action' ? 'Action Required' : 'TBD';
      return '<tr style="background:' + rowBg + ';border-bottom:1px solid #e2e8f0"><td style="padding:7px 9px;font-size:11px;font-weight:600">' + item.title + '</td><td style="padding:7px 9px;font-size:9px;color:#64748b;font-family:monospace">' + item.clause + (item.oeescArticle !== 'N/A' ? ' / ' + item.oeescArticle : '') + '</td><td style="padding:7px 9px;font-size:10px">' + statusLabel + '</td><td style="padding:7px 9px;font-size:10px;color:#475569">' + (item.actionRequired || '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="4" style="padding:10px;color:#94a3b8">No checklist available</td></tr>';

    var monthlyTempRow = a.climate.monthlyTemperature ? a.climate.monthlyTemperature.map(function(m) { return '<td style="padding:3px 5px;text-align:center;font-size:9px">' + m.max + '<br><span style="color:#94a3b8">' + m.avg + '</span></td>'; }).join('') : '';
    var monthlyRainRow = a.rainfall.monthly ? a.rainfall.monthly.map(function(m) { return '<td style="padding:3px 5px;text-align:center;font-size:9px;color:' + (m.precipitation > 20 ? '#2563eb' : m.precipitation > 5 ? '#b45309' : '#94a3b8') + '">' + m.precipitation + '</td>'; }).join('') : '';
    var recRows = a.obcRecommendations.slice(0, 8).map(function(r, i) {
      return '<tr style="background:' + (i % 2 === 0 ? '#f8fafc' : 'white') + ';border-bottom:1px solid #e2e8f0"><td style="padding:7px 9px"><span style="background:' + (r.priority === 'high' ? '#fee2e2' : r.priority === 'medium' ? '#fef3c7' : '#f0fdf4') + ';color:' + (r.priority === 'high' ? '#991b1b' : r.priority === 'medium' ? '#92400e' : '#166534') + ';padding:1px 5px;border-radius:4px;font-size:9px;font-weight:700">' + r.priority.toUpperCase() + '</span></td><td style="padding:7px 9px;font-size:11px;font-weight:600">' + r.title + '</td><td style="padding:7px 9px;font-size:11px;color:#1a5d3c;font-weight:700">+' + r.potentialScoreIncrease + '</td><td style="padding:7px 9px;font-size:9px;color:#64748b">' + (r.oeescReference || r.obcReference) + '</td><td style="padding:7px 9px;font-size:10px">' + r.implementationCost + '</td></tr>';
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OmanSustain Report ' + date + '</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;line-height:1.45}h2{color:#1a5d3c;font-size:13px;border-bottom:2px solid #d4af37;padding-bottom:3px;margin:18px 0 8px}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 12px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:8px}.card-label{font-size:9px;color:#94a3b8;margin-bottom:1px}.card-val{font-size:16px;font-weight:700;color:#1a5d3c}table{width:100%;border-collapse:collapse;margin-bottom:12px}thead tr{background:#1a5d3c}thead th{padding:7px 9px;color:white;font-size:9px;text-align:left;font-weight:600}.footer{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center}@media print{.no-print{display:none}}</style></head><body>' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #1a5d3c;padding-bottom:12px;margin-bottom:16px"><div><div style="font-size:18px;font-weight:700;color:#1a5d3c;margin-bottom:3px">OmanSustain Land Sustainability Report</div><div style="font-size:10px;color:#64748b">LEED v4.1 Pre-Design Assessment · ' + date + '</div><div style="font-size:10px;color:#475569;margin-top:2px">' + a.location.lat.toFixed(5) + 'N, ' + a.location.lng.toFixed(5) + 'E · ' + a.climate.climateZone + (krookiMetadata && krookiMetadata.planNumber ? ' · Plan: ' + krookiMetadata.planNumber : '') + '</div></div><div style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center"><div style="font-size:9px;color:#94a3b8">LEED Potential</div><div style="font-size:26px;font-weight:700;color:#1a5d3c">' + a.landAssessment.maxPossibleScore + '</div><div style="font-size:10px;font-weight:700;color:' + certColor + '">' + certLabel + '</div></div></div>' +
    '<h2>1. Key Site Data</h2><div class="grid4"><div class="card"><div class="card-label">Solar GHI/yr (PVGIS ±4%)</div><div class="card-val">' + a.solar.yearlyGHI + '</div><div style="font-size:8px;color:#94a3b8">kWh/m²</div></div><div class="card"><div class="card-label">PV Yield Potential</div><div class="card-val">' + a.solar.pvProductionPotential + '</div><div style="font-size:8px;color:#94a3b8">kWh/kWp/yr · ' + a.solar.optimalTilt + 'deg</div></div><div class="card"><div class="card-label">CDD base 18°C (ERA5)</div><div class="card-val" style="color:#dc2626">' + a.climate.cdd.toLocaleString() + '</div><div style="font-size:8px;color:#94a3b8">Overheating: ' + a.climate.overheatingHours + ' hrs/yr</div></div><div class="card"><div class="card-label">Wind avg (ERA5)</div><div class="card-val">' + a.wind.averageSpeed + '</div><div style="font-size:8px;color:#94a3b8">m/s · ' + a.wind.prevailingDirection + ' · vent ' + a.wind.ventilationScore + '/100</div></div><div class="card"><div class="card-label">Annual Rainfall</div><div class="card-val">' + a.rainfall.annualTotal + '</div><div style="font-size:8px;color:#94a3b8">mm/yr · ' + a.rainfall.elevation + 'm elev</div></div><div class="card"><div class="card-label">Wadi / Cyclone Risk</div><div class="card-val" style="font-size:12px">' + a.rainfall.wadiFloodRisk + ' / ' + a.rainfall.cycloneRiskLevel + '</div></div><div class="card"><div class="card-label">Seismic Zone (USGS)</div><div class="card-val" style="font-size:11px">' + a.seismic.zone.split(' - ')[0] + '</div><div style="font-size:8px;color:#94a3b8">PGA ' + a.seismic.pga + 'g</div></div><div class="card"><div class="card-label">Foundation (soil)</div><div class="card-val" style="font-size:13px">' + a.soil.recommendedFoundation + '</div><div style="font-size:8px;color:#94a3b8">' + (a.soil.sabkhaRisk ? 'SABKHA RISK' : a.soil.corrosionRisk + ' corrosion') + '</div></div></div>' +
    '<h2>2. OEESC Envelope — CDD ' + a.climate.cdd + ' (' + (a.climate.cdd > 3500 ? 'Hot Arid/Humid' : 'Moderate') + ')</h2><div class="grid4"><div class="card"><div class="card-label">Wall U-value max</div><div class="card-val">' + a.climate.recommendedUValues.wall + '</div><div style="font-size:8px;color:#94a3b8">W/m²K — Art. 3.2</div></div><div class="card"><div class="card-label">Roof U-value max</div><div class="card-val">' + a.climate.recommendedUValues.roof + '</div><div style="font-size:8px;color:#94a3b8">W/m²K — Art. 3.3</div></div><div class="card"><div class="card-label">Glazing U-value max</div><div class="card-val">' + a.climate.recommendedUValues.glazing + '</div><div style="font-size:8px;color:#94a3b8">W/m²K — Art. 3.4</div></div><div class="card"><div class="card-label">WWR N/S/E/W max</div><div class="card-val" style="font-size:12px">' + a.solar.recommendedWWR.north + '/' + a.solar.recommendedWWR.south + '/' + a.solar.recommendedWWR.east + '/' + a.solar.recommendedWWR.west + '%</div><div style="font-size:8px;color:#94a3b8">Art. 3.5</div></div></div>' +
    '<h2>3. Monthly Data</h2><table><thead><tr><th>Parameter</th><th>JAN</th><th>FEB</th><th>MAR</th><th>APR</th><th>MAY</th><th>JUN</th><th>JUL</th><th>AUG</th><th>SEP</th><th>OCT</th><th>NOV</th><th>DEC</th></tr></thead><tbody><tr style="background:#f8fafc"><td style="padding:4px 8px;font-size:9px;font-weight:600">Temp max/avg °C</td>' + monthlyTempRow + '</tr><tr><td style="padding:4px 8px;font-size:9px;font-weight:600">Rainfall mm</td>' + monthlyRainRow + '</tr></tbody></table>' +
    '<h2>4. OBC / OEESC Compliance Checklist</h2><table><thead><tr><th>Requirement</th><th>Clause / OEESC</th><th>Status</th><th>Action Required</th></tr></thead><tbody>' + obcRows + '</tbody></table>' +
    '<h2>5. Top ' + Math.min(a.obcRecommendations.length, 8) + ' Recommendations</h2><table><thead><tr><th>Pri</th><th>Recommendation</th><th>+pts</th><th>Reference</th><th>Cost</th></tr></thead><tbody>' + recRows + '</tbody></table>' +
    '<h2>6. LEED Score by Category</h2><table><thead><tr><th>Category</th><th>Current</th><th>Achievable</th><th>Maximum</th></tr></thead><tbody>' + a.landAssessment.categories.map(function(c, i) { return '<tr style="background:' + (i % 2 === 0 ? '#f8fafc' : 'white') + ';border-bottom:1px solid #e2e8f0"><td style="padding:6px 9px;font-size:11px;font-weight:600">' + c.name + '</td><td style="padding:6px 9px;font-size:11px;color:#1a5d3c;font-weight:700">' + c.currentPoints + '</td><td style="padding:6px 9px;font-size:11px;color:#d4af37;font-weight:700">' + c.possiblePoints + '</td><td style="padding:6px 9px;font-size:11px;color:#94a3b8">' + c.maxPoints + '</td></tr>'; }).join('') + '</tbody></table>' +
    '<div class="footer"><p>OmanSustain.om — LEED v4.1 Land Assessment Platform — Generated by Dr. Tariq Al Amri</p><p>Data: PVGIS v5.2 (EU JRC) ±4% · ERA5 via Open-Meteo ±3-5% · OpenLandMap ±15% · USGS Earthquake API</p><p>This report is for pre-design guidance. All OBC/OEESC items require professional review before permit submission. Report ID: ' + Date.now().toString(36).toUpperCase() + '</p></div>' +
    '<div class="no-print" style="text-align:center;margin-top:24px"><button onclick="window.print()" style="padding:11px 24px;background:#1a5d3c;color:white;border:none;border-radius:7px;cursor:pointer;font-size:13px;margin-right:10px">Print / Save as PDF</button><button onclick="window.close()" style="padding:11px 18px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:7px;cursor:pointer;font-size:13px">Close</button></div></body></html>';

    var w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      addToast('Full PDF report opened. Use Print > Save as PDF in the new tab.', 'ok');
    } else {
      addToast('Pop-up blocked — please allow pop-ups for this site.', 'warn');
    }
  };


  var fetchWadiOverlay = async function(lat: number, lng: number) {
    try {
      var query = '[out:json][timeout:20];(way["waterway"~"wadi|stream|river|canal"](around:15000,' + lat + ',' + lng + '););out geom;';
      var url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
      var res = await fetch(url);
      var data = await res.json();
      var lines: [number,number][][] = [];
      if (data && data.elements) {
        data.elements.forEach(function(el: { geometry?: { lat: number; lon: number }[] }) {
          if (el.geometry && el.geometry.length > 1) {
            lines.push(el.geometry.map(function(pt) { return [pt.lat, pt.lon] as [number,number]; }));
          }
        });
      }
      setWadiLines(lines);
      if (lines.length > 0) addToast('تم تحميل ' + lines.length + ' وادي/مجرى مائي في نطاق 15 كم.', 'ok');
      else addToast('لا توجد أودية مسجلة في نطاق 15 كم من الموقع.', 'warn');
    } catch (_e) { addToast('فشل تحميل بيانات الأودية.', 'warn'); }
  };

  useEffect(function() {
    var lat = parseFloat(inputLat), lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) setLocation({ lat, lng });
  }, [inputLat, inputLng]);

  var getDustColor = function(v: string) { return v === 'low' ? 'bg-green-100 text-green-800' : v === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'; };
  var getTurbineColor = function(v: string) { return v === 'excellent' ? 'bg-green-100 text-green-800' : v === 'good' ? 'bg-blue-100 text-blue-800' : v === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'; };

  return (
    <section id="analysis" className="py-20 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Land Sustainability Analysis</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Free comprehensive LEED v4.1 pre-design assessment. Upload a krooki or enter coordinates to begin.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Upload className="w-4 h-4" />Upload Krooki / Plan</h3>
                <KrookiUploader onCoordinatesDetected={handleKrookiCoordinates} onPolygonDetected={function(p, a) { setLandPolygon(p); setPolygonArea(a); }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Search className="w-4 h-4" />Search Location</h3>
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Search in Oman (e.g. Salalah, Muscat)..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') handleMapSearch(); }} />
                  <Button onClick={handleMapSearch} variant="outline" disabled={isSearching}>{isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />Coordinates & Project</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-slate-500">Latitude</Label><Input type="number" step="0.000001" value={inputLat} onChange={function(e) { setInputLat(e.target.value); }} className="mt-1" /></div>
                    <div><Label className="text-xs text-slate-500">Longitude</Label><Input type="number" step="0.000001" value={inputLng} onChange={function(e) { setInputLng(e.target.value); }} className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Project Type</Label>
                      <select value={projectType} onChange={function(e) { setProjectType(e.target.value); }} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1a5d3c]/20">
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="mixed-use">Mixed Use</option>
                        <option value="hospitality">Hospitality</option>
                      </select>
                    </div>
                    <div><Label className="text-xs text-slate-500">GFA (m²)</Label><Input type="number" value={projectGFA} onChange={function(e) { setProjectGFA(e.target.value); }} placeholder="500" className="mt-1" /></div>
                    <div><Label className="text-xs text-slate-500">Floors</Label><Input type="number" value={projectFloors} onChange={function(e) { setProjectFloors(e.target.value); }} placeholder="2" className="mt-1" /></div>
                  </div>
                  <Button onClick={function() { navigator.geolocation && navigator.geolocation.getCurrentPosition(function(p) { setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setInputLat(p.coords.latitude.toFixed(6)); setInputLng(p.coords.longitude.toFixed(6)); setKrookiMetadata(null); }); }} variant="outline" className="w-full"><Crosshair className="w-4 h-4 mr-2" />Use My Current Location</Button>
                  <Button onClick={handleAnalyze} disabled={loading} className="w-full bg-[#1a5d3c] hover:bg-[#143d29] h-12">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing all 6 data layers...</> : <><Search className="w-4 h-4 mr-2" />Analyze Land — Free</>}
                  </Button>
                </div>
                {krookiMetadata && (
                  <div className="mt-4 p-4 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                    <p className="text-xs text-[#1a5d3c] font-medium mb-1">Krooki Data Detected</p>
                    {krookiMetadata.planNumber && <p className="text-sm text-slate-700">Plan: {krookiMetadata.planNumber}</p>}
                    {krookiMetadata.wilayat && <p className="text-sm text-slate-700">Wilayat: {krookiMetadata.wilayat}</p>}
                    {((krookiMetadata.area && krookiMetadata.area > 0) || polygonArea > 0) && <p className="text-sm text-slate-700">Area: {(krookiMetadata.area || polygonArea).toLocaleString()} m² ({((krookiMetadata.area || polygonArea) / 10000).toFixed(2)} ha)</p>}
                  </div>
                )}
              </div>
            </div>
            <AccuracyDisclaimer />
          </CardContent>
        </Card>

        {error && <Alert variant="destructive" className="mb-8"><AlertTriangle className="w-4 h-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
            {toasts.map(function(t) {
              var bg = t.type === 'error' ? 'bg-red-600' : t.type === 'warn' ? 'bg-orange-500' : 'bg-[#1a5d3c]';
              var icon = t.type === 'error' ? '⚠️' : t.type === 'warn' ? '⚡' : '✓';
              return (
                <div key={t.id} className={'flex items-start gap-3 p-3 rounded-xl text-white shadow-2xl text-sm animate-fade-up ' + bg}>
                  <span className="flex-shrink-0">{icon}</span>
                  <span className="flex-1">{t.msg}</span>
                  <button onClick={function() { setToasts(function(prev) { return prev.filter(function(x) { return x.id !== t.id; }); }); }} className="text-white/70 hover:text-white flex-shrink-0 text-xs">✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Map + Tabs Grid */}
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={function() {
                  if (!showWadi) { setShowWadi(true); fetchWadiOverlay(location.lat, location.lng); }
                  else { setShowWadi(false); setWadiLines([]); }
                }}
                className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ' + (showWadi ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400')}
              >
                <Waves className="w-3.5 h-3.5" />الأودية
              </button>
              <Button variant={mapLayer === 'satellite' ? 'default' : 'outline'} size="sm" onClick={function() { setMapLayer(mapLayer === 'street' ? 'satellite' : 'street'); }} className={mapLayer === 'satellite' ? 'bg-[#1a5d3c] gap-1.5' : 'gap-1.5'}>
                <Layers className="w-4 h-4" />{mapLayer === 'street' ? 'Satellite' : 'Street Map'}
              </Button>
            </div>
            <Card className="h-[500px] lg:h-[600px] overflow-hidden">
              <MapContainer center={[location.lat, location.lng]} zoom={8} className="w-full h-full">
                {mapLayer === 'street' ? <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> : <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />}
                <Polygon positions={OMAN_BOUNDARY} pathOptions={{ color: '#1a5d3c', weight: 2, fillOpacity: 0.05 }}><Tooltip>Oman Boundary</Tooltip></Polygon>
                {landPolygon && landPolygon.length >= 3 && <Polygon positions={landPolygon} pathOptions={{ color: '#d4af37', weight: 3, fillOpacity: 0.2 }}><Tooltip>Land Boundary ({polygonArea.toLocaleString()} m²)</Tooltip></Polygon>}
                <Marker position={[location.lat, location.lng]}><Tooltip>Selected Location</Tooltip></Marker>
                {showWadi && wadiLines.map(function(pts, i) {
                  return <Polyline key={i} positions={pts} pathOptions={{ color: '#2563eb', weight: 2, opacity: 0.7, dashArray: '4 3' }}><Tooltip sticky>وادي/مجرى مائي</Tooltip></Polyline>;
                })}
                <MapClickHandler onMapClick={handleMapClick} />
                <MapUpdater lat={location.lat} lng={location.lng} />
              </MapContainer>
            </Card>
          </div>

          {/* ─── DATA TABS — 7 tabs now ────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {analysisResult ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full mb-1">
                  <TabsTrigger value="summary" className="text-xs gap-1"><LayoutDashboard className="w-3 h-3" />Summary</TabsTrigger>
                  <TabsTrigger value="obc" className="text-xs gap-1"><FileCheck className="w-3 h-3" />OBC</TabsTrigger>
                  <TabsTrigger value="climate" className="text-xs">Climate</TabsTrigger>
                  <TabsTrigger value="solar" className="text-xs">Solar</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-4 w-full mb-1">
                  <TabsTrigger value="wind" className="text-xs">Wind</TabsTrigger>
                  <TabsTrigger value="soil" className="text-xs">Soil</TabsTrigger>
                  <TabsTrigger value="seismic" className="text-xs gap-1"><Activity className="w-3 h-3" />Seismic</TabsTrigger>
                  <TabsTrigger value="rainfall" className="text-xs gap-1"><Droplets className="w-3 h-3" />Rainfall</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 w-full mb-1">
                  <TabsTrigger value="envelope" className="text-xs gap-1"><BarChart3 className="w-3 h-3" />Envelope</TabsTrigger>
                  <TabsTrigger value="leed" className="text-xs gap-1"><Leaf className="w-3 h-3" />LEED</TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs gap-1"><Calendar className="w-3 h-3" />Calendar</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 w-full mb-1">
                  <TabsTrigger value="bei" className="text-xs gap-1"><Zap className="w-3 h-3" />BEI</TabsTrigger>
                  <TabsTrigger value="solarroi" className="text-xs gap-1"><Sun className="w-3 h-3" />ROI شمسي</TabsTrigger>
                  <TabsTrigger value="water" className="text-xs gap-1"><Droplets className="w-3 h-3" />المياه</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 w-full mb-1">
                  <TabsTrigger value="opal" className="text-xs gap-1"><Building2 className="w-3 h-3" />OPAL</TabsTrigger>
                  <TabsTrigger value="cost" className="text-xs gap-1"><Package className="w-3 h-3" />التكلفة</TabsTrigger>
                  <TabsTrigger value="carbon" className="text-xs gap-1"><LeafIcon className="w-3 h-3" />ESG</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="battery" className="text-xs gap-1"><Battery className="w-3 h-3" />البطارية</TabsTrigger>
                  <TabsTrigger value="materials" className="text-xs gap-1"><Globe2 className="w-3 h-3" />المواد</TabsTrigger>
                  <TabsTrigger value="share" className="text-xs gap-1"><Share2 className="w-3 h-3" />مشاركة</TabsTrigger>
                  <TabsTrigger value="portfolio" className="text-xs gap-1"><FolderOpen className="w-3 h-3" />المشاريع</TabsTrigger>
                </TabsList>

                {/* SUMMARY TAB — NEW */}
                <TabsContent value="summary" className="space-y-4">
                  <ExecutiveSummary result={analysisResult} projectType={projectType} projectGFA={projectGFA} projectFloors={projectFloors} />
                </TabsContent>

                {/* OBC CHECKLIST TAB — NEW */}
                <TabsContent value="obc" className="space-y-4">
                  {obcChecklist ? (
                    <OBCChecklist checklist={obcChecklist} />
                  ) : (
                    <Card><CardContent className="p-8 text-center text-slate-400"><FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm">Run analysis to generate OBC/OEESC compliance checklist</div></CardContent></Card>
                  )}
                </TabsContent>

                {/* CLIMATE TAB */}
                <TabsContent value="climate" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><Thermometer className="w-5 h-5 text-[#1a5d3c]" />Climate Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Avg Temp</div><div className="text-xl font-bold">{analysisResult.climate.avgTemperature}°C</div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Humidity</div><div className="text-xl font-bold">{analysisResult.climate.relativeHumidity}%</div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Max Temp</div><div className="text-xl font-bold">{analysisResult.climate.maxTemperature}°C</div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Min Temp</div><div className="text-xl font-bold">{analysisResult.climate.minTemperature}°C</div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200"><div className="text-xs text-red-600 font-medium">CDD (base 18°C)</div><div className="text-xl font-bold text-slate-900">{analysisResult.climate.cdd.toLocaleString()}</div></div>
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200"><div className="text-xs text-orange-600 font-medium">Overheating hrs/yr</div><div className="text-xl font-bold text-slate-900">{analysisResult.climate.overheatingHours.toLocaleString()}</div></div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-sm text-[#1a5d3c] font-medium mb-2">Monthly Comfort Hours</div>
                        <div className="grid grid-cols-4 gap-1">
                          {analysisResult.climate.comfortHours.map(function(m) {
                            return (
                              <div key={m.month} className="text-center">
                                <div className="text-xs text-slate-500">{m.month}</div>
                                <div className="text-xs font-bold" style={{ color: m.percentage > 30 ? '#16a34a' : m.percentage > 10 ? '#b45309' : '#dc2626' }}>{m.percentage}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-sm text-[#1a5d3c] font-medium">Climate Zone</div>
                        <div className="text-sm font-semibold text-slate-900">{analysisResult.climate.climateZone}</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700"><Info className="w-3 h-3 inline mr-1" />Source: ERA5 via Open-Meteo (hourly reanalysis) — ±3% accuracy</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SOLAR TAB */}
                <TabsContent value="solar" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><Sun className="w-5 h-5 text-[#d4af37]" />Solar Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">GHI Daily</div><div className="text-xl font-bold">{analysisResult.solar.ghi}<span className="text-xs text-slate-400 ml-1">kWh/m²</span></div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">DNI Daily</div><div className="text-xl font-bold">{analysisResult.solar.dni}<span className="text-xs text-slate-400 ml-1">kWh/m²</span></div></div>
                      </div>
                      <div className="p-3 bg-[#d4af37]/10 rounded-lg border border-[#d4af37]/30">
                        <div className="text-xs text-[#d4af37] font-medium">Yearly GHI</div>
                        <div className="text-2xl font-bold">{analysisResult.solar.yearlyGHI}<span className="text-xs text-slate-400 ml-1">kWh/m²/yr</span></div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-xs text-[#1a5d3c] font-medium">PV Production Potential</div>
                        <div className="text-2xl font-bold">{analysisResult.solar.pvProductionPotential}<span className="text-xs text-slate-400 ml-1">kWh/kWp/yr</span></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Optimal Tilt</div><div className="text-xl font-bold">{analysisResult.solar.optimalTilt}°</div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Azimuth</div><div className="text-xl font-bold">{analysisResult.solar.optimalAzimuth}°</div></div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div><div className="text-xs text-slate-500">Dust Impact</div><div className="text-lg font-semibold">{analysisResult.solar.dustImpactValue}% loss</div></div>
                        <Badge className={getDustColor(analysisResult.solar.dustImpact)}>{analysisResult.solar.dustImpact}</Badge>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700"><Info className="w-3 h-3 inline mr-1" />Source: PVGIS v5.2 (EU JRC) — ±4% accuracy. NASA POWER fallback if unavailable.</div>
                      </div>
                    </CardContent>
                  </Card>
                  <ShadowStudy latitude={analysisResult.location.lat} />
                </TabsContent>

                {/* WIND TAB */}
                <TabsContent value="wind" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><Wind className="w-5 h-5 text-blue-500" />Wind Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Avg Speed</div><div className="text-xl font-bold">{analysisResult.wind.averageSpeed}<span className="text-xs text-slate-400 ml-1">m/s</span></div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Max Speed</div><div className="text-xl font-bold">{analysisResult.wind.maxSpeed}<span className="text-xs text-slate-400 ml-1">m/s</span></div></div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-600 font-medium">Energy Density</div>
                        <div className="text-2xl font-bold">{analysisResult.wind.energyDensity}<span className="text-xs text-slate-400 ml-1">W/m²</span></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Prevailing Direction</div><div className="text-lg font-semibold">{analysisResult.wind.prevailingDirection}</div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Ventilation Score</div><div className="text-xl font-bold" style={{ color: analysisResult.wind.ventilationScore > 60 ? '#16a34a' : analysisResult.wind.ventilationScore > 40 ? '#b45309' : '#dc2626' }}>{analysisResult.wind.ventilationScore}<span className="text-xs text-slate-400">/100</span></div></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="text-xs text-amber-700 font-medium">Shamal (Jun-Aug)</div>
                          <div className="text-lg font-bold">{analysisResult.wind.seasonalWind.shamal.avgSpeed} m/s</div>
                          <div className="text-xs text-amber-600">NW-N direction</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-700 font-medium">Kharif (Jun-Sep)</div>
                          <div className="text-lg font-bold">{analysisResult.wind.seasonalWind.kharif.avgSpeed} m/s</div>
                          <div className="text-xs text-blue-600">SW monsoon</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div><div className="text-xs text-slate-500">Turbine Suitability</div><div className="text-lg font-semibold capitalize">{analysisResult.wind.turbineSuitability}</div></div>
                        <Badge className={getTurbineColor(analysisResult.wind.turbineSuitability)}>{analysisResult.wind.turbineSuitability}</Badge>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700"><Info className="w-3 h-3 inline mr-1" />Source: ERA5 via Open-Meteo (8,760 hourly readings/yr) — ±5% accuracy</div>
                      </div>
                    </CardContent>
                  </Card>
                  <WindRoseChart windRose={analysisResult.wind.windRose} prevailingDirection={analysisResult.wind.prevailingDirection} />
                </TabsContent>

                {/* SOIL TAB */}
                <TabsContent value="soil" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="w-5 h-5 text-amber-600" />Soil Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700 font-medium">Soil Zone</div>
                        <div className="text-base font-semibold">{analysisResult.soil.type}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Texture</div><div className="text-sm font-medium">{analysisResult.soil.texture}</div></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Bearing Range</div><div className="text-base font-bold">{analysisResult.soil.bearingRange.min}–{analysisResult.soil.bearingRange.max}<span className="text-xs text-slate-400 ml-1">kPa</span></div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">pH Level</div><div className="text-xl font-bold">{analysisResult.soil.phLevel}</div></div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-xs text-[#1a5d3c] font-medium">Recommended Foundation</div>
                        <div className="text-lg font-bold capitalize">{analysisResult.soil.recommendedFoundation}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Sabkha Risk</div><RiskBadge level={analysisResult.soil.sabkhaRisk ? 'high' : 'low'} /></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Corrosion Risk</div><RiskBadge level={analysisResult.soil.corrosionRisk} /></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Drainage</div><div className="text-sm font-semibold capitalize">{analysisResult.soil.drainage}</div></div>
                        <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500">Waterproofing</div><div className="text-sm font-semibold">{analysisResult.soil.waterproofingRequired ? 'Required' : 'Not required'}</div></div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700"><Info className="w-3 h-3 inline mr-1" />Source: OpenLandMap (250m) + 10-zone Oman calibration — ±15%. Field survey recommended for foundation design.</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SEISMIC TAB — NEW */}
                <TabsContent value="seismic" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><Activity className="w-5 h-5 text-red-500" />Seismic Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={'p-4 rounded-lg border ' + (analysisResult.seismic.zoneNumber >= 3 ? 'bg-red-50 border-red-200' : analysisResult.seismic.zoneNumber >= 2 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200')}>
                        <div className="text-xs font-medium mb-1" style={{ color: analysisResult.seismic.zoneNumber >= 3 ? '#dc2626' : analysisResult.seismic.zoneNumber >= 2 ? '#ea580c' : '#16a34a' }}>Seismic Zone (OBC Section 6.6)</div>
                        <div className="text-lg font-bold text-slate-900">{analysisResult.seismic.zone}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">Peak Ground Acceleration</div>
                          <div className="text-xl font-bold">{analysisResult.seismic.pga}<span className="text-xs text-slate-400 ml-1">g</span></div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">Historical Events (500km, M3+)</div>
                          <div className="text-xl font-bold">{analysisResult.seismic.historicalEvents}</div>
                        </div>
                      </div>
                      {analysisResult.seismic.maxMagnitude > 0 && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">Maximum Recorded Magnitude</div>
                          <div className="text-xl font-bold">M {analysisResult.seismic.maxMagnitude.toFixed(1)}</div>
                        </div>
                      )}
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-xs text-[#1a5d3c] font-medium mb-1">Structural Recommendation</div>
                        <div className="text-sm text-slate-700">{analysisResult.seismic.structuralRecommendation}</div>
                      </div>
                      {analysisResult.seismic.diaphragmContinuity && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="text-xs text-orange-700 font-medium">Diaphragm Continuity Required</div>
                          <div className="text-xs text-orange-600 mt-1">Full diaphragm continuity and ductile connections required per OBC Section 6.6.</div>
                        </div>
                      )}
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700"><Info className="w-3 h-3 inline mr-1" />Source: USGS Earthquake Hazards API. Regional estimate — site-specific geotechnical assessment recommended.</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* RAINFALL TAB — NEW */}
                <TabsContent value="rainfall" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><Droplets className="w-5 h-5 text-blue-500" />Rainfall & Flood Risk</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-medium">Annual Rainfall</div>
                          <div className="text-2xl font-bold">{analysisResult.rainfall.annualTotal}<span className="text-xs text-slate-400 ml-1">mm/yr</span></div>
                        </div>
                        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                          <div className="text-xs text-[#1a5d3c] font-medium">Elevation (SRTM)</div>
                          <div className="text-2xl font-bold">{analysisResult.rainfall.elevation}<span className="text-xs text-slate-400 ml-1">m</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">Wadi Flood Risk</div>
                          <RiskBadge level={analysisResult.rainfall.wadiFloodRisk} />
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500">Cyclone Risk</div>
                          <RiskBadge level={analysisResult.rainfall.cycloneRiskLevel} />
                        </div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-xs text-[#1a5d3c] font-medium">Rainwater Harvesting Potential</div>
                        <div className="text-xl font-bold">{analysisResult.rainfall.rainwaterHarvestingPotential}<span className="text-xs text-slate-400 ml-1">m³/yr</span></div>
                        <div className="text-xs text-slate-500 mt-1">Based on roof area and 80% collection efficiency</div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-800 font-medium mb-1">OBC Drainage Requirement</div>
                        <div className="text-xs text-amber-700">{analysisResult.rainfall.stormDrainageRequirement}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-medium mb-2">Monthly Precipitation (mm)</div>
                        <div className="grid grid-cols-4 gap-1">
                          {analysisResult.rainfall.monthly.map(function(m) {
                            return (
                              <div key={m.month} className="text-center p-1 bg-slate-50 rounded">
                                <div className="text-xs text-slate-500">{m.month}</div>
                                <div className="text-xs font-bold" style={{ color: m.precipitation > 20 ? '#2563eb' : m.precipitation > 5 ? '#b45309' : '#94a3b8' }}>{m.precipitation}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700"><Info className="w-3 h-3 inline mr-1" />Source: ERA5 via Open-Meteo daily precipitation — ±5% accuracy</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ENVELOPE TAB */}
                <TabsContent value="envelope" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="w-5 h-5 text-purple-600" />OEESC Envelope Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs text-purple-700 font-medium">Climate Classification</div>
                        <div className="text-sm font-semibold text-slate-900">{analysisResult.climate.cdd > 3500 ? (analysisResult.location.lng >= 58.5 || analysisResult.location.lat < 19.5 ? 'Hot Humid (CDD ' + analysisResult.climate.cdd + ')' : 'Hot Arid (CDD ' + analysisResult.climate.cdd + ')') : 'Moderate (CDD ' + analysisResult.climate.cdd + ')'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                          <div className="text-xs text-[#1a5d3c] font-medium">Wall U-value max</div>
                          <div className="text-2xl font-bold">{analysisResult.climate.recommendedUValues.wall}</div>
                          <div className="text-xs text-slate-500">W/m²K — OEESC Art. 3.2</div>
                        </div>
                        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                          <div className="text-xs text-[#1a5d3c] font-medium">Roof U-value max</div>
                          <div className="text-2xl font-bold">{analysisResult.climate.recommendedUValues.roof}</div>
                          <div className="text-xs text-slate-500">W/m²K — OEESC Art. 3.3</div>
                        </div>
                        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                          <div className="text-xs text-[#1a5d3c] font-medium">Glazing U-value max</div>
                          <div className="text-2xl font-bold">{analysisResult.climate.recommendedUValues.glazing}</div>
                          <div className="text-xs text-slate-500">W/m²K — OEESC Art. 3.4</div>
                        </div>
                        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                          <div className="text-xs text-[#1a5d3c] font-medium">Floor U-value max</div>
                          <div className="text-2xl font-bold">{analysisResult.climate.recommendedUValues.floor}</div>
                          <div className="text-xs text-slate-500">W/m²K — OEESC Art. 3.2</div>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-800 font-medium mb-2">Recommended WWR per Facade (OEESC Art. 3.5)</div>
                        <div className="grid grid-cols-4 gap-2">
                          {[['N', analysisResult.solar.recommendedWWR.north], ['S', analysisResult.solar.recommendedWWR.south], ['E', analysisResult.solar.recommendedWWR.east], ['W', analysisResult.solar.recommendedWWR.west]].map(function(item) {
                            return (
                              <div key={item[0]} className="text-center p-2 bg-white rounded border">
                                <div className="text-xs text-slate-500">{item[0]}</div>
                                <div className="text-lg font-bold text-[#1a5d3c]">{item[1]}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs text-slate-500 font-medium mb-2">Facade Heat Gain Index (0–100)</div>
                        <div className="grid grid-cols-4 gap-2">
                          {[['N', analysisResult.solar.facadeHeatGain.north], ['S', analysisResult.solar.facadeHeatGain.south], ['E', analysisResult.solar.facadeHeatGain.east], ['W', analysisResult.solar.facadeHeatGain.west]].map(function(item) {
                            var val = item[1] as number;
                            return (
                              <div key={item[0]} className="text-center p-2 bg-white rounded border">
                                <div className="text-xs text-slate-500">{item[0]}</div>
                                <div className="text-lg font-bold" style={{ color: val > 70 ? '#dc2626' : val > 50 ? '#ea580c' : '#16a34a' }}>{val}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* LEED RADAR TAB — NEW */}
                <TabsContent value="leed" className="space-y-4">
                  <LEEDRadarChart categories={analysisResult.landAssessment.categories} />
                </TabsContent>

                {/* SEASONAL CALENDAR TAB — NEW */}
                <TabsContent value="calendar" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base"><Calendar className="w-4 h-4 text-[#1a5d3c]" />Construction Season Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {seasonalCalendar.length > 0
                        ? <SeasonalCalendarView calendar={seasonalCalendar} />
                        : <div className="text-center py-6 text-slate-400 text-sm">Run analysis to generate construction calendar</div>
                      }
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* BEI TAB */}
                <TabsContent value="bei" className="space-y-4">
                  {beiResult
                    ? <BEICalculator bei={beiResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Zap className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm">أدخل بيانات المشروع وشغّل التحليل لحساب BEI</div></CardContent></Card>
                  }
                </TabsContent>

                {/* SOLAR ROI TAB */}
                <TabsContent value="solarroi" className="space-y-4">
                  {roiResult
                    ? <SolarROICalculator roi={roiResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Sun className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm">شغّل التحليل لحساب ROI الطاقة الشمسية بالريال العُماني</div></CardContent></Card>
                  }
                </TabsContent>

                {/* WATER DEMAND TAB */}
                <TabsContent value="water" className="space-y-4">
                  {waterResult
                    ? <WaterDemandCalculator water={waterResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Droplets className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm">شغّل التحليل لحساب الطلب على المياه وتوازن الموارد المائية</div></CardContent></Card>
                  }
                </TabsContent>

                {/* OPAL TAB */}
                <TabsContent value="opal" className="space-y-4">
                  {opalResult
                    ? <OPALMapping opal={opalResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm" dir="rtl">شغّل التحليل لعرض تصنيف OPAL الأخضر العُماني</div></CardContent></Card>
                  }
                </TabsContent>

                {/* COST TAB */}
                <TabsContent value="cost" className="space-y-4">
                  {costResult
                    ? <CostEstimatorView cost={costResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm" dir="rtl">شغّل التحليل لتقدير تكلفة البناء بالريال العُماني</div></CardContent></Card>
                  }
                </TabsContent>

                {/* CARBON ESG TAB */}
                <TabsContent value="carbon" className="space-y-4">
                  {carbonResult
                    ? <CarbonESGView carbon={carbonResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><LeafIcon className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm" dir="rtl">شغّل التحليل لحساب البصمة الكربونية وتقييم ESG</div></CardContent></Card>
                  }
                </TabsContent>

                {/* MATERIALS TAB */}
                <TabsContent value="materials" className="space-y-4">
                  {analysisResult
                    ? <MaterialsRecommender analysis={analysisResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Globe2 className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm" dir="rtl">شغّل التحليل لعرض توصيات المواد المحلية</div></CardContent></Card>
                  }
                </TabsContent>

                {/* SHARE TAB */}
                <TabsContent value="share" className="space-y-4">
                  {analysisResult
                    ? <SharePanel analysis={analysisResult} projectType={projectType} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Share2 className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm" dir="rtl">شغّل التحليل لمشاركة النتائج عبر واتساب أو QR Code</div></CardContent></Card>
                  }
                </TabsContent>

                {/* BATTERY STORAGE TAB */}
                <TabsContent value="battery" className="space-y-4">
                  {batteryResult
                    ? <BatteryStorageView battery={batteryResult} />
                    : <Card><CardContent className="p-8 text-center text-slate-400"><Battery className="w-10 h-10 mx-auto mb-2 opacity-30" /><div className="text-sm" dir="rtl">شغّل التحليل لحساب حجم البطارية المثالي والجدوى الاقتصادية</div></CardContent></Card>
                  }
                </TabsContent>

                {/* PORTFOLIO TAB */}
                <TabsContent value="portfolio" className="space-y-4">
                  <PortfolioManager analysis={analysisResult} projectType={projectType} projectGFA={projectGFA} projectFloors={projectFloors} />
                </TabsContent>

              </Tabs>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"><MapPin className="w-8 h-8 text-slate-400" /></div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Analysis Yet</h3>
                  <p className="text-slate-500 max-w-xs">Enter coordinates and click Analyze to see full sustainability data across 21 analysis tabs — completely free.</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {showReport && analysisResult && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <ReportPage analysis={analysisResult} onClose={function() { setShowReport(false); }} />
          </div>
        )}

        {/* Results Section */}
        {analysisResult && (
          <div ref={reportRef}>
            <div className="mt-12">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button onClick={function() { setShowReport(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #1a5d3c, #2d8f5e)' }}>
                  <FileText className="w-4 h-4" />View Full Report
                </button>
                <Button onClick={handlePdfExport} variant="outline" className="gap-2"><FileDown className="w-4 h-4" />Download PDF</Button>
                <Button onClick={handleCsvExport} variant="outline" className="gap-2"><FileSpreadsheet className="w-4 h-4" />Export CSV</Button>
                <PrintReportButton analysisResult={analysisResult} krookiMetadata={krookiMetadata} />
              </div>
              <LandAssessmentCard assessment={analysisResult.landAssessment} />
            </div>

            <div className="mt-12"><OBCRecommendations recommendations={analysisResult.obcRecommendations} /></div>
            <div className="mt-12"><FutureImprovements improvements={analysisResult.futureImprovements} /></div>

            {/* Regional Benchmarks */}
            {analysisResult.benchmarks && analysisResult.benchmarks.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Regional Benchmarks — Oman</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {analysisResult.benchmarks.map(function(b) {
                    var isMysite = b.region.includes('Your Site');
                    return (
                      <Card key={b.region} className={'border-2 ' + (isMysite ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-transparent')}>
                        <CardContent className="p-4">
                          <div className={'text-xs font-semibold mb-2 ' + (isMysite ? 'text-[#d4af37]' : 'text-slate-500')}>{b.region}</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Solar</span><span className="font-semibold">{b.solarPotential} kWh</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">CDD</span><span className="font-semibold">{b.coolingLoad.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Ventilation</span><span className="font-semibold">{b.ventilationScore}/100</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data Accuracy */}
            <div className="mt-12">
              <DataAccuracy items={buildDataAccuracyItems(!!analysisResult.solar, !!analysisResult.wind, !!analysisResult.soil, !!analysisResult.seismic)} />
            </div>
          </div>
        )}

        {/* Claude AI Panel */}
        {analysisResult && <div className="mt-8"><AIPanel analysis={analysisResult} /></div>}
      </div>
    </section>
  );
}
