import { User, WorkoutVideo, WorkoutCategory, StorageStats, MembershipStage, StageRequest, ProgressPhotoCheckin, ImprovementAssessment, DailyNutritionLog } from '../types/workout';

export const STORAGE_KEYS = {
  USERS: 'gymapp_users_v3',
  VIDEOS: 'gymapp_videos_v3',
  CURRENT_USER: 'gymapp_current_user_v3',
  COMPLETED: 'gymapp_completed_workouts_v3',
  COMPLETION_HISTORY: 'gymapp_completion_history_v3',
  STAGE_REQUESTS: 'gymapp_stage_requests_v3',
  RECENTLY_WATCHED: 'gymapp_recently_watched_v3',
  PROGRESS_PHOTOS: 'gymapp_progress_photos_v1',
  NUTRITION_LOGS: 'gymapp_nutrition_logs_v1',
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-muhammad',
    name: 'Muhammad (Admin)',
    email: 'muhammad@gymapp.com', // also accepts 'muhammad' and 'admin' for login
    password: '123',
    role: 'admin',
    createdAt: '2026-01-01T08:00:00Z',
    avatarSeed: 'muhammad',
    stage: 'Premium',
  },
  {
    id: 'user-athlete-alex',
    name: 'Alex (Athlete)',
    email: 'alex@gymapp.com', // sample athlete member for 1-click user testing
    password: '123',
    role: 'user',
    createdAt: '2026-01-02T08:00:00Z',
    avatarSeed: 'alex',
    stage: 'Normal',
  },
];

export const DEFAULT_STAGE_REQUESTS: StageRequest[] = [];


