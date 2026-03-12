import React, { useState, useEffect } from 'react';
import { Send, FileText, MessageCircle, Eye, Download, RotateCcw, Printer, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../layout/Header';
import { GlowButton } from '../ui/GlowButton';
import { AIService } from '../../services/aiService';
import { Message } from '../types';

interface Question {
  id: number;
  questionText: string;
  options?: string[];
  hint1?: string;
  hint2?: string;
  solution?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function StudentDashboard() {
  const { documentUploaded, user, addHintRequest, updateHintRequest, hintRequests } = useApp();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch questions from backend when document is uploaded
  useEffect(() => {
    if (documentUploaded) {
      fetchQuestions();
    }
  }, [documentUploaded]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await fetch(`${API_BASE}/api/questions`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          setSelectedQuestion(data.questions[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const requestHint = async (level: 'first' | 'second' | 'solution') => {
    if (!selectedQuestion || !user) return;

    setIsLoading(true);
    try {
      const levelMap = { 'first': 1, 'second': 2, 'solution': 3 };
      const response = await fetch(`${API_BASE}/api/hints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          level: levelMap[level],
          userId: parseInt(user.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const hintText = data.text;

        // Add AI message to chat
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: hintText,
          sender: 'ai',
          timestamp: new Date(),
          type: level === 'first' ? 'hint1' : level === 'second' ? 'hint2' : 'solution',
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Track hint request
        const existingRequest = hintRequests.find(
          (req) => req.studentId === user.id && req.questionNumber === selectedQuestion.id
        );

        if (!existingRequest) {
          addHintRequest({
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.username,
            questionNumber: selectedQuestion.id,
            question: selectedQuestion.questionText,
            firstHintAsked: level === 'first',
            secondHintAsked: level === 'second',
            solutionGiven: level === 'solution',
            timestamp: new Date(),
          });
        } else {
          updateHintRequest(existingRequest.id, {
            firstHintAsked: existingRequest.firstHintAsked || level === 'first',
            secondHintAsked: existingRequest.secondHintAsked || level === 'second',
            solutionGiven: existingRequest.solutionGiven || level === 'solution',
          });
        }
      }
    } catch (error) {
      console.error('Error requesting hint:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Error generating hint. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if this is a help request
      if (AIService.isRequestingHelp(message)) {
        const questionNumber = AIService.extractQuestionNumber(message);
        
        if (questionNumber && user) {
          // Find existing hint request for this question
          let existingRequest = hintRequests.find(
            req => req.studentId === user.id && req.questionNumber === questionNumber
          );

          let hintLevel: 'first' | 'second' | 'solution' = 'first';
          let messageType: 'hint1' | 'hint2' | 'solution' = 'hint1';

          if (existingRequest) {
            // Check if user is asking for more help
            if (AIService.isRequestingMoreHelp(message)) {
              if (!existingRequest.secondHintAsked) {
                hintLevel = 'second';
                messageType = 'hint2';
                updateHintRequest(existingRequest.id, { secondHintAsked: true });
              } else {
                hintLevel = 'solution';
                messageType = 'solution';
                updateHintRequest(existingRequest.id, { solutionGiven: true });
              }
            } else if (!existingRequest.firstHintAsked) {
              // First hint for this question
              updateHintRequest(existingRequest.id, { firstHintAsked: true });
            } else if (!existingRequest.secondHintAsked) {
              hintLevel = 'second';
              messageType = 'hint2';
              updateHintRequest(existingRequest.id, { secondHintAsked: true });
            } else {
              hintLevel = 'solution';
              messageType = 'solution';
              updateHintRequest(existingRequest.id, { solutionGiven: true });
            }
          } else {
            // Create new hint request
            const newRequest = {
              id: Date.now().toString(),
              studentId: user.id,
              studentName: user.username,
              questionNumber,
              question: message,
              firstHintAsked: true,
              secondHintAsked: false,
              solutionGiven: false,
              timestamp: new Date()
            };
            addHintRequest(newRequest);
          }

          // Generate AI response
          const aiResponse = await AIService.generateResponse(message, hintLevel);
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponse,
            sender: 'ai',
            timestamp: new Date(),
            type: messageType
          };

          setMessages(prev => [...prev, aiMessage]);
        } else {
          // Generic help response
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'd be happy to help! Please specify which question number you need help with (e.g., 'I need help with question 1' or 'I don't understand question 3').",
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } else {
        // General conversation
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm here to help you with questions from the uploaded document. Please let me know which specific question you need help with!",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble processing your request right now. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    setMessage('');
  };

  const PDFModal = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-warm-gray rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* PDF Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-soft-gray/20">
          <h3 className="text-lg font-semibold text-warm-gray dark:text-off-white">
            Document Viewer
          </h3>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-soft-gray/20 rounded-lg transition-colors" title="Zoom Out">
              <ZoomOut className="w-5 h-5 text-warm-gray dark:text-off-white" />
            </button>
            <button className="p-2 hover:bg-soft-gray/20 rounded-lg transition-colors" title="Zoom In">
              <ZoomIn className="w-5 h-5 text-warm-gray dark:text-off-white" />
            </button>
            <button className="p-2 hover:bg-soft-gray/20 rounded-lg transition-colors" title="Rotate">
              <RotateCcw className="w-5 h-5 text-warm-gray dark:text-off-white" />
            </button>
            <button className="p-2 hover:bg-soft-gray/20 rounded-lg transition-colors" title="Print">
              <Printer className="w-5 h-5 text-warm-gray dark:text-off-white" />
            </button>
            <button className="p-2 hover:bg-soft-gray/20 rounded-lg transition-colors" title="Download">
              <Download className="w-5 h-5 text-warm-gray dark:text-off-white" />
            </button>
            <button 
              onClick={() => setShowPDFModal(false)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 bg-gray-100 dark:bg-dark-tone p-8 overflow-auto">
          <div className="bg-white shadow-lg mx-auto max-w-4xl min-h-full rounded-lg p-8">
            <div className="text-center text-gray-500 py-20">
              <FileText className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">PDF content would be displayed here</p>
              <p className="text-sm mt-2">This is a demo placeholder for the PDF viewer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-off-white dark:bg-dark-tone">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
          
          {/* Chat Section */}
          <div className="bg-white dark:bg-warm-gray rounded-2xl shadow-xl flex flex-col">
            <div className="p-6 border-b border-soft-gray/20">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-warm-gray dark:text-off-white">
                  AI Hint Assistant
                </h2>
              </div>
              <p className="text-sm text-soft-gray mt-1">
                Ask for hints about specific questions (e.g., "Help with question 1")
              </p>
            </div>

            {!documentUploaded ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-soft-gray/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-soft-gray" />
                  </div>
                  <h3 className="text-lg font-medium text-soft-gray mb-2">
                    <strong>Chat Unavailable</strong>
                  </h3>
                  <p className="text-soft-gray">
                    Teacher has not yet uploaded the document.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-soft-gray py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Start asking for hints!</p>
                      <p className="text-xs">Try: "I need help with question 1" or "I don't understand question 2"</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                            msg.sender === 'user'
                              ? 'bg-accent text-white'
                              : `${
                                  msg.type === 'hint1' ? 'bg-blue-100 dark:bg-blue-900/20 border-l-4 border-blue-500' :
                                  msg.type === 'hint2' ? 'bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500' :
                                  msg.type === 'solution' ? 'bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500' :
                                  'bg-soft-gray/20'
                                } text-warm-gray dark:text-off-white`
                          }`}
                        >
                          {msg.type && (
                            <div className="text-xs font-semibold mb-1 opacity-75">
                              {msg.type === 'hint1' ? '💡 First Hint' :
                               msg.type === 'hint2' ? '🔍 Second Hint' :
                               msg.type === 'solution' ? '✅ Complete Solution' : ''}
                            </div>
                          )}
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'user' ? 'text-white/70' : 'text-soft-gray'
                          }`}>
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-soft-gray/20 text-warm-gray dark:text-off-white px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-sm ml-2">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-6 border-t border-soft-gray/20">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask for help with a specific question..."
                      className="flex-1 px-4 py-3 rounded-lg border border-soft-gray/30 bg-white dark:bg-dark-tone text-warm-gray dark:text-off-white placeholder-soft-gray focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Document Section */}
          <div className="bg-white dark:bg-warm-gray rounded-2xl shadow-xl flex flex-col">
            <div className="p-6 border-b border-soft-gray/20">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-warm-gray dark:text-off-white">
                  Questions & Hints
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!documentUploaded ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-soft-gray/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-soft-gray" />
                  </div>
                  <h3 className="text-lg font-medium text-soft-gray mb-2">
                    No Document Available
                  </h3>
                  <p className="text-soft-gray">
                    Waiting for teacher to upload a document.
                  </p>
                </div>
              ) : loadingQuestions ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-soft-gray">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-soft-gray">No questions available yet.</p>
                </div>
              ) : (
                <>
                  {/* Question Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-warm-gray dark:text-off-white mb-2">
                      Select a Question
                    </label>
                    <select
                      value={selectedQuestion?.id || ''}
                      onChange={(e) => {
                        const q = questions.find((q) => q.id === Number(e.target.value));
                        if (q) setSelectedQuestion(q);
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-soft-gray/30 bg-white dark:bg-dark-tone text-warm-gray dark:text-off-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                    >
                      {questions.map((q) => (
                        <option key={q.id} value={q.id}>
                          Question {q.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Question Display */}
                  {selectedQuestion && (
                    <div className="bg-soft-gray/10 dark:bg-dark-tone rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-warm-gray dark:text-off-white mb-2">
                          Question {selectedQuestion.id}
                        </h3>
                        <p className="text-sm text-warm-gray dark:text-off-white leading-relaxed">
                          {selectedQuestion.questionText}
                        </p>
                      </div>

                      {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-soft-gray uppercase">Options:</p>
                          <div className="space-y-1">
                            {selectedQuestion.options.map((opt, idx) => (
                              <div key={idx} className="text-sm text-warm-gray dark:text-off-white">
                                <span className="font-semibold">{String.fromCharCode(65 + idx)})</span> {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedQuestion.answer && (
                        <div className="border-t border-soft-gray/20 pt-2">
                          <p className="text-xs font-semibold text-soft-gray uppercase mb-1">Expected Answer:</p>
                          <p className="text-sm text-warm-gray dark:text-off-white">{selectedQuestion.answer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hint Buttons */}
                  {selectedQuestion && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-soft-gray uppercase">Get Hints:</p>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => requestHint('first')}
                          disabled={isLoading}
                          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          💡 First Hint
                        </button>
                        <button
                          onClick={() => requestHint('second')}
                          disabled={isLoading}
                          className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          🔍 Second Hint
                        </button>
                        <button
                          onClick={() => requestHint('solution')}
                          disabled={isLoading}
                          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          ✅ Final Solution
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* PDF Modal */}
      {showPDFModal && <PDFModal />}
    </div>
  );
}