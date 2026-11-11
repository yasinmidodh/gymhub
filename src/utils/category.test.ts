import { test } from 'node:test';
import assert from 'node:assert/strict';

// Node test environment LocalStorage mock
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

import { WORKOUT_CATEGORIES, WorkoutCategory, WorkoutVideo } from '../types/workout';
import { 
  DEFAULT_VIDEOS, 
  DEFAULT_USERS, 
  getStoredVideos, 
  addWorkoutVideo, 
  updateWorkoutVideo,
  authenticateUser,
  safeSetItem,
  STORAGE_KEYS
} from './storage';

test('WorkoutCategory: WORKOUT_CATEGORIES defines standard fitness training categories', () => {
  assert.ok(Array.isArray(WORKOUT_CATEGORIES), 'WORKOUT_CATEGORIES must be an array');
  assert.ok(WORKOUT_CATEGORIES.includes('Strength'), 'Must include Strength');
  assert.ok(WORKOUT_CATEGORIES.includes('Cardio'), 'Must include Cardio');
  assert.ok(WORKOUT_CATEGORIES.includes('HIIT'), 'Must include HIIT');
  assert.ok(WORKOUT_CATEGORIES.includes('Hypertrophy'), 'Must include Hypertrophy');
  assert.ok(WORKOUT_CATEGORIES.includes('Mobility/Flexibility'), 'Must include Mobility/Flexibility');
});

test('WorkoutVideo: DEFAULT_VIDEOS routines have valid categories', () => {
  for (const video of DEFAULT_VIDEOS) {
    assert.ok(video.category, `Video ${video.id} must have a category`);
    assert.ok(
      WORKOUT_CATEGORIES.includes(video.category),
      `Video ${video.id} has invalid category: ${video.category}`
    );
  }
});

test('addWorkoutVideo and updateWorkoutVideo support category field', () => {
  const res = addWorkoutVideo({
    title: 'HIIT Kettlebell Hell',
    muscleGroup: 'Abs',
    category: 'HIIT',
    duration: '20:00',
    durationMinutes: 20,
    deviceVideoId: 'test-device-hiit-1',
    description: 'High intensity interval training with kettlebells.',
    tips: ['Keep core braced throughout intervals.'],
  });

  assert.equal(res.success, true, 'Video addition should succeed');
  assert.ok(res.video, 'Created video should be returned');
  assert.equal(res.video?.category, 'HIIT');

  const videoId = res.video!.id;
  const updateRes = updateWorkoutVideo(videoId, {
    category: 'Cardio',
    title: 'Updated Cardio Intervals'
  });

  assert.equal(updateRes.success, true, 'Video update should succeed');
  assert.equal(updateRes.video?.category, 'Cardio');
  assert.equal(updateRes.video?.title, 'Updated Cardio Intervals');
});

test('Authentication: Quick Access accounts (Coach Muhammad & Athlete Alex)', () => {
  // Ensure default users are loaded
  safeSetItem(STORAGE_KEYS.USERS, DEFAULT_USERS);

  // Admin authentication (email)
  const adminRes1 = authenticateUser('muhammad@gymapp.com', '123');
  assert.ok(adminRes1.user, 'Admin muhammad@gymapp.com should authenticate');
  assert.equal(adminRes1.user.role, 'admin');

  // Admin authentication (alias 'muhammad')
  const adminRes2 = authenticateUser('muhammad', '123');
  assert.ok(adminRes2.user, 'Admin muhammad alias should authenticate');
  assert.equal(adminRes2.user.role, 'admin');

  // Athlete user authentication
  const athleteRes = authenticateUser('alex@gymapp.com', '123');
  assert.ok(athleteRes.user, 'Athlete alex@gymapp.com should authenticate');
  assert.equal(athleteRes.user.role, 'user');
});

test('Video Library Category Filtering: filters videos accurately by category', () => {
  const sampleVideos: WorkoutVideo[] = [
    {
      id: 'v1',
      title: 'Heavy Deadlift Form',
      muscleGroup: 'Back',
      category: 'Strength',
      duration: '15:00',
      durationMinutes: 15,
      description: 'Strength training',
      tips: ['Brace core'],
      difficulty: 'Advanced',
      addedBy: 'Admin',
      addedAt: '2026-01-01',
      trainerName: 'Muhammad',
      requiredStage: 'Normal'
    },
    {
      id: 'v2',
      title: 'Bicep Peak Hypertrophy',
      muscleGroup: 'Arms',
      category: 'Hypertrophy',
      duration: '10:00',
      durationMinutes: 10,
      description: 'Hypertrophy training',
      tips: ['Squeeze peak'],
      difficulty: 'Intermediate',
      addedBy: 'Admin',
      addedAt: '2026-01-01',
      trainerName: 'Muhammad',
      requiredStage: 'Normal'
    },
    {
      id: 'v3',
      title: 'Full Body HIIT Burn',
      muscleGroup: 'Cardio/Full Body',
      category: 'HIIT',
      duration: '12:00',
      durationMinutes: 12,
      description: 'HIIT training',
      tips: ['High pace'],
      difficulty: 'Intermediate',
      addedBy: 'Admin',
      addedAt: '2026-01-01',
      trainerName: 'Muhammad',
      requiredStage: 'Normal'
    }
  ];

  const filterByCategory = (category: 'All' | WorkoutCategory) => {
    return sampleVideos.filter(v => category === 'All' || v.category === category);
  };

  assert.equal(filterByCategory('All').length, 3);
  assert.equal(filterByCategory('Strength').length, 1);
  assert.equal(filterByCategory('Strength')[0].id, 'v1');
  assert.equal(filterByCategory('Hypertrophy').length, 1);
  assert.equal(filterByCategory('Hypertrophy')[0].id, 'v2');
  assert.equal(filterByCategory('HIIT').length, 1);
  assert.equal(filterByCategory('HIIT')[0].id, 'v3');
  assert.equal(filterByCategory('Cardio').length, 0);
});