export const DEFAULT_VIDEOS: WorkoutVideo[] = [
  {
    id: 'vid-chest-1',
    title: 'Incline Dumbbell Bench Press for Upper Chest Growth',
    muscleGroup: 'Chest',
    category: 'Hypertrophy',
    duration: '12:00',
    durationMinutes: 12,
    deviceVideoId: 'default-vid-chest-1',
    deviceFileName: 'incline_dumbbell_press.mp4',
    deviceFileSizeMb: 14.2,
    description: 'Master the proper bench angle, scapular retraction, and elbow path to maximize clavicular pectoral fiber recruitment without impinging shoulder tendons.',
    tips: [
      'Set the incline angle to 30 degrees (no higher to avoid front delt dominance)',
      'Keep your shoulder blades retracted and depressed against the pad throughout the movement',
      'Lower under control for 3 seconds, feeling a deep stretch across the upper chest',
      'Press up along a slight inward arc, stopping just short of clicking the dumbbells'
    ],
    difficulty: 'Intermediate',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-02-20T09:00:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Normal', // Stage 1 (1 real)
    equipment: 'Incline Bench & Dumbbells',
    rpe: 8,
  },
  {
    id: 'vid-back-1',
    title: 'Lat Pulldown Execution & Mind-Muscle Connection',
    muscleGroup: 'Back',
    category: 'Strength',
    duration: '10:00',
    durationMinutes: 10,
    deviceVideoId: 'default-vid-back-1',
    deviceFileName: 'lat_pulldown_form.mp4',
    deviceFileSizeMb: 11.5,
    description: 'Learn the difference between pulling with your arms versus engaging the lats from the stretch position. Includes grip variations and torso lean cues.',
    tips: [
      'Initiate every repetition by pulling your scapulae down before bending your elbows',
      'Drive your elbows directly down into your back pockets, not backward',
      'Maintain a slight 10-15 degree thoracic extension; avoid excessive swinging',
      'Pause for 1 full second at the chest before slowly releasing back to full stretch'
    ],
    difficulty: 'Beginner',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-02-22T11:30:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Normal', // Stage 1 (1 real)
    equipment: 'Lat Pulldown Cable Machine',
    rpe: 7,
  },
  {
    id: 'vid-legs-1',
    title: 'Barbell Back Squat: Depth, Stance & Core Bracing',
    muscleGroup: 'Legs',
    category: 'Strength',
    duration: '18:30',
    durationMinutes: 18,
    deviceVideoId: 'default-vid-legs-1',
    deviceFileName: 'barbell_back_squat.mp4',
    deviceFileSizeMb: 22.8,
    description: 'A comprehensive walkthrough of foot root, diaphragmatic 360-degree bracing, hip hinge mechanics, and achieving consistent parallel depth safely.',
    tips: [
      'Take a deep belly breath and brace your core against your weight belt (Valsalva maneuver)',
      'Root your feet into the floor using the tripod concept (big toe, pinky toe, heel)',
      'Open your knees in the direction of your toes as you descend',
      'Drive through the mid-foot while keeping the bar path completely vertical'
    ],
    difficulty: 'Advanced',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-02-24T08:45:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Extra', // Stage 2 (3 tier)
    equipment: 'Squat Rack & Olympic Barbell',
    rpe: 9,
  },
  {
    id: 'vid-shoulders-1',
    title: 'Standing Overhead Barbell Press Technique Guide',
    muscleGroup: 'Shoulders',
    category: 'Strength',
    duration: '14:15',
    durationMinutes: 14,
    deviceVideoId: 'default-vid-shoulders-1',
    deviceFileName: 'overhead_press_guide.mp4',
    deviceFileSizeMb: 16.0,
    description: 'The king of shoulder mass movements. Learn bar path clearance around your chin, glute and quad stabilization, and safe overhead lockout position.',
    tips: [
      'Squeeze your glutes and quads hard to create a solid immovable base',
      'Keep your forearms perpendicular to the barbell in the bottom rack position',
      'Pull your chin back slightly as the bar passes, then push your head forward under the bar at lockout',
      'Shrug shoulders slightly upward at the top to clear the subacromial space'
    ],
    difficulty: 'Intermediate',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-02-26T14:00:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Extra', // Stage 2 (3 tier)
    equipment: 'Barbell & Lifting Belt',
    rpe: 8,
  },
  {
    id: 'vid-arms-1',
    title: 'Biceps Cable Curl: Peak Contraction & Constant Tension',
    muscleGroup: 'Arms',
    category: 'Hypertrophy',
    duration: '08:45',
    durationMinutes: 8,
    deviceVideoId: 'default-vid-arms-1',
    deviceFileName: 'biceps_cable_curls.mp4',
    deviceFileSizeMb: 9.7,
    description: 'Why cables outperform dumbbells for hypertrophy: keeping continuous resistance through both the eccentric and contracted peaks of the elbow flexors.',
    tips: [
      'Pin your elbows tight by your ribcage; do not let them drift forward during the curl',
      'Actively supinate your wrists at the top to recruit the biceps short head',
      'Avoid swinging or using hip momentum—treat the elbow as a strict hinge',
      'Take 3 seconds to lower the weight to complete extension for maximum micro-trauma'
    ],
    difficulty: 'Beginner',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-02-27T10:15:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Normal', // Stage 1 (1 real)
    equipment: 'Cable Pulley & Straight Bar',
    rpe: 8,
  },
  {
    id: 'vid-abs-1',
    title: 'Hanging Leg & Knee Raises for Lower Abdominal Hypertrophy',
    muscleGroup: 'Abs',
    category: 'HIIT',
    duration: '09:30',
    durationMinutes: 9,
    deviceVideoId: 'default-vid-abs-1',
    deviceFileName: 'hanging_leg_raises.mp4',
    deviceFileSizeMb: 10.4,
    description: 'Stop swinging your legs and engaging your hip flexors! Learn how posterior pelvic tilt activates the rectus abdominis for deep core development.',
    tips: [
      'Do not just lift your thighs—curl your pelvis upward toward your sternum',
      'Hang from a stable dead-hang or active scapular position without swaying',
      'Exhale completely as you curl the pelvis and hold the peak crunch for 1 second',
      'Control the descent to avoid swinging into the next repetition'
    ],
    difficulty: 'Intermediate',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-02-28T16:20:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Premium', // Stage 3 (5 real)
    equipment: 'Pull-up Bar',
    rpe: 8,
  },
  {
    id: 'vid-cardio-1',
    title: 'High-Intensity Metabolic Sprint & Agility Conditioning',
    muscleGroup: 'Cardio/Full Body',
    category: 'Cardio',
    duration: '15:00',
    durationMinutes: 15,
    deviceVideoId: 'default-vid-cardio-1',
    deviceFileName: 'metabolic_conditioning.mp4',
    deviceFileSizeMb: 18.0,
    description: 'Full body athletic interval conditioning combining sprint intervals, explosive box jumps, and kettlebell swings for VO2 max development.',
    tips: [
      'Maintain maximum explosive output for 40 seconds, then active recovery for 20 seconds',
      'Land softly with bent knees during box jumps to dissipate joint impact',
      'Breathe rhythmically in through the nose and out through the mouth'
    ],
    difficulty: 'Intermediate',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-03-01T12:00:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Normal',
    equipment: 'Kettlebells & Plyo Box',
    rpe: 9,
  },
  {
    id: 'vid-mobility-1',
    title: 'Full Body Joint Mobility & Thoracic Spine Decompression',
    muscleGroup: 'Cardio/Full Body',
    category: 'Mobility/Flexibility',
    duration: '12:00',
    durationMinutes: 12,
    deviceVideoId: 'default-vid-mobility-1',
    deviceFileName: 'thoracic_mobility_routine.mp4',
    deviceFileSizeMb: 13.5,
    description: 'Essential pre-lift or recovery flow targeting hip internal rotation, ankle dorsiflexion, and thoracic extension to prevent heavy lifting injuries.',
    tips: [
      'Never force a range of motion into sharp joint pinch',
      'Sink deeper into each stretch on a long, slow 5-second exhalation',
      'Perform before heavy squatting or pressing days'
    ],
    difficulty: 'Beginner',
    addedBy: 'Muhammad (Admin)',
    addedAt: '2026-03-02T07:30:00Z',
    trainerName: 'Muhammad',
    requiredStage: 'Normal',
    equipment: 'Yoga Mat & Foam Roller',
    rpe: 5,
  },
];

