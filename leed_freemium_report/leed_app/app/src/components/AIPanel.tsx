import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  Loader2,
  FileText,
  Sparkles,
  MessageSquare,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClaudeAI, type ChatMessage } from '@/hooks/useClaudeAI';
import type { AnalysisResult } from '@/types';

// ─── Suggested Questions ────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS_EN = [
  'What LEED certification level can this land achieve?',
  'What are the top 3 highest-impact improvements for this parcel?',
  'How does the solar potential compare to other Oman locations?',
  'What is the ROI on solar PV installation for this site?',
  'How can we improve the water efficiency score?',
];

const SUGGESTED_QUESTIONS_AR = [
  'ما مستوى شهادة LEED الذي يمكن تحقيقه لهذه الأرض؟',
  'ما أبرز 3 تحسينات ذات تأثير أعلى لهذه القطعة؟',
  'كيف تقارن إمكانات الطاقة الشمسية بمواقع أخرى في عُمان؟',
  'ما العائد على الاستثمار لتركيب الألواح الشمسية في هذا الموقع؟',
  'كيف يمكن تحسين درجة كفاءة استخدام المياه؟',
];

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function RenderMarkdown({ content }: { content: string }) {
  const isArabic = /[\u0600-\u06FF]/.test(content.slice(0, 50));

  const lines = content.split('\n');
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      rendered.push(
        <h3 key={i} className="text-base font-bold text-slate-800 mt-4 mb-1">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      rendered.push(
        <h2 key={i} className="text-lg font-bold text-[#1a5d3c] mt-5 mb-2 border-b border-[#1a5d3c]/20 pb-1">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      rendered.push(
        <h1 key={i} className="text-xl font-bold text-[#1a5d3c] mt-4 mb-2">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      rendered.push(
        <p key={i} className="font-bold text-slate-800 mt-2">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      rendered.push(
        <li key={i} className="ml-4 text-slate-700 leading-relaxed list-disc">
          {renderInline(line.replace(/^[-•] /, ''))}
        </li>
      );
    } else if (/^\d+\. /.test(line)) {
      rendered.push(
        <li key={i} className="ml-4 text-slate-700 leading-relaxed list-decimal">
          {renderInline(line.replace(/^\d+\. /, ''))}
        </li>
      );
    } else if (line.trim() === '') {
      rendered.push(<div key={i} className="h-2" />);
    } else {
      rendered.push(
        <p key={i} className="text-slate-700 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return (
    <div
      className="space-y-1"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{ fontFamily: isArabic ? "'Noto Naskh Arabic', 'Cairo', serif" : 'inherit' }}
    >
      {rendered}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-100 text-[#1a5d3c] px-1 py-0.5 rounded text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─── API Key Setup ───────────────────────────────────────────────────────────
function ApiKeySetup({ onKeySet }: { onKeySet: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a5d3c] to-[#2d8f5e] flex items-center justify-center shadow-lg">
        <Key className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Anthropic API</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Enter your Anthropic API key to activate the Claude AI analysis panel.
          Your key stays in memory only — never stored or transmitted elsewhere.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            placeholder="sk-ant-api03-..."
            value={key}
            onChange={e => setKey(e.target.value)}
            className="pr-10 font-mono text-sm"
            onKeyDown={e => e.key === 'Enter' && key.startsWith('sk-') && onKeySet(key.trim())}
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          onClick={() => onKeySet(key.trim())}
          disabled={!key.startsWith('sk-')}
          className="w-full bg-[#1a5d3c] hover:bg-[#14472e] text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Activate AI Analysis
        </Button>
        <p className="text-xs text-slate-400">
          Get your key at{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1a5d3c] hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      <div className="w-full max-w-sm p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
        <p className="text-xs text-blue-700 font-medium mb-1">💡 For permanent activation:</p>
        <p className="text-xs text-blue-600">
          Set <code className="bg-blue-100 px-1 rounded">VITE_ANTHROPIC_API_KEY</code> in your GitHub repository Secrets → it will be baked into builds automatically.
        </p>
      </div>
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isArabic = /[\u0600-\u06FF]/.test(message.content.slice(0, 50));

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isUser
            ? 'bg-[#d4af37] text-white'
            : 'bg-gradient-to-br from-[#1a5d3c] to-[#2d8f5e] text-white'
        }`}
      >
        {isUser ? 'You' : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-[#1a5d3c] text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 rounded-tl-sm'
        }`}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {isUser ? (
          <p className={isArabic ? 'text-right' : ''}>{message.content}</p>
        ) : (
          <RenderMarkdown content={message.content} />
        )}
        <div className={`text-xs mt-1.5 opacity-60 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1.5">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

// ─── Main AIPanel Component ──────────────────────────────────────────────────
interface AIPanelProps {
  analysis: AnalysisResult;
}

export function AIPanel({ analysis }: AIPanelProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    generateArabicSummary,
    generateAIRecommendations,
    clearChat,
    setApiKey,
    hasApiKey,
  } = useClaudeAI();

  const [inputText, setInputText] = useState('');
  const [keyActivated, setKeyActivated] = useState(hasApiKey());
  const [arabicSummary, setArabicSummary] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [recError, setRecError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeySet = useCallback((key: string) => {
    setApiKey(key);
    setKeyActivated(true);
  }, [setApiKey]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    setShowSuggestions(false);
    sendMessage(text, analysis);
  }, [inputText, isLoading, sendMessage, analysis]);

  const handleSuggestion = useCallback((q: string) => {
    setShowSuggestions(false);
    sendMessage(q, analysis);
  }, [sendMessage, analysis]);

  const handleGenerateSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const result = await generateArabicSummary(analysis);
      setArabicSummary(result);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setSummaryLoading(false);
    }
  }, [generateArabicSummary, analysis]);

  const handleGenerateRecs = useCallback(async () => {
    setRecLoading(true);
    setRecError('');
    try {
      const result = await generateAIRecommendations(analysis);
      setAiRecommendations(result);
    } catch (e) {
      setRecError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setRecLoading(false);
    }
  }, [generateAIRecommendations, analysis]);

  const leedScore = analysis.landAssessment.maxPossibleScore;
  const certLevel =
    leedScore >= 80 ? { label: 'Platinum', color: 'text-purple-700 bg-purple-100' } :
    leedScore >= 60 ? { label: 'Gold', color: 'text-yellow-700 bg-yellow-100' } :
    leedScore >= 50 ? { label: 'Silver', color: 'text-slate-600 bg-slate-100' } :
    { label: 'Certified', color: 'text-green-700 bg-green-100' };

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a5d3c] to-[#2d8f5e] flex items-center justify-center shadow-md">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Claude AI Analysis
              <Badge className="bg-[#1a5d3c]/10 text-[#1a5d3c] text-xs">Powered by Claude</Badge>
            </h2>
            <p className="text-sm text-slate-500">
              AI-powered insights based on your LEED assessment data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-sm px-3 py-1 ${certLevel.color}`}>
            ⭐ {certLevel.label} Potential — {leedScore} pts
          </Badge>
        </div>
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        {!keyActivated ? (
          <ApiKeySetup onKeySet={handleKeySet} />
        ) : (
          <Tabs defaultValue="chat">
            <div className="border-b border-slate-100 px-4 pt-2">
              <TabsList className="bg-transparent gap-1">
                <TabsTrigger
                  value="chat"
                  className="data-[state=active]:bg-[#1a5d3c] data-[state=active]:text-white rounded-lg gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger
                  value="arabic"
                  className="data-[state=active]:bg-[#1a5d3c] data-[state=active]:text-white rounded-lg gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>التقرير العربي</span>
                </TabsTrigger>
                <TabsTrigger
                  value="recommendations"
                  className="data-[state=active]:bg-[#1a5d3c] data-[state=active]:text-white rounded-lg gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Recommendations
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── CHAT TAB ── */}
            <TabsContent value="chat" className="m-0">
              <div className="flex flex-col h-[600px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1a5d3c]/10 to-[#d4af37]/10 flex items-center justify-center">
                        <Bot className="w-7 h-7 text-[#1a5d3c]" />
                      </div>
                      <h3 className="font-semibold text-slate-800 mb-1">LEED Assessment Assistant</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        Ask me anything about this land assessment. I have full access to the LEED scores, solar, wind, climate, and soil data.
                      </p>
                    </div>
                  )}

                  {/* Suggested questions */}
                  {showSuggestions && messages.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLang('en')}
                          className={`text-xs px-2 py-1 rounded ${lang === 'en' ? 'bg-[#1a5d3c] text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setLang('ar')}
                          className={`text-xs px-2 py-1 rounded ${lang === 'ar' ? 'bg-[#1a5d3c] text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          العربية
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(lang === 'en' ? SUGGESTED_QUESTIONS_EN : SUGGESTED_QUESTIONS_AR).map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestion(q)}
                            className={`w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-[#1a5d3c]/5 border border-slate-100 hover:border-[#1a5d3c]/20 text-sm text-slate-700 transition-all ${lang === 'ar' ? 'text-right' : ''}`}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map(m => (
                    <ChatBubble key={m.id} message={m} />
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a5d3c] to-[#2d8f5e] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <div className="flex gap-1 items-center h-5">
                          <div className="w-2 h-2 rounded-full bg-[#1a5d3c] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[#1a5d3c] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[#1a5d3c] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-slate-100 p-4">
                  <div className="flex gap-2">
                    {messages.length > 0 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={clearChat}
                        className="flex-shrink-0 h-10 w-10 text-slate-400 hover:text-red-500"
                        title="Clear chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Input
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Ask about the LEED score, solar potential, recommendations... | اسأل عن التقييم..."
                      className="flex-1 h-10"
                      dir="auto"
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!inputText.trim() || isLoading}
                      className="flex-shrink-0 h-10 w-10 bg-[#1a5d3c] hover:bg-[#14472e]"
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Bilingual support — type in Arabic or English
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── ARABIC SUMMARY TAB ── */}
            <TabsContent value="arabic" className="m-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">الملخص التنفيذي العربي</h3>
                    <p className="text-sm text-slate-500">تقرير شامل باللغة العربية مُنشأ بالذكاء الاصطناعي</p>
                  </div>
                  <div className="flex gap-2">
                    {arabicSummary && <CopyButton text={arabicSummary} />}
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={summaryLoading}
                      className="bg-[#1a5d3c] hover:bg-[#14472e] text-white gap-2"
                    >
                      {summaryLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />جارٍ التوليد...</>
                      ) : arabicSummary ? (
                        <><RefreshCw className="w-4 h-4" />إعادة التوليد</>
                      ) : (
                        <><Sparkles className="w-4 h-4" />توليد التقرير</>
                      )}
                    </Button>
                  </div>
                </div>

                {summaryError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{summaryError}</p>
                  </div>
                )}

                {arabicSummary ? (
                  <div
                    className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-6 max-h-[520px] overflow-y-auto"
                    dir="rtl"
                    style={{ fontFamily: "'Noto Naskh Arabic', 'Cairo', 'Amiri', serif" }}
                  >
                    <RenderMarkdown content={arabicSummary} />
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a5d3c]/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-[#1a5d3c]" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2" dir="rtl">
                      تقرير تنفيذي شامل بالعربية
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto" dir="rtl">
                      اضغط على "توليد التقرير" للحصول على ملخص احترافي كامل يشمل تقييم LEED، التوصيات، والإمكانات البيئية للقطعة
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── AI RECOMMENDATIONS TAB ── */}
            <TabsContent value="recommendations" className="m-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">AI-Enhanced Recommendations</h3>
                    <p className="text-sm text-slate-500">Specific, data-driven actions to maximize your LEED score</p>
                  </div>
                  <div className="flex gap-2">
                    {aiRecommendations && <CopyButton text={aiRecommendations} />}
                    <Button
                      onClick={handleGenerateRecs}
                      disabled={recLoading}
                      className="bg-[#1a5d3c] hover:bg-[#14472e] text-white gap-2"
                    >
                      {recLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                      ) : aiRecommendations ? (
                        <><RefreshCw className="w-4 h-4" />Regenerate</>
                      ) : (
                        <><Sparkles className="w-4 h-4" />Generate Insights</>
                      )}
                    </Button>
                  </div>
                </div>

                {recError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{recError}</p>
                  </div>
                )}

                {aiRecommendations ? (
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-6 max-h-[520px] overflow-y-auto">
                    <RenderMarkdown content={aiRecommendations} />
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[#d4af37]" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      AI-Powered LEED Optimization
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Claude will analyze your specific solar irradiance, wind speed, soil type, and climate data to generate prioritized, ROI-based recommendations unique to this parcel
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
}
