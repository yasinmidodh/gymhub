import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Volume2, Bell } from 'lucide-react';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { triggerHaptic, playButtonClickSound, playSuccessChime } from '../utils/media';

interface WorkoutRestTimerProps {
  themeSettings?: ThemeSettings;
}

export const WorkoutRestTimer: React.FC<WorkoutRestTimerProps> = ({ themeSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            triggerHaptic([100, 50, 100, 50, 200]);
            playSuccessChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, secondsLeft]);

  const setPreset = (sec: number) => {
    triggerHaptic(20);
    playButtonClickSound();
    setTotalSeconds(sec);
    setSecondsLeft(sec);
    setIsRunning(true);
  };

  const toggleRunning = () => {
    triggerHaptic(20);
    playButtonClickSound();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    triggerHaptic(20);
    playButtonClickSound();
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const remainingSecs = secondsLeft % 60;
  const formattedTime = `${minutes}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;

  return (
    <>
      {/* Floating Trigger Button (Bottom Left on Mobile/Desktop, above bottom nav) */}
      <button
        onClick={() => {
          triggerHaptic(20);
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-20 md:bottom-6 left-4 z-40 p-3 rounded-full shadow-2xl flex items-center gap-2 border font-mono font-bold text-xs transition-all cursor-pointer min-h-[44px] min-w-[44px] backdrop-blur-md"
        style={{
          backgroundColor: isDark ? 'rgba(9, 13, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isRunning ? accentColor : (isDark ? '#334155' : '#E2E8F0'),
          color: isRunning ? accentColor : (isDark ? '#FFFFFF' : '#0F172A')
        }}
        aria-label="Rest interval timer"
        title="Rest Interval Timer"
      >
        <Timer className="w-5 h-5" style={isRunning ? { color: accentColor } : {}} />
        <span className="tabular-nums font-bold">{isRunning ? formattedTime : 'Rest'}</span>
      </button>

      {/* Floating Modal / Card Drawer */}
      {isOpen && (
        <div 
          className={`fixed bottom-36 md:bottom-20 left-4 z-50 w-72 rounded-2xl shadow-2xl p-4 border animate-in slide-in-from-bottom-4 duration-200 backdrop-blur-md ${
            isDark ? 'bg-[#090D16]/98 border-slate-800 text-white' : 'bg-white/98 border-slate-200 text-slate-900 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-xs font-bold font-mono">Rest Interval Timer</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time display */}
          <div className="py-4 text-center">
            <div className="text-4xl font-extrabold font-mono tabular-nums tracking-wider" style={{ color: accentColor }}>
              {formattedTime}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {isRunning ? 'Resting between sets...' : secondsLeft === 0 ? 'Rest complete! Next set!' : 'Ready'}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[30, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => setPreset(sec)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                  totalSeconds === sec && isRunning
                    ? 'text-slate-950 font-bold border-transparent'
                    : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                style={totalSeconds === sec && isRunning ? { backgroundColor: accentColor } : {}}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={toggleRunning}
              className="flex-1 py-2 px-3 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>
            <button
              onClick={resetTimer}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
