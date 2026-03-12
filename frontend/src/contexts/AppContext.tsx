import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HintRequest, StudentHintStats } from '../types';

export type Theme = 'light' | 'dark';
export type UserRole = 'student' | 'teacher';

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
  hintRequests: HintRequest[];
  addHintRequest: (request: HintRequest) => void;
  updateHintRequest: (id: string, updates: Partial<HintRequest>) => void;
  getStudentHintStats: () => StudentHintStats[];
  isLoggedIn: boolean;
  login: (email: string, password: string, role: UserRole, rememberMe: boolean) => Promise<boolean>;
  signup: (username: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
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
  const [hintRequests, setHintRequests] = useState<HintRequest[]>([]);

  const isLoggedIn = user !== null;

  // Load data from localStorage on app start
  useEffect(() => {
    const rememberedUser = localStorage.getItem('hintify_user');
    const sessionExpiry = localStorage.getItem('hintify_session_expiry');
    const savedDocumentState = localStorage.getItem('hintify_document_uploaded');
    const savedDocument = localStorage.getItem('hintify_uploaded_document');
    const savedDocumentText = localStorage.getItem('hintify_document_text');
    const savedHintRequests = localStorage.getItem('hintify_hint_requests');
    
    if (rememberedUser && sessionExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(sessionExpiry)) {
        setUser(JSON.parse(rememberedUser));
      } else {
        localStorage.removeItem('hintify_user');
        localStorage.removeItem('hintify_session_expiry');
      }
    }

    if (savedDocumentState === 'true') {
      setDocumentUploaded(true);
    }
    if (savedDocument) {
      setUploadedDocument(savedDocument);
    }
    if (savedDocumentText) {
      setDocumentText(savedDocumentText);
    }
    if (savedHintRequests) {
      try {
        const requests = JSON.parse(savedHintRequests);
        setHintRequests(requests.map((req: any) => ({
          ...req,
          timestamp: new Date(req.timestamp)
        })));
      } catch (error) {
        console.error('Error loading hint requests:', error);
      }
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    localStorage.setItem('hintify_document_uploaded', documentUploaded.toString());
  }, [documentUploaded]);

  useEffect(() => {
    if (uploadedDocument) {
      localStorage.setItem('hintify_uploaded_document', uploadedDocument);
    } else {
      localStorage.removeItem('hintify_uploaded_document');
    }
  }, [uploadedDocument]);

  useEffect(() => {
    if (documentText) {
      localStorage.setItem('hintify_document_text', documentText);
    } else {
      localStorage.removeItem('hintify_document_text');
    }
  }, [documentText]);

  useEffect(() => {
    localStorage.setItem('hintify_hint_requests', JSON.stringify(hintRequests));
  }, [hintRequests]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const addHintRequest = (request: HintRequest) => {
    setHintRequests(prev => [...prev, request]);
  };

  const updateHintRequest = (id: string, updates: Partial<HintRequest>) => {
    setHintRequests(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  const getStudentHintStats = (): StudentHintStats[] => {
    const studentStats: { [studentId: string]: StudentHintStats } = {};

    // Initialize stats for all students
    mockUsers.filter(u => u.role === 'student').forEach(student => {
      studentStats[student.id] = {
        studentId: student.id,
        studentName: student.username,
        questionHints: {},
        totalHints: 0
      };
    });

    // Process hint requests
    hintRequests.forEach(request => {
      const stats = studentStats[request.studentId];
      if (stats) {
        if (!stats.questionHints[request.questionNumber]) {
          stats.questionHints[request.questionNumber] = {
            firstHint: false,
            secondHint: false
          };
        }

        if (request.firstHintAsked) {
          stats.questionHints[request.questionNumber].firstHint = true;
          stats.totalHints++;
        }
        if (request.secondHintAsked) {
          stats.questionHints[request.questionNumber].secondHint = true;
          stats.totalHints++;
        }
      }
    });

    return Object.values(studentStats);
  };

  const login = async (email: string, password: string, role: UserRole, rememberMe: boolean): Promise<boolean> => {
    const foundUser = mockUsers.find(u => 
      u.email === email && 
      u.password === password && 
      u.role === role
    );

    if (foundUser) {
      const userWithoutPassword = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role
      };
      
      setUser(userWithoutPassword);

      if (rememberMe) {
        const expiryTime = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 hours
        localStorage.setItem('hintify_user', JSON.stringify(userWithoutPassword));
        localStorage.setItem('hintify_session_expiry', expiryTime.toString());
      }

      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setDocumentUploaded(false);
    setUploadedDocument(null);
    setDocumentText('');
    setHintRequests([]);
    localStorage.removeItem('hintify_user');
    localStorage.removeItem('hintify_session_expiry');
    localStorage.removeItem('hintify_document_uploaded');
    localStorage.removeItem('hintify_uploaded_document');
    localStorage.removeItem('hintify_document_text');
    localStorage.removeItem('hintify_hint_requests');
  };

  const signup = async (username: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; message: string }> => {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Validate password strength
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Create new user
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      username,
      email,
      password,
      role
    };

    mockUsers.push(newUser);
    
    // Save to localStorage for persistence
    localStorage.setItem('hintify_mock_users', JSON.stringify(mockUsers));

    return { success: true, message: 'Account created successfully! You can now log in.' };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }

    // In a real app, you would send an email here
    // For demo purposes, we'll show the password
    return { 
      success: true, 
      message: `Password reset instructions sent to ${email}. For demo: Your password is "${user.password}"` 
    };
  };

  // Load users from localStorage on app start
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

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      user,
      setUser,
      documentUploaded,
      setDocumentUploaded,
      uploadedDocument,
      setUploadedDocument,
      documentText,
      setDocumentText,
      hintRequests,
      addHintRequest,
      updateHintRequest,
      getStudentHintStats,
      isLoggedIn,
      login,
      signup,
      forgotPassword,
      logout
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