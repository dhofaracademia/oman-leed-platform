import { useState } from 'react';
import type { AnalysisResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, QrCode, Copy, Check, MessageSquare } from 'lucide-react';

interface SharePanelProps {
  analysis: AnalysisResult;
  projectType?: string;
}

function getLEEDLabel(score: number): string {
  if (score >= 80) return 'بلاتيني';
  if (score >= 60) return 'ذهبي';
  if (score >= 50) return 'فضي';
  if (score >= 40) return 'معتمد';
  return 'تحت الحد الأدنى';
}

export function SharePanel({ analysis, projectType }: SharePanelProps) {
  var _copied = useState(false); var copied = _copied[0], setCopied = _copied[1];
  var _qr = useState(false); var showQR = _qr[0], setShowQR = _qr[1];

  var a = analysis;
  var leedLabel = getLEEDLabel(a.landAssessment.maxPossibleScore);

  var waText = [
    'تقرير OmanSustain — تقييم الأرض',
    'الإحداثيات: ' + a.location.lat.toFixed(4) + 'N, ' + a.location.lng.toFixed(4) + 'E',
    '',
    'درجة LEED v4.1: ' + a.landAssessment.maxPossibleScore + '/110 (' + leedLabel + ')',
    '',
    'الطاقة الشمسية (PVGIS): ' + a.solar.pvProductionPotential + ' kWh/kWp/yr',
    'متوسط الرياح (ERA5): ' + a.wind.averageSpeed + ' m/s · اتجاه ' + a.wind.prevailingDirection,
    'درجة الحرارة: ' + a.climate.avgTemperature + 'C | CDD: ' + a.climate.cdd.toLocaleString(),
    'نوع التربة: ' + a.soil.type,
    'المنطقة الزلزالية: ' + a.seismic.zone,
    'مخاطر الوادي: ' + a.rainfall.wadiFloodRisk,
    '',
    'U-value الجدار: ' + a.climate.recommendedUValues.wall + ' W/m²K (OEESC)',
    'إنتاجية PV: ' + a.solar.pvProductionPotential + ' kWh/kWp/yr | ميل: ' + a.solar.optimalTilt + 'deg',
    '',
    'تم التحليل بواسطة OmanSustain — dhofaracademia.github.io/oman-leed-platform',
  ].join('\n');

  var summaryText = [
    'OmanSustain Report | ' + a.location.lat.toFixed(4) + 'N, ' + a.location.lng.toFixed(4) + 'E',
    'LEED: ' + a.landAssessment.maxPossibleScore + ' (' + leedLabel + ')',
    'Solar: ' + a.solar.pvProductionPotential + ' kWh/kWp/yr',
    'Wind: ' + a.wind.averageSpeed + 'm/s ' + a.wind.prevailingDirection,
    'CDD: ' + a.climate.cdd + ' | Seismic: ' + a.seismic.zone,
    'Soil: ' + a.soil.type,
    'Source: OmanSustain LEED v4.1 Platform',
  ].join(' | ');

  var qrData = encodeURIComponent('https://dhofaracademia.github.io/oman-leed-platform/?lat=' + a.location.lat.toFixed(4) + '&lng=' + a.location.lng.toFixed(4) + '&score=' + a.landAssessment.maxPossibleScore);
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + qrData + '&bgcolor=f0f4f0&color=1a5d3c&margin=10';

  var handleWhatsApp = function() {
    window.open('https://wa.me/?text=' + encodeURIComponent(waText), '_blank');
  };

  var handleCopy = function() {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  };

  return (
    <div className="space-y-4" dir="rtl">

      <div className="p-4 bg-[#1a5d3c]/5 rounded-xl border border-[#1a5d3c]/20">
        <div className="text-xs text-[#1a5d3c] font-bold mb-1">ملخص التقرير</div>
        <div className="text-sm text-slate-700 leading-loose">
          <strong>درجة LEED:</strong> {a.landAssessment.maxPossibleScore}/110 ({leedLabel}) ·
          <strong> الشمس:</strong> {a.solar.pvProductionPotential} kWh/kWp/yr ·
          <strong> CDD:</strong> {a.climate.cdd.toLocaleString()} ·
          <strong> التربة:</strong> {a.soil.type} ·
          <strong> الزلازل:</strong> {a.seismic.zone}
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleWhatsApp}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 h-12"
        >
          <MessageSquare className="w-5 h-5" />
          <div className="text-right">
            <div className="text-sm font-bold">شارك واتساب</div>
            <div className="text-xs opacity-80">ملخص عربي كامل</div>
          </div>
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="gap-2 h-12"
        >
          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          <div className="text-right">
            <div className="text-sm font-bold">{copied ? 'تم النسخ' : 'نسخ الملخص'}</div>
            <div className="text-xs text-slate-500">للبريد الإلكتروني</div>
          </div>
        </Button>
      </div>

      {/* QR Code */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#1a5d3c]" />
              رمز QR للتقرير
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={function() { setShowQR(!showQR); }}
              className="text-xs h-7"
            >
              {showQR ? 'إخفاء' : 'عرض QR'}
            </Button>
          </div>
        </CardHeader>
        {showQR && (
          <CardContent className="flex flex-col items-center gap-3">
            <img
              src={qrUrl}
              alt="QR Code"
              className="rounded-xl border border-slate-200 shadow"
              width={200}
              height={200}
            />
            <div className="text-xs text-slate-500 text-center">
              الصق هذا الرمز على المخططات الورقية للوصول المباشر للتقرير الرقمي
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={function() {
                var a2 = document.createElement('a');
                a2.href = qrUrl;
                a2.download = 'omansustain-qr.png';
                a2.click();
              }}
            >
              تحميل رمز QR
            </Button>
          </CardContent>
        )}
      </Card>

      {/* WhatsApp message preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">معاينة رسالة واتساب</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-slate-600 bg-green-50 p-3 rounded-lg border border-green-100 whitespace-pre-wrap leading-relaxed font-sans" dir="rtl">
            {waText}
          </pre>
        </CardContent>
      </Card>

    </div>
  );
}
