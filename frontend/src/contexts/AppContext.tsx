import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HintRequest, StudentHintStats } from '../types';

export type Theme = 'light' | 'dark';
export type UserRole = 'student' | 'teacher';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  documentUploaded: boolean;
  setDocumentUploaded: (uploaded: boolean) => void;
  uploadedDocument: string | null;
  setUploadedDocument: (document: string | null) => void;
  documentText: string;
  setDocumentText: (text: string) => void;
  /** Number of questions parsed from the currently uploaded PDF */
  questionCount: number;
  setQuestionCount: (count: number) => void;
  hintRequests: HintRequest[];
  addHintRequest: (request: HintRequest) => void;
  updateHintRequest: (id: string, updates: Partial<HintRequest>) => void;
  setHintRequests: (requests: HintRequest[]) => void;
  getStudentHintStats: () => StudentHintStats[];
  isLoggedIn: boolean;
  login: (email: string, password: string, role: UserRole, rememberMe: boolean) => Promise<boolean>;
  signup: (username: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  /**
   * Single call to update all document-related state after a successful PDF upload.
   * Also clears stale hint data so analytics start fresh for the new document.
   */
  onDocumentUploaded: (filename: string, text: string, count: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock user database
let mockUsers = [
  { id: '1', username: 'Alice', email: 'alice@gmail.com', password: 'test@123', role: 'student' as UserRole },
  { id: '2', username: 'Bob', email: 'bob@gmail.com', password: 'test@456', role: 'student' as UserRole },
  { id: '3', username: 'Akhil', email: 'katakamakki@gmail.com', password: 'akhil@632', role: 'teacher' as UserRole },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<User | null>(null);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [hintRequests, setHintRequests] = useState<HintRequest[]>([]);

  const isLoggedIn = user !== null;

  // ── Load persisted state on start ─────────────────────────────────────────
  useEffect(() => {
    const rememberedUser = localStorage.getItem('hintify_user');
    const sessionExpiry = localStorage.getItem('hintify_session_expiry');
    const savedDocumentState = localStorage.getItem('hintify_document_uploaded');
    const savedDocument = localStorage.getItem('hintify_uploaded_document');
    const savedDocumentText = localStorage.getItem('hintify_document_text');
    const savedHintRequests = localStorage.getItem('hintify_hint_requests');
    const savedQuestionCount = localStorage.getItem('hintify_question_count');

    if (rememberedUser && sessionExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(sessionExpiry)) {
        setUser(JSON.parse(rememberedUser));
      } else {
        localStorage.removeItem('hintify_user');
        localStorage.removeItem('hintify_session_expiry');
      }
    }

    if (savedDocumentState === 'true') setDocumentUploaded(true);
    if (savedDocument) setUploadedDocument(savedDocument);
    if (savedDocumentText) setDocumentText(savedDocumentText);
    if (savedQuestionCount) setQuestionCount(Number(savedQuestionCount));

    if (savedHintRequests) {
      try {
        const requests = JSON.parse(savedHintRequests);
        setHintRequests(requests.map((req: any) => ({
          ...req,
          timestamp: new Date(req.timestamp),
        })));
      } catch (error) {
        console.error('Error loading hint requests:', error);
      }
    }
  }, []);

  // ── On load: sync question count from backend (handles page refresh) ──────
  useEffect(() => {
    async function syncCount() {
      try {
        const res = await fetch(`${API_BASE}/api/questions/count`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') {
            setQuestionCount(data.count);
            localStorage.setItem('hintify_question_count', String(data.count));
          }
        }
      } catch {
        // Backend not running — use cached localStorage value silently
      }
    }
    syncCount();
  }, []);

  // ── Load saved users ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const savedUsers = localStorage.getItem('hintify_mock_users');
    if (savedUsers) {
      try {
        mockUsers = JSON.parse(savedUsers);
      } catch (error) {
        console.error('Error loading saved users:', error);
      }
    }
  }, []);

  // ── Persist changes to localStorage ───────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('hintify_document_uploaded', documentUploaded.toString());
  }, [documentUploaded]);

  useEffect(() => {
    if (uploadedDocument) localStorage.setItem('hintify_uploaded_document', uploadedDocument);
    else localStorage.removeItem('hintify_uploaded_document');
  }, [uploadedDocument]);

  useEffect(() => {
    if (documentText) localStorage.setItem('hintify_document_text', documentText);
    else localStorage.removeItem('hintify_document_text');
  }, [documentText]);

  useEffect(() => {
    localStorage.setItem('hintify_question_count', String(questionCount));
  }, [questionCount]);

  useEffect(() => {
    localStorage.setItem('hintify_hint_requests', JSON.stringify(hintRequests));
  }, [hintRequests]);

  // ── Apply theme ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Called after a successful PDF upload ──────────────────────────────────
  const onDocumentUploaded = (filename: string, text: string, count: number) => {
    setDocumentUploaded(true);
    setUploadedDocument(filename);
    setDocumentText(text);
    setQuestionCount(count);
    // Clear stale hint analytics — new document = fresh slate
    setHintRequests([]);
    localStorage.removeItem('hintify_hint_requests');
  };

  // ── Hint helpers ───────────────────────────────────────────────────────────
  const addHintRequest = (request: HintRequest) => {
    setHintRequests(prev => [...prev, request]);
  };

  const updateHintRequest = (id: string, updates: Partial<HintRequest>) => {
    setHintRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, ...updates } : req))
    );
  };

  /**
   * Returns per-student analytics.
   * questionHints slots are pre-filled for Q1…Qn based on questionCount,
   * so the analytics table always renders the correct number of columns
   * even for students who haven't asked for any hints yet.
   */
  const getStudentHintStats = (): StudentHintStats[] => {
    const studentStats: { [studentId: string]: StudentHintStats } = {};

    mockUsers.filter(u => u.role === 'student').forEach(student => {
      const questionHints: StudentHintStats['questionHints'] = {};
      for (let q = 1; q <= questionCount; q++) {
        questionHints[q] = { firstHint: false, secondHint: false, solutionGiven: false };
      }
      studentStats[student.id] = {
        studentId: student.id,
        studentName: student.username,
        questionHints,
        totalHints: 0,
      };
    });

    hintRequests.forEach(request => {
      const stats = studentStats[request.studentId];
      if (!stats) return;
      if (!stats.questionHints[request.questionNumber]) {
        stats.questionHints[request.questionNumber] = { firstHint: false, secondHint: false, solutionGiven: false };
      }
      if (request.firstHintAsked) {
        stats.questionHints[request.questionNumber].firstHint = true;
        stats.totalHints++;
      }
      if (request.secondHintAsked) {
        stats.questionHints[request.questionNumber].secondHint = true;
        stats.totalHints++;
      }
      if (request.solutionGiven) {
        stats.questionHints[request.questionNumber].solutionGiven = true;
        stats.totalHints++;
      }
    });

    return Object.values(studentStats);
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, role: UserRole, rememberMe: boolean): Promise<boolean> => {
    const foundUser = mockUsers.find(u =>
      u.email === email && u.password === password && u.role === role
    );
    if (foundUser) {
      const userWithoutPassword = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
      };
      setUser(userWithoutPassword);
      if (rememberMe) {
        const expiryTime = new Date().getTime() + 2 * 60 * 60 * 1000;
        localStorage.setItem('hintify_user', JSON.stringify(userWithoutPassword));
        localStorage.setItem('hintify_session_expiry', expiryTime.toString());
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // Only remove session information on logout if it was set to persist (i.e., "Remember Me" was checked)
    localStorage.removeItem('hintify_user');
    localStorage.removeItem('hintify_session_expiry');
  };

  const signup = async (username: string, email: string, password: string, role: UserRole) => {
    if (mockUsers.find(u => u.email === email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    mockUsers.push({ id: (mockUsers.length + 1).toString(), username, email, password, role });
    localStorage.setItem('hintify_mock_users', JSON.stringify(mockUsers));
    return { success: true, message: 'Account created successfully! You can now log in.' };
  };

  const forgotPassword = async (email: string) => {
    const u = mockUsers.find(u => u.email === email);
    if (!u) return { success: false, message: 'No account found with this email address.' };
    return {
      success: true,
      message: `Password reset instructions sent to ${email}. For demo: Your password is "${u.password}"`,
    };
  };

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      user, setUser,
      documentUploaded, setDocumentUploaded,
      uploadedDocument, setUploadedDocument,
      documentText, setDocumentText,
      questionCount, setQuestionCount,
      hintRequests, addHintRequest, updateHintRequest,
      getStudentHintStats,
      isLoggedIn,
      login, signup, forgotPassword, logout,
      onDocumentUploaded,
      setHintRequests,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}