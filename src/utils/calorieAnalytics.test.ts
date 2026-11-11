import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkoutVideo, User } from '../types/workout';

// Mock localStorage for Node test runner
const memoryStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, val: string) => { memoryStorage[key] = val; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); },
};

import { calculateVideoCalories, getUserCalorieAnalytics, getAdminGymAnalytics } from './calorieAnalytics';

test('calculateVideoCalories returns targetCalories if defined or calculates by duration & stage', () => {
  const customVideo: WorkoutVideo = {
    id: '1',
    title: 'Custom Bench',
    muscleGroup: 'Chest',
    description: 'Test',
    tips: ['Keep shoulder blades retracted'],
    duration: '20:00',
    durationMinutes: 20,
    targetCalories: 240,
    difficulty: 'Intermediate',
    addedBy: 'admin',
    addedAt: new Date().toISOString(),
    trainerName: 'Muhammad',
  };

  assert.equal(calculateVideoCalories(customVideo), 240);

  const autoVideo: WorkoutVideo = {
    id: '2',
    title: 'High Intensity HIIT',
    muscleGroup: 'Cardio/Full Body',
    description: 'Test',
    tips: ['Breathe evenly'],
    duration: '30 mins',
    durationMinutes: 30,
    difficulty: 'Advanced',
    addedBy: 'admin',
    addedAt: new Date().toISOString(),
    trainerName: 'Muhammad',
    rpe: 9,
  };

  const cals = calculateVideoCalories(autoVideo);
  assert.ok(cals > 150, `Expected estimated calories to be > 150, got ${cals}`);
});

test('getUserCalorieAnalytics computes 7-day history and day-over-day delta', () => {
  const sampleVideos: WorkoutVideo[] = [
    {
      id: 'v1',
      title: 'Dumbbell Incline Press',
      muscleGroup: 'Chest',
      description: 'Test',
      tips: ['Control descent'],
      duration: '15:00',
      durationMinutes: 15,
      targetCalories: 150,
      difficulty: 'Beginner',
      addedBy: 'admin',
      addedAt: new Date().toISOString(),
      trainerName: 'Muhammad',
    },
    {
      id: 'v2',
      title: 'Pull-up Progression',
      muscleGroup: 'Back',
      description: 'Test',
      tips: ['Full lockout'],
      duration: '20:00',
      durationMinutes: 20,
      targetCalories: 200,
      difficulty: 'Intermediate',
      addedBy: 'admin',
      addedAt: new Date().toISOString(),
      trainerName: 'Muhammad',
    }
  ];

  // Seed completed workout
  localStorage.setItem('gymapp_completed_workouts_v3_user_alex', JSON.stringify(['v1']));

  const analytics = getUserCalorieAnalytics('user_alex', sampleVideos, 'Normal');

  assert.equal(analytics.history.length, 7);
  assert.ok(typeof analytics.todayCalories === 'number');
  assert.ok(typeof analytics.dayOverDayDiff === 'number');
  assert.ok(typeof analytics.dayOverDayPercent === 'number');
  assert.ok(analytics.todayTarget > 0);
  assert.ok(analytics.targetProgressPercent >= 0);

  // Verify dedicated Session vs Previous Day Comparison Bar Chart structure
  assert.ok(analytics.sessionComparison);
  assert.equal(analytics.sessionComparison.comparisonBarData.length, 2);
  assert.equal(analytics.sessionComparison.comparisonBarData[0].displayName, 'Previous Day');
  assert.equal(analytics.sessionComparison.comparisonBarData[1].displayName, 'Current Session');
  assert.equal(analytics.sessionComparison.metricsList.length, 4);
  assert.ok(typeof analytics.sessionComparison.diffCalories === 'number');
});

test('getAdminGymAnalytics generates gym-wide totals and muscle breakdown', () => {
  const sampleUsers: User[] = [
    {
      id: 'u1',
      name: 'Alex Vance',
      email: 'alex@gymapp.com',
      role: 'user',
      stage: 'Normal',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u2',
      name: 'Sam Fisher',
      email: 'sam@gymapp.com',
      role: 'user',
      stage: 'Extra',
      createdAt: new Date().toISOString(),
    }
  ];

  const sampleVideos: WorkoutVideo[] = [
    {
      id: 'v1',
      title: 'Deadlift',
      muscleGroup: 'Back',
      description: 'Test',
      tips: ['Engage lats'],
      duration: '18:00',
      durationMinutes: 18,
      targetCalories: 210,
      difficulty: 'Advanced',
      addedBy: 'admin',
      addedAt: new Date().toISOString(),
      trainerName: 'Muhammad',
    },
    {
      id: 'v2',
      title: 'Leg Press',
      muscleGroup: 'Legs',
      description: 'Test',
      tips: ['Feet shoulder width'],
      duration: '22:00',
      durationMinutes: 22,
      targetCalories: 260,
      difficulty: 'Intermediate',
      addedBy: 'admin',
      addedAt: new Date().toISOString(),
      trainerName: 'Muhammad',
    }
  ];

  // Seed completions for users
  localStorage.setItem('gymapp_completed_workouts_v3_u1', JSON.stringify(['v1']));
  localStorage.setItem('gymapp_completed_workouts_v3_u2', JSON.stringify(['v1', 'v2']));

  const adminStats = getAdminGymAnalytics(sampleUsers, sampleVideos);

  assert.equal(adminStats.weeklyGymCalories.length, 7);
  assert.equal(adminStats.stageDistribution.length, 3);
  assert.ok(adminStats.muscleGroupDistribution.length > 0);
  assert.ok(adminStats.totalGymCaloriesBurned >= 0);
  assert.ok(typeof adminStats.gymDayOverDayDiff === 'number');
  assert.ok(typeof adminStats.gymDayOverDayPercent === 'number');
});
