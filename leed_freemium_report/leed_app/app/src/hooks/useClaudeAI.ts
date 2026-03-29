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

async function callAnthropicAPI(apiKey: string, body: object): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  try {
    const res = await fetch(CLAUDE_API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.status !== 0) return res;
  } catch { /* fall through to proxy */ }
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(CLAUDE_API_URL);
  return fetch(proxyUrl, { method: 'POST', headers, body: JSON.stringify(body) });
}

function buildContext(analysis: AnalysisResult): string {
  return `
LEED v4.1 Land Assessment — Oman
Location: ${analysis.location.lat.toFixed(4)}°N, ${analysis.location.lng.toFixed(4)}°E
Date: ${analysis.analysisDate}

SCORES: Current ${analysis.landAssessment.currentScore} pts | Potential +${analysis.landAssessment.potentialScore} pts | Max ${analysis.landAssessment.maxPossibleScore} pts

CATEGORIES:
${analysis.landAssessment.categories.map(c => `  ${c.name}: ${c.currentPoints}/${c.possiblePoints}/${c.maxPoints}`).join('\n')}

SOLAR: GHI ${analysis.solar.ghi} kWh/m²/day | Yearly ${analysis.solar.yearlyGHI} kWh/m² | PV ${analysis.solar.pvProductionPotential} kWh/kWp/yr | Tilt ${analysis.solar.optimalTilt}° | Dust ${analysis.solar.dustImpactValue}%
WIND: ${analysis.wind.averageSpeed} m/s avg | ${analysis.wind.energyDensity} W/m² | ${analysis.wind.turbineSuitability} suitability
CLIMATE: ${analysis.climate.climateZone} | ${analysis.climate.avgTemperature}°C avg | ${analysis.climate.rainfall}mm rain | ${analysis.climate.relativeHumidity}% humidity
SOIL: ${analysis.soil.type} | ${analysis.soil.texture} | pH ${analysis.soil.phLevel} | ${analysis.soil.bearingCapacity} kPa | ${analysis.soil.drainage} drainage
`.trim();
}

function buildSystem(analysis: AnalysisResult): string {
  return `You are an expert LEED v4.1 sustainability consultant for Oman and GCC. Respond in the SAME LANGUAGE as the user (Arabic if Arabic, English if English). Be specific — use actual numbers from the data.\n\nDATA:\n${buildContext(analysis)}`;
}

export function useClaudeAI() {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const apiKeyRef = useRef<string>(
    (() => { try { return (import.meta as unknown as { env: Record<string, string> }).env?.VITE_ANTHROPIC_API_KEY || ''; } catch { return ''; } })()
  );

  const setApiKey = useCallback((key: string) => { apiKeyRef.current = key.trim(); }, []);
  const hasApiKey = useCallback(() => Boolean(apiKeyRef.current?.trim()), []);

  const callClaude = useCallback(async (userMessage: string, analysis: AnalysisResult, history: ChatMessage[]): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');
    const response = await callAnthropicAPI(apiKey, {
      model: MODEL, max_tokens: 1500, system: buildSystem(analysis),
      messages: [...history.slice(-10).map(m => ({ role: m.role, content: m.content })), { role: 'user' as const, content: userMessage }],
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } })?.error?.message || '';
      if (response.status === 401) throw new Error('Invalid API key — check Anthropic Console');
      if (response.status === 403) throw new Error('API key lacks permission — ensure billing is active');
      throw new Error(msg || `API error ${response.status}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }, []);

  const sendMessage = useCallback(async (userContent: string, analysis: AnalysisResult) => {
    setError(null);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userContent, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const reply = await callClaude(userContent, analysis, messages);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally { setIsLoading(false); }
  }, [messages, callClaude]);

  const generateArabicSummary = useCallback(async (analysis: AnalysisResult): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');
    const response = await callAnthropicAPI(apiKey, {
      model: MODEL, max_tokens: 2000,
      system: `أنت خبير استشاري LEED v4.1 لسلطنة عُمان.\n${buildContext(analysis)}`,
      messages: [{ role: 'user', content: 'اكتب ملخصاً تنفيذياً احترافياً شاملاً باللغة العربية يشمل: الموقع، درجة LEED والشهادة المتوقعة، الإمكانات البيئية، خصائص التربة، أبرز 5 توصيات مع تكاليفها، وخلاصة الجدوى. مناسب للمستثمرين والجهات الحكومية.' }],
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }, []);

  const generateAIRecommendations = useCallback(async (analysis: AnalysisResult): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');
    const response = await callAnthropicAPI(apiKey, {
      model: MODEL, max_tokens: 2000, system: buildSystem(analysis),
      messages: [{ role: 'user', content: `Provide 6 prioritized recommendations to maximize this parcel's LEED score. For each: LEED credit name, current→achievable points, technical specs using actual data (tilt ${analysis.solar.optimalTilt}°, temp ${analysis.climate.avgTemperature}°C), OMR cost estimate, points-per-OMR ratio. Order by best ROI first.` }],
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }, []);

  const clearChat = useCallback(() => { setMessages([]); setError(null); }, []);

  return { messages, isLoading, error, sendMessage, generateArabicSummary, generateAIRecommendations, clearChat, setApiKey, hasApiKey };
}
