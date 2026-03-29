import { useState, useCallback, useRef } from 'react';
import type { AnalysisResult } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const PROXY = 'https://corsproxy.io/?';

async function callAPI(apiKey: string, body: object): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  const bodyStr = JSON.stringify(body);
  try {
    const res = await fetch(API_URL, { method: 'POST', headers, body: bodyStr });
    if (res.status !== 0) return res;
  } catch (_e) { /* fall to proxy */ }
  return fetch(PROXY + encodeURIComponent(API_URL), { method: 'POST', headers, body: bodyStr });
}

function buildContext(a: AnalysisResult): string {
  const cats = a.landAssessment.categories
    .map(function(c) { return '  ' + c.name + ': ' + c.currentPoints + '/' + c.possiblePoints + '/' + c.maxPoints; })
    .join('\n');
  const recs = a.obcRecommendations.slice(0, 4)
    .map(function(r) { return '  [' + r.priority + '] ' + r.title + ': +' + r.potentialScoreIncrease + ' pts'; })
    .join('\n');
  return [
    'LEED v4.1 Land Assessment - Oman',
    'Location: ' + a.location.lat.toFixed(4) + 'N, ' + a.location.lng.toFixed(4) + 'E',
    'Date: ' + a.analysisDate,
    '',
    'SCORES: Current ' + a.landAssessment.currentScore + ' | Potential +' + a.landAssessment.potentialScore + ' | Max ' + a.landAssessment.maxPossibleScore,
    '',
    'CATEGORIES:',
    cats,
    '',
    'SOLAR: GHI ' + a.solar.ghi + ' kWh/m2/day | Yearly ' + a.solar.yearlyGHI + ' | PV ' + a.solar.pvProductionPotential + ' kWh/kWp/yr | Tilt ' + a.solar.optimalTilt + 'deg | Dust ' + a.solar.dustImpactValue + '%',
    'WIND: ' + a.wind.averageSpeed + ' m/s | ' + a.wind.energyDensity + ' W/m2 | ' + a.wind.turbineSuitability,
    'CLIMATE: ' + a.climate.climateZone + ' | ' + a.climate.avgTemperature + 'C avg | ' + a.climate.rainfall + 'mm rain',
    'SOIL: ' + a.soil.type + ' | pH ' + a.soil.phLevel + ' | ' + a.soil.bearingCapacity + ' kPa | ' + a.soil.drainage,
    '',
    'RECOMMENDATIONS:',
    recs,
  ].join('\n');
}

function buildSystem(a: AnalysisResult): string {
  return 'You are an expert LEED v4.1 sustainability consultant for Oman and GCC.\n' +
    'Respond in the SAME LANGUAGE as the user (Arabic if Arabic, English if English).\n' +
    'Be specific - use actual numbers from the data.\n\n' +
    'DATA:\n' + buildContext(a);
}

export function useClaudeAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKeyRef = useRef<string>(
    (function() {
      try {
        const meta = import.meta as unknown as { env: Record<string, string> };
        return meta.env && meta.env.VITE_ANTHROPIC_API_KEY ? meta.env.VITE_ANTHROPIC_API_KEY : '';
      } catch (_e) { return ''; }
    })()
  );

  const setApiKey = useCallback(function(key: string) { apiKeyRef.current = key.trim(); }, []);
  const hasApiKey = useCallback(function() { return Boolean(apiKeyRef.current && apiKeyRef.current.trim()); }, []);

  const callClaude = useCallback(async function(
    userMessage: string,
    analysis: AnalysisResult,
    history: ChatMessage[]
  ): Promise<string> {
    const apiKey = apiKeyRef.current ? apiKeyRef.current.trim() : '';
    if (!apiKey) throw new Error('API key not set');

    const msgs = history.slice(-10).map(function(m) {
      return { role: m.role, content: m.content };
    });
    msgs.push({ role: 'user', content: userMessage });

    const response = await callAPI(apiKey, {
      model: MODEL,
      max_tokens: 1500,
      system: buildSystem(analysis),
      messages: msgs,
    });

    if (!response.ok) {
      const errData = await response.json().catch(function() { return {}; });
      const errObj = errData as { error?: { message?: string } };
      const msg = errObj && errObj.error && errObj.error.message ? errObj.error.message : '';
      if (response.status === 401) throw new Error('Invalid API key - check Anthropic Console');
      if (response.status === 403) throw new Error('API key lacks permission - ensure billing is active');
      throw new Error(msg || 'API error ' + response.status);
    }

    const data = await response.json();
    const content = data.content;
    return content && content[0] && content[0].text ? content[0].text : '';
  }, []);

  const sendMessage = useCallback(async function(userContent: string, analysis: AnalysisResult) {
    setError(null);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setMessages(function(prev) { return [...prev, userMsg]; });
    setIsLoading(true);

    try {
      const currentMessages = messages;
      const reply = await callClaude(userContent, analysis, currentMessages);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(function(prev) { return [...prev, assistantMsg]; });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [messages, callClaude]);

  const generateArabicSummary = useCallback(async function(analysis: AnalysisResult): Promise<string> {
    const apiKey = apiKeyRef.current ? apiKeyRef.current.trim() : '';
    if (!apiKey) throw new Error('API key not set');

    const systemMsg = 'You are an expert LEED v4.1 consultant for Oman. Write professional Arabic reports.\n\nDATA:\n' + buildContext(analysis);
    const userMsg = 'اكتب ملخصا تنفيذيا احترافيا شاملا باللغة العربية يشمل: الموقع، درجة LEED والشهادة المتوقعة، الامكانات البيئية، خصائص التربة، ابرز 5 توصيات مع تكاليفها، وخلاصة الجدوى. مناسب للمستثمرين والجهات الحكومية.';

    const response = await callAPI(apiKey, {
      model: MODEL,
      max_tokens: 2000,
      system: systemMsg,
      messages: [{ role: 'user', content: userMsg }],
    });

    if (!response.ok) throw new Error('API error: ' + response.status);
    const data = await response.json();
    const content = data.content;
    return content && content[0] && content[0].text ? content[0].text : '';
  }, []);

  const generateAIRecommendations = useCallback(async function(analysis: AnalysisResult): Promise<string> {
    const apiKey = apiKeyRef.current ? apiKeyRef.current.trim() : '';
    if (!apiKey) throw new Error('API key not set');

    const userMsg = 'Provide 6 prioritized recommendations to maximize LEED score for this parcel. ' +
      'For each: LEED credit name, current to achievable points, technical specs using actual data ' +
      '(tilt ' + analysis.solar.optimalTilt + ' deg, temp ' + analysis.climate.avgTemperature + 'C), ' +
      'OMR cost estimate, points-per-OMR ratio. Order by best ROI first.';

    const response = await callAPI(apiKey, {
      model: MODEL,
      max_tokens: 2000,
      system: buildSystem(analysis),
      messages: [{ role: 'user', content: userMsg }],
    });

    if (!response.ok) throw new Error('API error: ' + response.status);
    const data = await response.json();
    const content = data.content;
    return content && content[0] && content[0].text ? content[0].text : '';
  }, []);

  const clearChat = useCallback(function() {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, generateArabicSummary, generateAIRecommendations, clearChat, setApiKey, hasApiKey };
}
