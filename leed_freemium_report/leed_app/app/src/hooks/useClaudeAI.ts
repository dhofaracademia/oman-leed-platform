import { useState, useCallback, useRef } from 'react';
import type { AnalysisResult } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  lang?: 'ar' | 'en' | 'mixed';
  timestamp: Date;
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function buildLEEDContext(analysis: AnalysisResult): string {
  return `
LEED v4.1 Land Assessment Report — Oman
========================================
Location: ${analysis.location.lat.toFixed(4)}°N, ${analysis.location.lng.toFixed(4)}°E
Address: ${analysis.location.address || 'Oman'}
Date: ${analysis.analysisDate}

LEED SCORES:
- Current Land Score: ${analysis.landAssessment.currentScore} points
- Potential Additional Points: ${analysis.landAssessment.potentialScore}
- Maximum Achievable: ${analysis.landAssessment.maxPossibleScore} points
- Certification Level: ${
    analysis.landAssessment.maxPossibleScore >= 80 ? 'Platinum (80+)' :
    analysis.landAssessment.maxPossibleScore >= 60 ? 'Gold (60-79)' :
    analysis.landAssessment.maxPossibleScore >= 50 ? 'Silver (50-59)' :
    'Certified (40-49)'
  }

LEED CATEGORY BREAKDOWN:
${analysis.landAssessment.categories.map(c =>
  `- ${c.name}: ${c.currentPoints} current / ${c.possiblePoints} achievable (max ${c.maxPoints})`
).join('\n')}

SOLAR ANALYSIS (NASA POWER data):
- Daily GHI: ${analysis.solar.ghi} kWh/m²
- Daily DNI: ${analysis.solar.dni} kWh/m²
- Yearly GHI: ${analysis.solar.yearlyGHI} kWh/m²/year
- PV Production Potential: ${analysis.solar.pvProductionPotential} kWh/kWp/year
- Optimal Panel Tilt: ${analysis.solar.optimalTilt}°
- Dust Impact: ${analysis.solar.dustImpact} (${analysis.solar.dustImpactValue}% loss)

WIND ANALYSIS:
- Average Speed: ${analysis.wind.averageSpeed} m/s
- Max Speed: ${analysis.wind.maxSpeed} m/s
- Energy Density: ${analysis.wind.energyDensity} W/m²
- Prevailing Direction: ${analysis.wind.prevailingDirection}
- Turbine Suitability: ${analysis.wind.turbineSuitability}
- Viable Wind Hours: ${analysis.wind.annualHours} hrs/year

CLIMATE DATA:
- Climate Zone: ${analysis.climate.climateZone}
- Avg Temperature: ${analysis.climate.avgTemperature}°C
- Max Temperature: ${analysis.climate.maxTemperature}°C
- Min Temperature: ${analysis.climate.minTemperature}°C
- Humidity: ${analysis.climate.relativeHumidity}%
- Annual Rainfall: ${analysis.climate.rainfall} mm
- Sunshine Hours: ${analysis.climate.sunshineHours} hrs/year

SOIL ANALYSIS (SoilGrids data):
- Type: ${analysis.soil.type}
- Texture: ${analysis.soil.texture}
- Bearing Capacity: ${analysis.soil.bearingCapacity} kPa
- Drainage: ${analysis.soil.drainage}
- pH: ${analysis.soil.phLevel}
- Organic Carbon: ${analysis.soil.organicCarbon}%
- Contamination Risk: ${analysis.soil.contaminationRisk}

TOP OBC RECOMMENDATIONS:
${analysis.obcRecommendations.slice(0, 5).map(r =>
  `- ${r.title} (Priority: ${r.priority}, +${r.potentialScoreIncrease} LEED pts): ${r.description.slice(0, 100)}...`
).join('\n')}

TOP FUTURE IMPROVEMENTS:
${analysis.futureImprovements.slice(0, 4).map(i =>
  `- ${i.title} (+${i.leedPointsIncrease} pts, Cost: ${i.estimatedCost}, Payback: ${i.paybackPeriod})`
).join('\n')}
`.trim();
}

