import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { User, WorkoutVideo, WorkoutCategory, WORKOUT_CATEGORIES, MuscleGroup, MembershipStage, STAGE_CONFIG, StageRequest, ProgressPhotoCheckin, ImprovementAssessment } from '../types/workout';
import { getCompletedWorkouts } from '../utils/storage';
import { saveDeviceVideoFile, extractVideoDuration } from '../utils/deviceVideoStorage';
import { getWorkoutThumbnail, triggerHaptic } from '../utils/media';
import { getAdminGymAnalytics, calculateVideoCalories } from '../utils/calorieAnalytics';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { playSuccessChime, playStageUpgradeSound, playButtonClickSound } from '../utils/soundEffects';
import { 
  Users, Video, Plus, Trash2, Check, AlertCircle, Eye, 
  Dumbbell, ShieldCheck, UserPlus, Clock,
  Edit, Inbox, CheckCheck, XCircle, Award, Upload, HardDrive, 
  FileVideo, Zap, Menu, ChevronDown, Sparkles, AlertTriangle,
  Flame, BarChart2, TrendingUp, Palette, Activity,
  Camera, CheckCircle2, MessageSquare, ThumbsUp, KeyRound
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  videos: WorkoutVideo[];
  stageRequests: StageRequest[];
  activeTab: 'videos' | 'add-video' | 'users' | 'requests' | 'analytics' | 'physique-reviews';
  onSelectTab: (tab: 'videos' | 'add-video' | 'users' | 'requests' | 'analytics' | 'physique-reviews') => void;
  onAddVideo: (videoData: any) => { success: boolean; error?: string };
  onUpdateVideo: (videoId: string, updatedFields: any) => { success: boolean; error?: string };
  onDeleteVideo: (id: string) => void;
  onAddUser: (userData: any) => { success: boolean; error?: string };
  onDeleteUser: (id: string) => void;
  onResolveStageRequest: (requestId: string, status: 'accepted' | 'rejected') => void;
  onPreviewVideo: (video: WorkoutVideo) => void;
  themeSettings?: ThemeSettings;
  onOpenThemeSettings?: () => void;
  onOpenChangePassword?: () => void;
  progressPhotos?: ProgressPhotoCheckin[];
  onReviewProgressPhoto?: (id: string, assessment: ImprovementAssessment, feedbackText: string) => void;
  onDeleteProgressPhoto?: (id: string) => void;
}

