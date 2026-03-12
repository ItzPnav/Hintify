import React, { useState } from 'react';
import { ArrowRight, Mail, UserPlus, Lock } from 'lucide-react';
import { useApp, UserRole } from '../../contexts/AppContext';
import { NeonCheckbox } from '../ui/NeonCheckbox';
import { GlowButton } from '../ui/GlowButton';

type AuthMode = 'login' | 'signup' | 'forgot';

export function LoginPage() {
  const { login, signup, forgotPassword } = useApp();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const success = await login(email, password, role, rememberMe);
      if (!success) {
        setError('Invalid credentials. Please check your email, password, and role.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup(username, email, password, role);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          setAuthMode('login');
          setSuccess('');
          setUsername('');
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-off-white dark:bg-dark-tone flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-warm-gray rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              {authMode === 'login' && <span className="text-white font-bold text-2xl">H</span>}
              {authMode === 'signup' && <UserPlus className="w-8 h-8 text-white" />}
              {authMode === 'forgot' && <Lock className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-warm-gray dark:text-off-white mb-2">
              {authMode === 'login' && (role === 'student' ? 'Student Login' : 'Teacher Login')}
              {authMode === 'signup' && (role === 'student' ? 'Student Sign Up' : 'Teacher Sign Up')}
              {authMode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-soft-gray">
              {authMode === 'login' && 'Welcome back to Hintify'}
              {authMode === 'signup' && 'Create your Hintify account'}
              {authMode === 'forgot' && 'Enter your email to reset password'}
            </p>
          </div>

          {/* Role Toggle - Only show for login and signup */}
          {authMode !== 'forgot' && (
            <div className="flex bg-soft-gray/20 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  role === 'student'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-warm-gray hover:text-accent'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  role === 'teacher'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-warm-gray hover:text-accent'
                }`}
              >
                Teacher
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleForgotPassword} className="space-y-6">
            {/* Username field - Only for signup */}
            {authMode === 'signup' && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-warm-gray dark:text-off-white mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-soft-gray/30 bg-white dark:bg-dark-tone text-warm-gray dark:text-off-white placeholder-soft-gray focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  placeholder="Enter your username"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-warm-gray dark:text-off-white mb-2">
                Email ID
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-soft-gray/30 bg-white dark:bg-dark-tone text-warm-gray dark:text-off-white placeholder-soft-gray focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="Enter your email"
              />
            </div>

            {/* Password fields - Not for forgot password */}
            {authMode !== 'forgot' && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-warm-gray dark:text-off-white mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-soft-gray/30 bg-white dark:bg-dark-tone text-warm-gray dark:text-off-white placeholder-soft-gray focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Confirm Password - Only for signup */}
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-warm-gray dark:text-off-white mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-soft-gray/30 bg-white dark:bg-dark-tone text-warm-gray dark:text-off-white placeholder-soft-gray focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                      placeholder="Confirm your password"
                    />
                  </div>
                )}
              </>
            )}

            {/* Remember Me - Only for login */}
            {authMode === 'login' && (
              <div className="flex items-center justify-between">
                <NeonCheckbox
                  checked={rememberMe}
                  onChange={setRememberMe}
                  label="Remember Me"
                />
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <GlowButton
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2"
            >
              {authMode === 'login' && (
                <>
                  <span>{isLoading ? 'Signing in...' : 'ENTRY'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
              {authMode === 'signup' && (
                <>
                  <span>{isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}</span>
                  <UserPlus className="w-5 h-5" />
                </>
              )}
              {authMode === 'forgot' && (
                <>
                  <span>{isLoading ? 'Sending...' : 'RESET PASSWORD'}</span>
                  <Mail className="w-5 h-5" />
                </>
              )}
            </GlowButton>
          </form>

          {/* Navigation Links */}
          <div className="text-center text-sm text-soft-gray mt-6 space-y-2">
            {authMode === 'login' && (
              <p>
                New to Hintify?{' '}
                <button 
                  onClick={() => switchMode('signup')}
                  className="text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Sign Up here
                </button>
              </p>
            )}
            {authMode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => switchMode('login')}
                  className="text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Login here
                </button>
              </p>
            )}
            {authMode === 'forgot' && (
              <p>
                Remember your password?{' '}
                <button 
                  onClick={() => switchMode('login')}
                  className="text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </p>
            )}
          </div>

          {/* About Hintify - Only show on login */}
          {authMode === 'login' && (
            <div className="mt-8 p-4 bg-soft-gray/10 rounded-lg">
              <p className="text-xs text-soft-gray mb-2 font-medium">About:</p>
              <p className="text-xs text-soft-gray leading-relaxed">
                This website gives a hint for your question using the uploaded PDF. Students can ask questions, and the system shows helpful clues or answers from the file. It's made for easy learning between teachers and students.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}