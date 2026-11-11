import React, { useState, useRef } from 'react';
import { 
  X, Camera, Upload, Sparkles, AlertCircle, CheckCircle2, 
  Trash2, Dumbbell, Calendar, MessageSquare, Info 
} from 'lucide-react';
import { User, MuscleGroup, ProgressPhotoCheckin } from '../types/workout';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { triggerHaptic, playButtonClickSound, playSuccessChime } from '../utils/media';

interface ProgressPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveCheckin: (checkin: Omit<ProgressPhotoCheckin, 'id' | 'createdAt'>) => void;
  themeSettings?: ThemeSettings;
}

const MUSCLE_OPTIONS: Exclude<MuscleGroup, 'All'>[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Abs',
  'Cardio/Full Body'
];

export const ProgressPhotoModal: React.FC<ProgressPhotoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveCheckin,
  themeSettings,
}) => {
  const [beforePhoto, setBeforePhoto] = useState<string>('');
  const [afterPhoto, setAfterPhoto] = useState<string>('');
  const [workoutDate, setWorkoutDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [muscleFocus, setMuscleFocus] = useState<string>('Chest');
  const [userNote, setUserNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image is too large. Please select a photo under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setter(result);
      setErrorMsg('');
      triggerHaptic(20);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadDemoSample = () => {
    triggerHaptic(25);
    playButtonClickSound();
    setBeforePhoto("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='100%25' height='100%25' fill='%23111827'/%3E%3Ccircle cx='200' cy='140' r='50' fill='%23374151'/%3E%3Cpath d='M120 320 C120 220, 280 220, 280 320 L280 440 L120 440 Z' fill='%23374151'/%3E%3Crect x='30' y='30' width='140' height='36' rx='8' fill='%231F2937' stroke='%234B5563'/%3E%3Ctext x='100' y='53' fill='%239CA3AF' font-family='sans-serif' font-size='13' font-weight='bold' text-anchor='middle'%3EBEFORE WORKOUT%3C/text%3E%3Ctext x='200' y='470' fill='%236B7280' font-family='monospace' font-size='11' text-anchor='middle'%3EPre-Session Posture & State%3C/text%3E%3C/svg%3E");
    setAfterPhoto("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='100%25' height='100%25' fill='%230B132B'/%3E%3Ccircle cx='200' cy='140' r='50' fill='%2300E5FF' fill-opacity='0.25' stroke='%2300E5FF' stroke-width='2'/%3E%3Cpath d='M110 320 C110 210, 290 210, 290 320 L290 440 L110 440 Z' fill='%2300E5FF' fill-opacity='0.2' stroke='%2300E5FF' stroke-width='2'/%3E%3Crect x='30' y='30' width='140' height='36' rx='8' fill='%23064E3B' stroke='%2310B981'/%3E%3Ctext x='100' y='53' fill='%2334D399' font-family='sans-serif' font-size='13' font-weight='bold' text-anchor='middle'%3EAFTER WORKOUT%3C/text%3E%3Ctext x='200' y='470' fill='%2300E5FF' font-family='monospace' font-size='11' text-anchor='middle'%3EPost-Session Vascularity & Pump%3C/text%3E%3C/svg%3E");
    setUserNote("Felt strong contraction in upper chest and lats today. Increased weight by 2.5kg with strict 3s eccentrics.");
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforePhoto && !afterPhoto) {
      setErrorMsg('Please upload at least a before or after photo to submit.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic([30, 40, 100]);
    playSuccessChime();

    onSaveCheckin({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      beforePhotoUrl: beforePhoto || undefined,
      afterPhotoUrl: afterPhoto || undefined,
      workoutDate,
      muscleFocus,
      userNote: userNote.trim() || undefined,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div 
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-7 z-10 space-y-6 max-h-[92vh] overflow-y-auto border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-photo-title"
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
              <Camera className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="progress-photo-title" className="text-lg font-bold">
                  Physique Progress Check-in
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                  Optional
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Add before & after photos for Coach Muhammad to review your improvement and send feedback
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
            aria-label="Close photo check-in"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Disclaimer Notice */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-semibold text-white">This check-in is 100% optional:</span> You can train freely without uploading any photos. If you choose to share your before/after photos, Coach Muhammad reviews your physique progress, assesses muscular development and form, and sends personalized feedback back to your athlete dashboard.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Side-by-Side Photo Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className={`p-4 rounded-xl border flex flex-col items-center text-center justify-between min-h-[240px] transition-colors ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  1. Before Training
                </span>
                {beforePhoto && (
                  <button
                    type="button"
                    onClick={() => setBeforePhoto('')}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    aria-label="Remove before photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {beforePhoto ? (
                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden border border-slate-700 my-auto bg-black flex items-center justify-center">
                  <img 
                    src={beforePhoto} 
                    alt="Athlete Before Training" 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-slate-300 border border-slate-700">
                    Pre-Workout
                  </span>
                </div>
              ) : (
                <div 
                  onClick={() => beforeInputRef.current?.click()}
                  className={`w-full aspect-[4/5] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-slate-800 hover:border-cyan-500 bg-slate-900/40 hover:bg-slate-900/80' 
                      : 'border-slate-300 hover:border-cyan-600 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-bold text-slate-300">Choose Before Photo</span>
                  <span className="text-[11px] text-slate-500 mt-1">Upload from device or camera</span>
                </div>
              )}

              <input 
                ref={beforeInputRef}
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, setBeforePhoto)}
                className="hidden" 
                aria-label="Upload before workout photo"
              />
            </div>

            {/* After Photo */}
            <div className={`p-4 rounded-xl border flex flex-col items-center text-center justify-between min-h-[240px] transition-colors ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  2. After Training (Pump)
                </span>
                {afterPhoto && (
                  <button
                    type="button"
                    onClick={() => setAfterPhoto('')}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    aria-label="Remove after photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {afterPhoto ? (
                <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden border border-emerald-700/60 my-auto bg-black flex items-center justify-center">
                  <img 
                    src={afterPhoto} 
                    alt="Athlete After Training" 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700">
                    Post-Workout
                  </span>
                </div>
              ) : (
                <div 
                  onClick={() => afterInputRef.current?.click()}
                  className={`w-full aspect-[4/5] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-slate-800 hover:border-emerald-500 bg-slate-900/40 hover:bg-slate-900/80' 
                      : 'border-slate-300 hover:border-emerald-600 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Camera className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-bold text-slate-300">Choose After Photo</span>
                  <span className="text-[11px] text-slate-500 mt-1">Capture vascularity / muscle pump</span>
                </div>
              )}

              <input 
                ref={afterInputRef}
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, setAfterPhoto)}
                className="hidden" 
                aria-label="Upload after workout photo"
              />
            </div>
          </div>

          {/* Quick Demo Pre-load Button for easy testing */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleLoadDemoSample}
              className={`text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill With Demonstration Photos</span>
            </button>
          </div>

          {/* Workout Details: Date & Muscle Focus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="workout-date-input" className="text-xs font-mono font-bold uppercase tracking-wider block mb-1 text-slate-400">
                Session Date
              </label>
              <div className="relative">
                <input
                  id="workout-date-input"
                  type="date"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="muscle-focus-select" className="text-xs font-mono font-bold uppercase tracking-wider block mb-1 text-slate-400">
                Trained Muscle Focus
              </label>
              <select
                id="muscle-focus-select"
                value={muscleFocus}
                onChange={(e) => setMuscleFocus(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {MUSCLE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Note to Coach */}
          <div>
            <label htmlFor="user-note-input" className="text-xs font-mono font-bold uppercase tracking-wider block mb-1 text-slate-400">
              Note for Coach Muhammad (Optional)
            </label>
            <textarea
              id="user-note-input"
              rows={2}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="e.g. Felt great activation in upper chest today, kept 3 RIR on incline dumbbells..."
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <Upload className="w-4 h-4" />
              <span>Submit Progress Check-in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
