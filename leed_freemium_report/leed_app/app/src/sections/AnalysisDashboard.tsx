import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon, Tooltip } from 'react-leaflet';
import { 
  MapPin, 
  Crosshair, 
  Search, 
  Sun, 
  Wind, 
  Thermometer,
  Navigation,
  AlertTriangle,
  Loader2,
  Upload,
  FileText,
  X,
  CheckCircle2,
  Printer,
  Ruler,
  Info,
  Plus,
  Trash2
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
import { useLEEDScoring } from '@/hooks/useLEEDScoring';
import type { Location, AnalysisResult } from '@/types';
import { LandAssessmentCard } from '@/components/LandAssessmentCard';
import { OBCRecommendations } from '@/components/OBCRecommendations';
import { FutureImprovements } from '@/components/FutureImprovements';
import { AIPanel } from '@/components/AIPanel';
import { ReportPage } from '@/components/ReportPage';
import { parseKrookiText, utmToLatLng, calculateUtmArea, formatUtmCoordinates } from '@/utils/krookiParser';

// Fix Leaflet default icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Oman boundary coordinates (simplified) - as tuple array for Leaflet
const OMAN_BOUNDARY: [number, number][] = [
  [26.5, 56.0],
  [26.5, 56.5],
  [26.0, 57.0],
  [25.5, 58.0],
  [25.0, 58.5],
  [24.5, 59.0],
  [24.0, 59.5],
  [23.5, 60.0],
  [23.0, 60.0],
  [22.0, 59.5],
  [21.0, 59.0],
  [20.0, 58.5],
  [19.0, 58.0],
  [18.0, 57.0],
  [17.0, 56.0],
  [16.5, 55.0],
  [16.5, 54.0],
  [17.0, 53.5],
  [18.0, 53.0],
  [19.0, 52.5],
  [20.0, 52.5],
  [21.0, 53.0],
  [22.0, 53.5],
  [23.0, 54.0],
  [24.0, 54.5],
  [25.0, 55.0],
  [26.0, 55.5],
  [26.5, 56.0],
];

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Accuracy Disclaimer Component
function AccuracyDisclaimer() {
  return (
    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Data Accuracy & Limitations</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li><strong>NASA POWER:</strong> 0.5° x 0.5° resolution (~55km). Data represents regional averages, not exact point measurements.</li>
            <li><strong>ISRIC SoilGrids:</strong> 250m resolution. Soil data is interpolated and may vary from actual site conditions.</li>
            <li><strong>LEED Assessment:</strong> Based on available data. Professional site survey required for certification.</li>
            <li><strong>Coordinates:</strong> UTM Zone 40N assumed for Oman. Verify zone for locations near borders.</li>
            <li><strong>Land Area:</strong> Calculated from coordinates. Survey-grade measurement recommended for legal purposes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Print Report Component
function PrintReportButton({ analysisResult, krookiMetadata }: { 
  analysisResult: AnalysisResult; 
  krookiMetadata: { planNumber?: string; wilayat?: string; area?: number } | null;
}) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date().toLocaleDateString('en-OM', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>UrbanEX Land Analysis Report</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #1a5d3c; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1a5d3c; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #1a5d3c; border-bottom: 2px solid #d4af37; padding-bottom: 8px; font-size: 18px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #64748b; }
          .card .value { font-size: 24px; font-weight: bold; color: #1a5d3c; }
          .card .unit { font-size: 14px; color: #94a3b8; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-yellow { background: #fef9c3; color: #854d0e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .recommendation { background: #f8fafc; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #1a5d3c; }
          .recommendation h4 { margin: 0 0 8px 0; color: #1a5d3c; }
          .recommendation p { margin: 0; font-size: 13px; color: #475569; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
          .accuracy-note { background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; }
          .accuracy-note h4 { color: #92400e; margin: 0 0 8px 0; }
          .accuracy-note ul { margin: 0; padding-left: 20px; }
          .accuracy-note li { margin-bottom: 4px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UrbanEX Land Sustainability Report</h1>
          <p>Comprehensive Land Analysis for Green Building Assessment</p>
          <p>Report Date: ${date}</p>
          ${krookiMetadata?.planNumber ? `<p>Plan Number: ${krookiMetadata.planNumber}</p>` : ''}
          ${krookiMetadata?.wilayat ? `<p>Wilayat: ${krookiMetadata.wilayat}</p>` : ''}
        </div>

        <div class="section">
          <h2>Location Information</h2>
          <div class="grid">
            <div class="card">
              <h3>Coordinates (WGS84)</h3>
              <div class="value">${analysisResult.location.lat.toFixed(6)}, ${analysisResult.location.lng.toFixed(6)}</div>
            </div>
            <div class="card">
              <h3>UTM Zone 40N</h3>
              <div class="value">${formatUtmCoordinates(
                utmToLatLng(analysisResult.location.lat, analysisResult.location.lng).lat,
                utmToLatLng(analysisResult.location.lat, analysisResult.location.lng).lng
              )}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>LEED Assessment Summary</h2>
          <div class="grid">
            <div class="card">
              <h3>Current Land Score</h3>
              <div class="value">${analysisResult.landAssessment.currentScore} <span class="unit">/ 110</span></div>
            </div>
            <div class="card">
              <h3>Potential Score</h3>
              <div class="value">+${analysisResult.landAssessment.potentialScore} <span class="unit">pts</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Climate Data (NASA POWER)</h2>
          <div class="grid">
            <div class="card">
              <h3>Average Temperature</h3>
              <div class="value">${analysisResult.climate.avgTemperature} <span class="unit">°C</span></div>
            </div>
            <div class="card">
              <h3>Relative Humidity</h3>
              <div class="value">${analysisResult.climate.relativeHumidity} <span class="unit">%</span></div>
            </div>
            <div class="card">
              <h3>Annual Rainfall</h3>
              <div class="value">${analysisResult.climate.rainfall} <span class="unit">mm</span></div>
            </div>
            <div class="card">
              <h3>Sunshine Hours</h3>
              <div class="value">${analysisResult.climate.sunshineHours} <span class="unit">hrs/yr</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Solar Analysis</h2>
          <div class="grid">
            <div class="card">
              <h3>Yearly GHI</h3>
              <div class="value">${analysisResult.solar.yearlyGHI} <span class="unit">kWh/m²/yr</span></div>
            </div>
            <div class="card">
              <h3>PV Production Potential</h3>
              <div class="value">${analysisResult.solar.pvProductionPotential} <span class="unit">kWh/kWp/yr</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Wind Analysis</h2>
          <div class="grid">
            <div class="card">
              <h3>Average Wind Speed</h3>
              <div class="value">${analysisResult.wind.averageSpeed} <span class="unit">m/s</span></div>
            </div>
            <div class="card">
              <h3>Turbine Suitability</h3>
              <span class="badge badge-${analysisResult.wind.turbineSuitability === 'excellent' || analysisResult.wind.turbineSuitability === 'good' ? 'green' : analysisResult.wind.turbineSuitability === 'moderate' ? 'yellow' : 'red'}">${analysisResult.wind.turbineSuitability}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Soil Analysis (ISRIC)</h2>
          <div class="grid">
            <div class="card">
              <h3>Soil Type</h3>
              <div class="value" style="font-size: 18px;">${analysisResult.soil.type}</div>
            </div>
            <div class="card">
              <h3>Bearing Capacity</h3>
              <div class="value">${analysisResult.soil.bearingCapacity} <span class="unit">kPa</span></div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Top Recommendations</h2>
          ${analysisResult.obcRecommendations.slice(0, 5).map(rec => `
            <div class="recommendation">
              <h4>${rec.title} <span style="color: #d4af37;">(+${rec.potentialScoreIncrease} pts)</span></h4>
              <p>${rec.description}</p>
              <p style="margin-top: 8px; font-size: 11px; color: #64748b;">
                <strong>Phase:</strong> ${rec.implementationPhase} | 
                <strong>Priority:</strong> ${rec.priority} | 
                <strong>Cost:</strong> ${rec.implementationCost}
              </p>
            </div>
          `).join('')}
        </div>

        <div class="accuracy-note">
          <h4>Data Accuracy & Limitations</h4>
          <ul>
            <li><strong>NASA POWER:</strong> 0.5° x 0.5° resolution (~55km). Regional averages, not exact point measurements.</li>
            <li><strong>ISRIC SoilGrids:</strong> 250m resolution. Interpolated data may vary from actual conditions.</li>
            <li><strong>LEED Assessment:</strong> Preliminary assessment only. Professional site survey required for certification.</li>
            <li><strong>Coordinates:</strong> UTM Zone 40N assumed. Verify for locations near borders.</li>
          </ul>
        </div>

        <div class="footer">
          <p>Generated by UrbanEX.om - Developed by Dr. Tariq Al Amri</p>
          <p>Report ID: ${Date.now().toString(36).toUpperCase()}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #1a5d3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            Print Report
          </button>
        </div>
      </body>
      </html>
    `;

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

// Manual Polygon Input Component
function ManualPolygonInput({ 
  onPolygonComplete 
}: { 
  onPolygonComplete: (coords: { northing: number; easting: number }[], polygon: [number, number][]) => void 
}) {
  const [points, setPoints] = useState<{ northing: string; easting: string }[]>([
    { northing: '', easting: '' },
    { northing: '', easting: '' },
    { northing: '', easting: '' },
    { northing: '', easting: '' },
  ]);

  const updatePoint = (index: number, field: 'northing' | 'easting', value: string) => {
    const newPoints = [...points];
    newPoints[index][field] = value;
    setPoints(newPoints);
  };

  const addPoint = () => {
    setPoints([...points, { northing: '', easting: '' }]);
  };

  const removePoint = (index: number) => {
    if (points.length > 3) {
      setPoints(points.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const validPoints = points
      .filter(p => p.northing && p.easting)
      .map(p => ({
        northing: parseFloat(p.northing),
        easting: parseFloat(p.easting),
      }));

    if (validPoints.length < 3) {
      alert('Please enter at least 3 valid coordinate points');
      return;
    }

    const polygon: [number, number][] = validPoints.map(p => {
      const latLng = utmToLatLng(p.northing, p.easting);
      return [latLng.lat, latLng.lng];
    });

    onPolygonComplete(validPoints, polygon);
  };

  const calculatedArea = (() => {
    const validPoints = points
      .filter(p => p.northing && p.easting)
      .map(p => ({
        northing: parseFloat(p.northing),
        easting: parseFloat(p.easting),
      }));
    if (validPoints.length < 3) return 0;
    return calculateUtmArea(validPoints);
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Enter UTM coordinates (minimum 3 points)</p>
        <Button onClick={addPoint} variant="outline" size="sm" className="gap-1">
          <Plus className="w-3 h-3" />
          Add Point
        </Button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {points.map((point, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-6">{index + 1}</span>
            <Input
              type="number"
              placeholder="NORTHING"
              value={point.northing}
              onChange={(e) => updatePoint(index, 'northing', e.target.value)}
              className="flex-1 text-sm"
            />
            <Input
              type="number"
              placeholder="EASTING"
              value={point.easting}
              onChange={(e) => updatePoint(index, 'easting', e.target.value)}
              className="flex-1 text-sm"
            />
            {points.length > 3 && (
              <button
                onClick={() => removePoint(index)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {calculatedArea > 0 && (
        <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
          <div className="flex items-center gap-2 text-sm">
            <Ruler className="w-4 h-4 text-[#1a5d3c]" />
            <span className="text-slate-600">Calculated Area:</span>
            <span className="font-semibold text-[#1a5d3c]">
              {calculatedArea.toLocaleString()} m²
            </span>
            <span className="text-slate-400">
              ({(calculatedArea / 10000).toFixed(2)} ha)
            </span>
          </div>
        </div>
      )}

      <Button 
        onClick={handleSubmit}
        className="w-full bg-[#1a5d3c] hover:bg-[#143d29]"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Draw Land Polygon
      </Button>
    </div>
  );
}

// Krooki Upload Component
function KrookiUploader({ 
  onCoordinatesDetected,
  onPolygonDetected,
}: { 
  onCoordinatesDetected: (lat: number, lng: number, metadata?: { planNumber?: string; wilayat?: string; area?: number }) => void;
  onPolygonDetected?: (polygon: [number, number][], area: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showPolygonInput, setShowPolygonInput] = useState(false);
  const [manualNorthing, setManualNorthing] = useState('');
  const [manualEasting, setManualEasting] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG)');
      return;
    }
    
    setUploadedFile(file);
    setIsProcessing(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowManualInput(true);
    }, 1000);
  };

  const handleManualSubmit = () => {
    const northing = parseFloat(manualNorthing);
    const easting = parseFloat(manualEasting);
    
    if (isNaN(northing) || isNaN(easting)) {
      alert('Please enter valid UTM coordinates');
      return;
    }
    
    const { lat, lng } = utmToLatLng(northing, easting);
    onCoordinatesDetected(lat, lng, {
      planNumber: 'Manual Entry',
      wilayat: 'Unknown',
      area: 0,
    });
  };

  const handleTextExtract = () => {
    if (!extractedText.trim()) return;
    
    const krookiData = parseKrookiText(extractedText);
    if (krookiData) {
      onCoordinatesDetected(krookiData.centerPoint.lat, krookiData.centerPoint.lng, {
        planNumber: krookiData.planNumber,
        wilayat: krookiData.wilayat,
        area: krookiData.area,
      });
      if (onPolygonDetected && krookiData.polygon.length >= 3) {
        onPolygonDetected(krookiData.polygon, krookiData.area);
      }
    } else {
      alert('Could not parse coordinates from the text. Please check the format or enter manually.');
    }
  };

  const handlePolygonComplete = (coords: { northing: number; easting: number }[], polygon: [number, number][]) => {
    const area = calculateUtmArea(coords);
    if (onPolygonDetected) {
      onPolygonDetected(polygon, area);
    }
    // Calculate center
    const avgNorthing = coords.reduce((sum, c) => sum + c.northing, 0) / coords.length;
    const avgEasting = coords.reduce((sum, c) => sum + c.easting, 0) / coords.length;
    const { lat, lng } = utmToLatLng(avgNorthing, avgEasting);
    onCoordinatesDetected(lat, lng, {
      planNumber: 'Manual Polygon',
      wilayat: 'Unknown',
      area,
    });
    setShowPolygonInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-[#1a5d3c] bg-[#1a5d3c]/5' 
            : 'border-slate-300 hover:border-[#1a5d3c]/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">
          Upload Krooki / Plan Image
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Drag & drop or click to select
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports JPG, PNG
        </p>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-[#1a5d3c]" />
          <span className="text-sm text-slate-600">Processing image...</span>
        </div>
      )}

      {/* Extracted File */}
      {uploadedFile && !isProcessing && (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <FileText className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800 flex-1 truncate">{uploadedFile.name}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setShowManualInput(false); }}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Options Tabs */}
      <div className="flex gap-2">
        <Button
          variant={showManualInput && !showPolygonInput ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setShowManualInput(true); setShowPolygonInput(false); }}
          className={showManualInput && !showPolygonInput ? 'bg-[#1a5d3c]' : ''}
        >
          Single Point
        </Button>
        <Button
          variant={showPolygonInput ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setShowPolygonInput(true); setShowManualInput(false); }}
          className={showPolygonInput ? 'bg-[#1a5d3c]' : ''}
        >
          <Ruler className="w-3 h-3 mr-1" />
          Land Polygon
        </Button>
      </div>

      {/* Single Point Input */}
      {showManualInput && !showPolygonInput && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <p className="text-sm font-medium text-slate-700">Enter UTM Coordinates (WGS 84)</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">NORTHING</Label>
              <Input
                type="number"
                placeholder="e.g. 1880419"
                value={manualNorthing}
                onChange={(e) => setManualNorthing(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">EASTING</Label>
              <Input
                type="number"
                placeholder="e.g. 255925"
                value={manualEasting}
                onChange={(e) => setManualEasting(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleManualSubmit}
            className="w-full bg-[#1a5d3c] hover:bg-[#143d29]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Apply Coordinates
          </Button>
        </div>
      )}

      {/* Polygon Input */}
      {showPolygonInput && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <ManualPolygonInput onPolygonComplete={handlePolygonComplete} />
        </div>
      )}

      {/* Text Extraction Option */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
        <p className="text-sm font-medium text-slate-700">Or paste extracted text</p>
        <textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          placeholder="Paste text from krooki here... (UTM GRID, NORTHING, EASTING values)"
          className="w-full h-24 p-3 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-[#1a5d3c]/20 focus:border-[#1a5d3c]"
        />
        <Button 
          onClick={handleTextExtract}
          disabled={!extractedText.trim()}
          variant="outline"
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          Extract from Text
        </Button>
      </div>
    </div>
  );
}

export function AnalysisDashboard() {
  const [location, setLocation] = useState<Location>({ lat: 23.5859, lng: 58.4059 }); // Muscat default
  const [inputLat, setInputLat] = useState('23.5859');
  const [inputLng, setInputLng] = useState('58.4059');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState('climate');
  const [krookiMetadata, setKrookiMetadata] = useState<{ planNumber?: string; wilayat?: string; area?: number } | null>(null);
  const [landPolygon, setLandPolygon] = useState<[number, number][] | null>(null);
  const [polygonArea, setPolygonArea] = useState<number>(0);

  const { loading, error, fetchAllData } = useClimateData();
  const { calculateAssessment, generateOBCRecommendations, generateFutureImprovements } = useLEEDScoring();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
    setInputLat(lat.toFixed(6));
    setInputLng(lng.toFixed(6));
    setKrookiMetadata(null);
  }, []);

  const handleKrookiCoordinates = (lat: number, lng: number, metadata?: { planNumber?: string; wilayat?: string; area?: number }) => {
    setLocation({ lat, lng });
    setInputLat(lat.toFixed(6));
    setInputLng(lng.toFixed(6));
    if (metadata) {
      setKrookiMetadata(metadata);
    }
  };

  const handlePolygonDetected = (polygon: [number, number][], area: number) => {
    setLandPolygon(polygon);
    setPolygonArea(area);
  };

  const handleManualCoordinateChange = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({ lat, lng });
      setKrookiMetadata(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setInputLat(latitude.toFixed(6));
          setInputLng(longitude.toFixed(6));
          setKrookiMetadata(null);
        },
        (err) => {
          console.error('Geolocation error:', err);
          alert('Unable to get your location. Please enter coordinates manually.');
        }
      );
    }
  };

  const handleAnalyze = async () => {
    try {
      const climateData = await fetchAllData(location);
      const inp = {
        location: location,
        solar: climateData.solar,
        wind: climateData.wind,
        climate: climateData.climate,
        rainfall: climateData.rainfall,
        soil: climateData.soil,
        seismic: climateData.seismic,
      };
      const landAssessment = calculateAssessment(inp);
      const obcRecommendations = generateOBCRecommendations(inp, landAssessment.categoryDetails);
      const futureImprovements = generateFutureImprovements(inp);

      const result: AnalysisResult = {
        location,
        solar: climateData.solar,
        wind: climateData.wind,
        climate: climateData.climate,
        rainfall: climateData.rainfall,
        soil: climateData.soil,
        seismic: climateData.seismic,
        landAssessment,
        obcRecommendations,
        futureImprovements,
        benchmarks: landAssessment.benchmarks,
        analysisDate: new Date().toISOString(),
      };

      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  useEffect(() => {
    handleManualCoordinateChange();
  }, [inputLat, inputLng]);

  const getDustImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTurbineSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section id="analysis" className="py-20 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Land Sustainability Analysis
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload a krooki/plan image or enter coordinates manually to analyze land status. 
            Recommendations show potential LEED points achievable during design and construction phases.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Krooki Upload */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Krooki / Plan
                </h3>
                <KrookiUploader onCoordinatesDetected={handleKrookiCoordinates} onPolygonDetected={handlePolygonDetected} />
              </div>

              {/* Right: Manual Input */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Manual Coordinates
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Latitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={inputLat}
                        onChange={(e) => setInputLat(e.target.value)}
                        placeholder="23.5859"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Longitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={inputLng}
                        onChange={(e) => setInputLng(e.target.value)}
                        placeholder="58.4059"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleUseCurrentLocation}
                    variant="outline"
                    className="w-full"
                  >
                    <Crosshair className="w-4 h-4 mr-2" />
                    Use My Current Location
                  </Button>

                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full bg-[#1a5d3c] hover:bg-[#143d29] h-12"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze Land
                      </>
                    )}
                  </Button>
                </div>

                {/* Krooki Metadata Display */}
                {krookiMetadata && (
                  <div className="mt-4 p-4 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                    <p className="text-xs text-[#1a5d3c] font-medium mb-1">Krooki Data Detected</p>
                    {krookiMetadata.planNumber && (
                      <p className="text-sm text-slate-700">Plan: {krookiMetadata.planNumber}</p>
                    )}
                    {krookiMetadata.wilayat && (
                      <p className="text-sm text-slate-700">Wilayat: {krookiMetadata.wilayat}</p>
                    )}
                    {(krookiMetadata.area && krookiMetadata.area > 0) || polygonArea > 0 ? (
                      <p className="text-sm text-slate-700">
                        Area: {(krookiMetadata.area || polygonArea).toLocaleString()} m²
                        ({((krookiMetadata.area || polygonArea) / 10000).toFixed(2)} ha)
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Accuracy Disclaimer */}
            <AccuracyDisclaimer />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="h-[500px] lg:h-[600px] overflow-hidden">
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={8}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polygon
                  positions={OMAN_BOUNDARY}
                  pathOptions={{ color: '#1a5d3c', weight: 2, fillOpacity: 0.05 }}
                >
                  <Tooltip>Oman Boundary</Tooltip>
                </Polygon>
                {landPolygon && landPolygon.length >= 3 && (
                  <Polygon
                    positions={landPolygon}
                    pathOptions={{ color: '#d4af37', weight: 3, fillOpacity: 0.2 }}
                  >
                    <Tooltip>Land Boundary ({polygonArea.toLocaleString()} m²)</Tooltip>
                  </Polygon>
                )}
                <Marker position={[location.lat, location.lng]}>
                  <Tooltip>Selected Location</Tooltip>
                </Marker>
                <MapClickHandler onMapClick={handleMapClick} />
              </MapContainer>
            </Card>
          </div>

          {/* Data Panel */}
          <div className="lg:col-span-2">
            {analysisResult ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="climate">Climate</TabsTrigger>
                  <TabsTrigger value="solar">Solar</TabsTrigger>
                  <TabsTrigger value="wind">Wind</TabsTrigger>
                  <TabsTrigger value="soil">Soil</TabsTrigger>
                </TabsList>

                {/* Climate Tab */}
                <TabsContent value="climate" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Thermometer className="w-5 h-5 text-[#1a5d3c]" />
                        Climate Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Avg Temperature</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.climate.avgTemperature}°C
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Humidity</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.climate.relativeHumidity}%
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Max Temp</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.climate.maxTemperature}°C
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Min Temp</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.climate.minTemperature}°C
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Annual Rainfall</div>
                        <div className="text-xl font-bold text-slate-900">
                          {analysisResult.climate.rainfall} mm
                        </div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-sm text-[#1a5d3c] font-medium">Climate Zone</div>
                        <div className="text-base font-semibold text-slate-900">
                          {analysisResult.climate.climateZone}
                        </div>
                      </div>
                      <div className="p-3 bg-[#d4af37]/10 rounded-lg border border-[#d4af37]/30">
                        <div className="text-sm text-[#d4af37] font-medium flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Sunshine Hours
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {analysisResult.climate.sunshineHours}
                          <span className="text-sm font-normal text-slate-500 ml-1">hrs/year</span>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700">
                          <Info className="w-3 h-3 inline mr-1" />
                          Data source: NASA POWER (0.5° resolution). Regional averages, not exact point measurements.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Solar Tab */}
                <TabsContent value="solar" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sun className="w-5 h-5 text-[#d4af37]" />
                        Solar Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">GHI (Daily)</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.solar.ghi}
                            <span className="text-sm font-normal text-slate-500 ml-1">kWh/m²</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">DNI (Daily)</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.solar.dni}
                            <span className="text-sm font-normal text-slate-500 ml-1">kWh/m²</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-[#d4af37]/10 rounded-lg border border-[#d4af37]/30">
                        <div className="text-sm text-[#d4af37] font-medium">Yearly GHI</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {analysisResult.solar.yearlyGHI}
                          <span className="text-sm font-normal text-slate-500 ml-1">kWh/m²/year</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Optimal Tilt</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.solar.optimalTilt}°
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Azimuth</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.solar.optimalAzimuth}°
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-[#1a5d3c]/5 rounded-lg border border-[#1a5d3c]/20">
                        <div className="text-sm text-[#1a5d3c] font-medium">PV Production Potential</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {analysisResult.solar.pvProductionPotential}
                          <span className="text-sm font-normal text-slate-500 ml-1">kWh/kWp/year</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="text-sm text-slate-500">Dust Impact</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {analysisResult.solar.dustImpactValue}% loss
                          </div>
                        </div>
                        <Badge className={getDustImpactColor(analysisResult.solar.dustImpact)}>
                          {analysisResult.solar.dustImpact}
                        </Badge>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700">
                          <Info className="w-3 h-3 inline mr-1" />
                          Data source: NASA POWER satellite data. ±5-10% accuracy for solar resource assessment.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Wind Tab */}
                <TabsContent value="wind" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Wind className="w-5 h-5 text-blue-500" />
                        Wind Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Avg Speed</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.wind.averageSpeed}
                            <span className="text-sm font-normal text-slate-500 ml-1">m/s</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Max Speed</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.wind.maxSpeed}
                            <span className="text-sm font-normal text-slate-500 ml-1">m/s</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-600 font-medium">Energy Density</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {analysisResult.wind.energyDensity}
                          <span className="text-sm font-normal text-slate-500 ml-1">W/m²</span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          Prevailing Direction
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {analysisResult.wind.prevailingDirection}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Viable Wind Hours</div>
                        <div className="text-xl font-bold text-slate-900">
                          {analysisResult.wind.annualHours}
                          <span className="text-sm font-normal text-slate-500 ml-1">hrs/year</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="text-sm text-slate-500">Turbine Suitability</div>
                          <div className="text-lg font-semibold text-slate-900 capitalize">
                            {analysisResult.wind.turbineSuitability}
                          </div>
                        </div>
                        <Badge className={getTurbineSuitabilityColor(analysisResult.wind.turbineSuitability)}>
                          {analysisResult.wind.turbineSuitability}
                        </Badge>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700">
                          <Info className="w-3 h-3 inline mr-1" />
                          Data source: NASA POWER (10m height). Local terrain effects not accounted for.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Soil Tab */}
                <TabsContent value="soil" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5 text-amber-600" />
                        Soil Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-sm text-amber-700 font-medium">Soil Type</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {analysisResult.soil.type}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Texture</div>
                        <div className="text-base font-medium text-slate-900">
                          {analysisResult.soil.texture}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Bearing Capacity</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.soil.bearingCapacity}
                            <span className="text-sm font-normal text-slate-500 ml-1">kPa</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">pH Level</div>
                          <div className="text-xl font-bold text-slate-900">
                            {analysisResult.soil.phLevel}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500">Organic Carbon</div>
                        <div className="text-xl font-bold text-slate-900">
                          {analysisResult.soil.organicCarbon}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Drainage</div>
                          <div className="text-lg font-semibold text-slate-900 capitalize">
                            {analysisResult.soil.drainage}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-500">Contamination Risk</div>
                          <Badge 
                            variant={analysisResult.soil.contaminationRisk === 'low' ? 'default' : 'destructive'}
                            className="mt-1 capitalize"
                          >
                            {analysisResult.soil.contaminationRisk}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs text-amber-700">
                          <Info className="w-3 h-3 inline mr-1" />
                          Data source: ISRIC SoilGrids (250m resolution). Interpolated data - site survey recommended for foundation design.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-slate-500 max-w-xs">
                    Upload a krooki or enter coordinates and click "Analyze" to see detailed sustainability data.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {showReport && analysisResult && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <ReportPage analysis={analysisResult} onClose={() => setShowReport(false)} />
          </div>
        )}

        {/* Land Assessment Section */}
        {analysisResult && (
          <div className="mt-12 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-[1.03] active:scale-95"
                style={{ background: "linear-gradient(135deg, #1a5d3c, #2d8f5e)", fontFamily: "sans-serif" }}
              >
                <span>📄</span>
                View Freemium Report
              </button>
              <PrintReportButton analysisResult={analysisResult} krookiMetadata={krookiMetadata} />
            </div>
            <LandAssessmentCard assessment={analysisResult.landAssessment} />
          </div>
        )}

        {/* OBC Recommendations */}
        {analysisResult && (
          <div className="mt-12 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <OBCRecommendations recommendations={analysisResult.obcRecommendations} />
          </div>
        )}

        {/* Future Improvements */}
        {analysisResult && (
          <div className="mt-12 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <FutureImprovements improvements={analysisResult.futureImprovements} />
          </div>
        )}

        {/* Claude AI Panel */}
        {analysisResult && (
          <div className="animate-fade-up" style={{ animationDelay: '600ms' }}>
            <AIPanel analysis={analysisResult} />
          </div>
        )}
      </div>
    </section>
  );
}
