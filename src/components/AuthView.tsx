import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, SEMESTERS } from '../lib/validation';
import { UniLinkLogo } from './BrandAndMedia';

export function AuthView({
  onBack,
  onSuccess,
}: {
  onBack?: () => void;
  onSuccess?: () => void;
}) {
  const {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    campusConfig,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(SEMESTERS[2]);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleGoogle = async () => {
    clearAuthError();
    setLocalError(null);
    setNotice(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch {
      // authError handled in context
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    setNotice(null);

    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (mode === 'register' && displayName.trim().length < 2) {
      setLocalError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        onSuccess?.();
      } else {
        const res = await registerWithEmail({
          email,
          password,
          displayName,
          department,
          branch,
          semester,
        });
        if (res.verificationSent) {
          setNotice(
            'Account created! A verification email has been sent. Please verify your email before posting reports or listings.',
          );
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full mx-auto">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0F1A38] mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to UniLink
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Left Context Panel */}
          <div className="lg:col-span-5 bg-[#0F1A38] text-white p-8 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <UniLinkLogo variant="light" />
              <div className="space-y-2 pt-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-balance">
                  Verified access for students
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Sign in with Gmail or email to report lost items, coordinate safe desk handovers,
                  exchange books across semesters, and publish campus events.
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#14B8A6] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white">Verified Gmail & Email Access</p>
                  <p className="mt-1">
                    Supported domains:{' '}
                    <span className="font-mono text-white">
                      {campusConfig.allowedCollegeDomains.join(', ')}
                    </span>
                  </p>
                  <p className="mt-1 text-slate-400">
                    {campusConfig.strictCollegeDomainOnly
                      ? 'Domain allowlist enforcement is active via server configuration.'
                      : 'Sign in directly with Google (gmail.com) or register with email verification via Firebase Authentication.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Privacy by design: your email and contact details are isolated in your private
                  profile and never displayed on public campus boards.
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0F1A38]">
                  {mode === 'login' ? 'Sign in to your account' : 'Create student account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Powered by Firebase Authentication
                </p>
              </div>
              <div className="inline-flex p-1 bg-slate-100 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLocalError(null);
                    setNotice(null);
                    clearAuthError();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'login'
                      ? 'bg-white text-[#0F1A38] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1A38]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setLocalError(null);
                    setNotice(null);
                    clearAuthError();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'register'
                      ? 'bg-white text-[#0F1A38] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1A38]'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {(authError || localError) && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError || localError}</span>
              </div>
            )}

            {notice && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </div>
            )}

            {/* Primary Google Sign-In */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="w-full min-h-[44px] flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-[#0F1A38] transition-colors disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                Continue with Google
              </button>
              <p className="text-xs text-slate-500 text-center">
                Recommended for instant verified authentication with your Google (gmail.com) account
              </p>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="px-3 text-xs text-slate-400">or use email & password</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Riya Sharma"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                      >
                        {SEMESTERS.map((sem) => (
                          <option key={sem} value={sem}>
                            {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Branch Short Code
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. CSE, ECE, MECH"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F1A38] hover:bg-[#17254D] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {mode === 'register' && <UserPlus className="w-4 h-4" />}
                {busy
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In with Email'
                    : 'Register & Send Verification Email'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