function buildSystemPrompt(analysis: AnalysisResult): string {
  return `You are an expert LEED v4.1 sustainability consultant and land assessment specialist for Oman, with deep knowledge of:
- LEED BD+C certification requirements and scoring
- Oman Building Code (OBC) and energy efficiency standards
- Middle East climate considerations and sustainable design
- Arabic and English bilingual communication

You have access to a detailed land assessment report for a specific parcel in Oman. Answer questions thoroughly in the same language the user writes in. If they write in Arabic, respond in Arabic. If English, respond in English.

Be specific, cite actual numbers from the data, and give actionable advice. When discussing LEED credits, reference specific credit names and point values from the report.

CURRENT ASSESSMENT DATA:
${buildLEEDContext(analysis)}`;
}

export function useClaudeAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const apiKeyRef = useRef<string>(import.meta.env.VITE_ANTHROPIC_API_KEY || '');

  const setApiKey = useCallback((key: string) => {
    apiKeyRef.current = key;
  }, []);

  const hasApiKey = useCallback(() => {
    return Boolean(apiKeyRef.current?.trim());
  }, []);

  const callClaude = useCallback(async (
    userMessage: string,
    analysis: AnalysisResult,
    history: ChatMessage[]
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const apiMessages = [
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: buildSystemPrompt(analysis),
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }, []);

  const sendMessage = useCallback(async (
    userContent: string,
    analysis: AnalysisResult
  ) => {
    setError(null);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const reply = await callClaude(userContent, analysis, messages);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  }, [messages, callClaude]);

  const generateArabicSummary = useCallback(async (
    analysis: AnalysisResult
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const prompt = `بناءً على بيانات تقييم الأرض التالية لقطعة أرض في سلطنة عُمان، اكتب ملخصاً تنفيذياً شاملاً باللغة العربية يتضمن:

1. **موقع القطعة ومواصفاتها**
2. **تقييم LEED v4.1** - الدرجة الحالية والمحتملة ومستوى الشهادة المتوقع
3. **الإمكانات البيئية** - الطاقة الشمسية، طاقة الرياح، المناخ
4. **خصائص التربة** وملاءمتها للبناء
5. **أبرز التوصيات** للحصول على أعلى تقييم LEED
6. **الاستثمارات ذات الأولوية** والعائد المتوقع
7. **الخلاصة والتوصية النهائية** حول جدوى المشروع

اجعل التقرير احترافياً ومناسباً للعرض على المستثمرين والجهات الحكومية في عُمان. استخدم المصطلحات الفنية العربية الصحيحة.`;

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: `أنت خبير استشاري في الاستدامة وتقييمات LEED v4.1 مع خبرة واسعة في سوق العقارات والبناء في سلطنة عُمان ودول الخليج العربي. تكتب تقارير تنفيذية احترافية بالعربية الفصحى.

بيانات التقييم:
${buildLEEDContext(analysis)}`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }, []);

  const generateAIRecommendations = useCallback(async (
    analysis: AnalysisResult
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const prompt = `Based on the land assessment data, provide 6 highly specific, prioritized AI-enhanced recommendations to maximize the LEED score for this Oman parcel. For each recommendation:

1. State the specific LEED credit targeted
2. Exact current points vs. achievable points
3. Specific technical specifications (actual numbers from the data)
4. Estimated implementation cost in OMR
5. ROI or LEED point-per-OMR efficiency

Format as structured recommendations in English, with the most impactful ones first. Be extremely specific — use the actual solar irradiance, wind speeds, soil data, and temperature values from the report.`;

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: buildSystemPrompt(analysis),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    error,
    sendMessage,
    generateArabicSummary,
    generateAIRecommendations,
    clearChat,
    setApiKey,
    hasApiKey,
  };
}
