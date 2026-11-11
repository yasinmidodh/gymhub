import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { User, WorkoutVideo, WorkoutCategory, WORKOUT_CATEGORIES, MuscleGroup, MembershipStage, STAGE_CONFIG, canAccessVideo, StageRequest, ProgressPhotoCheckin } from '../types/workout';
import { get7DayCompletionHistory, DailyCompletion } from '../utils/storage';
import { 
  getWorkoutThumbnail, 
  triggerHaptic, 
  playWorkoutDoneSound, 
  playButtonClickSound, 
  playStageUpgradeSound, 
  playCalorieCelebrationSound 
} from '../utils/media';
import { calculateVideoCalories, getUserCalorieAnalytics } from '../utils/calorieAnalytics';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { WeeklyD3Analytics } from './WeeklyD3Analytics';
import { NutritionTracker } from './NutritionTracker';
import { 
  Search, Play, CheckCircle2, Clock, Dumbbell, 
  Sparkles, Filter, X, Award, RotateCcw, Lock, Send,
  ChevronRight, Check, AlertCircle, BarChart3, History,
  Flame, Zap, HardDrive, FileVideo, Activity, TrendingUp, TrendingDown,
  Calendar, ShieldCheck, ArrowUpRight, ArrowDownRight, Target, FileText,
  Camera, Smartphone, Download, Utensils
} from 'lucide-react';

interface UserDashboardProps {
  currentUser: User;
  videos: WorkoutVideo[];
  completedVideoIds: string[];
  recentlyWatchedIds?: string[];
  stageRequests: StageRequest[];
  onOpenVideo: (video: WorkoutVideo) => void;
  onToggleCompleted: (videoId: string) => void;
  onSubmitStageRequest: (requestedStage: MembershipStage, note?: string) => { success: boolean; error?: string };
  themeSettings?: ThemeSettings;
  onOpenUserSettings?: () => void;
  onOpenProgressPhotos?: () => void;
  progressPhotos?: ProgressPhotoCheckin[];
  onDeleteProgressPhoto?: (id: string) => void;
  onOpenInstallPwa?: () => void;
}

const MUSCLE_FILTER_OPTIONS: MuscleGroup[] = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Abs',
  'Cardio/Full Body'
];

