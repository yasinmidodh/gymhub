import React, { useState, useEffect, useMemo } from 'react';
import { User, DailyNutritionLog } from '../types/workout';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { getNutritionLog, saveNutritionLog, getNutritionHistory, DEFAULT_NUTRITION_GOALS } from '../utils/storage';
import { cloudSaveNutritionLog } from '../utils/cloudSync';
import { triggerHaptic, playButtonClickSound, playCalorieCelebrationSound } from '../utils/media';
import { 
  Droplets, Flame, Utensils, Plus, Minus, ChevronLeft, ChevronRight, 
  RotateCcw, Sparkles, Check, CheckCircle2, Target, Calendar, Award,
  Sliders, Coffee, Dumbbell, Zap, AlertCircle
} from 'lucide-react';

interface NutritionTrackerProps {
  currentUser: User;
  themeSettings?: ThemeSettings;
}

interface MealPreset {
  name: string;
  emoji: string;
  protein: number;
  carbs: number;
  fats: number;
  waterMl?: number;
  description: string;
}

const COMMON_MEAL_PRESETS: MealPreset[] = [
  {
    name: 'Whey Protein Shake',
    emoji: '🥛',
    protein: 30,
    carbs: 4,
    fats: 2,
    waterMl: 350,
    description: '1 scoop whey isolate + water/almond milk',
  },
  {
    name: 'Chicken & White Rice',
    emoji: '🍗',
    protein: 45,
    carbs: 55,
    fats: 6,
    waterMl: 250,
    description: '200g grilled breast + 1.5 cups jasmine rice',
  },
  {
    name: 'Oats & Peanut Butter',
    emoji: '🥣',
    protein: 16,
    carbs: 52,
    fats: 16,
    waterMl: 250,
    description: 'Rolled oats, 1 tbsp peanut butter, berries',
  },
  {
    name: 'Lean Beef & Sweet Potato',
    emoji: '🥩',
    protein: 42,
    carbs: 45,
    fats: 14,
    waterMl: 250,
    description: 'Lean ground beef + roasted sweet potato',
  },
  {
    name: 'Eggs & Avocado Toast',
    emoji: '🥑',
    protein: 22,
    carbs: 32,
    fats: 18,
    waterMl: 200,
    description: '3 whole eggs + sourdough & avocado',
  },
  {
    name: 'Salmon & Quinoa Bowl',
    emoji: '🐟',
    protein: 38,
    carbs: 38,
    fats: 15,
    waterMl: 250,
    description: 'Baked salmon fillet + steamed quinoa & greens',
  },
];

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({
  currentUser,
  themeSettings,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [log, setLog] = useState<DailyNutritionLog>(() => getNutritionLog(currentUser.id, todayStr));
  const [history, setHistory] = useState<DailyNutritionLog[]>(() => getNutritionHistory(currentUser.id, 7));
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [customGoals, setCustomGoals] = useState({
    waterGoalMl: log.waterGoalMl,
    proteinGoalGrams: log.proteinGoalGrams,
    carbsGoalGrams: log.carbsGoalGrams,
    fatsGoalGrams: log.fatsGoalGrams,
  });

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);

  // Sync log whenever user switches date
  useEffect(() => {
    const current = getNutritionLog(currentUser.id, selectedDate);
    setLog(current);
    setCustomGoals({
      waterGoalMl: current.waterGoalMl,
      proteinGoalGrams: current.proteinGoalGrams,
      carbsGoalGrams: current.carbsGoalGrams,
      fatsGoalGrams: current.fatsGoalGrams,
    });
    setHistory(getNutritionHistory(currentUser.id, 7));
  }, [selectedDate, currentUser.id]);

  // Save log updates locally and sync to Cloud
  const updateLog = (newLog: DailyNutritionLog) => {
    setLog(newLog);
    saveNutritionLog(newLog);
    cloudSaveNutritionLog(newLog).catch(() => {});
    setHistory(getNutritionHistory(currentUser.id, 7));
  };

  // Water Intake Actions
  const handleAddWater = (deltaMl: number) => {
    triggerHaptic(20);
    playButtonClickSound();
    const newWater = Math.max(0, log.waterMl + deltaMl);
    
    // Play celebration if hitting water goal for the first time today
    if (newWater >= log.waterGoalMl && log.waterMl < log.waterGoalMl) {
      playCalorieCelebrationSound();
    }

    const updated: DailyNutritionLog = {
      ...log,
      waterMl: newWater,
    };
    updateLog(updated);
  };

  // Macro Updates
  const handleUpdateMacro = (macro: 'protein' | 'carbs' | 'fats', delta: number) => {
    triggerHaptic(20);
    playButtonClickSound();
    const key = macro === 'protein' ? 'proteinGrams' : macro === 'carbs' ? 'carbsGrams' : 'fatsGrams';
    const currentVal = log[key];
    const newVal = Math.max(0, currentVal + delta);

    const updated: DailyNutritionLog = {
      ...log,
      [key]: newVal,
    };
    updateLog(updated);
  };

  // Direct Number Input Change
  const handleDirectMacroInput = (macro: 'protein' | 'carbs' | 'fats' | 'water', value: number) => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    let updated: DailyNutritionLog;
    if (macro === 'water') {
      updated = { ...log, waterMl: safeVal };
    } else if (macro === 'protein') {
      updated = { ...log, proteinGrams: safeVal };
    } else if (macro === 'carbs') {
      updated = { ...log, carbsGrams: safeVal };
    } else {
      updated = { ...log, fatsGrams: safeVal };
    }
    updateLog(updated);
  };

  // Log a Meal Preset
  const handleApplyPreset = (preset: MealPreset) => {
    triggerHaptic(30);
    playButtonClickSound();
    const updated: DailyNutritionLog = {
      ...log,
      proteinGrams: log.proteinGrams + preset.protein,
      carbsGrams: log.carbsGrams + preset.carbs,
      fatsGrams: log.fatsGrams + preset.fats,
      waterMl: log.waterMl + (preset.waterMl || 0),
    };
    updateLog(updated);
  };

  // Reset Today's Log
  const handleResetDay = () => {
    if (!window.confirm("Reset water and macro tracking for this date?")) return;
    triggerHaptic(40);
    const updated: DailyNutritionLog = {
      ...log,
      waterMl: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatsGrams: 0,
    };
    updateLog(updated);
  };

  // Save Custom Goals
  const handleSaveCustomGoals = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(30);
    playButtonClickSound();
    const updated: DailyNutritionLog = {
      ...log,
      waterGoalMl: customGoals.waterGoalMl,
      proteinGoalGrams: customGoals.proteinGoalGrams,
      carbsGoalGrams: customGoals.carbsGoalGrams,
      fatsGoalGrams: customGoals.fatsGoalGrams,
    };
    updateLog(updated);
    setShowGoalEditor(false);
  };

  // Date Navigation Helpers
  const shiftDate = (deltaDays: number) => {
    triggerHaptic(20);
    playButtonClickSound();
    const current = new Date(selectedDate + 'T12:00:00Z');
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === todayStr;

  const displayDateFormatted = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00Z');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    return `${isToday ? 'Today · ' : ''}${dayName}, ${month} ${dayNum}`;
  }, [selectedDate, isToday]);

  // Derived Macro Calculations
  const proteinKcal = log.proteinGrams * 4;
  const carbsKcal = log.carbsGrams * 4;
  const fatsKcal = log.fatsGrams * 9;
  const totalMacroCalories = proteinKcal + carbsKcal + fatsKcal;

  const targetMacroCalories = (log.proteinGoalGrams * 4) + (log.carbsGoalGrams * 4) + (log.fatsGoalGrams * 9);

  // Macro percentages for distribution bar
  const macroPercentages = useMemo(() => {
    if (totalMacroCalories === 0) return { protein: 33, carbs: 33, fats: 34 };
    return {
      protein: Math.round((proteinKcal / totalMacroCalories) * 100),
      carbs: Math.round((carbsKcal / totalMacroCalories) * 100),
      fats: Math.round((fatsKcal / totalMacroCalories) * 100),
    };
  }, [proteinKcal, carbsKcal, fatsKcal, totalMacroCalories]);

  const waterPercent = Math.min(100, Math.round((log.waterMl / log.waterGoalMl) * 100));
  const proteinPercent = Math.min(100, Math.round((log.proteinGrams / log.proteinGoalGrams) * 100));
  const carbsPercent = Math.min(100, Math.round((log.carbsGrams / log.carbsGoalGrams) * 100));
  const fatsPercent = Math.min(100, Math.round((log.fatsGrams / log.fatsGoalGrams) * 100));

  return (
    <section 
      id="nutrition-tracker-section"
      className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-6 transition-colors scroll-mt-20 ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* 1. Header & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md text-slate-950 font-extrabold"
            style={{ backgroundColor: accentColor }}
          >
            <Utensils className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">Nutrition & Macro Tracking</h3>
              <span 
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                style={{
                  color: accentColor,
                  borderColor: accentColor,
                  backgroundColor: `rgba(${accentRgb}, 0.1)`
                }}
              >
                Hydration & Fuel
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Log daily water intake, protein, carbs, and fats to fuel peak performance and muscle recovery
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => shiftDate(-1)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Previous Day"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
            isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{displayDateFormatted}</span>
          </div>

          <button
            onClick={() => shiftDate(1)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Next Day"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              Today
            </button>
          )}

          <button
            onClick={() => setShowGoalEditor(!showGoalEditor)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ml-1 ${
              showGoalEditor 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                : isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Edit Daily Nutrition Goals"
            aria-label="Edit daily nutrition goals"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Optional Goals Editor Drawer */}
      {showGoalEditor && (
        <form onSubmit={handleSaveCustomGoals} className={`p-4 rounded-xl border space-y-4 animate-in fade-in duration-200 ${
          isDark ? 'bg-[#070B12] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Personal Nutrition Goals</h4>
            </div>
            <span className="text-[11px] text-slate-400">Customized targets for your bodyweight & stage</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Water Goal (ml)</label>
              <input
                type="number"
                step="100"
                min="500"
                max="10000"
                value={customGoals.waterGoalMl}
                onChange={(e) => setCustomGoals({ ...customGoals, waterGoalMl: parseInt(e.target.value) || 3000 })}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  isDark ? 'bg-black border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-cyan-400 block mb-1">Protein Goal (g)</label>
              <input
                type="number"
                step="5"
                min="20"
                max="500"
                value={customGoals.proteinGoalGrams}
                onChange={(e) => setCustomGoals({ ...customGoals, proteinGoalGrams: parseInt(e.target.value) || 160 })}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  isDark ? 'bg-black border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-amber-400 block mb-1">Carbs Goal (g)</label>
              <input
                type="number"
                step="5"
                min="20"
                max="800"
                value={customGoals.carbsGoalGrams}
                onChange={(e) => setCustomGoals({ ...customGoals, carbsGoalGrams: parseInt(e.target.value) || 220 })}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  isDark ? 'bg-black border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-emerald-400 block mb-1">Fats Goal (g)</label>
              <input
                type="number"
                step="5"
                min="10"
                max="300"
                value={customGoals.fatsGoalGrams}
                onChange={(e) => setCustomGoals({ ...customGoals, fatsGoalGrams: parseInt(e.target.value) || 65 })}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                  isDark ? 'bg-black border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowGoalEditor(false)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 transition-transform active:scale-95 cursor-pointer shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              Save Goals
            </button>
          </div>
        </form>
      )}

      {/* 3. Water Intake Station (Primary User Request) */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#071322] via-[#09182E] to-[#06101D] border-cyan-900/60' 
          : 'bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 border-cyan-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
              <Droplets className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
                  Daily Hydration
                </span>
                {waterPercent >= 100 && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-mono font-bold bg-cyan-400 text-slate-950 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Goal Achieved!
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  {log.waterMl.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  / {log.waterGoalMl.toLocaleString()} ml
                </span>
                <span className="text-xs font-bold font-mono text-cyan-400 ml-1">
                  ({waterPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Water Logging Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAddWater(250)}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Add 1 Glass (250 ml)"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+250 ml</span>
              <span className="text-[10px] text-cyan-400/70 hidden sm:inline">(Glass)</span>
            </button>

            <button
              onClick={() => handleAddWater(500)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md hover:brightness-110"
              title="Add 1 Shaker Bottle (500 ml)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+500 ml</span>
              <span className="text-[10px] hidden sm:inline">(Bottle)</span>
            </button>

            <button
              onClick={() => handleAddWater(750)}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Add 1 Large Jug (750 ml)"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+750 ml</span>
            </button>

            {log.waterMl > 0 && (
              <button
                onClick={() => handleAddWater(-250)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer text-slate-400 hover:text-red-400 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
                title="Undo 250 ml"
                aria-label="Undo 250 ml"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Water Progress Bar */}
        <div className="w-full bg-slate-900/60 dark:bg-slate-950 h-3 rounded-full overflow-hidden mt-3.5 border border-cyan-900/30">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500 relative"
            style={{ width: `${waterPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Macro-Nutrients Grid (Protein, Carbs, Fats) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">
              Macro-Nutrients Breakdown
            </span>
          </div>

          <div className="text-xs font-mono font-bold flex items-center gap-2">
            <span className="text-slate-500">Total Fuel:</span>
            <span className="text-slate-900 dark:text-white tabular-nums text-sm font-extrabold" style={{ color: accentColor }}>
              {totalMacroCalories.toLocaleString()} kcal
            </span>
            <span className="text-slate-500 text-[11px]">/ {targetMacroCalories} target</span>
          </div>
        </div>

        {/* 3 Macro Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: PROTEIN */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-[#090E17] border-cyan-900/50' : 'bg-slate-50 border-cyan-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-extrabold text-cyan-400 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" /> PROTEIN
                </span>
                <span className="text-slate-400 font-semibold">{proteinPercent}%</span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div className="text-2xl font-extrabold font-mono tabular-nums text-cyan-400">
                  {log.proteinGrams} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Target: {log.proteinGoalGrams}g ({proteinKcal} kcal)
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stepper Buttons */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => handleUpdateMacro('protein', 10)}
                className="flex-1 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer text-center"
              >
                +10g
              </button>
              <button
                onClick={() => handleUpdateMacro('protein', 25)}
                className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer text-center"
              >
                +25g
              </button>
              {log.proteinGrams > 0 && (
                <button
                  onClick={() => handleUpdateMacro('protein', -10)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer"
                  title="Remove 10g"
                >
                  -10g
                </button>
              )}
            </div>
          </div>

          {/* Card 2: CARBS */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-[#090E17] border-amber-900/50' : 'bg-slate-50 border-amber-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> CARBOHYDRATES
                </span>
                <span className="text-slate-400 font-semibold">{carbsPercent}%</span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div className="text-2xl font-extrabold font-mono tabular-nums text-amber-400">
                  {log.carbsGrams} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Target: {log.carbsGoalGrams}g ({carbsKcal} kcal)
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stepper Buttons */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => handleUpdateMacro('carbs', 15)}
                className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer text-center"
              >
                +15g
              </button>
              <button
                onClick={() => handleUpdateMacro('carbs', 30)}
                className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer text-center"
              >
                +30g
              </button>
              {log.carbsGrams > 0 && (
                <button
                  onClick={() => handleUpdateMacro('carbs', -15)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer"
                  title="Remove 15g"
                >
                  -15g
                </button>
              )}
            </div>
          </div>

          {/* Card 3: FATS */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-[#090E17] border-emerald-900/50' : 'bg-slate-50 border-emerald-200'
          }`}>
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> HEALTHY FATS
                </span>
                <span className="text-slate-400 font-semibold">{fatsPercent}%</span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
                  {log.fatsGrams} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Target: {log.fatsGoalGrams}g ({fatsKcal} kcal)
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${fatsPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stepper Buttons */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
              <button
                onClick={() => handleUpdateMacro('fats', 5)}
                className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer text-center"
              >
                +5g
              </button>
              <button
                onClick={() => handleUpdateMacro('fats', 10)}
                className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer text-center"
              >
                +10g
              </button>
              {log.fatsGrams > 0 && (
                <button
                  onClick={() => handleUpdateMacro('fats', -5)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer"
                  title="Remove 5g"
                >
                  -5g
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Macro Ratio Split Bar */}
        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
          isDark ? 'bg-[#070B12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Macro Calorie Distribution Ratio</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> {macroPercentages.protein}% Protein
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> {macroPercentages.carbs}% Carbs
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> {macroPercentages.fats}% Fats
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800">
            <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${macroPercentages.protein}%` }} />
            <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${macroPercentages.carbs}%` }} />
            <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${macroPercentages.fats}%` }} />
          </div>
        </div>
      </div>

      {/* 5. Quick Gym Meal Presets (1-Tap Logging) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
              Quick Athletic Meal Presets (1-Tap Log)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Tap any item to instantly add to your daily log</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {COMMON_MEAL_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset)}
              className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group hover:border-cyan-500/50 ${
                isDark 
                  ? 'bg-[#090D16] border-slate-800 hover:bg-slate-900' 
                  : 'bg-white border-slate-200 hover:bg-cyan-50/50 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">{preset.emoji}</span>
                  <Plus className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-bold text-xs mt-1 text-slate-900 dark:text-white line-clamp-1">
                  {preset.name}
                </div>
                <p className={`text-[10px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {preset.description}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-cyan-400">{preset.protein}p</span>
                <span className="text-amber-400">{preset.carbs}c</span>
                <span className="text-emerald-400">{preset.fats}f</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. 7-Day Consistency History & Reset */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark ? 'bg-[#070B12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-mono text-slate-400 shrink-0">Last 7 Days:</span>
          {history.map((h) => {
            const isSelected = h.date === selectedDate;
            const metWater = h.waterMl >= h.waterGoalMl && h.waterGoalMl > 0;
            const metProtein = h.proteinGrams >= h.proteinGoalGrams && h.proteinGoalGrams > 0;
            const d = new Date(h.date + 'T12:00:00Z');
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });

            return (
              <button
                key={h.date}
                onClick={() => setSelectedDate(h.date)}
                className={`flex flex-col items-center p-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer min-w-[36px] ${
                  isSelected 
                    ? 'border-cyan-400 bg-cyan-500/10 font-bold' 
                    : isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-[10px] text-slate-400">{dayLabel}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${metWater ? 'bg-cyan-400' : 'bg-slate-700'}`} title="Water Met" />
                  <span className={`w-1.5 h-1.5 rounded-full ${metProtein ? 'bg-emerald-400' : 'bg-slate-700'}`} title="Protein Met" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleResetDay}
            className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset this day's entries"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Day</span>
          </button>
        </div>
      </div>
    </section>
  );
};