/**
 * Storage safe wrapper with error handling
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

export function safeSetItem<T>(key: string, value: T): { success: boolean; error?: string } {
  try {
    const stringified = JSON.stringify(value);
    localStorage.setItem(key, stringified);
    return { success: true };
  } catch (error: any) {
    console.error(`Error writing ${key} to localStorage:`, error);
    const isQuota = error && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    );
    return {
      success: false,
      error: isQuota
        ? 'Browser storage quota exceeded. Please remove some items or reset storage.'
        : 'Failed to write data to browser storage.',
    };
  }
}

export function getStoredUsers(): User[] {
  let users = safeGetItem<User[]>(STORAGE_KEYS.USERS, []);
  if (!users || users.length === 0) {
    safeSetItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return DEFAULT_USERS;
  }

  let needsSave = false;
  // Purge legacy demo users (user-regular-1, user-regular-2, Alex Vance, Sarah Connor from initial seed)
  const purged = users.filter(u => u.id !== 'user-regular-1' && u.id !== 'user-regular-2');
  if (purged.length !== users.length) {
    users = purged;
    needsSave = true;
  }

  // Migrate any legacy @gymhub.com emails to @gymapp.com
  users = users.map(u => {
    if (u.email && u.email.includes('@gymhub.com')) {
      needsSave = true;
      return { ...u, email: u.email.replace('@gymhub.com', '@gymapp.com') };
    }
    return u;
  });

  // Ensure default admin Muhammad always exists as the primary administrator
  const hasMuhammad = users.some(u => 
    u.id === 'user-admin-muhammad' || 
    u.email.toLowerCase() === 'muhammad' || 
    u.email.toLowerCase() === 'muhammad@gymapp.com' ||
    (u.role === 'admin' && u.name.includes('Muhammad'))
  );
  if (!hasMuhammad) {
    users = [DEFAULT_USERS[0], ...users];
    needsSave = true;
  }

  if (needsSave) {
    safeSetItem(STORAGE_KEYS.USERS, users);
  }
  return users;
}

/**
 * Delete all athlete members, preserving only Admin (Muhammad)
 */
export function deleteAllAthletes(): { success: boolean; deletedCount: number; remainingUsers: User[] } {
  const current = getStoredUsers();
  const kept = current.filter(u => u.role === 'admin' || u.id === 'user-admin-muhammad' || u.name.includes('Muhammad') || u.email === 'muhammad@gymapp.com');
  const deletedCount = current.length - kept.length;
  const finalUsers = kept.length > 0 ? kept : DEFAULT_USERS;
  safeSetItem(STORAGE_KEYS.USERS, finalUsers);
  // Clear stage requests and progress photos associated with deleted athletes
  safeSetItem(STORAGE_KEYS.STAGE_REQUESTS, []);
  safeSetItem(STORAGE_KEYS.PROGRESS_PHOTOS, []);
  return { success: true, deletedCount, remainingUsers: finalUsers };
}

/**
 * Update a user's password with verification.
 * Persists the new password to STORAGE_KEYS.USERS and active session.
 */
export function updateUserPassword(
  userId: string,
  newPassword: string,
  currentPasswordAttempt?: string,
  verifyCurrent: boolean = true
): { success: boolean; user?: User; error?: string } {
  const cleanNew = newPassword.trim();
  if (!cleanNew || cleanNew.length < 3) {
    return { success: false, error: 'New password must be at least 3 characters long.' };
  }

  const users = getStoredUsers();
  const user = users.find(u => u.id === userId || (userId === 'user-admin-muhammad' && u.role === 'admin') || (u.role === 'admin' && u.name.includes('Muhammad')));
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  if (verifyCurrent && currentPasswordAttempt !== undefined) {
    if (user.password !== currentPasswordAttempt.trim()) {
      return { success: false, error: 'Current password is incorrect. Please check and try again.' };
    }
  }

  if (user.password === cleanNew) {
    return { success: false, error: 'New password cannot be identical to the current password.' };
  }

  user.password = cleanNew;
  const saveRes = saveUsers(users);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error || 'Failed to persist new password.' };
  }

  // Update current session if matching active user
  const session = getCurrentSession();
  if (session && (session.id === user.id || (session.role === 'admin' && user.role === 'admin'))) {
    session.password = cleanNew;
    saveCurrentSession(session);
  }

  return { success: true, user };
}

export function saveUsers(users: User[]): { success: boolean; error?: string } {
  return safeSetItem(STORAGE_KEYS.USERS, users);
}

export function getStoredVideos(): WorkoutVideo[] {
  const videos = safeGetItem<WorkoutVideo[]>(STORAGE_KEYS.VIDEOS, []);
  if (!videos || videos.length === 0) {
    safeSetItem(STORAGE_KEYS.VIDEOS, DEFAULT_VIDEOS);
    return DEFAULT_VIDEOS;
  }
  // Sanitize videos: Ensure 100% device-only format without legacy fields, and ensure category exists
  let needsSave = false;
  const cleaned = videos.map(v => {
    const raw: any = { ...v };
    if ('youtubeUrl' in raw || 'youtubeId' in raw || 'sourceType' in raw) {
      delete raw.youtubeUrl;
      delete raw.youtubeId;
      delete raw.sourceType;
      needsSave = true;
    }
    if (!raw.deviceVideoId) {
      raw.deviceVideoId = `device-${raw.id}`;
      needsSave = true;
    }
    if (!raw.category) {
      if (raw.muscleGroup === 'Abs') raw.category = 'HIIT';
      else if (raw.muscleGroup === 'Cardio/Full Body') raw.category = 'Cardio';
      else if (raw.muscleGroup === 'Legs' || raw.muscleGroup === 'Back') raw.category = 'Strength';
      else raw.category = 'Hypertrophy';
      needsSave = true;
    }
    return raw as WorkoutVideo;
  });

  if (needsSave) {
    safeSetItem(STORAGE_KEYS.VIDEOS, cleaned);
  }
  return cleaned;
}