const ALL_STAGES: MembershipStage[] = ['Normal', 'Extra', 'Premium'];

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  videos,
  completedVideoIds,
  recentlyWatchedIds = [],
  stageRequests,
  onOpenVideo,
  onToggleCompleted,
  onSubmitStageRequest,
  themeSettings,
  onOpenUserSettings,
  onOpenProgressPhotos,
  progressPhotos = [],
  onDeleteProgressPhoto,
  onOpenInstallPwa,
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | WorkoutCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompletedOnly, setFilterCompletedOnly] = useState(false);
  const [filterByStage, setFilterByStage] = useState<'All' | MembershipStage>('All');
  const [chartView, setChartView] = useState<'comparison' | 'calories' | 'workouts'>('comparison');

  // Stage Request Modal State
  const [selectedTargetStage, setSelectedTargetStage] = useState<MembershipStage | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestStatus, setRequestStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);
  const userStage: MembershipStage = currentUser.stage || 'Normal';

  // Find user's progress photo checkins
  const userCheckins = useMemo(() => {
    return progressPhotos.filter(p => p.userId === currentUser.id);
  }, [progressPhotos, currentUser.id]);

  // Find user's latest stage request
  const userLatestRequest = useMemo(() => {
    return stageRequests.find(r => r.userId === currentUser.id);
  }, [stageRequests, currentUser.id]);

  // Overall Library Completion
  const totalLibraryCount = videos.length;
  const completedCount = completedVideoIds.length;
  const progressPercentage = totalLibraryCount > 0 
    ? Math.min(100, Math.round((completedCount / totalLibraryCount) * 100)) 
    : 0;

  // Calculate total minutes completed
  const totalMinutesCompleted = useMemo(() => {
    return videos
      .filter(v => completedVideoIds.includes(v.id))
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [videos, completedVideoIds]);

  // DAILY CALORIE BURN & DAY-OVER-DAY ANALYTICS (Factoring in custom daily calorie goal)
  const calorieAnalytics = useMemo(() => {
    return getUserCalorieAnalytics(currentUser.id, videos, userStage, currentUser.dailyCalorieGoal);
  }, [currentUser.id, videos, userStage, completedVideoIds, currentUser.dailyCalorieGoal]);

  // 7-DAY WORKOUT COMPLETION HISTORY
  const weeklyHistory = useMemo(() => {
    return get7DayCompletionHistory(currentUser.id);
  }, [currentUser.id, completedVideoIds]);

  const totalWeeklyWorkouts = useMemo(() => {
    return weeklyHistory.reduce((acc, curr) => acc + curr.completedCount, 0);
  }, [weeklyHistory]);

  const activeDaysCount = useMemo(() => {
    return weeklyHistory.filter(d => d.completedCount > 0).length;
  }, [weeklyHistory]);

  const avgWorkoutsPerDay = useMemo(() => {
    return Number((totalWeeklyWorkouts / 7).toFixed(1));
  }, [totalWeeklyWorkouts]);

  // RECENTLY WATCHED: Last 3 videos opened by the user
  const recentlyWatchedVideos = useMemo(() => {
    if (!recentlyWatchedIds || recentlyWatchedIds.length === 0) return [];
    return recentlyWatchedIds
      .map(id => videos.find(v => v.id === id))
      .filter((v): v is WorkoutVideo => !!v)
      .slice(0, 3);
  }, [recentlyWatchedIds, videos]);

  // Filtered Videos calculation
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      if (selectedMuscle !== 'All' && video.muscleGroup !== selectedMuscle) return false;
      if (selectedCategory !== 'All' && (video.category || 'Strength') !== selectedCategory) return false;
      if (filterByStage !== 'All' && video.requiredStage !== filterByStage) return false;
      if (filterCompletedOnly && !completedVideoIds.includes(video.id)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = video.title.toLowerCase().includes(query);
        const inMuscle = video.muscleGroup.toLowerCase().includes(query);
        const inCategory = (video.category || '').toLowerCase().includes(query);
        const inDesc = video.description.toLowerCase().includes(query);
        const inTips = video.tips.some(t => t.toLowerCase().includes(query));
        const inEquip = (video.equipment || '').toLowerCase().includes(query);
        return inTitle || inMuscle || inCategory || inDesc || inTips || inEquip;
      }

      return true;
    });
  }, [videos, selectedMuscle, selectedCategory, filterByStage, filterCompletedOnly, searchQuery, completedVideoIds]);

  // Video counts categorized by muscle group for top filter pills
  const muscleGroupCounts = useMemo(() => {
    const counts: Record<string, number> = { All: videos.length };
    for (const v of videos) {
      counts[v.muscleGroup] = (counts[v.muscleGroup] || 0) + 1;
    }
    return counts;
  }, [videos]);

  // Video counts categorized by workout category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: videos.length };
    for (const v of videos) {
      const cat = v.category || 'Strength';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [videos]);

  const handleResetFilters = () => {
    triggerHaptic(20);
    playButtonClickSound();
    setSearchQuery('');
    setSelectedMuscle('All');
    setSelectedCategory('All');
    setFilterByStage('All');
    setFilterCompletedOnly(false);
  };

  const handleToggleWorkoutWithSound = (videoId: string) => {
    triggerHaptic([40, 60]);
    const isNowDone = !completedVideoIds.includes(videoId);
    if (isNowDone) {
      playWorkoutDoneSound();
      const v = videos.find(x => x.id === videoId);
      const addedKcal = v ? calculateVideoCalories(v) : 150;
      if (calorieAnalytics.todayCalories + addedKcal >= calorieAnalytics.todayTarget) {
        setTimeout(() => playCalorieCelebrationSound(), 600);
      }
    } else {
      playButtonClickSound();
    }
    onToggleCompleted(videoId);
  };

  const handleSendStageRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetStage) return;

    triggerHaptic(35);
    setRequestStatus({ type: 'idle', message: '' });

    const result = onSubmitStageRequest(selectedTargetStage, requestNote);
    if (result.success) {
      triggerHaptic([50, 50, 100]);
      playStageUpgradeSound();
      setRequestStatus({
        type: 'success',
        message: `Upgrade request to ${selectedTargetStage} stage sent to Coach Muhammad!`
      });
      setRequestNote('');
      setTimeout(() => {
        setSelectedTargetStage(null);
        setRequestStatus({ type: 'idle', message: '' });
      }, 1500);
    } else {
      playButtonClickSound();
      setRequestStatus({
        type: 'error',
        message: result.error || 'Failed to submit stage request.'
      });
    }
  };

  const isPositiveDiff = calorieAnalytics.dayOverDayDiff >= 0;

  return (
    <div className="space-y-6">
      {/* 0. TOP WORKOUT SEARCH BAR & MUSCLE FILTER NAVIGATOR */}
      <div 
        className={`rounded-2xl p-4 sm:p-5 shadow-xl border transition-all ${
          isDark 
            ? 'bg-[#000000] border-slate-800 text-white shadow-black/40' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/70'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0 transition-transform"
              style={{ 
                backgroundColor: `rgba(${accentRgb}, 0.15)`,
                border: `1px solid rgba(${accentRgb}, 0.35)`
              }}
            >
              <Search className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Workout Video Navigator</span>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: accentColor,
                    borderColor: `rgba(${accentRgb}, 0.4)`,
                    backgroundColor: `rgba(${accentRgb}, 0.1)`
                  }}
                >
                  {filteredVideos.length} of {videos.length} Routines
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Instant search by workout title (e.g. Squat, Bench), target muscle, or cues
              </p>
            </div>
          </div>

          {(searchQuery || selectedMuscle !== 'All' || filterByStage !== 'All' || filterCompletedOnly) && (
            <button
              onClick={handleResetFilters}
              className={`self-start md:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Search Input Field */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workout routines by title (e.g. Squat, Bench, Cable Curl), target muscle group, or cues..."
            className={`w-full pl-10 pr-24 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none border font-medium transition-all shadow-inner ${
              isDark 
                ? 'bg-[#090D16] border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50' 
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/50'
            }`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => {
                  playButtonClickSound();
                  setSearchQuery('');
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <a
              href="#workout-catalog"
              onClick={() => {
                triggerHaptic(20);
                playButtonClickSound();
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-transform active:scale-95 text-slate-950 flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Muscle Group Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-thin">
          <span className={`text-[11px] font-mono shrink-0 mr-1 flex items-center gap-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Filter className="w-3 h-3" />
            <span>Muscle:</span>
          </span>
          {MUSCLE_FILTER_OPTIONS.map((mg) => {
            const count = muscleGroupCounts[mg] || 0;
            const isSelected = selectedMuscle === mg;
            return (
              <button
                key={mg}
                onClick={() => {
                  triggerHaptic(20);
                  playButtonClickSound();
                  setSelectedMuscle(mg);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'text-slate-950 font-bold shadow-md'
                    : isDark 
                      ? 'bg-[#090D16] text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
                style={isSelected ? { backgroundColor: accentColor } : {}}
              >
                <span>{mg}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected ? 'bg-black/20 text-slate-950' : 'bg-slate-800/40 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. HERO & ATHLETE OVERVIEW BANNER */}
      <div className={`rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden border transition-colors ${
        isDark 
          ? 'bg-[#000000] border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/70'
      }`}>
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-mono border"
                style={{
                  color: accentColor,
                  borderColor: accentColor,
                  backgroundColor: `rgba(${accentRgb}, 0.1)`
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Athlete Training Portal
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span style={{ color: accentColor }}>{currentUser.name}</span>
            </h1>

            <p className={`text-xs sm:text-sm max-w-xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Enrolled in <strong className="font-bold underline" style={{ color: accentColor }}>{userStage} Stage</strong>. Complete daily routines, track your calorie burn vs yesterday, and advance your biomechanical conditioning.
            </p>

            {/* Quick Athlete Bio Strip */}
            <div className="flex items-center gap-3 pt-2 text-xs font-mono flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span><strong className="font-bold">{calorieAnalytics.totalCaloriesAllTime}</strong> Total kcal Burned</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>{totalMinutesCompleted} Mins Trained</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>{completedCount} Completed</span>
              </div>
            </div>
          </div>

          {/* VISUAL PROGRESS BAR & PERCENTAGE INDICATOR */}
          <div className={`p-5 rounded-2xl border shrink-0 w-full lg:w-80 shadow-xl transition-colors ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" style={{ color: accentColor }} />
                <span>Workout Library Progress</span>
              </span>
              <span className="text-xl font-extrabold font-mono tabular-nums" style={{ color: accentColor }}>
                {progressPercentage}%
              </span>
            </div>

            {/* High-visibility horizontal progress bar */}
            <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border shadow-inner ${
              isDark ? 'bg-black border-slate-800' : 'bg-slate-200 border-slate-300'
            }`}>
              <div
                className="h-full rounded-full transition-all duration-700 shadow-md"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: accentColor 
                }}
              />
            </div>

            <div className={`mt-3 flex items-center justify-between text-xs pt-2 border-t font-mono ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{completedCount}</strong> of <strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalLibraryCount}</strong> completed
              </span>
              <span style={{ color: accentColor }}>
                {totalLibraryCount - completedCount} remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAILY CALORIE BURN & DAY-OVER-DAY DIFFERENCE CHARTS (FOR ALL USERS) */}
      <div className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header & Chart Switcher */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl text-black font-bold shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <Flame className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Daily Calorie Burn & Training Analytics</span>
                <span 
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: accentColor,
                    borderColor: accentColor,
                    backgroundColor: `rgba(${accentRgb}, 0.1)`
                  }}
                >
                  Day-over-Day Track
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Monitor today's energy expenditure and exact comparison against yesterday
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
            <div className={`p-1 rounded-xl border inline-flex items-center gap-1 flex-nowrap sm:flex-wrap ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => {
                  playButtonClickSound();
                  setChartView('comparison');
                }}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  chartView === 'comparison'
                    ? 'text-slate-950 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={chartView === 'comparison' ? { backgroundColor: accentColor } : {}}
              >
                Session vs Previous Day
              </button>
              <button
                onClick={() => {
                  playButtonClickSound();
                  setChartView('calories');
                }}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  chartView === 'calories'
                    ? 'text-slate-950 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={chartView === 'calories' ? { backgroundColor: accentColor } : {}}
              >
                7-Day Energy Trend
              </button>
              <button
                onClick={() => {
                  playButtonClickSound();
                  setChartView('workouts');
                }}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  chartView === 'workouts'
                    ? 'text-slate-950 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={chartView === 'workouts' ? { backgroundColor: accentColor } : {}}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Weekly Workouts (Recharts)</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  playButtonClickSound();
                  document.getElementById('weekly-d3-analytics-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border whitespace-nowrap ${
                  isDark 
                    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/50' 
                    : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Weekly D3 Analytics</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  playButtonClickSound();
                  document.getElementById('nutrition-tracker-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border whitespace-nowrap ${
                  isDark 
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Nutrition & Macros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Metrics Cards with Day-over-Day Difference (Mobile-Optimized 2x2 Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Metric 1: Today's Burn */}
          <div className={`p-3 sm:p-4 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-mono">
              <span className="truncate">Today's Burn</span>
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 truncate" style={{ color: accentColor }}>
              {calorieAnalytics.todayCalories} <span className="text-xs font-normal">kcal</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              Target: {calorieAnalytics.todayTarget} kcal/d
            </div>
          </div>

          {/* Metric 2: Day-Over-Day Difference (Key User Request) */}
          <div className={`p-3 sm:p-4 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-mono">
              <span className="truncate">vs Yesterday</span>
              {isPositiveDiff ? (
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              )}
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 flex items-center gap-1 truncate ${
              isPositiveDiff ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              <span>{isPositiveDiff ? `+${calorieAnalytics.dayOverDayDiff}` : calorieAnalytics.dayOverDayDiff}</span>
              <span className="text-xs font-normal">kcal</span>
            </div>
            <div className={`text-[10px] sm:text-[11px] font-mono font-semibold mt-1 truncate ${
              isPositiveDiff ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              {isPositiveDiff ? `▲ +${calorieAnalytics.dayOverDayPercent}%` : `▼ ${calorieAnalytics.dayOverDayPercent}%`} ({calorieAnalytics.yesterdayCalories}k)
            </div>
          </div>

          {/* Metric 3: Target Goal Progress */}
          <div className={`p-3 sm:p-4 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-mono">
              <span className="truncate">Daily Goal</span>
              <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 text-emerald-400 truncate">
              {calorieAnalytics.targetProgressPercent}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${calorieAnalytics.targetProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Metric 4: 7-Day Total */}
          <div className={`p-3 sm:p-4 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-mono">
              <span className="truncate">7-Day Total</span>
              <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 truncate">
              {calorieAnalytics.weeklyCalories} <span className="text-xs font-normal">kcal</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              Avg: {calorieAnalytics.avgDailyCalories} kcal/d
            </div>
          </div>
        </div>

        {/* Dynamic Recharts Graph (Session Comparison vs Calories vs Workouts) */}
        <div className="w-full pb-1 pt-2">
          {chartView === 'comparison' ? (
            <div className="space-y-4">
              {/* Comparison Header Summary */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                isDark ? 'bg-[#070B12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Current Session vs Previous Day Metrics</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                        isPositiveDiff 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}>
                        {isPositiveDiff ? `+${calorieAnalytics.dayOverDayDiff} kcal` : `${calorieAnalytics.dayOverDayDiff} kcal`} ({isPositiveDiff ? '+' : ''}{calorieAnalytics.dayOverDayPercent}%)
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Side-by-side comparison of active session expenditure against yesterday's benchmark
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-500 dark:bg-slate-600" />
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      Previous Day ({calorieAnalytics.yesterdayCalories} kcal)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: accentColor }} />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Current Session ({calorieAnalytics.todayCalories} kcal)
                    </span>
                  </div>
                </div>
              </div>

              {/* The Dedicated Bar Chart */}
              <div className="h-64 sm:h-72 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={calorieAnalytics.sessionComparison.comparisonBarData} 
                    margin={{ top: 20, right: 15, left: -18, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#161F2E' : '#E2E8F0'} vertical={false} />
                    <XAxis 
                      dataKey="displayName" 
                      stroke={isDark ? '#94A3B8' : '#64748B'} 
                      fontSize={11} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={{ stroke: isDark ? '#1E293B' : '#E2E8F0' }} 
                    />
                    <YAxis 
                      stroke={isDark ? '#64748B' : '#94A3B8'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: isDark ? '#1E293B' : '#E2E8F0' }} 
                      unit=" kcal"
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as typeof calorieAnalytics.sessionComparison.comparisonBarData[0];
                          return (
                            <div className={`p-3 sm:p-3.5 rounded-xl shadow-xl text-xs font-mono border ${
                              isDark ? 'bg-[#090D16] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                            }`}>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">{item.displayName}</div>
                              <div className="mt-1.5 text-base font-extrabold flex items-center gap-1.5" style={{ color: accentColor }}>
                                <Flame className="w-4 h-4" />
                                <span>{item.calories} kcal burned</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-1 border-t border-slate-200 dark:border-slate-800 pt-1.5">
                                <div>Completed Routines: <strong className="text-slate-900 dark:text-white">{item.sets} sets</strong></div>
                                <div>Training Volume: <strong className="text-slate-900 dark:text-white">{item.minutes} mins</strong></div>
                                <div>Avg Burn Rate: <strong className="text-slate-900 dark:text-white">{item.burnRateKcalPerMin} kcal/min</strong></div>
                                <div>Daily Target Goal: <strong className="text-slate-900 dark:text-slate-200">{item.targetCalories} kcal</strong></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      y={calorieAnalytics.todayTarget} 
                      stroke="#10B981" 
                      strokeDasharray="4 4" 
                      label={{ 
                        value: `Target: ${calorieAnalytics.todayTarget}k`, 
                        position: 'right', 
                        fill: '#10B981', 
                        fontSize: 9,
                        fontWeight: 600
                      }} 
                    />
                    <Bar 
                      dataKey="calories" 
                      radius={[8, 8, 0, 0]} 
                      maxBarSize={56}
                    >
                      {calorieAnalytics.sessionComparison.comparisonBarData.map((entry, idx) => (
                        <Cell 
                          key={`comp-cell-${idx}`} 
                          fill={idx === 0 ? (isDark ? '#475569' : '#94A3B8') : accentColor} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sub-grid of comparative metrics (Volume, Sets, Burn Intensity) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                {calorieAnalytics.sessionComparison.metricsList.map((m, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded-xl border ${
                      isDark ? 'bg-[#090D16] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex items-center justify-between">
                      <span className="truncate">{m.metric}</span>
                      <span className={`text-[10px] font-bold shrink-0 ${m.isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {m.isPositive ? `+${m.difference}` : m.difference}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 font-mono">
                      <div>
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {m.currentSession}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">{m.unit}</span>
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">
                        prev:{m.previousDay}
                      </div>
                    </div>
                    <div className={`text-[9px] sm:text-[10px] font-mono mt-1 truncate ${m.isPositive ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {m.isPositive ? `▲ +${m.percentChange}%` : `▼ ${m.percentChange}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : chartView === 'calories' ? (
            <div className="h-60 w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calorieAnalytics.history} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#161F2E' : '#E2E8F0'} vertical={false} />
                  <XAxis 
                    dataKey="dayLabel" 
                    stroke={isDark ? '#64748B' : '#94A3B8'} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: isDark ? '#1E293B' : '#E2E8F0' }} 
                  />
                  <YAxis 
                    stroke={isDark ? '#64748B' : '#94A3B8'} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: isDark ? '#1E293B' : '#E2E8F0' }} 
                    allowDecimals={false} 
                  />
                  <Tooltip 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as typeof calorieAnalytics.history[0];
                        return (
                          <div className={`p-3 rounded-xl shadow-xl text-xs font-mono border ${
                            isDark ? 'bg-[#090D16] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                          }`}>
                            <div className="font-bold">{d.dayLabel} ({d.displayDate})</div>
                            <div className="mt-1.5 flex items-center gap-1 font-bold" style={{ color: accentColor }}>
                              <Flame className="w-3.5 h-3.5" />
                              <span>{d.caloriesBurned} kcal burned</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Target goal: {d.targetCalories} kcal
                            </div>
                            <div className={`text-[11px] mt-1 font-semibold ${
                              d.diffFromYesterday >= 0 ? 'text-emerald-500' : 'text-amber-500'
                            }`}>
                              {d.diffFromYesterday >= 0 ? `+${d.diffFromYesterday}` : d.diffFromYesterday} kcal vs prior day
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="caloriesBurned" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {calorieAnalytics.history.map((entry, index) => {
                      const isToday = index === calorieAnalytics.history.length - 1;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.caloriesBurned > 0
                              ? isToday ? accentColor : '#38BDF8'
                              : isDark ? '#1E293B' : '#CBD5E1'
                          } 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Workouts Completion Header Summary */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                isDark ? 'bg-[#070B12] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-2 rounded-lg border text-black font-extrabold"
                    style={{ backgroundColor: accentColor }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Workouts Completed Per Day (Last 7 Days)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {totalWeeklyWorkouts} Total Completed
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Interactive Recharts visualization of daily completed workout sessions and consistency
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-mono flex-wrap">
                  <div className={`px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-slate-500 mr-1.5">Active Days:</span>
                    <strong className="text-emerald-400">{activeDaysCount}/7</strong>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-slate-500 mr-1.5">7-Day Avg:</span>
                    <strong style={{ color: accentColor }}>{avgWorkoutsPerDay}/day</strong>
                  </div>
                </div>
              </div>

              {/* The Dedicated Recharts Bar Chart */}
              <div className="h-64 sm:h-72 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHistory} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#161F2E' : '#E2E8F0'} vertical={false} />
                    <XAxis 
                      dataKey="dayLabel" 
                      stroke={isDark ? '#94A3B8' : '#64748B'} 
                      fontSize={11} 
                      fontWeight={600}
                      tickLine={false} 
                      axisLine={{ stroke: isDark ? '#1E293B' : '#E2E8F0' }} 
                    />
                    <YAxis 
                      stroke={isDark ? '#64748B' : '#94A3B8'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: isDark ? '#1E293B' : '#E2E8F0' }} 
                      allowDecimals={false} 
                      unit=" sets"
                    />
                    <Tooltip 
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as DailyCompletion;
                          const isAboveAvg = d.completedCount >= avgWorkoutsPerDay && d.completedCount > 0;
                          return (
                            <div className={`p-3 rounded-xl shadow-xl text-xs font-mono border ${
                              isDark ? 'bg-[#090D16] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                            }`}>
                              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-2">
                                <span>{d.dayLabel}</span>
                                <span className="text-[11px] text-slate-400 font-normal">{d.displayDate}</span>
                              </div>
                              <div className="mt-1.5 text-base font-extrabold flex items-center gap-1.5" style={{ color: accentColor }}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{d.completedCount} workouts completed</span>
                              </div>
                              <div className="text-[11px] mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                <div className="flex items-center justify-between gap-3 text-slate-400">
                                  <span>Weekly contribution:</span>
                                  <strong className="text-slate-900 dark:text-white">
                                    {totalWeeklyWorkouts > 0 ? Math.round((d.completedCount / totalWeeklyWorkouts) * 100) : 0}%
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-slate-400">Status:</span>
                                  <span className={`font-bold ${
                                    d.completedCount === 0 
                                      ? 'text-slate-500' 
                                      : isAboveAvg ? 'text-emerald-400' : 'text-cyan-400'
                                  }`}>
                                    {d.completedCount === 0 ? 'Rest Day' : isAboveAvg ? '🔥 Above Average' : 'Active Day'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {avgWorkoutsPerDay > 0 && (
                      <ReferenceLine 
                        y={avgWorkoutsPerDay} 
                        stroke="#10B981" 
                        strokeDasharray="4 4" 
                        label={{ 
                          value: `Avg: ${avgWorkoutsPerDay}/d`, 
                          position: 'right', 
                          fill: '#10B981', 
                          fontSize: 9,
                          fontWeight: 700
                        }} 
                      />
                    )}
                    <Bar dataKey="completedCount" radius={[8, 8, 0, 0]} maxBarSize={52}>
                      {weeklyHistory.map((entry, index) => (
                        <Cell 
                          key={`cell-w-${index}`} 
                          fill={
                            entry.completedCount > 0 
                              ? index === weeklyHistory.length - 1 
                                ? accentColor 
                                : '#38BDF8'
                              : (isDark ? '#1E293B' : '#CBD5E1')
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. WEEKLY ANALYTICS (D3.JS POWERED) */}
      <WeeklyD3Analytics 
        id="weekly-d3-analytics-section"
        history={calorieAnalytics.history}
        dailyCalorieGoal={currentUser.dailyCalorieGoal}
        onOpenGoalSettings={onOpenUserSettings}
        themeSettings={themeSettings}
      />

      {/* 4. NUTRITION & MACRO-NUTRIENTS TRACKING (WATER, PROTEIN, CARBS, FATS) */}
      <NutritionTracker
        currentUser={currentUser}
        themeSettings={themeSettings}
      />

      {/* 5. PHYSIQUE PROGRESS & COACH REVIEWS (OPTIONAL) */}
      <div className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg border text-black font-bold"
              style={{ backgroundColor: accentColor }}
            >
              <Camera className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Physique Progress & Coach Reviews</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                  Optional
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Upload before & after workout photos to receive personalized feedback and form assessment from Coach Muhammad
              </p>
            </div>
          </div>

          {onOpenProgressPhotos && (
            <button
              onClick={() => {
                triggerHaptic(20);
                playButtonClickSound();
                onOpenProgressPhotos();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Add Workout Photos</span>
            </button>
          )}
        </div>

        {/* Content: List or Empty state */}
        {userCheckins.length === 0 ? (
          <div className={`p-6 rounded-xl border text-center space-y-2 ${
            isDark ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-50 border-slate-200'
          }`}>
            <Camera className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold">No Transformation Photos Uploaded Yet</h4>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Adding before and after workout photos is completely optional. If you'd like Coach Muhammad to evaluate your muscle growth, symmetry, and form, you can upload them anytime.
            </p>
            {onOpenProgressPhotos && (
              <button
                onClick={onOpenProgressPhotos}
                className="mt-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 inline-flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload First Check-in</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCheckins.map((checkin) => (
              <div 
                key={checkin.id}
                className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
                  isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Checkin Top Meta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-300">
                      {checkin.workoutDate}
                    </span>
                    {checkin.muscleFocus && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {checkin.muscleFocus}
                      </span>
                    )}
                  </div>

                  {checkin.adminFeedback ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{checkin.adminFeedback.assessment}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Awaiting Coach Review</span>
                    </span>
                  )}
                </div>

                {/* Photos Comparison */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block text-center">BEFORE</span>
                    <div className="aspect-[4/5] rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                      {checkin.beforePhotoUrl ? (
                        <img src={checkin.beforePhotoUrl} alt="Before workout" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-slate-500">No Photo</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 block text-center font-bold">AFTER (PUMP)</span>
                    <div className="aspect-[4/5] rounded-lg overflow-hidden bg-black border border-emerald-900/60 flex items-center justify-center">
                      {checkin.afterPhotoUrl ? (
                        <img src={checkin.afterPhotoUrl} alt="After workout" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-slate-500">No Photo</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Athlete Note */}
                {checkin.userNote && (
                  <p className={`text-xs italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    "{checkin.userNote}"
                  </p>
                )}

                {/* Coach Feedback Box */}
                {checkin.adminFeedback && (
                  <div className={`p-3 rounded-lg border space-y-1 ${
                    isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>{checkin.adminFeedback.coachName}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(checkin.adminFeedback.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {checkin.adminFeedback.feedbackText}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile App & APK Installation Banner */}
      {onOpenInstallPwa && (
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-slate-950 via-[#070D18] to-cyan-950/40 border-cyan-800/40' 
            : 'bg-gradient-to-r from-cyan-50 via-sky-50 to-white border-cyan-200'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md text-slate-950 font-extrabold"
              style={{ backgroundColor: accentColor }}
            >
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                  GYM APP ON YOUR PHONE
                </h4>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PWA / APK
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Install directly on Android / iOS home screen or generate a signed APK with PWABuilder
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(25);
              playButtonClickSound();
              onOpenInstallPwa();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Install App / Get APK</span>
          </button>
        </div>
      )}

      {/* 4. RECENTLY WATCHED WORKOUTS */}
      <div className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg border text-black"
              style={{ backgroundColor: accentColor }}
            >
              <History className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold">Recently Watched Routines</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Quickly resume your last 3 training sessions
              </p>
            </div>
          </div>
          {recentlyWatchedVideos.length > 0 && (
            <span 
              className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
              style={{
                color: accentColor,
                borderColor: accentColor,
                backgroundColor: `rgba(${accentRgb}, 0.1)`
              }}
            >
              {recentlyWatchedVideos.length} / 3 cached
            </span>
          )}
        </div>

        {recentlyWatchedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {recentlyWatchedVideos.map((video) => {
              const isDone = completedVideoIds.includes(video.id);
              const displayDuration = video.duration || `${video.durationMinutes} min`;
              const poster = video.thumbnailUrl || getWorkoutThumbnail(video.muscleGroup);
              const kcal = calculateVideoCalories(video);
              const personalNote = currentUser?.workoutNotes?.[video.id];

              return (
                <div
                  key={`recent-${video.id}`}
                  className={`rounded-xl overflow-hidden flex flex-col group border transition-all shadow-md ${
                    isDark 
                      ? 'bg-[#090D16] border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div 
                    onClick={() => onOpenVideo(video)}
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                  >
                    <img
                      src={poster}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div 
                        className="w-10 h-10 rounded-full text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform font-bold"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30 max-w-[48%] truncate">
                      {video.muscleGroup}
                    </div>

                    {/* Calories burned badge */}
                    <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{kcal} kcal</span>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{displayDuration}</span>
                    </div>

                    {isDone && (
                      <div className="absolute bottom-2 left-2 bg-emerald-950/90 border border-emerald-600 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 flex-wrap">
                        <span className="font-medium" style={{ color: accentColor }}>{video.muscleGroup}</span>
                        <span>·</span>
                        <span className="font-mono font-semibold">{displayDuration}</span>
                        <span>·</span>
                        <span>{video.difficulty}</span>
                        {personalNote && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.2 rounded font-bold">
                              <FileText className="w-2.5 h-2.5" /> Note
                            </span>
                          </>
                        )}
                      </div>
                      <h4
                        onClick={() => onOpenVideo(video)}
                        className={`text-xs sm:text-sm font-bold line-clamp-1 transition-colors cursor-pointer ${
                          isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'
                        }`}
                      >
                        {video.title}
                      </h4>
                      {personalNote && (
                        <div className={`mt-1.5 p-1.5 rounded-lg text-[10px] font-mono border flex items-center gap-1 truncate ${
                          isDark ? 'bg-cyan-950/30 border-cyan-900/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                        }`}>
                          <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate italic">"{personalNote}"</span>
                        </div>
                      )}
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <button
                        onClick={() => {
                          triggerHaptic(30);
                          handleToggleWorkoutWithSound(video.id);
                        }}
                        className={`text-[11px] flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                          isDone ? 'text-emerald-500 font-semibold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Done' : 'Mark done'}</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic(30);
                          onOpenVideo(video);
                        }}
                        className="px-3 py-1 rounded-lg text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        style={{ backgroundColor: accentColor }}
                      >
                        <span>Resume</span>
                        <Play className="w-3 h-3 fill-slate-950" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`border rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-2 ${
            isDark ? 'bg-[#090D16] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Clock className="w-6 h-6 text-slate-400" />
            <div className="text-xs font-bold">No Recently Watched Routines Yet</div>
            <p className="text-xs max-w-md">
              Pick any workout routine from the library below to begin training. Your last 3 opened routines stay right here.
            </p>
          </div>
        )}
      </div>

      {/* 4. THREE MEMBERSHIP STAGES (Normal: 1 real, Extra: 3 real, Premium: 5 real) */}
      <div className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: accentColor }} />
              <span>Training Stages & Membership Progression</span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Progression system: Normal (1 real), Extra (3 real), Premium (5 real). Request upgrades directly to Coach Muhammad.
            </p>
          </div>
          {userLatestRequest && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 self-start sm:self-auto ${
              userLatestRequest.status === 'pending'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : userLatestRequest.status === 'accepted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                Request: {userLatestRequest.status.toUpperCase()} ({userLatestRequest.requestedStage})
              </span>
            </div>
          )}
        </div>

        {/* 3 Stage Cards with clear explanation inside the website */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ALL_STAGES.map((stageKey) => {
            const config = STAGE_CONFIG[stageKey];
            const isCurrent = userStage === stageKey;
            const isAccessible = canAccessVideo(userStage, stageKey);

            return (
              <div
                key={stageKey}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? isDark ? 'bg-[#090D16] border-cyan-500 shadow-md' : 'bg-cyan-50/50 border-cyan-400 shadow-sm'
                    : isDark ? 'bg-[#090D16]/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${config.badgeColor}`}>
                      {stageKey}
                    </span>
                    <span className="text-xs font-bold font-mono" style={{ color: accentColor }}>
                      {config.realEquivalent}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {config.description}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  {isCurrent ? (
                    <span className="text-xs font-bold flex items-center gap-1 font-mono" style={{ color: accentColor }}>
                      <CheckCircle2 className="w-4 h-4" /> Enrolled Stage
                    </span>
                  ) : isAccessible ? (
                    <span className="text-xs text-emerald-500 font-mono flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        setSelectedTargetStage(stageKey);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span>Request Upgrade</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. VIDEO LIBRARY SECTION WITH DEDICATED SEARCH BAR & MUSCLE FILTERS */}
      <div 
        id="video-library"
        className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-5 transition-colors scroll-mt-6 ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Dumbbell className="w-5 h-5" style={{ color: accentColor }} />
              <span>Video Library</span>
              <span 
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ml-1"
                style={{
                  color: accentColor,
                  borderColor: `rgba(${accentRgb}, 0.4)`,
                  backgroundColor: `rgba(${accentRgb}, 0.1)`
                }}
              >
                {filteredVideos.length} of {videos.length} Videos
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Search and filter workout video routines curated by Head Coach Muhammad
            </p>
          </div>

          {(searchQuery || selectedMuscle !== 'All' || selectedCategory !== 'All' || filterByStage !== 'All' || filterCompletedOnly) && (
            <button
              onClick={handleResetFilters}
              className={`self-start md:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Search & Filters</span>
            </button>
          )}
        </div>

        {/* Dedicated Video Library Search Bar & Filter Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="relative md:col-span-6 lg:col-span-7">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workout videos by name or muscle group (e.g. Incline Bench, Squat, Lat Pulldown)..."
                className={`w-full pl-10 pr-20 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm focus:outline-none border font-medium transition-all shadow-inner ${
                  isDark 
                    ? 'bg-[#090D16] border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40'
                }`}
                aria-label="Search workout videos by name or muscle group"
              />
              {searchQuery && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setSearchQuery('');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    title="Clear search query"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Clear</span>
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="md:col-span-3 lg:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  triggerHaptic(20);
                  playButtonClickSound();
                  setSelectedCategory(e.target.value as any);
                }}
                className={`w-full py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-[#090D16] border-slate-800 text-cyan-300 focus:border-cyan-400' 
                    : 'bg-slate-50 border-slate-300 text-cyan-800 focus:border-cyan-600'
                }`}
                aria-label="Filter workout videos by category"
              >
                <option value="All">All Categories ({videos.length})</option>
                {WORKOUT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({categoryCounts[cat] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Access Gate Filter Dropdown */}
            <div className="md:col-span-3 lg:col-span-2">
              <select
                value={filterByStage}
                onChange={(e) => {
                  triggerHaptic(20);
                  playButtonClickSound();
                  setFilterByStage(e.target.value as any);
                }}
                className={`w-full py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-[#090D16] border-slate-800 text-slate-300 focus:border-cyan-400' 
                    : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-cyan-600'
                }`}
                aria-label="Filter workout videos by required stage"
              >
                <option value="All">All Stages</option>
                <option value="Normal">Normal Tier</option>
                <option value="Extra">Extra Tier</option>
                <option value="Premium">Premium Tier</option>
              </select>
            </div>
          </div>

          {/* Active Search / Filter Pill Indicator */}
          {(searchQuery.trim() || selectedMuscle !== 'All' || selectedCategory !== 'All' || filterByStage !== 'All' || filterCompletedOnly) && (
            <div className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-mono ${
              isDark ? 'bg-[#070B12] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500">Active Search:</span>
                {searchQuery.trim() && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    <span>"{searchQuery.trim()}"</span>
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedMuscle !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                    Muscle: {selectedMuscle}
                  </span>
                )}
                {filterByStage !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                    Stage: {filterByStage}
                  </span>
                )}
                {filterCompletedOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    Completed Only
                  </span>
                )}
                <span className="text-slate-400 font-semibold">({filteredVideos.length} matching)</span>
              </div>

              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className={`text-[11px] font-mono shrink-0 mr-1 flex items-center gap-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>
              <Zap className="w-3 h-3" />
              <span>Category:</span>
            </span>
            {(['All', ...WORKOUT_CATEGORIES] as const).map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    triggerHaptic(20);
                    playButtonClickSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-slate-950 font-bold shadow-md'
                      : isDark 
                        ? 'bg-[#090D16] text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800' 
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  }`}
                  style={isSelected ? { backgroundColor: accentColor } : {}}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-black/20 text-slate-950 font-extrabold'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Muscle Filter Buttons with counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className={`text-[11px] font-mono shrink-0 mr-1 flex items-center gap-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Filter className="w-3 h-3" />
              <span>Muscle:</span>
            </span>
            {MUSCLE_FILTER_OPTIONS.map((mg) => {
              const count = muscleGroupCounts[mg] || 0;
              return (
                <button
                  key={mg}
                  onClick={() => {
                    triggerHaptic(20);
                    playButtonClickSound();
                    setSelectedMuscle(mg);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedMuscle === mg
                      ? 'text-slate-950 font-bold shadow-md'
                      : isDark 
                        ? 'bg-[#090D16] text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800' 
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                  }`}
                  style={selectedMuscle === mg ? { backgroundColor: accentColor } : {}}
                >
                  <span>{mg}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    selectedMuscle === mg
                      ? 'bg-black/20 text-slate-950 font-extrabold'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Cards Grid (Mobile-Optimized Grid) */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {filteredVideos.map((video) => {
              const isDone = completedVideoIds.includes(video.id);
              const videoRequired = video.requiredStage || 'Normal';
              const isAccessible = canAccessVideo(userStage, videoRequired);
              const displayDuration = video.duration || `${video.durationMinutes} min`;
              const poster = video.thumbnailUrl || getWorkoutThumbnail(video.muscleGroup);
              const kcal = calculateVideoCalories(video);
              const personalNote = currentUser?.workoutNotes?.[video.id];

              return (
                <div
                  key={video.id}
                  className={`border rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 ${
                    isAccessible
                      ? isDark 
                        ? 'bg-[#090D16] border-slate-800 hover:border-slate-700 shadow-lg' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-md'
                      : 'opacity-60 border-slate-800'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (isAccessible) {
                        triggerHaptic(30);
                        onOpenVideo(video);
                      } else {
                        triggerHaptic(30);
                        setSelectedTargetStage(videoRequired);
                      }
                    }}
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden group/thumb"
                  >
                    <img
                      src={poster}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      {isAccessible ? (
                        <div 
                          className="w-12 h-12 rounded-full text-slate-950 flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-transform font-bold"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                        </div>
                      ) : (
                        <div className="p-3 rounded-full bg-slate-900/90 text-amber-400 border border-amber-500/40 shadow-lg flex items-center justify-center backdrop-blur-sm">
                          <Lock className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 flex-wrap max-w-[60%]">
                      <span className="bg-black/80 backdrop-blur-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold text-cyan-300 border border-cyan-500/30 truncate">
                        {video.muscleGroup}
                      </span>
                      {video.category && (
                        <span className="bg-black/80 backdrop-blur-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-semibold text-amber-300 border border-amber-500/30 truncate">
                          {video.category}
                        </span>
                      )}
                    </div>

                    {/* Calorie Burn Target Badge */}
                    <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 bg-black/85 backdrop-blur-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-mono font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow">
                      <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400" />
                      <span>{kcal} kcal</span>
                    </div>

                    <div className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-2.5 bg-black/90 backdrop-blur-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-[11px] sm:text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow">
                      <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-cyan-400" />
                      <span>{displayDuration}</span>
                    </div>

                    {isDone && (
                      <div className="absolute bottom-2 sm:bottom-2.5 left-2 sm:left-2.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-1 flex-wrap">
                        <span className="font-semibold" style={{ color: accentColor }}>{video.muscleGroup}</span>
                        {video.category && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-[10px] border border-amber-500/20">
                              {video.category}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono font-semibold">{displayDuration}</span>
                        <span>•</span>
                        <span>{video.difficulty}</span>
                        {personalNote && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.2 rounded font-bold">
                              <FileText className="w-2.5 h-2.5" /> Note Saved
                            </span>
                          </>
                        )}
                      </div>
                      <h3
                        onClick={() => {
                          if (isAccessible) onOpenVideo(video);
                          else setSelectedTargetStage(videoRequired);
                        }}
                        className={`font-bold line-clamp-1 transition-colors cursor-pointer text-sm sm:text-base ${
                          isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'
                        }`}
                      >
                        {video.title}
                      </h3>
                      <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {video.description}
                      </p>
                      {personalNote && (
                        <div className={`mt-2 p-2 rounded-lg text-[11px] font-mono border flex items-center gap-1.5 ${
                          isDark ? 'bg-cyan-950/30 border-cyan-900/40 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                        }`}>
                          <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="line-clamp-1 italic">"{personalNote}"</span>
                        </div>
                      )}
                    </div>

                    <div className={`pt-3 border-t flex items-center justify-between ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      {isAccessible ? (
                        <>
                          <button
                            onClick={() => {
                              triggerHaptic(40);
                              handleToggleWorkoutWithSound(video.id);
                            }}
                            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              isDone ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isDone ? 'Completed ✓' : 'Mark as Done'}</span>
                          </button>

                          <button
                            onClick={() => {
                              triggerHaptic(30);
                              onOpenVideo(video);
                            }}
                            className="flex items-center gap-1 text-xs font-bold cursor-pointer"
                            style={{ color: accentColor }}
                          >
                            <span>Watch</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between text-xs text-amber-500">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Requires {videoRequired}
                          </span>
                          <button
                            onClick={() => {
                              triggerHaptic(25);
                              setSelectedTargetStage(videoRequired);
                            }}
                            className="font-bold underline cursor-pointer"
                          >
                            Request Stage
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-14 border border-dashed rounded-2xl p-6 space-y-3.5 ${
            isDark ? 'bg-[#090D16]/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div 
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
              style={{
                backgroundColor: `rgba(${accentRgb}, 0.15)`,
                border: `1px solid rgba(${accentRgb}, 0.35)`
              }}
            >
              <Search className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              No Workout Videos Found
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery.trim() 
                ? `No workout routines matching "${searchQuery}" in ${selectedMuscle === 'All' ? 'any category' : selectedMuscle}.` 
                : `No workouts available for the selected filters.`}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Search & Show All Videos</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STAGE REQUEST MODAL */}
      {selectedTargetStage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border ${
            isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Send className="w-4 h-4" style={{ color: accentColor }} />
                <span>Request {selectedTargetStage} Stage Upgrade</span>
              </h3>
              <button
                onClick={() => setSelectedTargetStage(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {requestStatus.type !== 'idle' && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                requestStatus.type === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
              }`}>
                {requestStatus.message}
              </div>
            )}

            <form onSubmit={handleSendStageRequest} className="space-y-4 text-xs">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-bold mb-1 text-slate-400">Target Stage:</div>
                <div className="font-extrabold text-sm font-mono" style={{ color: accentColor }}>
                  {selectedTargetStage} ({STAGE_CONFIG[selectedTargetStage].realEquivalent})
                </div>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {STAGE_CONFIG[selectedTargetStage].description}
                </p>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">
                  Note to Coach Muhammad (Optional):
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g., Hi Muhammad, I have completed all Normal tier routines and ready to advance!"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-[#090D16] border-slate-800 text-white placeholder:text-slate-600' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setSelectedTargetStage(null)}
                  className={`px-3 py-2 rounded-lg cursor-pointer ${
                    isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-slate-950 font-bold cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
