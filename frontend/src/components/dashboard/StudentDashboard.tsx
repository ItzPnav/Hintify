import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Loader2, AlertCircle, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../layout/Header';
import { AIService } from '../../services/aiService';
import { DocumentService } from '../../services/documentService';
import { Message } from '../../types';

export function StudentDashboard() {
  const { user, hintRequests, addHintRequest, updateHintRequest } = useApp();

  // ── Left panel tab ─────────────────────────────────────────────────────────
  const [leftTab, setLeftTab] = useState<'chat' | 'hints'>('chat');

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Quick Hints state ──────────────────────────────────────────────────────
  const [quickQuestion, setQuickQuestion] = useState<number>(1);
  const [quickResponse, setQuickResponse] = useState<string>('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickType, setQuickType] = useState<'hint1' | 'hint2' | 'solution' | null>(null);

  // ── PDF viewer state ───────────────────────────────────────────────────────
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // ── Load PDF from backend on mount ────────────────────────────────────────
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      setPdfLoading(true);
      setPdfError(null);

      try {
        objectUrl = await DocumentService.getLatestPdfUrl();
        setPdfUrl(objectUrl);
      } catch (err: any) {
        if (err?.message?.includes('No document')) {
          setPdfUrl(null);
        } else {
          setPdfError(err?.message ?? 'Failed to load document.');
        }
      } finally {
        setPdfLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Chat send logic ────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const isHelp = AIService.isRequestingHelp(trimmed);
      const isMoreHelp = AIService.isRequestingMoreHelp(trimmed);
      const qNum = AIService.extractQuestionNumber(trimmed);

      let hintLevel: 'first' | 'second' | 'solution' = 'first';

      if (isHelp && qNum && user) {
        const existing = hintRequests.find(
          (r) => r.studentId === user.id && r.questionNumber === qNum
        );

        if (!existing) {
          addHintRequest({
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.username,
            questionNumber: qNum,
            question: trimmed,
            firstHintAsked: true,
            secondHintAsked: false,
            solutionGiven: false,
            timestamp: new Date(),
          });
          hintLevel = 'first';
        } else if (isMoreHelp && existing.firstHintAsked && !existing.secondHintAsked) {
          updateHintRequest(existing.id, { secondHintAsked: true });
          hintLevel = 'second';
        } else if (isMoreHelp && existing.secondHintAsked && !existing.solutionGiven) {
          updateHintRequest(existing.id, { solutionGiven: true });
          hintLevel = 'solution';
        }
      }

      const responseText = await AIService.generateResponse(trimmed, hintLevel);

      const typeMap = {
        first: 'hint1' as const,
        second: 'hint2' as const,
        solution: 'solution' as const,
      };

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'ai',
          timestamp: new Date(),
          type: typeMap[hintLevel],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, something went wrong. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Quick Hints handler ────────────────────────────────────────────────────
  const handleQuickHint = async (level: 'first' | 'second' | 'solution') => {
    setQuickLoading(true);
    setQuickResponse('');
    setQuickType(level === 'first' ? 'hint1' : level === 'second' ? 'hint2' : 'solution');

    try {
      const res = await AIService.generateResponse(`question ${quickQuestion}`, level);
      setQuickResponse(res);

      // Also track in hint requests
      if (user) {
        const existing = hintRequests.find(
          (r) => r.studentId === user.id && r.questionNumber === quickQuestion
        );
        if (!existing) {
          addHintRequest({
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.username,
            questionNumber: quickQuestion,
            question: `Quick hint Q${quickQuestion}`,
            firstHintAsked: level === 'first',
            secondHintAsked: level === 'second',
            solutionGiven: level === 'solution',
            timestamp: new Date(),
          });
        } else {
          if (level === 'second') updateHintRequest(existing.id, { secondHintAsked: true });
          if (level === 'solution') updateHintRequest(existing.id, { solutionGiven: true });
        }
      }
    } catch {
      setQuickResponse('Error generating hint. Please try again.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'document.pdf';
    a.click();
  };

  // ── Styling helpers ────────────────────────────────────────────────────────
  const getAiMsgStyle = (type?: string) => {
    switch (type) {
      case 'hint1':    return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
      case 'hint2':    return 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800';
      case 'solution': return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
      default:         return 'bg-soft-gray/10 border border-soft-gray/20';
    }
  };

  const getAiLabel = (type?: string) => {
    switch (type) {
      case 'hint1':    return '💡 First Hint';
      case 'hint2':    return '🔍 Second Hint';
      case 'solution': return '✅ Solution';
      default:         return '🤖 Hintify';
    }
  };

  const quickBtnConfig = [
    {
      level: 'first' as const,
      label: 'First Hint',
      sublabel: 'gentle nudge',
      className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40',
    },
    {
      level: 'second' as const,
      label: 'Second Hint',
      sublabel: 'stronger guide',
      className: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
    },
    {
      level: 'solution' as const,
      label: 'Full Solution',
      sublabel: 'show answer',
      className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40',
    },
  ];

  return (
    <div className="min-h-screen bg-off-white dark:bg-dark-tone flex flex-col">
      <Header />

      <main className="flex-1 flex gap-4 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">

        {/* ── LEFT: Tabbed panel ────────────────────────────────────────────── */}
        <div className="flex flex-col w-full md:w-[420px] flex-shrink-0 bg-white dark:bg-warm-gray rounded-2xl shadow-xl overflow-hidden">

          {/* ── Tab bar (Google-style) ─────────────────────────────────────── */}
          <div className="flex border-b border-soft-gray/20">
            {(['chat', 'hints'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all duration-150 border-b-2 ${
                  leftTab === tab
                    ? 'border-accent text-accent'
                    : 'border-transparent text-soft-gray hover:text-warm-gray dark:hover:text-off-white'
                }`}
              >
                {tab === 'chat' ? 'Chat' : 'Quick Hints'}
              </button>
            ))}
          </div>

          {/* ── CHAT PANEL ────────────────────────────────────────────────── */}
          {leftTab === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">💡</span>
                    </div>
                    <p className="text-soft-gray text-sm">Ask about a question to get your first hint!</p>
                    <p className="text-soft-gray/60 text-xs mt-1">e.g. "Help with question 3"</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="max-w-[80%] bg-accent text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                        {msg.text}
                      </div>
                    ) : (
                      <div className={`max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm ${getAiMsgStyle(msg.type)}`}>
                        <p className="text-xs font-semibold text-soft-gray mb-1">{getAiLabel(msg.type)}</p>
                        <p className="text-warm-gray dark:text-off-white whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-soft-gray/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="px-4 py-3 border-t border-soft-gray/20">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder="e.g. Help with question 2"
                    className="flex-1 bg-soft-gray/10 dark:bg-dark-tone/50 border border-soft-gray/20 rounded-xl px-4 py-2.5 text-sm text-warm-gray dark:text-off-white placeholder-soft-gray focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── QUICK HINTS PANEL ─────────────────────────────────────────── */}
          {leftTab === 'hints' && (
            <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 gap-4">

              {/* Question selector */}
              <div>
                <label className="text-xs text-soft-gray mb-1.5 block">Select question number</label>
                <select
                  value={quickQuestion}
                  onChange={(e) => {
                    setQuickQuestion(Number(e.target.value));
                    setQuickResponse('');
                    setQuickType(null);
                  }}
                  className="w-full bg-soft-gray/10 dark:bg-dark-tone/50 border border-soft-gray/20 rounded-xl px-4 py-2.5 text-sm text-warm-gray dark:text-off-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {Array.from({ length: 30 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Question {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hint level buttons */}
              <div>
                <label className="text-xs text-soft-gray mb-1.5 block">Pick hint level</label>
                <div className="flex flex-col gap-2">
                  {quickBtnConfig.map(({ level, label, sublabel, className }) => (
                    <button
                      key={level}
                      disabled={quickLoading}
                      onClick={() => handleQuickHint(level)}
                      className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                    >
                      {label}
                      <span className="font-normal opacity-70 ml-1">— {sublabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Response area */}
              <div className={`flex-1 rounded-xl p-4 text-sm min-h-[120px] transition-all ${
                quickType ? getAiMsgStyle(quickType) : 'bg-soft-gray/10 border border-soft-gray/20'
              }`}>
                {quickLoading ? (
                  <div className="flex items-center gap-2 text-soft-gray">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Generating...</span>
                  </div>
                ) : quickResponse ? (
                  <>
                    <p className="text-xs font-semibold text-soft-gray mb-2">{getAiLabel(quickType ?? undefined)}</p>
                    <p className="text-warm-gray dark:text-off-white whitespace-pre-wrap">{quickResponse}</p>
                  </>
                ) : (
                  <p className="text-soft-gray/60">
                    Select a question and click a hint level above to get started.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: PDF Viewer ─────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col flex-1 bg-white dark:bg-warm-gray rounded-2xl shadow-xl overflow-hidden min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-soft-gray/20 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-accent" />
              <span className="font-semibold text-warm-gray dark:text-off-white text-sm">
                Document Viewer
              </span>
            </div>

            {pdfUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="p-1.5 rounded-lg hover:bg-soft-gray/10 text-soft-gray hover:text-accent transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-soft-gray w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  className="p-1.5 rounded-lg hover:bg-soft-gray/10 text-soft-gray hover:text-accent transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-soft-gray/30 mx-1" />
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg hover:bg-soft-gray/10 text-soft-gray hover:text-accent transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* PDF content */}
          <div className="flex-1 overflow-auto bg-soft-gray/5 min-h-0">
            {pdfLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-soft-gray text-sm">Loading document...</p>
              </div>
            )}

            {pdfError && !pdfLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                <AlertCircle className="w-10 h-10 text-soft-gray" />
                <p className="text-soft-gray text-sm">{pdfError}</p>
              </div>
            )}

            {!pdfUrl && !pdfLoading && !pdfError && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                <FileText className="w-12 h-12 text-soft-gray/40" />
                <p className="text-soft-gray font-medium">No document yet</p>
                <p className="text-soft-gray/60 text-sm">Your teacher hasn't uploaded a document yet.</p>
              </div>
            )}

            {pdfUrl && !pdfLoading && !pdfError && (
              <iframe
                src={`${pdfUrl}#zoom=${zoom}`}
                title="Course Document"
                className="w-full h-full border-0"
                style={{ minHeight: '600px' }}
              />
            )}
          </div>
        </div>

      </main>
    </div>
  );
}