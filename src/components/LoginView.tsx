import React, { useState } from 'react';
import { Dumbbell, Shield, User as UserIcon, Lock, KeyRound, AlertCircle, Sparkles, Sun, Moon, Zap, CheckCircle2 } from 'lucide-react';
import { ThemeSettings } from '../utils/theme';
import { triggerHaptic } from '../utils/media';
import { playButtonClickSound } from '../utils/soundEffects';

interface LoginViewProps {
  onLogin: (identifier: string, pass: string) => { success: boolean; error?: string };
  themeSettings?: ThemeSettings;
  onToggleTheme?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLogin,
  themeSettings,
  onToggleTheme,
}) => {
  const [identifier, setIdentifier] = useState('muhammad@gymapp.com');
  const [password, setPassword] = useState('123');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = onLogin(identifier, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (emailVal: string, passVal: string) => {
    triggerHaptic(40);
    playButtonClickSound();
    setIdentifier(emailVal);
    setPassword(passVal);
    setErrorMessage('');
    setIsSubmitting(true);
    const result = onLogin(emailVal, passVal);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFillCredentials = (emailVal: string, passVal: string) => {
    triggerHaptic(25);
    playButtonClickSound();
    setIdentifier(emailVal);
    setPassword(passVal);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top Quick Theme Switcher */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          type="button"
          className={`absolute top-4 right-4 p-2.5 rounded-xl border transition-all cursor-pointer ${
            isDark 
              ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white' 
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
          title={isDark ? 'Switch to White Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
        </button>
      )}

      <div className="relative w-full max-w-lg space-y-4">
        {/* Quick Access Credentials Banner */}
        <div className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-xl ${
          isDark 
            ? 'bg-[#090D16]/95 border-cyan-500/30 text-white' 
            : 'bg-white border-cyan-500/30 text-slate-900 shadow-cyan-500/5'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Zap className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
                Instant Quick Access Credentials
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              1-Click Ready
            </span>
          </div>

          <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Click either role below to sign in instantly or copy the test accounts:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Admin (Coach Muhammad) */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isDark 
                ? 'bg-black/60 border-amber-500/30 hover:border-amber-400' 
                : 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Coach Muhammad</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                  ADMIN
                </span>
              </div>
              <div className="text-[11px] font-mono space-y-0.5 mb-2.5 text-slate-300">
                <div><span className="text-slate-500">Email:</span> <strong className="text-white">muhammad@gymapp.com</strong></div>
                <div><span className="text-slate-500">Pass:</span> <strong className="text-white">123</strong></div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('muhammad@gymapp.com', '123')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>1-Click Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('muhammad@gymapp.com', '123')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Fill form with admin details"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Athlete User (Alex) */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isDark 
                ? 'bg-black/60 border-cyan-500/30 hover:border-cyan-400' 
                : 'bg-cyan-50/60 border-cyan-300 hover:border-cyan-400'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Alex (Athlete)</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold">
                  MEMBER
                </span>
              </div>
              <div className="text-[11px] font-mono space-y-0.5 mb-2.5 text-slate-300">
                <div><span className="text-slate-500">Email:</span> <strong className="text-white">alex@gymapp.com</strong></div>
                <div><span className="text-slate-500">Pass:</span> <strong className="text-white">123</strong></div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('alex@gymapp.com', '123')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>1-Click User</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('alex@gymapp.com', '123')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Fill form with athlete details"
                >
                  Fill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className={`rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl border transition-colors ${
          isDark 
            ? 'bg-[#090D16] border-slate-800 text-white shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/80'
        }`}>
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg mb-4 text-black font-extrabold"
              style={{ backgroundColor: accentColor }}
            >
              <Dumbbell className="w-8 h-8 text-slate-950" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
              GYM <span style={{ color: accentColor }}>APP</span>
            </h1>
            <p className={`mt-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sign in to access your workout videos & athletic training program
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} 
                htmlFor="login-username"
              >
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. muhammad@gymapp.com or alex@gymapp.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none border ${
                    isDark
                      ? 'bg-black border-slate-800 text-white placeholder-slate-600 focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 shadow-sm'
                  }`}
                />
              </div>
            </div>

            <div>
              <label 
                className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} 
                htmlFor="login-password"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg text-sm transition-all font-mono focus:outline-none border ${
                    isDark
                      ? 'bg-black border-slate-800 text-white placeholder-slate-600 focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 shadow-sm'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl text-slate-950 font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Verifying Account...' : 'Sign In to GYM App'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
