import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';

function AppContent() {
  const { isLoggedIn, user } = useApp();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;