const MUSCLE_GROUPS: Exclude<MuscleGroup, 'All'>[] = [
  'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs', 'Cardio/Full Body'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  videos,
  stageRequests,
  activeTab,
  onSelectTab,
  onAddVideo,
  onUpdateVideo,
  onDeleteVideo,
  onAddUser,
  onDeleteUser,
  onResolveStageRequest,
  onPreviewVideo,
  themeSettings,
  onOpenThemeSettings,
  onOpenChangePassword,
  progressPhotos = [],
  onReviewProgressPhoto,
  onDeleteProgressPhoto,
}) => {
  // Mobile tab dropdown/drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Athlete Physique Reviews State
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { assessment: ImprovementAssessment; feedback: string }>>({});
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string } | null>(null);

  const pendingReviewsCount = useMemo(() => {
    return (progressPhotos || []).filter(p => !p.adminFeedback).length;
  }, [progressPhotos]);

  const filteredProgressPhotos = useMemo(() => {
    return (progressPhotos || []).filter(p => {
      if (reviewStatusFilter === 'pending') return !p.adminFeedback;
      if (reviewStatusFilter === 'reviewed') return !!p.adminFeedback;
      return true;
    });
  }, [progressPhotos, reviewStatusFilter]);

  // Device file upload state (Exclusive Media Storage)
  const [selectedDeviceFile, setSelectedDeviceFile] = useState<File | null>(null);
  const [deviceFilePreviewUrl, setDeviceFilePreviewUrl] = useState<string | null>(null);
  const [isProcessingDeviceFile, setIsProcessingDeviceFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Workout Video Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<Exclude<MuscleGroup, 'All'>>('Chest');
  const [category, setCategory] = useState<WorkoutCategory>('Strength');
  const [requiredStage, setRequiredStage] = useState<MembershipStage>('Normal');
  const [description, setDescription] = useState('');
  const [tips, setTips] = useState<string[]>([
    'Maintain strict mechanical form without momentum.',
    'Keep constant muscular tension throughout the full range of motion.'
  ]);
  const [newTipInput, setNewTipInput] = useState('');
  
  // PROMINENT DURATION & CALORIE BURN FIELDS
  const [duration, setDuration] = useState('12:00');
  const [targetCalories, setTargetCalories] = useState('180');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [equipment, setEquipment] = useState('Dumbbells & Bench');
  const [rpe, setRpe] = useState('8');

  const [videoFormStatus, setVideoFormStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Custom Confirmation Modal State (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Edit Video Modal State
  const [editingVideo, setEditingVideo] = useState<WorkoutVideo | null>(null);
  const [editFormStatus, setEditFormStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // New User Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userStage, setUserStage] = useState<MembershipStage>('Normal');
  const [userFormStatus, setUserFormStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);
  const pendingRequests = stageRequests.filter(r => r.status === 'pending');

  // Gym-Wide Analytics for Muhammad
  const gymAnalytics = useMemo(() => {
    return getAdminGymAnalytics(users, videos);
  }, [users, videos]);

  const handleDeviceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(30);
    setIsProcessingDeviceFile(true);
    setSelectedDeviceFile(file);

    const previewUrl = URL.createObjectURL(file);
    setDeviceFilePreviewUrl(previewUrl);

    if (!videoTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setVideoTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    try {
      const durationData = await extractVideoDuration(file);
      setDuration(durationData.durationStr);
      // Auto-compute baseline calories
      setTargetCalories(String(Math.round(durationData.durationSeconds / 60 * 14)));
    } catch {
      setDuration('10:00');
      setTargetCalories('150');
    } finally {
      setIsProcessingDeviceFile(false);
    }
  };

  const handleAddTip = () => {
    if (!newTipInput.trim()) return;
    setTips([...tips, newTipInput.trim()]);
    setNewTipInput('');
  };

  const handleRemoveTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoFormStatus({ type: 'idle', message: '' });

    if (!selectedDeviceFile) {
      setVideoFormStatus({
        type: 'error',
        message: 'Please choose or record a video file (.mp4 or .webm) from this device.'
      });
      return;
    }

    const deviceVideoId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const deviceFileName = selectedDeviceFile.name;
    const deviceFileSizeMb = Math.round((selectedDeviceFile.size / (1024 * 1024)) * 10) / 10;

    const saveRes = await saveDeviceVideoFile(deviceVideoId, selectedDeviceFile, deviceFileName);
    if (!saveRes.success) {
      setVideoFormStatus({
        type: 'error',
        message: saveRes.error || 'Failed to save video to device storage.'
      });
      return;
    }

    let durationMins = 12;
    if (duration.includes(':')) {
      const parts = duration.split(':');
      durationMins = Math.max(1, Math.round(Number(parts[0]) + (Number(parts[1] || 0) / 60)));
    } else {
      durationMins = parseInt(duration, 10) || 12;
    }

    const res = onAddVideo({
      title: videoTitle,
      muscleGroup,
      category,
      requiredStage,
      duration: duration.trim() || `${durationMins}:00`,
      durationMinutes: durationMins,
      targetCalories: Number(targetCalories) || Math.round(durationMins * 14),
      deviceVideoId,
      deviceFileName,
      deviceFileSizeMb,
      description,
      tips,
      difficulty,
      trainerName: 'Muhammad (Head Coach)',
      equipment,
      rpe: Number(rpe) || 8,
    });

    if (res.success) {
      triggerHaptic([60, 60, 100]);
      playSuccessChime();
      setVideoFormStatus({
        type: 'success',
        message: `Native device video "${deviceFileName}" published to GYM App library!`
      });
      setVideoTitle('');
      setCategory('Strength');
      setSelectedDeviceFile(null);
      setDeviceFilePreviewUrl(null);
      setDescription('');
      setTips(['Control the eccentric movement for 3 seconds.']);
      setTimeout(() => onSelectTab('videos'), 1200);
    } else {
      setVideoFormStatus({
        type: 'error',
        message: res.error || 'Failed to publish video.'
      });
    }
  };

  const handleSaveEditedVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    setEditFormStatus({ type: 'idle', message: '' });

    let durationMins = editingVideo.durationMinutes || 12;
    if (editingVideo.duration && editingVideo.duration.includes(':')) {
      const parts = editingVideo.duration.split(':');
      durationMins = Math.max(1, Math.round(Number(parts[0]) + (Number(parts[1] || 0) / 60)));
    }

    const res = onUpdateVideo(editingVideo.id, {
      ...editingVideo,
      durationMinutes: durationMins,
    });

    if (res.success) {
      triggerHaptic(50);
      playSuccessChime();
      setEditFormStatus({ type: 'success', message: 'Workout details updated successfully!' });
      setTimeout(() => {
        setEditingVideo(null);
        setEditFormStatus({ type: 'idle', message: '' });
      }, 1000);
    } else {
      setEditFormStatus({ type: 'error', message: res.error || 'Failed to update video.' });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormStatus({ type: 'idle', message: '' });

    const res = onAddUser({
      name: userName,
      email: userEmail,
      password: userPassword,
      stage: userStage,
      role: 'user',
    });

    if (res.success) {
      triggerHaptic([40, 40, 80]);
      playSuccessChime();
      setUserFormStatus({
        type: 'success',
        message: `Athlete account for "${userName}" created successfully!`
      });
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserStage('Normal');
      setTimeout(() => {
        setShowAddUserModal(false);
        setUserFormStatus({ type: 'idle', message: '' });
      }, 1200);
    } else {
      setUserFormStatus({
        type: 'error',
        message: res.error || 'Failed to create user.'
      });
    }
  };

  const promptDeleteVideo = (vid: WorkoutVideo) => {
    triggerHaptic(30);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Workout Video?',
      message: `Are you sure you want to delete "${vid.title}"? Athletes will no longer be able to stream this routine.`,
      confirmLabel: 'Delete Video',
      onConfirm: () => {
        triggerHaptic(70);
        onDeleteVideo(vid.id);
        setConfirmDialog(null);
      }
    });
  };

  const promptDeleteUser = (u: User) => {
    triggerHaptic(30);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Athlete Account?',
      message: `Are you sure you want to delete athlete account "${u.name}" (${u.email})? This action cannot be undone.`,
      confirmLabel: 'Delete Account',
      onConfirm: () => {
        triggerHaptic(70);
        onDeleteUser(u.id);
        setConfirmDialog(null);
      }
    });
  };

  const promptDeleteAllAthletes = () => {
    triggerHaptic(40);
    const athleteUsers = users.filter(u => u.role !== 'admin' && !u.name.includes('Muhammad') && u.email !== 'muhammad@gymapp.com' && u.email !== 'muhammad');
    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Athlete Accounts?',
      message: `Are you sure you want to delete all ${athleteUsers.length} athlete account(s)? Primary Admin (Muhammad) will be preserved.`,
      confirmLabel: 'Delete All Athletes',
      onConfirm: () => {
        triggerHaptic(80);
        athleteUsers.forEach(u => onDeleteUser(u.id));
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className={`rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden border transition-colors ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/70'
      }`}>
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-10"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border"
                style={{
                  color: accentColor,
                  borderColor: accentColor,
                  backgroundColor: `rgba(${accentRgb}, 0.1)`
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Coach Muhammad • Head Administrator
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              GYM App Workout & 3-Stage Athlete Hub
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Native device video storage, calorie burn tracking, athlete stage approvals (Normal, Extra, Premium), and library curation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenThemeSettings && (
              <button
                onClick={() => {
                  triggerHaptic(25);
                  onOpenThemeSettings();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
                title="Change UI colors, dark/white theme"
              >
                <Palette className="w-4 h-4" style={{ color: accentColor }} />
                <span>Customize Colors</span>
              </button>
            )}

            {onOpenChangePassword && (
              <button
                onClick={() => {
                  triggerHaptic(25);
                  onOpenChangePassword();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
                title="Change Admin Password"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Change Password</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic(30);
                onSelectTab('add-video');
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic(30);
                onSelectTab('users');
                setShowAddUserModal(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer whitespace-nowrap ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" style={{ color: accentColor }} />
              <span>New Normal User</span>
            </button>
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t ${
          isDark ? 'border-slate-900' : 'border-slate-100'
        }`}>
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[11px] text-slate-500 font-medium">Device Library Videos</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-0.5">
              {videos.length}
            </div>
          </div>
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[11px] text-slate-500 font-medium">Registered Athletes</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-0.5" style={{ color: accentColor }}>
              {users.length}
            </div>
          </div>
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[11px] text-slate-500 font-medium">Pending Stage Requests</div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-0.5 ${
              pendingRequests.length > 0 ? 'text-amber-500' : 'text-slate-400'
            }`}>
              {pendingRequests.length}
            </div>
          </div>
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[11px] text-slate-500 font-medium">Total Calorie Activity</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-0.5 text-amber-500 flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{gymAnalytics.totalGymCaloriesBurned} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Admin Navigation Bar */}
      <div className="block md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold shadow-md ${
            isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Menu className="w-4 h-4" style={{ color: accentColor }} />
            <span>
              {activeTab === 'videos' && `Workout Library (${videos.length})`}
              {activeTab === 'analytics' && `Gym-Wide Analytics`}
              {activeTab === 'requests' && `Stage Requests (${pendingRequests.length})`}
              {activeTab === 'users' && `Manage Athletes (${users.length})`}
              {activeTab === 'physique-reviews' && `Physique Reviews (${progressPhotos.length})`}
              {activeTab === 'add-video' && '+ Upload Device Video'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-2 p-2 rounded-xl border shadow-2xl z-30 space-y-1 ${
                isDark ? 'bg-[#090D16] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <button
                onClick={() => { onSelectTab('videos'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'videos' ? 'text-slate-950 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                style={activeTab === 'videos' ? { backgroundColor: accentColor } : {}}
              >
                <span>Workout Videos ({videos.length})</span>
              </button>
              <button
                onClick={() => { onSelectTab('analytics'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'analytics' ? 'text-slate-950 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                style={activeTab === 'analytics' ? { backgroundColor: accentColor } : {}}
              >
                <span>Gym Analytics & Calories</span>
              </button>
              <button
                onClick={() => { onSelectTab('requests'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'requests' ? 'text-slate-950 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                style={activeTab === 'requests' ? { backgroundColor: accentColor } : {}}
              >
                <span>Stage Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { onSelectTab('users'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'users' ? 'text-slate-950 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                style={activeTab === 'users' ? { backgroundColor: accentColor } : {}}
              >
                <span>Manage Users ({users.length})</span>
              </button>
              <button
                onClick={() => { onSelectTab('physique-reviews'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'physique-reviews' ? 'text-slate-950 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                style={activeTab === 'physique-reviews' ? { backgroundColor: accentColor } : {}}
              >
                <span>Physique Reviews ({progressPhotos.length})</span>
                {pendingReviewsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-black text-[10px] font-bold">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { onSelectTab('add-video'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                  activeTab === 'add-video' ? 'text-slate-950 font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
                style={activeTab === 'add-video' ? { backgroundColor: accentColor } : {}}
              >
                <span>+ Upload Video</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Tabs */}
      <div className={`hidden md:flex p-1 rounded-xl border gap-1 ${
        isDark ? 'bg-[#000000] border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => onSelectTab('videos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'videos'
              ? 'text-slate-950 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
          style={activeTab === 'videos' ? { backgroundColor: accentColor } : {}}
        >
          <Video className="w-4 h-4" />
          <span>Workout Videos ({videos.length})</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-slate-950 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
          style={activeTab === 'analytics' ? { backgroundColor: accentColor } : {}}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Gym Analytics</span>
        </button>

        <button
          onClick={() => onSelectTab('requests')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'text-slate-950 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
          style={activeTab === 'requests' ? { backgroundColor: accentColor } : {}}
        >
          <Inbox className="w-4 h-4" />
          <span>Stage Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'text-slate-950 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
          style={activeTab === 'users' ? { backgroundColor: accentColor } : {}}
        >
          <Users className="w-4 h-4" />
          <span>Users ({users.length})</span>
        </button>

        <button
          onClick={() => onSelectTab('physique-reviews')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'physique-reviews'
              ? 'text-slate-950 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
          style={activeTab === 'physique-reviews' ? { backgroundColor: accentColor } : {}}
        >
          <Camera className="w-4 h-4" />
          <span>Physique Reviews</span>
          {pendingReviewsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-mono font-extrabold">
              {pendingReviewsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('add-video')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'add-video'
              ? 'text-slate-950 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
          style={activeTab === 'add-video' ? { backgroundColor: accentColor } : {}}
        >
          <Upload className="w-4 h-4" />
          <span>+ Upload Video</span>
        </button>
      </div>

      {/* TAB 1: WORKOUT LIBRARY */}
      {activeTab === 'videos' && (
        <div className={`border rounded-2xl p-5 sm:p-6 space-y-4 transition-colors ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Video className="w-5 h-5" style={{ color: accentColor }} />
                <span>GYM App Workout Library</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Manage all library exercises, durations, estimated calorie burn, and stage assignments.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('add-video')}
              className="px-3.5 py-1.5 rounded-lg text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {videos.map((vid) => {
              const displayDuration = vid.duration || `${vid.durationMinutes} min`;
              const poster = vid.thumbnailUrl || getWorkoutThumbnail(vid.muscleGroup);
              const kcal = calculateVideoCalories(vid);

              return (
                <div
                  key={vid.id}
                  className={`rounded-xl overflow-hidden flex flex-col group border transition-all shadow-md ${
                    isDark ? 'bg-[#090D16] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                    <img
                      src={poster}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[60%]">
                      <span className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30">
                        {vid.muscleGroup}
                      </span>
                      {vid.category && (
                        <span className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-amber-300 border border-amber-500/30">
                          {vid.category}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{kcal} kcal</span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 bg-black/90 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shadow">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{displayDuration}</span>
                    </div>

                    <button
                      onClick={() => onPreviewVideo(vid)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold cursor-pointer"
                    >
                      <div className="p-2.5 rounded-full text-slate-950 shadow-lg font-bold" style={{ backgroundColor: accentColor }}>
                        <Eye className="w-4 h-4" />
                      </div>
                      <span className="bg-black/80 px-2 py-1 rounded text-xs">Preview Workout</span>
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-bold line-clamp-1 transition-colors">
                        {vid.title}
                      </h4>
                      <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {vid.description}
                      </p>
                    </div>

                    <div className={`grid grid-cols-3 gap-2 text-[10px] font-mono pt-2 border-t text-slate-500 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <div>
                        <span>Burn: </span>
                        <strong className="text-amber-500">{kcal} kcal</strong>
                      </div>
                      <div>
                        <span>Length: </span>
                        <strong style={{ color: accentColor }}>{displayDuration}</strong>
                      </div>
                      <div>
                        <span>Stage: </span>
                        <strong className={isDark ? 'text-white' : 'text-slate-900'}>{vid.requiredStage || 'Normal'}</strong>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-2 border-t ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <button
                        onClick={() => {
                          setEditingVideo(vid);
                          setEditFormStatus({ type: 'idle', message: '' });
                        }}
                        className="flex items-center gap-1 text-xs font-semibold cursor-pointer py-1"
                        style={{ color: accentColor }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        onClick={() => promptDeleteVideo(vid)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete video from library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GYM-WIDE ANALYTICS & CHARTS (Key User Request) */}
      {activeTab === 'analytics' && (
        <div className={`border rounded-2xl p-5 sm:p-6 space-y-6 transition-colors ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5" style={{ color: accentColor }} />
              <span>Gym-Wide Energy & Athlete Analytics</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Weekly aggregated calorie expenditure, athlete participation trends, and stage distributions
            </p>
          </div>

          {/* Top 3 KPI metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-500 font-mono">Weekly Gym Calorie Burn</div>
              <div className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-amber-500 flex items-center gap-1.5">
                <Flame className="w-5 h-5" />
                <span>{gymAnalytics.totalGymCaloriesBurned} kcal</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Aggregated across {users.length} registered members
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-500 font-mono">Day-Over-Day Gym Delta</div>
              <div className={`text-2xl font-extrabold font-mono tabular-nums mt-1 ${
                gymAnalytics.gymDayOverDayDiff >= 0 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {gymAnalytics.gymDayOverDayDiff >= 0 ? `+${gymAnalytics.gymDayOverDayDiff}` : gymAnalytics.gymDayOverDayDiff} kcal
              </div>
              <div className={`text-[11px] font-semibold mt-1 ${
                gymAnalytics.gymDayOverDayDiff >= 0 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {gymAnalytics.gymDayOverDayDiff >= 0 ? `▲ +${gymAnalytics.gymDayOverDayPercent}%` : `▼ ${gymAnalytics.gymDayOverDayPercent}%`} vs yesterday
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-500 font-mono">Total Workout Library Capacity</div>
              <div className="text-2xl font-extrabold font-mono tabular-nums mt-1" style={{ color: accentColor }}>
                {videos.length} <span className="text-xs font-normal">routines</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                100% native device storage
              </div>
            </div>
          </div>

          {/* Recharts Chart: Gym-Wide Daily Calories Expended */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono">
                7-Day Gym-Wide Calorie Expenditure (All Athletes)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">kcal burned</span>
            </div>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gymAnalytics.weeklyGymCalories} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#161F2E' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey="dayLabel" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className={`p-2.5 rounded-xl text-xs font-mono border ${
                            isDark ? 'bg-[#000000] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                          }`}>
                            <div className="font-bold">{d.dayLabel} ({d.displayDate})</div>
                            <div className="text-amber-500 font-bold mt-1">🔥 {d.totalCalories} kcal burned</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{d.activeAthletes} athletes active</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="totalCalories" radius={[6, 6, 0, 0]} maxBarSize={48} fill={accentColor} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle Group & Stage Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Muscle Group Distribution */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Muscle Group Hypertrophy Distribution
              </h4>
              <div className="space-y-2">
                {gymAnalytics.muscleGroupDistribution.map((m) => (
                  <div key={m.muscle} className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{m.muscle}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-500">{m.workoutCount} routines</span>
                      <span className="font-bold text-amber-500">{m.estimatedKcal} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Membership Stage Distribution */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Membership Stage Enrollment
              </h4>
              <div className="space-y-3">
                {gymAnalytics.stageDistribution.map((s) => (
                  <div key={s.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>{s.stage}</span>
                      <span className="font-bold">{s.count} athletes ({s.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAGE REQUESTS */}
      {activeTab === 'requests' && (
        <div className={`border rounded-2xl p-5 sm:p-6 space-y-4 transition-colors ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Inbox className="w-5 h-5" style={{ color: accentColor }} />
                <span>Athlete Stage Enrollment Requests</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Athletes submit upgrade requests from the 3 stages: Normal (1 real), Extra (3 real), or Premium (5 real). Muhammad accepts or rejects.
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-500 border border-amber-500/30 font-mono">
                {pendingRequests.length} Awaiting Approval
              </span>
            )}
          </div>

          {stageRequests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-semibold">No requests submitted yet</div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {stageRequests.map((req) => {
                const stageInfo = STAGE_CONFIG[req.requestedStage];
                const isPending = req.status === 'pending';

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPending
                        ? isDark ? 'bg-[#090D16] border-slate-700' : 'bg-slate-50 border-slate-300'
                        : isDark ? 'bg-[#000000] border-slate-900 opacity-70' : 'bg-white border-slate-100 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{req.userName}</span>
                          <span className="text-xs text-slate-500 font-mono">({req.userEmail})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${stageInfo.badgeColor}`}>
                            Requested: {req.requestedStage} ({stageInfo.realEquivalent})
                          </span>
                        </div>
                        {req.note && (
                          <div className={`text-xs mt-1.5 px-3 py-1.5 rounded-lg border italic ${
                            isDark ? 'bg-black/60 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            "{req.note}"
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Submitted: {new Date(req.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => {
                                triggerHaptic(40);
                                playStageUpgradeSound();
                                onResolveStageRequest(req.id, 'accepted');
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Accept Upgrade</span>
                            </button>
                            <button
                              onClick={() => {
                                triggerHaptic(30);
                                playButtonClickSound();
                                onResolveStageRequest(req.id, 'rejected');
                              }}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                                isDark ? 'bg-slate-900 text-slate-400 hover:text-red-400 border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-red-600 border-slate-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            {req.status === 'accepted' ? (
                              <span className="text-emerald-500 flex items-center gap-1 font-bold">
                                <CheckCheck className="w-3.5 h-3.5" /> Approved by Muhammad
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 font-bold">
                                <XCircle className="w-3.5 h-3.5" /> Rejected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className={`border rounded-2xl p-5 sm:p-6 space-y-4 transition-colors ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: accentColor }} />
                <span>Athlete Account Management</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Review registered members, membership stages, and energy stats.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {users.filter(u => u.role !== 'admin' && !u.name.includes('Muhammad')).length > 0 && (
                <button
                  onClick={promptDeleteAllAthletes}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Athletes</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddUserModal(true);
                  setUserFormStatus({ type: 'idle', message: '' });
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Athlete</span>
              </button>
            </div>
          </div>

          <div className={`overflow-x-auto rounded-xl border ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <table className="w-full text-left text-xs">
              <thead className={`uppercase font-mono text-[10px] border-b ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="p-3">Athlete</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Current Stage</th>
                  <th className="p-3">Completed Workouts</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDark ? 'divide-slate-850 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}>
                {users.map((u) => {
                  const completedList = getCompletedWorkouts(u.id);
                  const isMuhammad = u.name.includes('Muhammad') || u.email === 'muhammad' || u.email === 'muhammad@gymapp.com' || u.role === 'admin';

                  return (
                    <tr key={u.id} className={isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}>
                      <td className="p-3">
                        <div className="font-bold flex items-center gap-2">
                          <span className={isDark ? 'text-white' : 'text-slate-900'}>{u.name}</span>
                          {isMuhammad && (
                            <span 
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono border"
                              style={{ color: accentColor, borderColor: accentColor }}
                            >
                              Head Coach
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.role === 'admin'
                            ? 'bg-slate-800 text-cyan-400 border-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          STAGE_CONFIG[u.stage || 'Normal'].badgeColor
                        }`}>
                          {u.stage || 'Normal'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold" style={{ color: accentColor }}>
                        {completedList.length} routines
                      </td>
                      <td className="p-3 text-right">
                        {isMuhammad && onOpenChangePassword ? (
                          <button
                            onClick={() => {
                              triggerHaptic(20);
                              onOpenChangePassword();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
                            title="Change Admin Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Change Password</span>
                          </button>
                        ) : !isMuhammad ? (
                          <button
                            onClick={() => promptDeleteUser(u)}
                            className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 1 && users[0].role === 'admin' && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                      <p className="font-semibold text-slate-400">All athlete accounts deleted</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the <strong>Create Athlete</strong> button above to enroll a new member into the Normal stage (1 real workout quota).
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ADD WORKOUT VIDEO FROM LOCAL DEVICE */}
      {activeTab === 'add-video' && (
        <div className={`border rounded-2xl p-5 sm:p-6 space-y-6 transition-colors ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 font-mono">
                <HardDrive className="w-3.5 h-3.5" />
                100% Native Device Media Upload
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              Publish Workout Video From This Device
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select an MP4/WebM workout video file. Video duration is auto-detected.
            </p>
          </div>

          {videoFormStatus.type !== 'idle' && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold border ${
              videoFormStatus.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}>
              {videoFormStatus.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{videoFormStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleCreateVideo} className="space-y-5">
            {/* Native Video File Drop / Picker Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Workout Video File (.mp4, .webm) *
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  selectedDeviceFile
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : isDark 
                      ? 'border-slate-800 hover:border-slate-700 bg-[#090D16]' 
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  onChange={handleDeviceFileSelect}
                  className="hidden"
                />

                {isProcessingDeviceFile ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor }} />
                    <span className="text-xs font-mono" style={{ color: accentColor }}>Analyzing video duration...</span>
                  </div>
                ) : selectedDeviceFile ? (
                  <div className="space-y-2 py-2 w-full max-w-md">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                      <FileVideo className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm truncate">{selectedDeviceFile.name}</div>
                      <div className="text-[11px] text-emerald-500 font-mono mt-0.5">
                        {(selectedDeviceFile.size / (1024 * 1024)).toFixed(1)} MB • Detected Duration: {duration}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div 
                      className="w-12 h-12 rounded-2xl text-slate-950 flex items-center justify-center mx-auto shadow-lg font-bold"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold">Click or tap to choose video from this device</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Stored in local device storage. Fast, zero-quota restrictions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Preview If Selected */}
            {deviceFilePreviewUrl && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 font-mono">
                  <Eye className="w-3.5 h-3.5" style={{ color: accentColor }} /> Local Preview:
                </span>
                <div className="relative aspect-video max-w-md rounded-xl overflow-hidden bg-black border border-slate-800">
                  <video src={deviceFilePreviewUrl} controls playsInline className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* Title, Muscle Group & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Workout Routine Title *
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g., Incline Dumbbell Bench Press"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Muscle Group *
                </label>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {MUSCLE_GROUPS.map((mg) => (
                    <option key={mg} value={mg}>{mg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Category (e.g. Strength, HIIT) *</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as WorkoutCategory)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-300 text-cyan-800'
                  }`}
                >
                  {WORKOUT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stage Requirement, Duration & Calorie Target */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Required Stage (Access Gate) *
                </label>
                <select
                  value={requiredStage}
                  onChange={(e) => setRequiredStage(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Normal">Normal (1 real equivalent)</option>
                  <option value="Extra">Extra (3 real equivalent)</option>
                  <option value="Premium">Premium (5 real equivalent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span>Routine Duration *</span>
                </label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 14:30 or 15"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Burn (kcal)</span>
                </label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  placeholder="e.g., 220"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold text-amber-500 focus:outline-none ${
                    isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Biomechanical Breakdown & Routine Overview *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the movement trajectory, primary muscle activation, and core cues..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                  isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-slate-950 font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>Publish Routine to GYM App Library</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: ATHLETE PHYSIQUE & PROGRESS REVIEWS */}
      {activeTab === 'physique-reviews' && (
        <div className={`border rounded-2xl p-5 sm:p-6 space-y-6 transition-colors ${
          isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Camera className="w-3.5 h-3.5" />
                  Coach Review & Feedback Hub
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                  Optional Athlete Submissions
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Athlete Before & After Photo Reviews
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Review physique photos submitted by athletes. Assess physical improvement, form, and vascularity, and send direct feedback.
              </p>
            </div>

            {/* Filter Pills */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 self-start sm:self-auto ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setReviewStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  reviewStatusFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({progressPhotos.length})
              </button>
              <button
                onClick={() => setReviewStatusFilter('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  reviewStatusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Needs Review</span>
                {pendingReviewsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-950 text-amber-300">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setReviewStatusFilter('reviewed')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  reviewStatusFilter === 'reviewed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Reviewed ({progressPhotos.filter(p => !!p.adminFeedback).length})
              </button>
            </div>
          </div>

          {/* List of Check-ins */}
          {filteredProgressPhotos.length === 0 ? (
            <div className={`p-10 rounded-xl border text-center space-y-2 ${
              isDark ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <Camera className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold">No Photo Check-ins Found</h4>
              <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {reviewStatusFilter === 'pending'
                  ? 'All athlete transformation check-ins have been reviewed. Outstanding work Coach Muhammad!'
                  : 'No athlete photo check-ins match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProgressPhotos.map((checkin) => {
                const isReviewed = !!checkin.adminFeedback;
                const isEditing = editingReviewId === checkin.id || !isReviewed;
                const draft = reviewDrafts[checkin.id] || {
                  assessment: checkin.adminFeedback?.assessment || 'Great Progress',
                  feedback: checkin.adminFeedback?.feedbackText || '',
                };

                return (
                  <div
                    key={checkin.id}
                    className={`rounded-2xl border p-5 space-y-5 transition-all ${
                      isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Athlete Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm"
                          style={{
                            backgroundColor: `rgba(${hexToRgb(accentColor)}, 0.15)`,
                            color: accentColor,
                            border: `2px solid ${accentColor}`
                          }}
                        >
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{checkin.userName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-800 bg-cyan-950 text-cyan-300 font-bold uppercase">
                              {checkin.muscleFocus || 'General'}
                            </span>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {checkin.userEmail} • Session Date: {checkin.workoutDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isReviewed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{checkin.adminFeedback?.assessment}</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Needs Coach Assessment</span>
                          </span>
                        )}

                        {onDeleteProgressPhoto && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this photo check-in?')) {
                                onDeleteProgressPhoto(checkin.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-900 transition-colors cursor-pointer"
                            title="Delete check-in"
                            aria-label="Delete check-in"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Athlete Note */}
                    {checkin.userNote && (
                      <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white block mb-0.5">Athlete Note:</span>
                          <span className="italic leading-relaxed">"{checkin.userNote}"</span>
                        </div>
                      </div>
                    )}

                    {/* Side-by-Side Photos Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                          <span className="font-bold">1. BEFORE WORKOUT</span>
                          <span>Pre-Session</span>
                        </div>
                        <div 
                          onClick={() => checkin.beforePhotoUrl && setLightboxPhoto({ url: checkin.beforePhotoUrl, title: `${checkin.userName} - Before Workout` })}
                          className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black border border-slate-800 cursor-pointer group flex items-center justify-center"
                        >
                          {checkin.beforePhotoUrl ? (
                            <>
                              <img src={checkin.beforePhotoUrl} alt="Before workout" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" /> Click to enlarge
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">No before photo</span>
                          )}
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                          <span className="font-bold">2. AFTER WORKOUT</span>
                          <span>Pump & Hypertrophy</span>
                        </div>
                        <div 
                          onClick={() => checkin.afterPhotoUrl && setLightboxPhoto({ url: checkin.afterPhotoUrl, title: `${checkin.userName} - After Workout` })}
                          className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black border border-emerald-900/60 cursor-pointer group flex items-center justify-center"
                        >
                          {checkin.afterPhotoUrl ? (
                            <>
                              <img src={checkin.afterPhotoUrl} alt="After workout" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" /> Click to enlarge
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">No after photo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coach Assessment & Feedback Form */}
                    <div className={`p-4 rounded-xl border space-y-4 ${
                      isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-sm font-bold">Coach Muhammad's Assessment & Decision</h4>
                        </div>
                        {isReviewed && !isEditing && (
                          <button
                            onClick={() => setEditingReviewId(checkin.id)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                          >
                            Edit Review
                          </button>
                        )}
                      </div>

                      {isReviewed && !isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Decision:</span>
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {checkin.adminFeedback?.assessment}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono ml-auto">
                              Reviewed on {new Date(checkin.adminFeedback!.reviewedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                            isDark ? 'bg-[#090D16] text-slate-200' : 'bg-slate-50 text-slate-800'
                          }`}>
                            "{checkin.adminFeedback?.feedbackText}"
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {/* 4 Improvement Assessment Options */}
                          <div>
                            <label className="text-xs font-mono font-bold uppercase tracking-wider block mb-2 text-slate-400">
                              Did the athlete improve? Select Coach Decision:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {(['Significant Improvement', 'Great Progress', 'On Track', 'Form Refinement Needed'] as ImprovementAssessment[]).map((opt) => {
                                const isSelected = draft.assessment === opt;
                                const colorClass = opt === 'Significant Improvement'
                                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/15'
                                  : opt === 'Great Progress'
                                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/15'
                                    : opt === 'On Track'
                                      ? 'border-amber-500 text-amber-400 bg-amber-500/15'
                                      : 'border-rose-500 text-rose-400 bg-rose-500/15';

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(20);
                                      setReviewDrafts(prev => ({
                                        ...prev,
                                        [checkin.id]: { ...draft, assessment: opt }
                                      }));
                                    }}
                                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                      isSelected
                                        ? colorClass
                                        : isDark ? 'border-slate-800 bg-[#090D16] text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Feedback Textarea */}
                          <div>
                            <label className="text-xs font-mono font-bold uppercase tracking-wider block mb-1.5 text-slate-400">
                              Personalized Feedback & Guidance:
                            </label>
                            <textarea
                              rows={3}
                              value={draft.feedback}
                              onChange={(e) => {
                                const val = e.target.value;
                                setReviewDrafts(prev => ({
                                  ...prev,
                                  [checkin.id]: { ...draft, feedback: val }
                                }));
                              }}
                              placeholder="Write your coaching assessment, noting muscular contraction, vascularity, symmetry, and what to focus on next session..."
                              className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-colors ${
                                isDark ? 'bg-[#090D16] border-slate-800 text-white placeholder-slate-600 focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                              }`}
                            />
                          </div>

                          {/* Quick Feedback Suggestions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-500">Quick Prompts:</span>
                            {[
                              'Noticeable upper chest pump, great execution!',
                              'Great symmetry and deltoid vascularity.',
                              'Keep progressive overload, form is looking solid.',
                              'Good effort! Focus on controlled 3s eccentrics next time.'
                            ].map((promptText) => (
                              <button
                                key={promptText}
                                type="button"
                                onClick={() => {
                                  triggerHaptic(15);
                                  setReviewDrafts(prev => ({
                                    ...prev,
                                    [checkin.id]: { ...draft, feedback: promptText }
                                  }));
                                }}
                                className={`text-[11px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                                  isDark ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {promptText}
                              </button>
                            ))}
                          </div>

                          {/* Submit Feedback Action */}
                          <div className="flex justify-end gap-2 pt-2">
                            {isReviewed && (
                              <button
                                type="button"
                                onClick={() => setEditingReviewId(null)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (!draft.feedback.trim()) {
                                  alert('Please enter feedback for the athlete.');
                                  return;
                                }
                                triggerHaptic([30, 40, 100]);
                                playSuccessChime();
                                onReviewProgressPhoto?.(checkin.id, draft.assessment, draft.feedback);
                                setEditingReviewId(null);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
                              style={{ backgroundColor: accentColor }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Submit Assessment & Send Feedback</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white pb-2">
              <span className="text-sm font-bold font-mono">{lightboxPhoto.title}</span>
              <button 
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img 
              src={lightboxPhoto.url} 
              alt={lightboxPhoto.title} 
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`relative w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border ${
            isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit className="w-4 h-4" style={{ color: accentColor }} />
                <span>Edit Workout Routine</span>
              </h3>
              <button onClick={() => setEditingVideo(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSaveEditedVideo} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-400">Routine Title</label>
                <input
                  type="text"
                  required
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold" style={{ color: accentColor }}>Duration</label>
                  <input
                    type="text"
                    required
                    value={editingVideo.duration || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono font-bold ${
                      isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-cyan-400">Category</label>
                  <select
                    value={editingVideo.category || 'Strength'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value as WorkoutCategory })}
                    className={`w-full px-3 py-2 rounded-lg border font-semibold ${
                      isDark ? 'bg-[#090D16] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-300 text-cyan-800'
                    }`}
                  >
                    {WORKOUT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">Required Stage</label>
                  <select
                    value={editingVideo.requiredStage || 'Normal'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, requiredStage: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Extra">Extra</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">Overview & Description</label>
                <textarea
                  rows={3}
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-2 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW ATHLETE MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border ${
            isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4" style={{ color: accentColor }} />
                <span>Register New Athlete Account</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-400">Athlete Full Name *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Tariq Mansour"
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">Email / Username *</label>
                <input
                  type="text"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. athlete@gymapp.com"
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="e.g. 123"
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400">Initial Membership Stage</label>
                <select
                  value={userStage}
                  onChange={(e) => setUserStage(e.target.value as any)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Normal">Normal (Default: 1 real)</option>
                  <option value="Extra">Extra (3 real)</option>
                  <option value="Premium">Premium (5 real)</option>
                </select>
              </div>

              <div className={`flex justify-end gap-2 pt-3 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
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
                  Create Athlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 border ${
                isDark ? 'bg-[#090D16] border-red-900/60 text-white' : 'bg-white border-red-200 text-slate-900'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto shadow-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-extrabold">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                    isDark ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
