import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Users, BarChart3, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../layout/Header';
import { GlowButton } from '../ui/GlowButton';
import { PDFService } from '../../services/pdfService';
import { AIService } from '../../services/aiService';

export function TeacherDashboard() {
  const { 
    documentUploaded, 
    setDocumentUploaded, 
    setUploadedDocument, 
    setDocumentText,
    getStudentHintStats 
  } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'analytics'>('upload');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Extract text from PDF
      const extractedText = await PDFService.extractTextFromFile(file);
      
      // Set the extracted text in AI service and context
      AIService.setDocumentText(extractedText);
      setDocumentText(extractedText);
      
      setIsUploading(false);
      setUploadSuccess(true);
      setDocumentUploaded(true);
      setUploadedDocument(file.name);
      
      // Hide success animation after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      alert('Failed to process PDF. Please try again.');
    }
  };

  const studentStats = getStudentHintStats();

  const AnalyticsTable = () => (
    <div className="bg-white dark:bg-warm-gray rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-soft-gray/20">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-warm-gray dark:text-off-white">
            Student Hint Analytics
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        {studentStats.map((student) => (
          <div key={student.studentId} className="p-6 border-b border-soft-gray/10 last:border-b-0">
            <h3 className="text-lg font-semibold text-warm-gray dark:text-off-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-accent" />
              <span>{student.studentName} Hint Count</span>
            </h3>
            
            <div className="overflow-hidden rounded-lg border border-soft-gray/20">
              <table className="w-full">
                <thead className="bg-soft-gray/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      Question Number
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      1st Hint
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-warm-gray dark:text-off-white">
                      2nd Hint
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-gray/10">
                  {[1, 2, 3, 4, 5].map((questionNum) => {
                    const questionHint = student.questionHints[questionNum];
                    return (
                      <tr key={questionNum} className="hover:bg-soft-gray/5 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                          {questionNum}
                        </td>
                        <td className="px-4 py-3 text-center border-r border-soft-gray/20">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            questionHint?.firstHint 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {questionHint?.firstHint ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            questionHint?.secondHint 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {questionHint?.secondHint ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-accent/5 font-semibold">
                    <td className="px-4 py-3 text-sm text-warm-gray dark:text-off-white border-r border-soft-gray/20">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-warm-gray dark:text-off-white" colSpan={2}>
                      <div className="flex items-center justify-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        <span>Hints asked = {student.totalHints}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {studentStats.length === 0 && (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-soft-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-soft-gray mb-2">No Analytics Data</h3>
            <p className="text-soft-gray">Students haven't asked for hints yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-off-white dark:bg-dark-tone">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-soft-gray/20 rounded-lg p-1 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'upload'
                ? 'bg-accent text-white shadow-sm'
                : 'text-warm-gray dark:text-off-white hover:text-accent'
            }`}
          >
            Document Upload
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-accent text-white shadow-sm'
                : 'text-warm-gray dark:text-off-white hover:text-accent'
            }`}
          >
            Student Analytics
          </button>
        </div>

        {activeTab === 'upload' ? (
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
                <div className="text-center">
                  <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-12 h-12 text-accent" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-warm-gray dark:text-off-white mb-4">
                    Upload your document
                  </h2>
                  
                  <p className="text-soft-gray mb-8">
                    Choose a PDF document that students can interact with using AI-powered Q&A
                  </p>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    
                    <GlowButton
                      disabled={isUploading}
                      className="relative z-10 pointer-events-none"
                    >
                      {isUploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

                  <p className="text-xs text-soft-gray mt-4">
                    Supported format: PDF (Max size: 10MB)
                  </p>
                </div>
              ) : (
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
                  
                  <h2 className="text-2xl font-bold text-warm-gray dark:text-off-white mb-4">
                    Document Uploaded Successfully!
                  </h2>
                  
                  <p className="text-soft-gray mb-8">
                    Your document has been processed and is now available for students. The AI can now provide hints and solutions based on the content.
                  </p>

                  <div className="bg-soft-gray/10 rounded-lg p-6">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <FileText className="w-6 h-6 text-accent" />
                      <span className="font-medium text-warm-gray dark:text-off-white">
                        Document Status: Active & AI-Ready
                      </span>
                    </div>
                    
                    <p className="text-sm text-soft-gray">
                      Students can now access the chat interface and receive intelligent hints
                    </p>
                  </div>

                  <div className="mt-6">
                    <GlowButton
                      variant="secondary"
                      onClick={() => {
                        setDocumentUploaded(false);
                        setUploadedDocument(null);
                        setDocumentText('');
                        setUploadSuccess(false);
                      }}
                    >
                      Upload New Document
                    </GlowButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
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