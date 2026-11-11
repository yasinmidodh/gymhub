import React from 'react';
import { User, StorageStats, STAGE_CONFIG } from '../types/workout';
import { ThemeSettings } from '../utils/theme';
import { 
  Dumbbell, LogOut, Shield, User as UserIcon, HardDrive, 
  HelpCircle, PlusCircle, Inbox, Sun, Moon, Palette, BarChart2,
  Volume2, VolumeX, Camera, Target, KeyRound, Smartphone, Activity, Utensils
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenInstructions: () => void;
  onOpenStorage: () => void;
  onOpenThemeSettings: () => void;
  onOpenUserSettings?: () => void;
  onOpenChangePassword?: () => void;
  onOpenInstallPwa?: () => void;
  onToggleThemeMode: () => void;
  themeSettings: ThemeSettings;
  storageStats: StorageStats;
  currentTab?: 'videos' | 'add-video' | 'users' | 'requests' | 'analytics' | 'physique-reviews';
  onSelectTab?: (tab: 'videos' | 'add-video' | 'users' | 'requests' | 'analytics' | 'physique-reviews') => void;
  pendingRequestsCount?: number;
  pendingReviewsCount?: number;
  isCloudLive?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenInstructions,
  onOpenStorage,
  onOpenThemeSettings,
  onOpenUserSettings,
  onOpenChangePassword,
  onOpenInstallPwa,
  onToggleThemeMode,
  themeSettings,
  storageStats,
  currentTab = 'videos',
  onSelectTab,
  pendingRequestsCount = 0,
  pendingReviewsCount = 0,
  isCloudLive = false,
  soundEnabled = true,
  onToggleSound,
}) => {
  const userStageConfig = currentUser ? STAGE_CONFIG[currentUser.stage || 'Normal'] : null;
  const isDark = themeSettings.mode === 'dark';
  const isAdmin = currentUser?.role === 'admin';
  const accentColor = themeSettings.accentHex;

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${
      isDark 
        ? 'bg-[#000000]/95 border-slate-800/80 text-white' 
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-black font-extrabold"
            style={{ backgroundColor: accentColor }}
          >
            <Dumbbell className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight uppercase font-mono">
                GYM <span style={{ color: accentColor }}>APP</span>
              </span>
              <span 
                className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded font-mono border"
                style={{
                  color: accentColor,
                  borderColor: accentColor,
                  backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'
                }}
              >
                Pro
              </span>
            </div>
            <p className={`text-[11px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Athlete Training & Performance Hub
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Admin Tabs (Admin only) */}
        {isAdmin && onSelectTab && (
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => onSelectTab('videos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'videos'
                  ? 'text-slate-950 shadow-sm font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentTab === 'videos' ? { backgroundColor: accentColor } : {}}
            >
              Workout Library
            </button>
            <button
              onClick={() => onSelectTab('add-video')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'add-video'
                  ? 'text-slate-950 shadow-sm font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentTab === 'add-video' ? { backgroundColor: accentColor } : {}}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Upload Video
            </button>
            <button
              onClick={() => onSelectTab('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'users'
                  ? 'text-slate-950 shadow-sm font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentTab === 'users' ? { backgroundColor: accentColor } : {}}
            >
              Manage Users
            </button>
            <button
              onClick={() => onSelectTab('requests')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer relative ${
                currentTab === 'requests'
                  ? 'text-slate-950 shadow-sm font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentTab === 'requests' ? { backgroundColor: accentColor } : {}}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Stage Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'analytics'
                  ? 'text-slate-950 shadow-sm font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentTab === 'analytics' ? { backgroundColor: accentColor } : {}}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Gym Analytics</span>
            </button>
            <button
              onClick={() => onSelectTab('physique-reviews')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer relative ${
                currentTab === 'physique-reviews'
                  ? 'text-slate-950 shadow-sm font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentTab === 'physique-reviews' ? { backgroundColor: accentColor } : {}}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Physique Reviews</span>
              {pendingReviewsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-400 text-slate-950">
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* Zone 3: Actions & Account Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* User Settings & Daily Calorie Goal */}
          {currentUser && onOpenUserSettings && (
            <button
              onClick={onOpenUserSettings}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="User Settings & Daily Calorie Goal"
              aria-label="User settings and daily calorie goal"
            >
              <Target className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Admin Change Password */}
          {currentUser?.role === 'admin' && onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300 hover:text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-amber-600 hover:text-amber-800'
              }`}
              title="Change Admin Password"
              aria-label="Change admin password"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Sound FX Toggle (For Everyone) */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title={soundEnabled ? 'Sound Effects Active (Click to mute)' : 'Sound Effects Muted (Click to enable)'}
              aria-label="Toggle sound effects"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}

          {/* Quick Light/Dark Toggle (For Everyone) */}
          <button
            onClick={onToggleThemeMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title={isDark ? 'Switch to White Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
          </button>

          {/* UI Customization Palette Settings (For Everyone) */}
          <button
            onClick={onOpenThemeSettings}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Custom UI Colors & Theme Settings"
            aria-label="Theme settings"
          >
            <Palette className="w-4 h-4" style={{ color: accentColor }} />
          </button>

          {/* Guide / Instructions Modal Button */}
          <button
            onClick={onOpenInstructions}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Training Stages & User Guide"
            aria-label="View instructions"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Install Mobile App / Download APK Modal Button */}
          {onOpenInstallPwa && (
            <button
              onClick={onOpenInstallPwa}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300 hover:text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-cyan-700 hover:text-cyan-900'
              }`}
              title="Install Mobile App on Phone / Download APK"
              aria-label="Install mobile app or download APK"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {/* ADMIN-ONLY CONTROLS (Cloud Sync & Storage diagnostics hidden for regular users like Alex) */}
          {isAdmin && (
            <>
              {/* Cloud Live Sync Indicator */}
              <div 
                onClick={onOpenStorage}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
                title={isCloudLive ? 'Firestore Cloud Sync Active' : 'Connecting to Cloud...'}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isCloudLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className={isCloudLive ? 'text-emerald-500 font-semibold' : 'text-amber-500'}>
                  {isCloudLive ? 'Cloud Sync' : 'Connecting'}
                </span>
              </div>

              {/* Storage Stats Button */}
              <button
                onClick={onOpenStorage}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Cross-Device Storage"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span className="tabular-nums">{storageStats.usedKb} KB</span>
              </button>
            </>
          )}

          {/* User Profile & Logout */}
          {currentUser ? (
            <div className={`flex items-center gap-2 pl-2 border-l ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-left">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                  style={{
                    backgroundColor: `rgba(${themeSettings.accentHex ? '0, 229, 255' : '0,0,0'}, 0.15)`,
                    color: accentColor,
                    border: `1.5px solid ${accentColor}`
                  }}
                >
                  {isAdmin ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden lg:block">
                  <div className={`text-xs font-semibold leading-tight truncate max-w-[120px] ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span 
                      className="text-[10px] font-mono uppercase tracking-wider font-bold"
                      style={{ color: accentColor }}
                    >
                      {isAdmin ? 'Coach' : (userStageConfig?.label || 'Member')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border-slate-800' 
                    : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border-slate-200'
                }`}
                title="Log out of GYM App"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sign in to continue
            </div>
          )}
        </div>
      </div>

      {/* Adaptive Mobile Bottom Navigation Bar (Smartphones: Touch Target >= 44px) */}
      {currentUser && (
        <nav 
          className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-2 py-1 flex items-center justify-around transition-colors shadow-2xl ${
            isDark 
              ? 'bg-[#000000]/95 border-slate-800/90 text-slate-400' 
              : 'bg-white/95 border-slate-200/90 text-slate-600'
          }`}
          style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
          aria-label="Mobile thumb navigation"
        >
          {isAdmin && onSelectTab ? (
            /* Admin Mobile Bottom Navigation */
            <>
              <button
                onClick={() => onSelectTab('videos')}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
                  currentTab === 'videos' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={currentTab === 'videos' ? { color: accentColor } : {}}
              >
                <Dumbbell className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Library</span>
              </button>

              <button
                onClick={() => onSelectTab('add-video')}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
                  currentTab === 'add-video' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={currentTab === 'add-video' ? { color: accentColor } : {}}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Upload</span>
              </button>

              <button
                onClick={() => onSelectTab('users')}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
                  currentTab === 'users' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={currentTab === 'users' ? { color: accentColor } : {}}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Users</span>
              </button>

              <button
                onClick={() => onSelectTab('requests')}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl relative transition-all cursor-pointer ${
                  currentTab === 'requests' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={currentTab === 'requests' ? { color: accentColor } : {}}
              >
                <Inbox className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-1 right-2 px-1 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-slate-950">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('analytics')}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
                  currentTab === 'analytics' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={currentTab === 'analytics' ? { color: accentColor } : {}}
              >
                <BarChart2 className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Analytics</span>
              </button>

              <button
                onClick={() => onSelectTab('physique-reviews')}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl relative transition-all cursor-pointer ${
                  currentTab === 'physique-reviews' ? 'font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={currentTab === 'physique-reviews' ? { color: accentColor } : {}}
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Reviews</span>
                {pendingReviewsCount > 0 && (
                  <span className="absolute top-1 right-2 px-1 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-400 text-slate-950">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            /* Member / Athlete Mobile Bottom Navigation */
            <>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl transition-all cursor-pointer"
                style={{ color: accentColor }}
              >
                <Dumbbell className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-0.5">Workouts</span>
              </button>

              <button
                onClick={() => {
                  document.getElementById('energy-tracker-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl opacity-75 hover:opacity-100 transition-all cursor-pointer"
              >
                <Activity className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] mt-0.5">Energy</span>
              </button>

              <button
                onClick={() => {
                  document.getElementById('weekly-d3-analytics-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl opacity-75 hover:opacity-100 transition-all cursor-pointer"
              >
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <span className="text-[10px] mt-0.5">Trends</span>
              </button>

              <button
                onClick={() => {
                  document.getElementById('nutrition-tracker-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center min-w-[50px] min-h-[46px] rounded-xl opacity-75 hover:opacity-100 transition-all cursor-pointer"
              >
                <Utensils className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] mt-0.5">Macros</span>
              </button>

              {onOpenUserSettings && (
                <button
                  onClick={onOpenUserSettings}
                  className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl opacity-75 hover:opacity-100 transition-all cursor-pointer"
                >
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] mt-0.5">Goal</span>
                </button>
              )}

              {onOpenInstallPwa && (
                <button
                  onClick={onOpenInstallPwa}
                  className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl opacity-75 hover:opacity-100 transition-all cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <span className="text-[10px] mt-0.5">Get APK</span>
                </button>
              )}
            </>
          )}
        </nav>
      )}
    </header>
  );
};
