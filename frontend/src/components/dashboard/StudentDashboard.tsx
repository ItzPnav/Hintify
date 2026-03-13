import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Loader2, AlertCircle, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../layout/Header';
import { AIService } from '../../services/aiService';
import { DocumentService } from '../../services/documentService';
import { Message } from '../../types';

export function StudentDashboard() {
  const { user, hintRequests, addHintRequest, updateHintRequest } = useApp();

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── PDF viewer state ───────────────────────────────────────────────────────
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // ── Always load PDF from backend on mount ─────────────────────────────────
  // Check backend directly — don't rely on documentUploaded flag which can
  // be lost on page refresh or after a backend restart.
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      setPdfLoading(true);
      setPdfError(null);

      try {
        objectUrl = await DocumentService.getLatestPdfUrl();
        setPdfUrl(objectUrl);
      } catch (err: any) {
        // 404 = no document yet, show empty state silently
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
  }, []); // run once on mount

  // ── Auto-scroll chat to bottom ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message / hint logic ──────────────────────────────────────────────
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
      let requestId: string | null = null;

      if (isHelp && qNum && user) {
        // Find existing hint request for this question
        const existing = hintRequests.find(
          (r) => r.studentId === user.id && r.questionNumber === qNum
        );

        if (!existing) {
          // First time asking about this question
          const newRequest = {
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.username,
            questionNumber: qNum,
            question: trimmed,
            firstHintAsked: true,
            secondHintAsked: false,
            solutionGiven: false,
            timestamp: new Date(),
          };
          addHintRequest(newRequest);
          requestId = newRequest.id;
          hintLevel = 'first';
        } else if (isMoreHelp && existing.firstHintAsked && !existing.secondHintAsked) {
          updateHintRequest(existing.id, { secondHintAsked: true });
          requestId = existing.id;
          hintLevel = 'second';
        } else if (isMoreHelp && existing.secondHintAsked && !existing.solutionGiven) {
          updateHintRequest(existing.id, { solutionGiven: true });
          requestId = existing.id;
          hintLevel = 'solution';
        } else {
          hintLevel = 'first';
        }
      }

      const responseText = await AIService.generateResponse(trimmed, hintLevel);

      const typeMap = {
        first: 'hint1' as const,
        second: 'hint2' as const,
        solution: 'solution' as const,
      };

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date(),
        type: typeMap[hintLevel],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
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

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'document.pdf';
    a.click();
  };

  // ── Message bubble styling ─────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-off-white dark:bg-dark-tone flex flex-col">
      <Header />

      <main className="flex-1 flex gap-4 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">

        {/* ── LEFT: Chat ───────────────────────────────────────────────────── */}
        <div className="flex flex-col w-full md:w-[420px] flex-shrink-0 bg-white dark:bg-warm-gray rounded-2xl shadow-xl overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-soft-gray/20">
            <h2 className="font-bold text-warm-gray dark:text-off-white text-lg">Ask for a Hint</h2>
            <p className="text-xs text-soft-gray mt-0.5">
              Type a question number to get a progressive hint
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">💡</span>
                </div>
                <p className="text-soft-gray text-sm">
                  Ask about a question to get your first hint!
                </p>
                <p className="text-soft-gray/60 text-xs mt-1">
                  e.g. "Help with question 3"
                </p>
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

          {/* Input */}
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

          {/* PDF content area */}
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
                <p className="text-soft-gray/60 text-sm">
                  Your teacher hasn't uploaded a document yet.
                </p>
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