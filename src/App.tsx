import React, { useState, useEffect, useCallback } from 'react';
import { User, WorkoutVideo, StorageStats, StageRequest, MembershipStage, ProgressPhotoCheckin, ImprovementAssessment } from './types/workout';
import { 
  getStoredUsers, 
  getStoredVideos, 
  getStoredStageRequests,
  getCurrentSession, 
  saveCurrentSession, 
  authenticateUser, 
  createUser, 
  deleteUserAccount, 
  addWorkoutVideo, 
  updateWorkoutVideo,
  deleteWorkoutVideo,
  getCompletedWorkouts, 
  toggleWorkoutCompleted, 
  getRecentlyWatched,
  recordRecentlyWatched,
  submitStageRequest,
  resolveStageRequest,
  calculateStorageStats, 
  resetToDemoData,
  saveUserWorkoutNote,
  getStoredProgressPhotos,
  saveProgressPhotoCheckin,
  reviewProgressPhotoCheckin,
  deleteProgressPhotoCheckin,
  updateUserDailyCalorieGoal,
  updateUserPassword
} from './utils/storage';
import {
  initializeCloudSync,
  cloudAddUser,
  cloudDeleteUser,
  cloudAddOrUpdateVideo,
  cloudDeleteVideo,
  cloudSubmitStageRequest,
  cloudResolveStageRequest,
  cloudSaveUserProgress,
  cloudSaveUserWorkoutNote,
  cloudUpdateUserPassword
} from './utils/cloudSync';
import { triggerHaptic, initAudioUnlock, playButtonClickSound, isSoundEnabled, toggleSound } from './utils/media';
import { 
  ThemeSettings, 
  getThemeSettings, 
  saveThemeSettings, 
  applyThemeToDom 
} from './utils/theme';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { VideoModal } from './components/VideoModal';
import { StorageModal } from './components/StorageModal';
import { InstructionsModal } from './components/InstructionsModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { ProgressPhotoModal } from './components/ProgressPhotoModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { WorkoutRestTimer } from './components/WorkoutRestTimer';
import { Dumbbell, Shield, HelpCircle, HardDrive, Plus, Award, Activity, Palette, LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentSession());
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [videos, setVideos] = useState<WorkoutVideo[]>(() => getStoredVideos());
  const [stageRequests, setStageRequests] = useState<StageRequest[]>(() => getStoredStageRequests());
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhotoCheckin[]>(() => getStoredProgressPhotos());
  const [adminTab, setAdminTab] = useState<'videos' | 'add-video' | 'users' | 'requests' | 'analytics' | 'physique-reviews'>('videos');
  const [isCloudLive, setIsCloudLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  // Theme & Appearance Customization State
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => getThemeSettings());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUserSettingsModalOpen, setIsUserSettingsModalOpen] = useState(false);
  const [isProgressPhotoModalOpen, setIsProgressPhotoModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isInstallPwaModalOpen, setIsInstallPwaModalOpen] = useState(false);
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());

  // Interactive Video Player Modal State
  const [activeModalVideo, setActiveModalVideo] = useState<WorkoutVideo | null>(null);

  // Storage and Guide Modals
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);

  // Storage stats
  const [storageStats, setStorageStats] = useState<StorageStats>(() => calculateStorageStats());

  // Completed workouts for current user
  const [completedVideoIds, setCompletedVideoIds] = useState<string[]>(() => {
    const session = getCurrentSession();
    return session ? getCompletedWorkouts(session.id) : [];
  });

  // Recently watched workouts for current user (last 3 opened)
  const [recentlyWatchedIds, setRecentlyWatchedIds] = useState<string[]>(() => {
    const session = getCurrentSession();
    return session ? getRecentlyWatched(session.id) : [];
  });

  // Mode toggle for Admin to test Member view
  const [adminAthleteView, setAdminAthleteView] = useState(false);

  // Apply theme to DOM on mount and when settings change
  useEffect(() => {
    applyThemeToDom(themeSettings);
    initAudioUnlock();
  }, [themeSettings]);

  const handleToggleThemeMode = () => {
    triggerHaptic(30);
    playButtonClickSound();
    const updated: ThemeSettings = {
      ...themeSettings,
      mode: themeSettings.mode === 'dark' ? 'light' : 'dark',
    };
    setThemeSettings(updated);
    saveThemeSettings(updated);
  };

  const handleUpdateThemeSettings = (newSettings: ThemeSettings) => {
    setThemeSettings(newSettings);
    saveThemeSettings(newSettings);
  };

  // Refresh data from storage
  const refreshData = useCallback(() => {
    const freshUsers = getStoredUsers();
    setUsers(freshUsers);
    setVideos(getStoredVideos());
    setStageRequests(getStoredStageRequests());
    setProgressPhotos(getStoredProgressPhotos());
    setStorageStats(calculateStorageStats());

    const session = getCurrentSession();
    if (session) {
      const matched = freshUsers.find(u => u.id === session.id);
      if (matched && matched.stage !== session.stage) {
        session.stage = matched.stage;
        saveCurrentSession(session);
        setCurrentUser({ ...session });
      }
      setCompletedVideoIds(getCompletedWorkouts(session.id));
      setRecentlyWatchedIds(getRecentlyWatched(session.id));
    } else {
      setRecentlyWatchedIds([]);
    }
  }, []);

  useEffect(() => {
    refreshData();

    initializeCloudSync({
      onUsersUpdated: (cloudUsers) => {
        setUsers(cloudUsers);
      },
      onVideosUpdated: (cloudVideos) => {
        setVideos(cloudVideos);
      },
      onStageRequestsUpdated: (cloudReqs) => {
        setStageRequests(cloudReqs);
      },
      onSyncStatusChange: (status) => {
        setIsCloudLive(status.isOnline);
        setLastSyncTime(status.lastSyncedAt);
      }
    });
  }, [refreshData]);

  // Auth Handlers
  const handleLogin = (identifier: string, pass: string) => {
    const res = authenticateUser(identifier, pass);
    if (res.user) {
      setCurrentUser(res.user);
      saveCurrentSession(res.user);
      setCompletedVideoIds(getCompletedWorkouts(res.user.id));
      setRecentlyWatchedIds(getRecentlyWatched(res.user.id));
      setAdminAthleteView(false);
      setAdminTab('videos');
      refreshData();
      return { success: true };
    }
    return { success: false, error: res.message };
  };

  const handleLogout = () => {
    triggerHaptic(30);
    saveCurrentSession(null);
    setCurrentUser(null);
    setActiveModalVideo(null);
    setRecentlyWatchedIds([]);
    setAdminAthleteView(false);
  };

  // Open video modal and record as recently watched
  const handleOpenVideo = (video: WorkoutVideo) => {
    setActiveModalVideo(video);
    if (currentUser) {
      const updated = recordRecentlyWatched(currentUser.id, video.id);
      setRecentlyWatchedIds(updated);
      cloudSaveUserProgress(currentUser.id, {
        completedVideoIds,
        recentlyWatchedIds: updated,
      });
    }
  };

  // Workout Video Management Handlers
  const handleAddVideo = (videoData: any) => {
    const res = addWorkoutVideo(videoData);
    if (res.success && res.video) {
      cloudAddOrUpdateVideo(res.video);
      refreshData();
    }
    return res;
  };

  const handleUpdateVideo = (videoId: string, updatedFields: any) => {
    const res = updateWorkoutVideo(videoId, updatedFields);
    if (res.success && res.video) {
      cloudAddOrUpdateVideo(res.video);
      refreshData();
    }
    return res;
  };

  const handleDeleteVideo = (videoId: string) => {
    const res = deleteWorkoutVideo(videoId);
    if (res.success) {
      cloudDeleteVideo(videoId);
      if (activeModalVideo?.id === videoId) {
        setActiveModalVideo(null);
      }
      refreshData();
    }
  };

  // User Management Handlers
  const handleAddUser = (userData: any) => {
    const res = createUser(userData);
    if (res.success && res.user) {
      cloudAddUser(res.user);
      refreshData();
    }
    return res;
  };

  const handleDeleteUser = (userId: string) => {
    const res = deleteUserAccount(userId);
    if (res.success) {
      cloudDeleteUser(userId);
      refreshData();
    }
  };

  // Stage Request Handlers
  const handleSubmitStageRequest = (requestedStage: MembershipStage, note?: string) => {
    if (!currentUser) return { success: false, error: 'Must be logged in to submit a request.' };
    const res = submitStageRequest(
      currentUser.id,
      currentUser.name,
      currentUser.email,
      currentUser.stage || 'Normal',
      requestedStage,
      note
    );
    if (res.success && res.request) {
      cloudSubmitStageRequest(res.request);
      refreshData();
    }
    return res;
  };

  const handleResolveStageRequest = (requestId: string, status: 'accepted' | 'rejected') => {
    const res = resolveStageRequest(requestId, status, currentUser?.name || 'Muhammad');
    if (res.success) {
      cloudResolveStageRequest(requestId, status, currentUser?.name || 'Muhammad');
      if (res.updatedUser) {
        cloudAddUser(res.updatedUser);
      }
      refreshData();
    }
  };

  // Daily Calorie Goal Handlers
  const handleSaveDailyCalorieGoal = (newGoal: number) => {
    if (!currentUser) return;
    const res = updateUserDailyCalorieGoal(currentUser.id, newGoal);
    if (res.success && res.user) {
      setCurrentUser({ ...res.user });
      setUsers(getStoredUsers());
      cloudAddUser(res.user);
    }
  };

  // Password Change Handler
  const handleUpdatePassword = (newPassword: string, currentPasswordAttempt?: string) => {
    if (!currentUser) return { success: false, error: 'No active session' };
    const res = updateUserPassword(currentUser.id, newPassword, currentPasswordAttempt, true);
    if (res.success && res.user) {
      setCurrentUser({ ...res.user });
      setUsers(getStoredUsers());
      cloudUpdateUserPassword(currentUser.id, newPassword);
    }
    return res;
  };

  // Athlete Progress Photos Check-in Handlers
  const handleSaveProgressPhotoCheckin = (checkinData: Omit<ProgressPhotoCheckin, 'id' | 'createdAt'>) => {
    const res = saveProgressPhotoCheckin(checkinData);
    if (res.success && res.checkin) {
      setProgressPhotos(getStoredProgressPhotos());
    }
  };

  const handleReviewProgressPhoto = (id: string, assessment: ImprovementAssessment, feedbackText: string) => {
    const coachName = currentUser?.name || 'Muhammad (Coach)';
    const res = reviewProgressPhotoCheckin(id, assessment, feedbackText, coachName);
    if (res.success) {
      setProgressPhotos(getStoredProgressPhotos());
    }
  };

  const handleDeleteProgressPhoto = (id: string) => {
    const res = deleteProgressPhotoCheckin(id);
    if (res.success) {
      setProgressPhotos(getStoredProgressPhotos());
    }
  };

  // Workout completion toggle
  const handleToggleCompleted = (videoId: string) => {
    if (!currentUser) return;
    const updated = toggleWorkoutCompleted(currentUser.id, videoId);
    setCompletedVideoIds(updated);
    cloudSaveUserProgress(currentUser.id, {
      completedVideoIds: updated,
      recentlyWatchedIds,
    });
  };

  // Athlete personal workout note handler (synced to profile & cloud)
  const handleSaveWorkoutNote = async (videoId: string, note: string) => {
    if (!currentUser) return;
    const res = saveUserWorkoutNote(currentUser.id, videoId, note);
    if (res.success && res.user) {
      setCurrentUser({ ...res.user });
      saveCurrentSession(res.user);
      refreshData();
      await cloudSaveUserWorkoutNote(currentUser.id, videoId, note);
    }
  };

  // Reset to default demo data
  const handleResetDemo = () => {
    resetToDemoData();
    refreshData();
  };

  const pendingRequestsCount = stageRequests.filter(r => r.status === 'pending').length;

  const sessionProgress = videos.length > 0 
    ? Math.round((completedVideoIds.length / videos.length) * 100) 
    : 0;

  const isDark = themeSettings.mode === 'dark';
  const accentColor = themeSettings.accentHex;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200 ${
      isDark ? 'bg-[#000000] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Top Session Progress Bar */}
      {currentUser && (
        <div className={`w-full h-1 ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
          <div 
            className="h-full transition-all duration-500"
            style={{ width: `${sessionProgress}%`, backgroundColor: accentColor }}
          />
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenInstructions={() => setIsInstructionsModalOpen(true)}
        onOpenStorage={() => setIsStorageModalOpen(true)}
        onOpenThemeSettings={() => setIsThemeModalOpen(true)}
        onOpenUserSettings={() => setIsUserSettingsModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenInstallPwa={() => setIsInstallPwaModalOpen(true)}
        onToggleThemeMode={handleToggleThemeMode}
        themeSettings={themeSettings}
        storageStats={storageStats}
        currentTab={adminTab}
        onSelectTab={(tab) => {
          playButtonClickSound();
          setAdminTab(tab);
        }}
        pendingRequestsCount={pendingRequestsCount}
        pendingReviewsCount={progressPhotos.filter(p => !p.adminFeedback).length}
        isCloudLive={isCloudLive}
        soundEnabled={soundActive}
        onToggleSound={() => setSoundActive(toggleSound())}
      />

      {/* Main View Area (with bottom clearance for mobile thumb navigation) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-8">
        {!currentUser ? (
          /* Login Screen */
          <LoginView 
            onLogin={handleLogin}
            themeSettings={themeSettings}
            onToggleTheme={handleToggleThemeMode}
          />
        ) : isAdmin && !adminAthleteView ? (
          /* Admin Dashboard (Muhammad) */
          <div className="space-y-4">
            <div className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border text-xs shadow-md transition-all ${
              isDark ? 'bg-[#090D16] border-slate-800' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-2 font-bold px-1" style={{ color: accentColor }}>
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Coach Muhammad Command Center</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                  ADMIN MODE
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsThemeModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span className="hidden sm:inline">Theme</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic(30);
                    setAdminAthleteView(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                  title="Switch to athlete feed view to experience the app as a gym member"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>Switch to Athlete View</span>
                </button>

                <button
                  onClick={handleLogout}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-800' 
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-red-600 hover:border-red-300'
                  }`}
                  title="Log out and return to the login page"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Login Page</span>
                </button>
              </div>
            </div>

            <AdminDashboard
              currentUser={currentUser}
              users={users}
              videos={videos}
              stageRequests={stageRequests}
              activeTab={adminTab}
              onSelectTab={setAdminTab}
              onAddVideo={handleAddVideo}
              onUpdateVideo={handleUpdateVideo}
              onDeleteVideo={handleDeleteVideo}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onResolveStageRequest={handleResolveStageRequest}
              onPreviewVideo={handleOpenVideo}
              themeSettings={themeSettings}
              onOpenThemeSettings={() => setIsThemeModalOpen(true)}
              onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
              progressPhotos={progressPhotos}
              onReviewProgressPhoto={handleReviewProgressPhoto}
              onDeleteProgressPhoto={handleDeleteProgressPhoto}
            />
          </div>
        ) : (
          /* User Dashboard (or Muhammad in athlete preview) */
          <div className="space-y-4">
            {isAdmin && adminAthleteView ? (
              <div className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border text-xs shadow-md transition-all ${
                isDark ? 'bg-cyan-950/70 border-cyan-800 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
              }`}>
                <div className="flex items-center gap-2 font-bold px-1">
                  <Dumbbell className="w-4 h-4 text-cyan-400" />
                  <span>Previewing Athlete Feed as Muhammad (Admin)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold">
                    ATHLETE VIEW
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      triggerHaptic(30);
                      setAdminAthleteView(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow text-slate-950 bg-amber-400 hover:bg-amber-300"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Return to Admin Console</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-800' 
                        : 'bg-white border-slate-300 text-slate-700 hover:text-red-600 hover:border-red-300'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Login Page</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border text-xs shadow-md transition-all ${
                isDark ? 'bg-[#090D16] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2 font-bold px-1">
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                  <span>Logged in: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{currentUser.name}</strong></span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold">
                    {currentUser.stage || 'Normal'} Member
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      handleLogin('muhammad@gymapp.com', '123');
                    }}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-slate-950 bg-amber-400 hover:bg-amber-300"
                    title="1-Click Switch to Coach Muhammad (Admin)"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Switch to Coach Muhammad (Admin)</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-800' 
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-red-600 hover:border-red-300'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Login Page</span>
                  </button>
                </div>
              </div>
            )}

            <UserDashboard
              currentUser={currentUser}
              videos={videos}
              completedVideoIds={completedVideoIds}
              recentlyWatchedIds={recentlyWatchedIds}
              stageRequests={stageRequests}
              onOpenVideo={handleOpenVideo}
              onToggleCompleted={handleToggleCompleted}
              onSubmitStageRequest={handleSubmitStageRequest}
              themeSettings={themeSettings}
              onOpenUserSettings={() => setIsUserSettingsModalOpen(true)}
              onOpenProgressPhotos={() => setIsProgressPhotoModalOpen(true)}
              progressPhotos={progressPhotos}
              onDeleteProgressPhoto={handleDeleteProgressPhoto}
              onOpenInstallPwa={() => setIsInstallPwaModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) on Mobile for Quick Admin Video Upload (positioned above bottom nav) */}
      {isAdmin && (
        <button
          onClick={() => {
            triggerHaptic(40);
            setAdminAthleteView(false);
            setAdminTab('add-video');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full text-slate-950 shadow-2xl flex items-center justify-center border-2 border-black cursor-pointer transform active:scale-95 transition-transform font-bold"
          style={{ backgroundColor: accentColor }}
          aria-label="Upload workout video"
          title="Upload new video"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Footer */}
      <footer className={`mt-auto border-t py-6 text-xs transition-colors ${
        isDark ? 'border-slate-900 bg-[#000000] text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>GYM APP</span>
            <span>·</span>
            <span>3-Stage Progression (Normal, Extra, Premium)</span>
            <span>·</span>
            <span>Calorie Analytics Active</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>Theme & Colors</span>
            </button>
            <button
              onClick={() => setIsInstructionsModalOpen(true)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Training Stages Guide</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsStorageModalOpen(true)}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1 font-mono tabular-nums cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Storage ({storageStats.usedKb} KB)</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Interactive Video Player Modal with Dynamic Forensic Watermarking & Profile Notes */}
      <VideoModal
        video={activeModalVideo}
        onClose={() => setActiveModalVideo(null)}
        isCompleted={activeModalVideo ? completedVideoIds.includes(activeModalVideo.id) : false}
        onToggleCompleted={handleToggleCompleted}
        currentUser={currentUser}
        onSaveNote={handleSaveWorkoutNote}
      />

      {/* Storage Diagnostic Modal (Admin only) */}
      <StorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        stats={storageStats}
        videoCount={videos.length}
        userCount={users.length}
        onResetDemo={handleResetDemo}
        onDataImported={refreshData}
      />

      {/* Instructions & Help Guide Modal */}
      <InstructionsModal
        isOpen={isInstructionsModalOpen}
        onClose={() => setIsInstructionsModalOpen(false)}
      />

      {/* Theme Settings & Custom Color Palette Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={themeSettings}
        onUpdateSettings={handleUpdateThemeSettings}
        isAdmin={isAdmin}
      />

      {/* User Settings & Daily Calorie Goal Modal */}
      <UserSettingsModal
        isOpen={isUserSettingsModalOpen}
        onClose={() => setIsUserSettingsModalOpen(false)}
        currentUser={currentUser}
        onSaveDailyCalorieGoal={handleSaveDailyCalorieGoal}
        onOpenThemeSettings={() => setIsThemeModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        themeSettings={themeSettings}
      />

      {/* Optional Athlete Physique Progress Photos Modal */}
      {currentUser && (
        <ProgressPhotoModal
          isOpen={isProgressPhotoModalOpen}
          onClose={() => setIsProgressPhotoModalOpen(false)}
          currentUser={currentUser}
          onSaveCheckin={handleSaveProgressPhotoCheckin}
          themeSettings={themeSettings}
        />
      )}

      {/* Admin & Account Password Change Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onUpdatePassword={handleUpdatePassword}
        themeSettings={themeSettings}
      />

      {/* Mobile App & APK Installation Modal (PWA & PWABuilder) */}
      <InstallPwaModal
        isOpen={isInstallPwaModalOpen}
        onClose={() => setIsInstallPwaModalOpen(false)}
        themeSettings={themeSettings}
      />

      {/* Floating Workout Rest Interval Timer with Audio Chimes */}
      <WorkoutRestTimer
        themeSettings={themeSettings}
      />
    </div>
  );
}