export function saveVideos(videos: WorkoutVideo[]): { success: boolean; error?: string } {
  return safeSetItem(STORAGE_KEYS.VIDEOS, videos);
}

export function getStoredStageRequests(): StageRequest[] {
  const reqs = safeGetItem<StageRequest[]>(STORAGE_KEYS.STAGE_REQUESTS, []);
  if (!reqs || reqs.length === 0) {
    safeSetItem(STORAGE_KEYS.STAGE_REQUESTS, DEFAULT_STAGE_REQUESTS);
    return DEFAULT_STAGE_REQUESTS;
  }
  return reqs;
}

export function saveStageRequests(requests: StageRequest[]): { success: boolean; error?: string } {
  return safeSetItem(STORAGE_KEYS.STAGE_REQUESTS, requests);
}

export function submitStageRequest(
  userId: string,
  userName: string,
  userEmail: string,
  currentStage: MembershipStage,
  requestedStage: MembershipStage,
  note?: string
): { success: boolean; request?: StageRequest; error?: string } {
  if (currentStage === requestedStage) {
    return { success: false, error: `You are already enrolled in the ${requestedStage} stage.` };
  }

  const existingRequests = getStoredStageRequests();
  // Check if an existing pending request for this user and stage exists
  const hasPending = existingRequests.some(r => r.userId === userId && r.status === 'pending');
  if (hasPending) {
    return { success: false, error: 'You already have a pending stage request awaiting Muhammad\'s review.' };
  }

  const newReq: StageRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userName,
    userEmail,
    currentStage,
    requestedStage,
    note: note?.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updated = [newReq, ...existingRequests];
  const saveRes = saveStageRequests(updated);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
  }
  return { success: true, request: newReq };
}

export function resolveStageRequest(
  requestId: string,
  status: 'accepted' | 'rejected',
  adminName: string = 'Muhammad'
): { success: boolean; error?: string; updatedUser?: User } {
  const requests = getStoredStageRequests();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) {
    return { success: false, error: 'Request not found.' };
  }

  const targetReq = requests[reqIndex];
  targetReq.status = status;
  targetReq.resolvedAt = new Date().toISOString();
  targetReq.resolvedBy = adminName;

  saveStageRequests(requests);

  let updatedUser: User | undefined;
  if (status === 'accepted') {
    // Upgrade the user's active stage
    const users = getStoredUsers();
    const userToUpdate = users.find(u => u.id === targetReq.userId);
    if (userToUpdate) {
      userToUpdate.stage = targetReq.requestedStage;
      saveUsers(users);
      updatedUser = userToUpdate;

      // Update active session if it's the same user
      const session = getCurrentSession();
      if (session && session.id === userToUpdate.id) {
        session.stage = targetReq.requestedStage;
        saveCurrentSession(session);
      }
    }
  }

  return { success: true, updatedUser };
}

export function getCompletedWorkouts(userId: string): string[] {
  if (!userId) return [];
  const allCompleted = safeGetItem<Record<string, string[]>>(STORAGE_KEYS.COMPLETED, {});
  return allCompleted[userId] || [];
}

export interface DailyCompletion {
  date: string;
  dayLabel: string;
  displayDate: string;
  dateStr: string;
  completedCount: number;
}

export function get7DayCompletionHistory(userId: string): DailyCompletion[] {
  if (!userId) return [];
  const historyStore = safeGetItem<Record<string, Record<string, string[]>>>(STORAGE_KEYS.COMPLETION_HISTORY, {});
  const userHistory = historyStore[userId] || {};
  const currentCompleted = getCompletedWorkouts(userId);

  // Generate 7 days ending today
  const result: DailyCompletion[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let count = (userHistory[dateKey] || []).length;

    // Fallback seed for demo users with completed workouts if history hasn't been populated
    if (count === 0 && currentCompleted.length > 0 && Object.keys(userHistory).length === 0) {
      if (i === 0) count = 1;
      else if (i === 2) count = Math.min(2, currentCompleted.length);
      else if (i === 4) count = 1;
    }

    result.push({
      date: dateKey,
      dayLabel,
      displayDate,
      dateStr: displayDate,
      completedCount: count,
    });
  }

  return result;
}

export function toggleWorkoutCompleted(userId: string, videoId: string): string[] {
  if (!userId || !videoId) return [];
  const allCompleted = safeGetItem<Record<string, string[]>>(STORAGE_KEYS.COMPLETED, {});
  const userList = allCompleted[userId] || [];
  const exists = userList.includes(videoId);
  const updated = exists ? userList.filter(id => id !== videoId) : [...userList, videoId];
  allCompleted[userId] = updated;
  safeSetItem(STORAGE_KEYS.COMPLETED, allCompleted);

  // Update daily completion history
  const historyStore = safeGetItem<Record<string, Record<string, string[]>>>(STORAGE_KEYS.COMPLETION_HISTORY, {});
  const userHistory = historyStore[userId] || {};
  const todayKey = new Date().toISOString().split('T')[0];
  const todayList = userHistory[todayKey] || [];

  if (!exists) {
    // Marked as complete
    if (!todayList.includes(videoId)) {
      userHistory[todayKey] = [...todayList, videoId];
    }
  } else {
    // Unmarked - remove from all days in history
    for (const dKey of Object.keys(userHistory)) {
      userHistory[dKey] = userHistory[dKey].filter(id => id !== videoId);
    }
  }
  historyStore[userId] = userHistory;
  safeSetItem(STORAGE_KEYS.COMPLETION_HISTORY, historyStore);

  return updated;
}

