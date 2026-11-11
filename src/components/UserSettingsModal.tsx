import React, { useState } from 'react';
import { 
  X, Flame, Target, Check, Sparkles, User as UserIcon, 
  Shield, Award, Activity, Palette, ArrowRight, CheckCircle2, KeyRound 
} from 'lucide-react';
import { User, STAGE_CONFIG } from '../types/workout';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { triggerHaptic, playButtonClickSound, playSuccessChime } from '../utils/media';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveDailyCalorieGoal: (goal: number) => void;
  onOpenThemeSettings?: () => void;
  onOpenChangePassword?: () => void;
  themeSettings?: ThemeSettings;
}

const PRESET_GOALS = [
  { value: 350, label: '350 kcal', desc: 'Foundation / Light' },
  { value: 500, label: '500 kcal', desc: 'Standard / Active' },
  { value: 750, label: '750 kcal', desc: 'High Intensity' },
  { value: 1000, label: '1000 kcal', desc: 'Elite Endurance' },
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveDailyCalorieGoal,
  onOpenThemeSettings,
  onOpenChangePassword,
  themeSettings,
}) => {
  const currentGoal = currentUser?.dailyCalorieGoal || 500;
  const [goal, setGoal] = useState<number>(currentGoal);
  const [inputVal, setInputVal] = useState<string>(String(currentGoal));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);
  const stageConfig = currentUser ? STAGE_CONFIG[currentUser.stage || 'Normal'] : null;

  const handlePresetClick = (val: number) => {
    triggerHaptic(20);
    playButtonClickSound();
    setGoal(val);
    setInputVal(String(val));
    setErrorMsg('');
  };

  const handleStep = (delta: number) => {
    triggerHaptic(25);
    playButtonClickSound();
    const nextVal = Math.max(100, Math.min(5000, goal + delta));
    setGoal(nextVal);
    setInputVal(String(nextVal));
    setErrorMsg('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setGoal(num);
      setErrorMsg('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseInt(inputVal, 10);
    if (isNaN(cleanNum) || cleanNum < 100 || cleanNum > 5000) {
      setErrorMsg('Please enter a realistic calorie goal between 100 and 5,000 kcal.');
      return;
    }

    triggerHaptic([30, 40, 120]);
    playSuccessChime();
    onSaveDailyCalorieGoal(cleanNum);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div 
        className={`relative w-full max-w-xl rounded-2xl shadow-2xl p-6 sm:p-7 z-10 space-y-6 max-h-[92vh] overflow-y-auto border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-settings-title"
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-bold text-slate-950"
              style={{ backgroundColor: accentColor }}
            >
              <Target className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 id="user-settings-title" className="text-lg font-bold">
                User Settings & Goals
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Define your daily calorie target and view training profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Close user settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Athlete Overview Card */}
        {currentUser && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                style={{
                  backgroundColor: `rgba(${accentRgb}, 0.15)`,
                  color: accentColor,
                  border: `2px solid ${accentColor}`
                }}
              >
                {currentUser.role === 'admin' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>{currentUser.name}</span>
                  <span 
                    className="text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase tracking-wider"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    {currentUser.role === 'admin' ? 'Coach' : (stageConfig?.label || 'Member')}
                  </span>
                </div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-[11px] font-mono block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Daily Access Quota
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {stageConfig?.realEquivalent || '1 real routine'}
              </span>
            </div>
          </div>
        )}

        {/* Daily Calorie Goal Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="daily-calorie-goal-input" className="text-sm font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Daily Calorie Goal</span>
              </label>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Reflected as a reference line in your D3.js analytics charts
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 tabular-nums">
                {goal}
              </span>
              <span className={`text-xs ml-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                kcal / day
              </span>
            </div>
          </div>

          {/* Stepper + Input */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep(-50)}
              className={`px-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              aria-label="Decrease calorie goal by 50"
            >
              -50
            </button>

            <div className="relative flex-1">
              <input
                id="daily-calorie-goal-input"
                type="number"
                min="100"
                max="5000"
                step="25"
                value={inputVal}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono font-bold text-center text-base sm:text-lg focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
                placeholder="500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                kcal
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(+50)}
              className={`px-3.5 py-2.5 rounded-xl border text-sm font-bold font-mono transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              aria-label="Increase calorie goal by 50"
            >
              +50
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-medium">
              {errorMsg}
            </p>
          )}

          {/* Quick Presets */}
          <div>
            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Quick Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_GOALS.map((p) => {
                const isSelected = goal === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePresetClick(p.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-sm'
                        : isDark
                          ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-400' : ''}`}>
                        {p.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className={`text-[10px] block mt-0.5 truncate ${
                      isSelected ? 'text-emerald-300' : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* D3 Reference Line Preview / Callout */}
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200/90' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-400">
                Interactive D3.js Chart Integration
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Setting this goal immediately renders an emerald reference line labeled <strong>"Goal {goal} kcal"</strong> across your 7-day D3.js dual-axis performance charts and adjusts the vertical scale domain dynamically.
              </p>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {onOpenThemeSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenThemeSettings();
                  }}
                  className={`text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span>Theme & Colors</span>
                </button>
              )}

              {currentUser?.role === 'admin' && onOpenChangePassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChangePassword();
                  }}
                  className="text-xs font-medium flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark 
                    ? 'border-slate-800 text-slate-300 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Goal Saved!</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Save Daily Goal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
