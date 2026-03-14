import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Users, BarChart3, TrendingUp, Hash } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../layout/Header';
import { GlowButton } from '../ui/GlowButton';
import { PDFService } from '../../services/pdfService';
import { AIService } from '../../services/aiService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── localStorage key for tab persistence ────────────────────────────────────
const TAB_KEY = 'hintify_teacher_tab';

export function TeacherDashboard() {
  const {
    documentUploaded,
    uploadedDocument,
    questionCount,
    getStudentHintStats,
    onDocumentUploaded,
    setDocumentUploaded,
    setUploadedDocument,
    setDocumentText,
    setHintRequests,
  } = useApp();

  const [isUploading, setIsUploading]   = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ── Persist active tab across refreshes ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<'upload' | 'analytics'>(
    () => (localStorage.getItem(TAB_KEY) as 'upload' | 'analytics') ?? 'upload'
  );

  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  // ── PDF upload handler ───────────────────────────────────────────────────
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const extractedText = await PDFService.extractTextFromFile(file);

      let count = 0;
      try {
        const countRes = await fetch(`${API_BASE}/api/questions/count`);
        if (countRes.ok) {
          const data = await countRes.json();
          count = typeof data.count === 'number' ? data.count : 0;
        }
      } catch {
        const matches = extractedText.match(/Question\s+\d+:/gi);
        count = matches ? matches.length : 0;
      }

      AIService.setDocumentText(extractedText);

      // Single call: sets document state + questionCount + clears stale hints
      onDocumentUploaded(file.name, extractedText, count);

      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      alert('Failed to process PDF. Please try again.');
    }

    // Reset file input so the same file can be re-uploaded if needed
    event.target.value = '';
  };

  // ── "Upload New Document" — full clean slate ─────────────────────────────
  // Previously this called setDocumentUploaded / setUploadedDocument / setDocumentText
  // directly, which left stale hintRequests in localStorage.
  // Now we go through the same helpers AppContext.logout() uses so nothing leaks.
  const handleReplaceDocument = () => {
    setDocumentUploaded(false);
    setUploadedDocument(null);
    setDocumentText('');
    // Clear hint analytics so the new PDF starts with a clean slate
    setHintRequests([]);
    localStorage.removeItem('hintify_hint_requests');
    localStorage.removeItem('hintify_hint_timers'); // clear student timers too
    setUploadSuccess(false);
    setActiveTab('upload');
  };

  const studentStats   = getStudentHintStats();
  const questionNumbers = Array.from({ length: questionCount }, (_, i) => i + 1);

  // ── Analytics table ──────────────────────────────────────────────────────
  const AnalyticsTable = () => (
    <div className="bg-white dark:bg-warm-gray rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-soft-gray/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold text-warm-gray dark:text-off-white">
              Student Hint Analytics
            </h2>
          </div>
          {questionCount > 0 && (
            <div className="flex items-center space-x-1.5 text-sm text-soft-gray">
              <Hash className="w-4 h-4" />
              <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* No document uploaded yet */}
        {!documentUploaded && (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-soft-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-gray mb-2">No Document Uploaded</h3>
            <p className="text-soft-gray">Upload a PDF to start tracking student hint usage.</p>
          </div>
        )}

        {/* Document uploaded but no questions parsed */}
        {documentUploaded && questionCount === 0 && (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-soft-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-gray mb-2">No Questions Parsed</h3>
            <p className="text-soft-gray">
              The PDF was uploaded but no questions were detected. Try a different document.
            </p>
          </div>
        )}

        {/* Per-student analytics tables */}
        {documentUploaded && questionCount > 0 && studentStats.map((student) => (
          <div key={student.studentId} className="p-6 border-b border-soft-gray/10 last:border-b-0">
            <h3 className="text-lg font-semibold text-warm-gray dark:text-off-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-accent" />
              <span>{student.studentName}</span>
            </h3>

            <div className="overflow-hidden rounded-lg border border-soft-gray/20">
              <table className="w-full">
                <thead className="bg-soft-gray/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      Question
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      Hint 1
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      Hint 2
                    </th>
                    {/* ── Solution column — was missing before ── */}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-warm-gray dark:text-off-white">
                      Solution
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-soft-gray/10">
                  {questionNumbers.map((qNum) => {
                    const qh = student.questionHints[qNum];
                    return (
                      <tr key={qNum} className="hover:bg-soft-gray/5 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                          Q{qNum}
                        </td>

                        {/* Hint 1 */}
                        <td className="px-4 py-3 text-center border-r border-soft-gray/20">
                          <Badge active={!!qh?.firstHint} />
                        </td>

                        {/* Hint 2 */}
                        <td className="px-4 py-3 text-center border-r border-soft-gray/20">
                          <Badge active={!!qh?.secondHint} />
                        </td>

                        {/* Solution */}
                        <td className="px-4 py-3 text-center">
                          <Badge active={!!qh?.solutionGiven} />
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total row */}
                  <tr className="bg-accent/5 font-semibold">
                    <td className="px-4 py-3 text-sm text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-warm-gray dark:text-off-white" colSpan={3}>
                      <div className="flex items-center justify-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        <span>Hints used: {student.totalHints}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* No students yet */}
        {documentUploaded && questionCount > 0 && studentStats.length === 0 && (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-soft-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-gray mb-2">No Analytics Data</h3>
            <p className="text-soft-gray">Students haven't asked for hints yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-off-white dark:bg-dark-tone">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab bar */}
        <div className="flex space-x-1 bg-soft-gray/20 rounded-lg p-1 mb-8 max-w-md mx-auto">
          {(['upload', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-warm-gray dark:text-off-white hover:text-accent'
              }`}
            >
              {tab === 'upload' ? 'Document Upload' : 'Student Analytics'}
            </button>
          ))}
        </div>

        {/* ── UPLOAD TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-warm-gray dark:text-off-white mb-4">
                Teacher Dashboard
              </h1>
              <p className="text-lg text-soft-gray">
                Upload documents for your students to interact with
              </p>
            </div>

            <div className="bg-white dark:bg-warm-gray rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
              {!documentUploaded ? (
                /* ── No document yet ── */
                <div className="text-center">
                  <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-12 h-12 text-accent" />
                  </div>

                  <h2 className="text-2xl font-bold text-warm-gray dark:text-off-white mb-4">
                    Upload your document
                  </h2>
                  <p className="text-soft-gray mb-8">
                    Choose a PDF document that students can interact with using AI-powered hints
                  </p>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    <GlowButton disabled={isUploading} className="relative z-10 pointer-events-none">
                      {isUploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing PDF...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Upload className="w-5 h-5" />
                          <span>Choose PDF File</span>
                        </div>
                      )}
                    </GlowButton>
                  </div>

                  <p className="text-xs text-soft-gray mt-4">Supported format: PDF (Max 10 MB)</p>
                  <p className="text-xs text-soft-gray mt-1">
                    Each new upload replaces the previous document and resets student analytics.
                  </p>
                </div>
              ) : (
                /* ── Document already uploaded ── */
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                    uploadSuccess
                      ? 'bg-green-100 dark:bg-green-900/20 animate-pulse'
                      : 'bg-green-100 dark:bg-green-900/20'
                  }`}>
                    <CheckCircle className={`w-12 h-12 text-green-600 transition-all duration-500 ${
                      uploadSuccess ? 'scale-110' : 'scale-100'
                    }`} />
                  </div>

                  <h2 className="text-2xl font-bold text-warm-gray dark:text-off-white mb-2">
                    Document Uploaded Successfully!
                  </h2>

                  {/* Show filename if available */}
                  {uploadedDocument && (
                    <p className="text-sm text-soft-gray mb-4 font-medium">{uploadedDocument}</p>
                  )}

                  <p className="text-soft-gray mb-8">
                    Your document has been processed and is now available for students.
                  </p>

                  <div className="bg-soft-gray/10 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <FileText className="w-6 h-6 text-accent" />
                      <span className="font-medium text-warm-gray dark:text-off-white">
                        Document Status: Active &amp; AI-Ready
                      </span>
                    </div>
                    {questionCount > 0 && (
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Hash className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-warm-gray dark:text-off-white">
                          {questionCount} question{questionCount !== 1 ? 's' : ''} parsed
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-soft-gray">
                      Students can now access the chat interface and receive intelligent hints
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* Fixed: goes through handleReplaceDocument which clears everything cleanly */}
                    <GlowButton variant="secondary" onClick={handleReplaceDocument}>
                      Upload New Document
                    </GlowButton>
                    <GlowButton variant="secondary" onClick={() => setActiveTab('analytics')}>
                      View Analytics →
                    </GlowButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-warm-gray dark:text-off-white mb-4">
                Student Analytics
              </h1>
              <p className="text-lg text-soft-gray">
                Track student progress and hint usage patterns
              </p>
            </div>
            <AnalyticsTable />
          </div>
        )}

      </main>
    </div>
  );
}

// ── Shared badge component ───────────────────────────────────────────────────
function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active
        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }`}>
      {active ? 'Yes' : 'No'}
    </span>
  );
}