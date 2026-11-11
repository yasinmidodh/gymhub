export type UserRole = 'admin' | 'user';

export type MembershipStage = 'Normal' | 'Extra' | 'Premium';

export interface StageRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentStage: MembershipStage;
  requestedStage: MembershipStage;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  avatarSeed?: string;
  stage: MembershipStage; // 'Normal' (1) | 'Extra' (3) | 'Premium' (5)
  workoutNotes?: Record<string, string>; // Personal athlete notes for specific workout videoIds
  dailyCalorieGoal?: number; // User-defined daily calorie goal (kcal)
}

export interface DailyNutritionLog {
  id: string; // e.g. "nutrition-userId-YYYY-MM-DD"
  userId: string;
  date: string; // "YYYY-MM-DD"
  waterMl: number; // Water intake in milliliters
  waterGoalMl: number; // Daily water target in ml (e.g. 3000)
  proteinGrams: number; // Protein in grams
  proteinGoalGrams: number; // Daily protein target in grams (e.g. 160)
  carbsGrams: number; // Carbohydrates in grams
  carbsGoalGrams: number; // Daily carbs target in grams (e.g. 220)
  fatsGrams: number; // Healthy fats in grams
  fatsGoalGrams: number; // Daily fats target in grams (e.g. 65)
  notes?: string; // Optional meals or hydration notes
  updatedAt: string;
}

export type ImprovementAssessment = 
  | 'Significant Improvement'
  | 'Great Progress'
  | 'On Track'
  | 'Form Refinement Needed';

export interface ProgressPhotoCheckin {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  beforePhotoUrl?: string; // base64 or photo URL
  afterPhotoUrl?: string; // base64 or photo URL
  workoutDate: string;
  createdAt: string;
  userNote?: string;
  muscleFocus?: string;
  adminFeedback?: {
    coachName: string;
    reviewedAt: string;
    assessment: ImprovementAssessment;
    feedbackText: string;
  };
}

export type MuscleGroup = 
  | 'All'
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Abs'
  | 'Cardio/Full Body';

export type WorkoutCategory = 
  | 'Strength' 
  | 'Cardio' 
  | 'HIIT' 
  | 'Hypertrophy' 
  | 'Mobility/Flexibility';

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  'Strength',
  'Cardio',
  'HIIT',
  'Hypertrophy',
  'Mobility/Flexibility',
];

export interface WorkoutVideo {
  id: string;
  title: string;
  muscleGroup: Exclude<MuscleGroup, 'All'>;
  category?: WorkoutCategory; // Training category classification (e.g. Strength, Cardio, HIIT, Hypertrophy, Mobility)
  duration: string; // Video duration/length (e.g., "12:00", "15 mins", "18:45")
  durationMinutes: number; // Numeric minutes for calculations
  deviceVideoId?: string; // IndexedDB reference ID for device-uploaded video
  deviceFileName?: string; // Original file name from device
  deviceFileSizeMb?: number; // File size in MB
  videoBlobUrl?: string; // Active playback Object URL
  thumbnailUrl?: string; // Optional custom poster image
  description: string;
  tips: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  addedBy: string;
  addedAt: string;
  trainerName: string;
  requiredStage?: MembershipStage; // Minimum tier to access video (Normal, Extra, Premium)
  equipment?: string; // e.g. "Barbell", "Dumbbells", "Cables", "Bodyweight"
  rpe?: number; // Rate of Perceived Exertion (1-10)
  targetCalories?: number; // Estimated calories burned in this training session (kcal)
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

export interface StorageStats {
  usedBytes: number;
  usedKb: number;
  maxStorageEstMb: number;
  isNearLimit: boolean;
}

export const STAGE_CONFIG: Record<MembershipStage, { label: string; dailyQuota: number; badgeColor: string; description: string; realEquivalent: string }> = {
  Normal: {
    label: 'Normal',
    dailyQuota: 1,
    realEquivalent: '1 real',
    badgeColor: 'text-slate-300 border-slate-700 bg-slate-900',
    description: '1 Real Workout Tier — Foundation access',
  },
  Extra: {
    label: 'Extra',
    dailyQuota: 3,
    realEquivalent: '3 real',
    badgeColor: 'text-cyan-300 border-cyan-800 bg-cyan-950',
    description: '3 Workout Tiers — Intermediate athletic access',
  },
  Premium: {
    label: 'Premium',
    dailyQuota: 5,
    realEquivalent: '5 real',
    badgeColor: 'text-amber-300 border-amber-800 bg-amber-950',
    description: '5 Real Workout Tiers — Complete elite access',
  },
};

export function canAccessVideo(userStage: MembershipStage = 'Normal', videoRequiredStage: MembershipStage = 'Normal'): boolean {
  const ranks: Record<MembershipStage, number> = {
    Normal: 1,
    Extra: 2,
    Premium: 3,
  };
  return ranks[userStage] >= ranks[videoRequiredStage];
}

