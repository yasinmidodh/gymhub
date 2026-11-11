import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { WorkoutVideo, User } from '../types/workout';
import { getDeviceVideoUrl } from '../utils/deviceVideoStorage';
import { 
  playTimerAlertSound, 
  playWorkoutDoneSound, 
  playTimerTickSound, 
  playTimerStartSound, 
  playButtonClickSound, 
  triggerHaptic, 
  getWorkoutThumbnail 
} from '../utils/media';
import { 
  X, CheckCircle, Clock, Award, Dumbbell, 
  Play, Pause, RotateCcw, Timer, HardDrive, ShieldCheck, Zap,
  Volume2, ShieldAlert, FileText, Save, Check, PenLine, Sparkles
} from 'lucide-react';

interface VideoModalProps {
  video: WorkoutVideo | null;
  onClose: () => void;
  isCompleted: boolean;
  onToggleCompleted: (videoId: string) => void;
  currentUser?: User | null;
  onSaveNote?: (videoId: string, note: string) => Promise<boolean | void> | void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  onClose,
  isCompleted,
  onToggleCompleted,
  currentUser,
  onSaveNote,
}) => {
  const [deviceUrl, setDeviceUrl] = useState<string | null>(null);
  const [loadingDeviceFile, setLoadingDeviceFile] = useState(false);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Personal Workout Notes State (Synced to User Profile)
  const savedProfileNote = (video && currentUser?.workoutNotes?.[video.id]) || '';
  const [personalNote, setPersonalNote] = useState<string>(savedProfileNote);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveStatus, setNoteSaveStatus] = useState<string | null>(null);

  // Sync personalNote when active video or user changes
  useEffect(() => {
    if (video) {
      const currentNote = currentUser?.workoutNotes?.[video.id] || '';
      setPersonalNote(currentNote);
      setNoteSaveStatus(null);
    }
  }, [video?.id, currentUser?.workoutNotes]);

  // Gym Rest Interval Timer State (Athlete Set Timer)
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [initialRestSeconds, setInitialRestSeconds] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Update live clock for forensic watermarking
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTimestamp(now.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load device video blob from IndexedDB / local storage
  useEffect(() => {
    let isMounted = true;
    if (video && video.deviceVideoId) {
      setLoadingDeviceFile(true);
      getDeviceVideoUrl(video.deviceVideoId)
        .then((url) => {
          if (isMounted) {
            setDeviceUrl(url);
            setLoadingDeviceFile(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setDeviceUrl(null);
            setLoadingDeviceFile(false);
          }
        });
    } else {
      setDeviceUrl(null);
      setLoadingDeviceFile(false);
    }
    return () => {
      isMounted = false;
    };
  }, [video]);

  // Circular rest countdown stopwatch logic with Web Audio & Haptic Alarm
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            // Timer finished!
            playTimerAlertSound();
            triggerHaptic([200, 100, 200, 100, 400]);
            return 0;
          }
          if (prev <= 4) {
            playTimerTickSound(true); // Urgent countdown sound at 3, 2, 1
          } else {
            playTimerTickSound(false); // Normal metronome tick
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restSeconds === 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, restSeconds]);

  if (!video) return null;

  const handleSavePersonalNote = async () => {
    if (!video || !onSaveNote) return;
    triggerHaptic(35);
    setIsSavingNote(true);
    try {
      await onSaveNote(video.id, personalNote);
      playButtonClickSound();
      setNoteSaveStatus('Saved to Profile ✓');
      setTimeout(() => setNoteSaveStatus(null), 3000);
    } catch (e) {
      setNoteSaveStatus('Failed to sync note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const videoDurationDisplay = video.duration || `${video.durationMinutes} min`;

  const handleStartTimer = (secs: number) => {
    triggerHaptic(40);
    playTimerStartSound();
    setInitialRestSeconds(secs);
    setRestSeconds(secs);
    setTimerRunning(true);
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Circular progress math
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = initialRestSeconds > 0 ? (restSeconds / initialRestSeconds) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const athleteWatermarkLabel = `GYM APP • ${currentUser?.name || 'ATHLETE'} • ID:${currentUser?.id?.slice(0, 8) || 'MEMBER'} • ${liveTimestamp}`;
  const posterSvg = video.thumbnailUrl || getWorkoutThumbnail(video.muscleGroup);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#090D16] border border-cyan-900/40 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden z-10 flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#000000]">
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-mono">
              {video.muscleGroup}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>Native Device Media</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Encrypted Player</span>
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {video.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 shrink-0 cursor-pointer"
            aria-label="Close workout modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Secure Video Player (Responsive 16:9) with Anti-Piracy Watermarking */}
          <div 
            className="relative w-full pt-[56.25%] rounded-xl overflow-hidden bg-black border border-cyan-900/40 shadow-2xl select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            {loadingDeviceFile ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-black">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-cyan-300">Decrypting workout media from device storage...</span>
              </div>
            ) : deviceUrl ? (
              <div className="absolute inset-0 w-full h-full">
                <video
                  ref={videoRef}
                  key={deviceUrl}
                  src={deviceUrl}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsInline
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            ) : (
              /* Fallback interactive coaching visualizer when device video blob is empty */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-[#070B12] to-black p-6 text-center">
                <img 
                  src={posterSvg} 
                  alt={video.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[1px] pointer-events-none"
                />
                <div className="relative z-10 max-w-md flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950/60">
                    <Dumbbell className="w-8 h-8 animate-pulse" />
                  </div>
                  <h4 className="text-base font-extrabold text-white mb-1 tracking-tight">
                    {video.title}
                  </h4>
                  <p className="text-xs text-cyan-300/80 font-mono mb-3">
                    Target: {video.muscleGroup} • Stage: {video.requiredStage || 'Normal'}
                  </p>
                  <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Protected Device Media • Ready for Gym Execution</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Local device video file: {video.deviceFileName || 'system-routine.mp4'}
                  </span>
                </div>
              </div>
            )}

            {/* DYNAMIC FORENSIC WATERMARK OVERLAY (Prevents screen recording and illegal re-distribution) */}
            <motion.div
              className="absolute pointer-events-none select-none z-20 px-2.5 py-1 rounded bg-black/45 border border-cyan-500/20 backdrop-blur-[2px] text-[10px] font-mono text-cyan-400/50 shadow-sm"
              animate={{
                x: [10, 160, 40, 220, 20],
                y: [10, 90, 180, 50, 10],
              }}
              transition={{
                repeat: Infinity,
                duration: 22,
                ease: 'easeInOut',
              }}
            >
              <div className="flex items-center gap-1.5 tracking-wider font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{athleteWatermarkLabel}</span>
              </div>
            </motion.div>

            {/* Secondary fixed micro-badge */}
            <div className="absolute bottom-2 right-2 pointer-events-none select-none z-10 px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
              <span>GYM APP SECURE STREAM</span>
            </div>
          </div>

          {/* Serious Athlete Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-[#000000] border border-cyan-950/60 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Duration</div>
                <div className="font-extrabold text-white font-mono tabular-nums text-sm text-cyan-300">
                  {videoDurationDisplay}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Equipment</div>
                <div className="font-semibold text-white truncate" title={video.equipment || 'Standard'}>
                  {video.equipment || 'Gym Standard'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Difficulty</div>
                <div className="font-semibold text-white">{video.difficulty}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Target Intensity</div>
                <div className="font-semibold text-amber-300 font-mono">
                  RPE {video.rpe || 8}/10
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Head Coach</div>
                <div className="font-semibold text-emerald-300 truncate">
                  {video.trainerName || 'Muhammad'}
                </div>
              </div>
            </div>
          </div>

          {/* GYM REST STOPWATCH / CIRCULAR COUNTDOWN TIMER */}
          <div className="p-4 rounded-xl bg-[#000000] border border-cyan-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              {/* Circular SVG Ring Countdown */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    className={`transition-all duration-500 ease-linear ${
                      restSeconds === 0
                        ? 'stroke-emerald-400'
                        : timerRunning
                        ? 'stroke-cyan-400'
                        : 'stroke-slate-600'
                    }`}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xs font-mono font-bold tabular-nums ${
                    restSeconds === 0 ? 'text-emerald-300 animate-pulse' : 'text-white'
                  }`}>
                    {restSeconds}s
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Pro Rest Interval Timer</span>
                  {timerRunning && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {restSeconds === 0 
                    ? '⚡ Rest complete! Next set ready to fire.' 
                    : 'Audible chime + haptic pulse upon 00:00'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                {[30, 60, 90, 120].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStartTimer(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      initialRestSeconds === s && timerRunning
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>

              {/* Play/Pause & Reset */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                <button
                  onClick={() => {
                    triggerHaptic(30);
                    setTimerRunning(!timerRunning);
                  }}
                  className="p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 cursor-pointer"
                  title={timerRunning ? 'Pause rest timer' : 'Start rest timer'}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    setTimerRunning(false);
                    setRestSeconds(initialRestSeconds);
                  }}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Exercise Overview & Biomechanics
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-[#000000]/60 p-4 rounded-xl border border-slate-800/80">
              {video.description}
            </p>
          </div>

          {/* Trainer's Coaching Instructions / Pro Tips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span>Coach Muhammad's Form & Execution Tips</span>
                <span className="text-[10px] text-slate-400 font-normal">({video.tips.length} key cues)</span>
              </h4>
            </div>
            <div className="space-y-2.5">
              {video.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#000000] border border-slate-800/80 text-sm text-slate-200"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="leading-snug">{tip}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PERSONAL ATHLETE WORKOUT NOTES (SYNCED TO PROFILE) */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#000000] border border-cyan-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Personal Workout Notes</span>
                    {currentUser && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                        {currentUser.name}'s Profile
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Log seat angle, working weights (kg/lbs), reps, or personal biomechanical reflections
                  </p>
                </div>
              </div>

              {noteSaveStatus && (
                <div className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/90 border border-emerald-600 text-emerald-300 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>{noteSaveStatus}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={personalNote}
                  onChange={(e) => {
                    setPersonalNote(e.target.value);
                    if (noteSaveStatus) setNoteSaveStatus(null);
                  }}
                  maxLength={600}
                  rows={3}
                  placeholder="e.g., Seat pin notch #3. Used 24kg dumbbells for 4 sets of 10 reps. Kept 3-second eccentric stretch with strict elbow angle..."
                  className="w-full p-3 rounded-xl bg-[#070B12] border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-sans transition-colors resize-none"
                />
                <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-500 pointer-events-none">
                  {personalNote.length} / 600
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>
                    {savedProfileNote ? 'Note saved in your profile' : 'No personal note saved yet'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {personalNote !== savedProfileNote && savedProfileNote && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(20);
                        setPersonalNote(savedProfileNote);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSavePersonalNote}
                    disabled={isSavingNote || personalNote === savedProfileNote}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      personalNote !== savedProfileNote
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-400/20 font-extrabold'
                        : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {isSavingNote ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {personalNote !== savedProfileNote ? 'Save Note to Profile' : 'Saved to Profile ✓'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-[#000000] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Native Video {video.deviceFileSizeMb ? `(${video.deviceFileSizeMb} MB)` : ''}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-cyan-400 font-mono">
              GYM App Pro Player
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic([50, 50, 100]);
                if (!isCompleted) {
                  playWorkoutDoneSound();
                } else {
                  playButtonClickSound();
                }
                onToggleCompleted(video.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20 font-extrabold'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isCompleted ? 'Workout Completed ✓' : 'Mark as Completed'}</span>
            </button>
            <button
              onClick={() => {
                playButtonClickSound();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
