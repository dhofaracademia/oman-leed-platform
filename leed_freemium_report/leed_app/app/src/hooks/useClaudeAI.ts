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

function buildLEEDContext(analysis: AnalysisResult): string {
  return `
LEED v4.1 Land Assessment Report — Oman
Location: ${analysis.location.lat.toFixed(4)}°N, ${analysis.location.lng.toFixed(4)}°E
Address: ${analysis.location.address || 'Oman'}
Date: ${analysis.analysisDate}

LEED SCORES:
- Current Land Score: ${analysis.landAssessment.currentScore} points
- Potential Additional Points: ${analysis.landAssessment.potentialScore}
- Maximum Achievable: ${analysis.landAssessment.maxPossibleScore} points

LEED CATEGORY BREAKDOWN:
${analysis.landAssessment.categories.map(c =>
  `- ${c.name}: ${c.currentPoints} current / ${c.possiblePoints} achievable (max ${c.maxPoints})`
).join('\n')}

SOLAR ANALYSIS:
- Daily GHI: ${analysis.solar.ghi} kWh/m²
- Yearly GHI: ${analysis.solar.yearlyGHI} kWh/m²/year
- PV Production Potential: ${analysis.solar.pvProductionPotential} kWh/kWp/year
- Optimal Panel Tilt: ${analysis.solar.optimalTilt}°
- Dust Impact: ${analysis.solar.dustImpact} (${analysis.solar.dustImpactValue}% loss)

WIND ANALYSIS:
- Average Speed: ${analysis.wind.averageSpeed} m/s
- Energy Density: ${analysis.wind.energyDensity} W/m²
- Turbine Suitability: ${analysis.wind.turbineSuitability}

CLIMATE DATA:
- Climate Zone: ${analysis.climate.climateZone}
- Avg Temperature: ${analysis.climate.avgTemperature}°C
- Annual Rainfall: ${analysis.climate.rainfall} mm

SOIL ANALYSIS:
- Type: ${analysis.soil.type}
- Bearing Capacity: ${analysis.soil.bearingCapacity} kPa
- Drainage: ${analysis.soil.drainage}
- pH: ${analysis.soil.phLevel}
`.trim();
}

function buildSystemPrompt(analysis: AnalysisResult): string {
  return `You are an expert LEED v4.1 sustainability consultant for Oman. Answer questions in the same language the user writes in. If Arabic, respond in Arabic. If English, respond in English. Be specific and cite actual numbers from the data.

ASSESSMENT DATA:
${buildLEEDContext(analysis)}`;
}

async function callAPI(
  url: string,
  apiKey: string,
  body: object
): Promise<Response> {
  // Try direct first, then fallback to proxy
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify(body),
    });
    return res;
  } catch {
    // Fallback to CORS proxy
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    return fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify(body),
    });
  }
}

export function useClaudeAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKeyRef = useRef<string>(
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_ANTHROPIC_API_KEY || ''
  );

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

    const response = await callAPI(CLAUDE_API_URL, apiKey, {
      model: MODEL,
      max_tokens: 1500,
      system: buildSystemPrompt(analysis),
      messages: apiMessages,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } })?.error?.message || `API error: ${response.status}`);
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
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [messages, callClaude]);

  const generateArabicSummary = useCallback(async (
    analysis: AnalysisResult
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const response = await callAPI(CLAUDE_API_URL, apiKey, {
      model: MODEL,
      max_tokens: 2000,
      system: `أنت خبير استشاري في الاستدامة وتقييمات LEED v4.1 لسلطنة عُمان. بيانات التقييم:\n${buildLEEDContext(analysis)}`,
      messages: [{
        role: 'user',
        content: 'اكتب ملخصاً تنفيذياً شاملاً باللغة العربية يشمل: الموقع، درجة LEED والشهادة المتوقعة، الإمكانات البيئية، التوصيات الرئيسية، والخلاصة النهائية. اجعله احترافياً ومناسباً للمستثمرين.',
      }],
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.content[0]?.text || '';
  }, []);

  const generateAIRecommendations = useCallback(async (
    analysis: AnalysisResult
  ): Promise<string> => {
    const apiKey = apiKeyRef.current?.trim();
    if (!apiKey) throw new Error('API key not set');

    const response = await callAPI(CLAUDE_API_URL, apiKey, {
      model: MODEL,
      max_tokens: 2000,
      system: buildSystemPrompt(analysis),
      messages: [{
        role: 'user',
        content: 'Provide 6 specific prioritized recommendations to maximize the LEED score. For each: state the LEED credit, exact points achievable, technical specifications using actual data from the report, and estimated OMR cost.',
      }],
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
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
    error,
    sendMessage,
    generateArabicSummary,
    generateAIRecommendations,
    clearChat,
    setApiKey,
    hasApiKey,
  };
}