/**
 * Recently Watched: Retrieves the last opened workout video IDs for an athlete (up to 3)
 */
export function getRecentlyWatched(userId: string): string[] {
  if (!userId) return [];
  const allRecent = safeGetItem<Record<string, string[]>>(STORAGE_KEYS.RECENTLY_WATCHED, {});
  return allRecent[userId] || [];
}

/**
 * Record a video as recently opened. Moves it to the front, deduplicates, and caps at 3 items.
 */
export function recordRecentlyWatched(userId: string, videoId: string): string[] {
  if (!userId || !videoId) return [];
  const allRecent = safeGetItem<Record<string, string[]>>(STORAGE_KEYS.RECENTLY_WATCHED, {});
  const currentList = allRecent[userId] || [];
  // Place newly opened video at the beginning and remove duplicates
  const filtered = currentList.filter(id => id !== videoId);
  const updated = [videoId, ...filtered].slice(0, 3);
  allRecent[userId] = updated;
  safeSetItem(STORAGE_KEYS.RECENTLY_WATCHED, allRecent);
  return updated;
}

export function getUserProgress(userId: string, totalVideosCount: number): { completedCount: number; totalCount: number; percentage: number } {
  const completed = getCompletedWorkouts(userId);
  const completedCount = completed.length;
  const totalCount = Math.max(totalVideosCount, 1);
  const percentage = Math.min(100, Math.round((completedCount / totalCount) * 100));
  return { completedCount, totalCount: totalVideosCount, percentage };
}

export function getCurrentSession(): User | null {
  return safeGetItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function saveCurrentSession(user: User | null): void {
  if (user) {
    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      avatarSeed: user.avatarSeed,
      stage: user.stage || 'Normal',
      workoutNotes: user.workoutNotes || {},
      dailyCalorieGoal: user.dailyCalorieGoal,
    };
    safeSetItem(STORAGE_KEYS.CURRENT_USER, safeUser);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {
      console.error('Failed to clear current session:', e);
    }
  }
}

/**
 * Save athlete personal workout note for a specific workout video
 */
export function saveUserWorkoutNote(
  userId: string,
  videoId: string,
  note: string
): { success: boolean; user?: User; error?: string } {
  if (!userId || !videoId) {
    return { success: false, error: 'User ID and Video ID are required.' };
  }

  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'User not found in storage.' };
  }

  const notes = { ...(user.workoutNotes || {}) };
  const trimmed = note.trim();
  if (trimmed) {
    notes[videoId] = trimmed;
  } else {
    delete notes[videoId];
  }
  user.workoutNotes = notes;

  const saveRes = saveUsers(users);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
  }

  // Update current session if matching user
  const session = getCurrentSession();
  if (session && session.id === userId) {
    session.workoutNotes = notes;
    saveCurrentSession(session);
  }

  return { success: true, user };
}

/**
 * Get athlete personal note for a specific workout video
 */
export function getUserWorkoutNote(userId: string, videoId: string): string {
  if (!userId || !videoId) return '';
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  return user?.workoutNotes?.[videoId] || '';
}

export function authenticateUser(identifier: string, passwordAttempt: string): { user: User | null; message: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordAttempt.trim();

  if (!cleanId || !cleanPass) {
    return { user: null, message: 'Please enter both username/email and password.' };
  }

  const users = getStoredUsers();
  const match = users.find(u => {
    const userEmail = u.email.toLowerCase();
    // Allow matching Muhammad as Admin with username or email
    const isMuhammad = (cleanId === 'muhammad' || cleanId === 'muhammad@gymapp.com') && 
                       (u.email.toLowerCase().includes('muhammad') || u.name.toLowerCase().includes('muhammad') || u.role === 'admin');
    const isAdminAlias = (cleanId === 'admin' || cleanId === 'admin@gymapp.com') && u.role === 'admin';
    return userEmail === cleanId || isMuhammad || isAdminAlias;
  });

  if (!match) {
    return { user: null, message: 'Account not found. Check credentials or request an account from Muhammad.' };
  }

  if (match.password !== cleanPass) {
    return { user: null, message: 'Incorrect password. Please try again.' };
  }

  return { user: match, message: 'Authentication successful.' };
}

/**
 * User Creation: Any account made by Muhammad or the system is saved as a Normal user.
 */
export function createUser(newUser: { 
  name: string; 
  email: string; 
  password?: string; 
  role?: 'admin' | 'user';
  stage?: MembershipStage;
}): { success: boolean; user?: User; error?: string } {
  const name = newUser.name.trim();
  const email = newUser.email.trim().toLowerCase();
  const password = newUser.password ? newUser.password.trim() : 'user123';
  // Built-in rule: Any account made by Muhammad will also be saved as a normal user unless explicitly requested otherwise
  const role = newUser.role || 'user';
  const stage = newUser.stage || 'Normal'; // defaults to Normal (1 real)

  if (!name) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!email) {
    return { success: false, error: 'Email/Username is required.' };
  }
  if (!password || password.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters long.' };
  }

  const users = getStoredUsers();
  if (users.some(u => u.email.toLowerCase() === email)) {
    return { success: false, error: 'An account with this email/username already exists.' };
  }

  const created: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name,
    email,
    password,
    role,
    stage,
    createdAt: new Date().toISOString(),
    avatarSeed: name.toLowerCase().replace(/\s+/g, '-'),
  };

  const updatedUsers = [...users, created];
  const saveResult = saveUsers(updatedUsers);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error };
  }

  return { success: true, user: created };
}

