import { useState, useCallback, useRef } from 'react';
import type { AnalysisResult } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// ─── Try direct then CORS proxy ──────────────────────────────────────────────
async function callAnthropicAPI(apiKey: string, body: object): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };

  // Try direct call first
  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    // If we get any HTTP response (even error), return it
    if (res.status !== 0) return res;
  } catch {
    // Network/CORS block — fall through to proxy
  }

  // Fallback: CORS proxy
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(CLAUDE_API_URL);
  return fetch(proxyUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ─── Context builders ────────────────────────────────────────────────────────
function buildLEEDContext(analysis: AnalysisResult): string {
  return `
LEED v4.1 Land Assessment — Oman
Location: ${analysis.location.lat.toFixed(4)}°N, ${analysis.location.lng.toFixed(4)}°E
Address: ${analysis.location.address || 'Oman'}
Date: ${analysis.analysisDate}

LEED SCORES:
- Current Land Score: ${analysis.landAssessment.currentScore} pts
- Potential Additional: ${analysis.landAssessment.potentialScore} pts
- Maximum Achievable: ${analysis.landAssessment.maxPossibleScore} pts
- Certification Level: ${
    analysis.landAssessment.maxPossibleScore >= 80 ? 'Platinum (80+)' :
    analysis.landAssessment.maxPossibleScore >= 60 ? 'Gold (60-79)' :
    analysis.landAssessment.maxPossibleScore >= 50 ? 'Silver (50-59)' :
    'Certified (40-49)'
  }

LEED CATEGORIES:
${analysis.landAssessment.categories.map(c =>
  `  ${c.name}: ${c.currentPoints} now / ${c.possiblePoints} achievable / ${c.maxPoints} max`
).join('\n')}

SOLAR (${(analysis.solar as SolarData & { dataSource?: string }).dataSource || 'NASA POWER'}):
- Daily GHI: ${analysis.solar.ghi} kWh/m²  |  DNI: ${analysis.solar.dni} kWh/m²
- Yearly GHI: ${analysis.solar.yearlyGHI} kWh/m²/yr
- PV Potential: ${analysis.solar.pvProductionPotential} kWh/kWp/yr
- Optimal Tilt: ${analysis.solar.optimalTilt}°  |  Dust Loss: ${analysis.solar.dustImpactValue}%

WIND:
- Average: ${analysis.wind.averageSpeed} m/s  |  Max: ${analysis.wind.maxSpeed} m/s
- Energy Density: ${analysis.wind.energyDensity} W/m²
- Suitability: ${analysis.wind.turbineSuitability}  |  Direction: ${analysis.wind.prevailingDirection}

CLIMATE:
- Zone: ${analysis.climate.climateZone}
- Avg Temp: ${analysis.climate.avgTemperature}°C  |  Max: ${analysis.climate.maxTemperature}°C
- Humidity: ${analysis.climate.relativeHumidity}%  |  Rainfall: ${analysis.climate.rainfall} mm/yr

SOIL (${(analysis.soil as SoilData & { dataSource?: string }).dataSource || 'SoilGrids'}):
- Type: ${analysis.soil.type}
- Texture: ${analysis.soil.texture}
- pH: ${analysis.soil.phLevel}  |  Bearing: ${analysis.soil.bearingCapacity} kPa
- Drainage: ${analysis.soil.drainage}  |  Contamination: ${analysis.soil.contaminationRisk}

TOP RECOMMENDATIONS:
${analysis.obcRecommendations.slice(0, 4).map(r =>
  `  [${r.priority}] ${r.title}: +${r.potentialScoreIncrease} pts, Cost: ${r.implementationCost}`
).join('\n')}
`.trim();
}

// Import type helpers
type SolarData = import('@/types').SolarData;
type SoilData  = import('@/types').SoilData;

function buildSystemPrompt(analysis: AnalysisResult): string {
  return `You are an expert LEED v4.1 BD+C sustainability consultant specializing in Oman and GCC markets. You have access to detailed land assessment data below.

Rules:
- Respond in the SAME LANGUAGE as the user (Arabic if they write Arabic, English if English)
- Be specific — reference actual numbers from the data
- For LEED credits, cite the exact credit name and point value
- Be concise and actionable

ASSESSMENT DATA:
${buildLEEDContext(analysis)}`;
}

// ─── Main hook ───────────────────────────────────────────────────────────────
export function useClaudeAI() {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Read env key at runtime (set by GitHub Actions build)
  const apiKeyRef = useRef<string>(
    (() => {
      try {
        return (import.meta as unknown as { env: Record<string, string> })
          .env?.VITE_ANTHROPIC_API_KEY || '';
      } catch { return ''; }
    })()
  );

  const setApiKey  = useCallback((key: string) => { apiKeyRef.current = key.trim(); }, []);
  const hasApiKey  = useCallback(() => Boolean(apiKeyRef.current?.trim()), []);

  // ─── Core call ─────────────────────────────────────────────────────────────
  const callClaude = useCallback(async (
    userMessage: string,
    analysis: AnalysisResult,
    history: ChatMessage[]
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const apiMessages = [
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await callAnthropicAPI(apiKey, {
      model:      MODEL,
      max_tokens: 1500,
      system:     buildSystemPrompt(analysis),
      messages:   apiMessages,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } })?.error?.message || '';
      if (response.status === 401) throw new Error('Invalid API key — please check your key in Anthropic Console');
      if (response.status === 403) throw new Error('API key lacks permission — ensure billing is active');
      throw new Error(msg || `API error ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }, []);

  // ─── Send chat message ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async (
    userContent: string,
    analysis: AnalysisResult
  ) => {
    setError(null);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user',
      content: userContent, timestamp: new Date(),
    };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const reply = await callClaude(userContent, analysis, messages);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: reply, timestamp: new Date(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [messages, callClaude]);

  // ─── Arabic summary ─────────────────────────────────────────────────────────
  const generateArabicSummary = useCallback(async (
    analysis: AnalysisResult
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const response = await callAnthropicAPI(apiKey, {
      model: MODEL,
      max_tokens: 2000,
      system: `أنت خبير استشاري في الاستدامة وتقييمات LEED v4.1 لسلطنة عُمان. بيانات التقييم:\n${buildLEEDContext(analysis)}`,
      messages: [{
        role: 'user',
        content: 'اكتب ملخصاً تنفيذياً احترافياً شاملاً باللغة العربية يشمل: الموقع والإحداثيات، درجة LEED والشهادة المتوقعة، الإمكانات البيئية (شمس/رياح/مناخ)، خصائص التربة، أبرز 5 توصيات مع تكاليفها، وخلاصة الجدوى. أسلوب مناسب للمستثمرين والجهات الحكومية العُمانية.',
      }],
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }, []);

  // ─── AI Recommendations ─────────────────────────────────────────────────────
  const generateAIRecommendations = useCallback(async (
    analysis: AnalysisResult
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const response = await callAnthropicAPI(apiKey, {
      model: MODEL,
      max_tokens: 2000,
      system: buildSystemPrompt(analysis),
      messages: [{
        role: 'user',
        content: `Provide exactly 6 prioritized recommendations to maximize this parcel's LEED score. For each recommendation:
1. LEED Credit name and category
2. Current points → achievable points (specific numbers)
3. Technical specification using ACTUAL data from the report (e.g. "${analysis.solar.optimalTilt}° tilt", "${analysis.climate.avgTemperature}°C avg temp")
4. Estimated cost in OMR
5. LEED points per OMR (efficiency ratio)

Order by highest LEED points × lowest cost first.`,
      }],
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages, isLoading, error,
    sendMessage, generateArabicSummary, generateAIRecommendations,
    clearChat, setApiKey, hasApiKey,
  };
}