export function deleteUserAccount(userId: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const target = users.find(u => u.id === userId);
  if (!target) {
    return { success: false, error: 'User not found.' };
  }
  if (target.email === 'muhammad' || target.id === 'user-admin-muhammad' || (target.role === 'admin' && target.name.includes('Muhammad'))) {
    return { success: false, error: 'The primary Admin account (Muhammad) cannot be deleted.' };
  }
  const filtered = users.filter(u => u.id !== userId);
  return saveUsers(filtered);
}

export function addWorkoutVideo(newVideo: {
  title: string;
  muscleGroup: Exclude<WorkoutVideo['muscleGroup'], 'All'>;
  category?: WorkoutCategory;
  duration?: string;
  durationMinutes?: number;
  deviceVideoId?: string;
  deviceFileName?: string;
  deviceFileSizeMb?: number;
  description: string;
  tips: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  trainerName?: string;
  requiredStage?: MembershipStage;
  equipment?: string;
  rpe?: number;
}): { success: boolean; video?: WorkoutVideo; error?: string } {
  const title = newVideo.title.trim();
  const description = newVideo.description.trim();

  if (!title) return { success: false, error: 'Workout title is required.' };
  if (!description) return { success: false, error: 'Description is required.' };
  if (!newVideo.deviceVideoId) {
    return { success: false, error: 'Please choose or record a video file (MP4/WebM) from your device.' };
  }

  // Calculate or normalize duration
  let durationStr = (newVideo.duration || '').trim();
  let durationMins = Number(newVideo.durationMinutes) || 0;

  if (!durationStr && durationMins > 0) {
    durationStr = `${durationMins}:00`;
  } else if (durationStr && !durationMins) {
    if (durationStr.includes(':')) {
      const parts = durationStr.split(':');
      durationMins = Math.max(1, Math.round(Number(parts[0]) + (Number(parts[1] || 0) / 60)));
    } else {
      durationMins = Math.max(1, parseInt(durationStr, 10) || 10);
    }
  } else if (!durationStr) {
    durationStr = '12:00';
    durationMins = 12;
  }

  const validTips = (newVideo.tips || [])
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const video: WorkoutVideo = {
    id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title,
    muscleGroup: newVideo.muscleGroup,
    category: newVideo.category || (newVideo.muscleGroup === 'Abs' ? 'HIIT' : newVideo.muscleGroup === 'Cardio/Full Body' ? 'Cardio' : 'Strength'),
    duration: durationStr,
    durationMinutes: durationMins,
    deviceVideoId: newVideo.deviceVideoId,
    deviceFileName: newVideo.deviceFileName,
    deviceFileSizeMb: newVideo.deviceFileSizeMb,
    description,
    tips: validTips.length > 0 ? validTips : ['Focus on strict technique and continuous muscle tension.'],
    difficulty: newVideo.difficulty || 'Intermediate',
    addedBy: newVideo.trainerName || 'Muhammad (Admin)',
    addedAt: new Date().toISOString(),
    trainerName: newVideo.trainerName || 'Muhammad',
    requiredStage: newVideo.requiredStage || 'Normal',
    equipment: newVideo.equipment?.trim() || 'Gym Equipment',
    rpe: newVideo.rpe ? Number(newVideo.rpe) : 8,
  };

  const currentVideos = getStoredVideos();
  const updated = [video, ...currentVideos];
  const saveResult = saveVideos(updated);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error };
  }
  return { success: true, video };
}

/**
 * Edit existing workout video
 */
export function updateWorkoutVideo(
  videoId: string,
  updatedFields: Partial<Omit<WorkoutVideo, 'id' | 'addedAt'>>
): { success: boolean; video?: WorkoutVideo; error?: string } {
  const currentVideos = getStoredVideos();
  const index = currentVideos.findIndex(v => v.id === videoId);
  if (index === -1) {
    return { success: false, error: 'Video not found.' };
  }

  const existing = currentVideos[index];
  const merged: WorkoutVideo = {
    ...existing,
    ...updatedFields,
    duration: updatedFields.duration || existing.duration || `${updatedFields.durationMinutes || existing.durationMinutes}:00`,
  };

  currentVideos[index] = merged;
  const saveRes = saveVideos(currentVideos);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
  }
  return { success: true, video: merged };
}

export function deleteWorkoutVideo(videoId: string): { success: boolean; error?: string } {
  const videos = getStoredVideos();
  const filtered = videos.filter(v => v.id !== videoId);
  return saveVideos(filtered);
}

export function calculateStorageStats(): StorageStats {
  let totalBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2;
      }
    }
  } catch (e) {
    console.error('Failed to calculate storage size:', e);
  }

  const usedKb = Math.round((totalBytes / 1024) * 10) / 10;
  const maxStorageEstMb = 5;
  const isNearLimit = totalBytes > (maxStorageEstMb * 1024 * 1024 * 0.8);

  return {
    usedBytes: totalBytes,
    usedKb,
    maxStorageEstMb,
    isNearLimit,
  };
}

export function resetToDemoData(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(DEFAULT_VIDEOS));
    localStorage.setItem(STORAGE_KEYS.STAGE_REQUESTS, JSON.stringify(DEFAULT_STAGE_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.RECENTLY_WATCHED, JSON.stringify({}));
  } catch (e) {
    console.error('Failed to reset storage:', e);
  }
}

export interface HubBackupPayload {
  version: string;
  exportedAt: string;
  source: string;
  users: User[];
  videos: WorkoutVideo[];
  stageRequests: StageRequest[];
  completedWorkouts: Record<string, string[]>;
  recentlyWatched: Record<string, string[]>;
}

export function exportGymAppDataAsJson(): string {
  const payload: HubBackupPayload = {
    version: '3.0',
    exportedAt: new Date().toISOString(),
    source: 'GYM App',
    users: getStoredUsers(),
    videos: getStoredVideos(),
    stageRequests: getStoredStageRequests(),
    completedWorkouts: (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })(),
    recentlyWatched: (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.RECENTLY_WATCHED);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })(),
  };

  return JSON.stringify(payload, null, 2);
}

export function exportHubDataAsJson(): string {
  return exportGymAppDataAsJson();
}

export function importHubDataFromJson(jsonStr: string): { 
  success: boolean; 
  error?: string; 
  counts?: { users: number; videos: number; requests: number } 
} {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<HubBackupPayload>;
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.videos)) {
      return { 
        success: false, 
        error: 'Invalid GYM App backup format. Must contain valid users and videos arrays.' 
      };
    }

    // Save users
    const userSave = saveUsers(parsed.users);
    if (!userSave.success) return { success: false, error: userSave.error };

    // Save videos
    const vidSave = saveVideos(parsed.videos);
    if (!vidSave.success) return { success: false, error: vidSave.error };

    // Save stage requests if present
    if (Array.isArray(parsed.stageRequests)) {
      saveStageRequests(parsed.stageRequests);
    }

    // Save completion and recently watched if present
    if (parsed.completedWorkouts && typeof parsed.completedWorkouts === 'object') {
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(parsed.completedWorkouts));
      } catch (e) {
        console.warn('Could not save completion logs during import:', e);
      }
    }

    if (parsed.recentlyWatched && typeof parsed.recentlyWatched === 'object') {
      try {
        localStorage.setItem(STORAGE_KEYS.RECENTLY_WATCHED, JSON.stringify(parsed.recentlyWatched));
      } catch (e) {
        console.warn('Could not save recently watched logs during import:', e);
      }
    }

    return {
      success: true,
      counts: {
        users: parsed.users.length,
        videos: parsed.videos.length,
        requests: Array.isArray(parsed.stageRequests) ? parsed.stageRequests.length : 0,
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Could not parse backup file: ${err.message || 'Unknown error'}`
    };
  }
}

/**
 * Update athlete Daily Calorie Goal (kcal)
 */
export function updateUserDailyCalorieGoal(
  userId: string,
  goal: number
): { success: boolean; user?: User; error?: string } {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }
  const cleanGoal = Math.round(Number(goal));
  if (isNaN(cleanGoal) || cleanGoal < 100 || cleanGoal > 10000) {
    return { success: false, error: 'Daily calorie goal must be between 100 and 10,000 kcal.' };
  }

  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  user.dailyCalorieGoal = cleanGoal;
  const saveRes = saveUsers(users);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
  }

  const session = getCurrentSession();
  if (session && session.id === userId) {
    session.dailyCalorieGoal = cleanGoal;
    saveCurrentSession(session);
  }

  return { success: true, user };
}

// Progress photos check-in storage
export const DEFAULT_PROGRESS_PHOTOS: ProgressPhotoCheckin[] = [];

export function getStoredProgressPhotos(userId?: string): ProgressPhotoCheckin[] {
  let list = safeGetItem<ProgressPhotoCheckin[]>(STORAGE_KEYS.PROGRESS_PHOTOS, []);
  if (!list) {
    safeSetItem(STORAGE_KEYS.PROGRESS_PHOTOS, []);
    list = [];
  }
  // Filter out check-ins from deleted demo users
  const purged = list.filter(p => p.userId !== 'user-regular-1' && p.userId !== 'user-regular-2');
  if (purged.length !== list.length) {
    list = purged;
    safeSetItem(STORAGE_KEYS.PROGRESS_PHOTOS, list);
  }
  if (userId) {
    return list.filter(p => p.userId === userId);
  }
  return list;
}

export function saveProgressPhotoCheckin(
  data: Omit<ProgressPhotoCheckin, 'id' | 'createdAt'>
): { success: boolean; checkin?: ProgressPhotoCheckin; error?: string } {
  if (!data.userId) {
    return { success: false, error: 'User ID is required.' };
  }
  if (!data.beforePhotoUrl && !data.afterPhotoUrl) {
    return { success: false, error: 'Please provide at least a before or after photo.' };
  }

  const existing = getStoredProgressPhotos();
  const newCheckin: ProgressPhotoCheckin = {
    ...data,
    id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newCheckin, ...existing];
  const saveRes = safeSetItem(STORAGE_KEYS.PROGRESS_PHOTOS, updated);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
  }
  return { success: true, checkin: newCheckin };
}

export function reviewProgressPhotoCheckin(
  id: string,
  assessment: ImprovementAssessment,
  feedbackText: string,
  coachName: string = 'Muhammad (Coach)'
): { success: boolean; checkin?: ProgressPhotoCheckin; error?: string } {
  const existing = getStoredProgressPhotos();
  const target = existing.find(p => p.id === id);
  if (!target) {
    return { success: false, error: 'Photo check-in not found.' };
  }

  target.adminFeedback = {
    coachName,
    reviewedAt: new Date().toISOString(),
    assessment,
    feedbackText: feedbackText.trim(),
  };

  const saveRes = safeSetItem(STORAGE_KEYS.PROGRESS_PHOTOS, existing);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error };
  }
  return { success: true, checkin: target };
}

export function deleteProgressPhotoCheckin(id: string): { success: boolean; error?: string } {
  const existing = getStoredProgressPhotos();
  const filtered = existing.filter(p => p.id !== id);
  const saveRes = safeSetItem(STORAGE_KEYS.PROGRESS_PHOTOS, filtered);
  return { success: saveRes.success, error: saveRes.error };
}

// ==========================================
// NUTRITION & MACRO-NUTRIENTS TRACKING
// ==========================================

export const DEFAULT_NUTRITION_GOALS = {
  waterGoalMl: 3000, // 3 Liters / ~100 fl oz
  proteinGoalGrams: 160, // 160g
  carbsGoalGrams: 220, // 220g
  fatsGoalGrams: 65, // 65g
};

export function getStoredNutritionLogs(): DailyNutritionLog[] {
  const stored = safeGetItem<DailyNutritionLog[]>(STORAGE_KEYS.NUTRITION_LOGS, []);
  return Array.isArray(stored) ? stored : [];
}

export function getNutritionLog(userId: string, date: string): DailyNutritionLog {
  const logs = getStoredNutritionLogs();
  const found = logs.find(l => l.userId === userId && l.date === date);
  if (found) {
    return {
      ...found,
      waterGoalMl: found.waterGoalMl || DEFAULT_NUTRITION_GOALS.waterGoalMl,
      proteinGoalGrams: found.proteinGoalGrams || DEFAULT_NUTRITION_GOALS.proteinGoalGrams,
      carbsGoalGrams: found.carbsGoalGrams || DEFAULT_NUTRITION_GOALS.carbsGoalGrams,
      fatsGoalGrams: found.fatsGoalGrams || DEFAULT_NUTRITION_GOALS.fatsGoalGrams,
    };
  }

  // Generate blank template for this date
  return {
    id: `nutrition-${userId}-${date}`,
    userId,
    date,
    waterMl: 0,
    waterGoalMl: DEFAULT_NUTRITION_GOALS.waterGoalMl,
    proteinGrams: 0,
    proteinGoalGrams: DEFAULT_NUTRITION_GOALS.proteinGoalGrams,
    carbsGrams: 0,
    carbsGoalGrams: DEFAULT_NUTRITION_GOALS.carbsGoalGrams,
    fatsGrams: 0,
    fatsGoalGrams: DEFAULT_NUTRITION_GOALS.fatsGoalGrams,
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

export function saveNutritionLog(log: DailyNutritionLog): { success: boolean; log: DailyNutritionLog; error?: string } {
  const logs = getStoredNutritionLogs();
  const index = logs.findIndex(l => l.id === log.id || (l.userId === log.userId && l.date === log.date));
  
  const updatedLog: DailyNutritionLog = {
    ...log,
    waterMl: Math.max(0, Math.round(Number(log.waterMl) || 0)),
    waterGoalMl: Math.max(500, Math.round(Number(log.waterGoalMl) || DEFAULT_NUTRITION_GOALS.waterGoalMl)),
    proteinGrams: Math.max(0, Math.round(Number(log.proteinGrams) || 0)),
    proteinGoalGrams: Math.max(20, Math.round(Number(log.proteinGoalGrams) || DEFAULT_NUTRITION_GOALS.proteinGoalGrams)),
    carbsGrams: Math.max(0, Math.round(Number(log.carbsGrams) || 0)),
    carbsGoalGrams: Math.max(20, Math.round(Number(log.carbsGoalGrams) || DEFAULT_NUTRITION_GOALS.carbsGoalGrams)),
    fatsGrams: Math.max(0, Math.round(Number(log.fatsGrams) || 0)),
    fatsGoalGrams: Math.max(10, Math.round(Number(log.fatsGoalGrams) || DEFAULT_NUTRITION_GOALS.fatsGoalGrams)),
    updatedAt: new Date().toISOString(),
  };

  let newLogs: DailyNutritionLog[];
  if (index >= 0) {
    newLogs = [...logs];
    newLogs[index] = updatedLog;
  } else {
    newLogs = [updatedLog, ...logs];
  }

  const saveRes = safeSetItem(STORAGE_KEYS.NUTRITION_LOGS, newLogs);
  if (!saveRes.success) {
    return { success: false, log: updatedLog, error: saveRes.error };
  }
  return { success: true, log: updatedLog };
}

export function getNutritionHistory(userId: string, countDays = 7): DailyNutritionLog[] {
  const result: DailyNutritionLog[] = [];
  const today = new Date();

  for (let i = countDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push(getNutritionLog(userId, dateStr));
  }
  return result;
}


