import test from 'node:test';
import assert from 'node:assert/strict';

// In node environment, mock localStorage if absent
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

import { 
  DEFAULT_USERS, 
  DEFAULT_VIDEOS, 
  DEFAULT_STAGE_REQUESTS,
  getUserProgress,
  recordRecentlyWatched,
  getRecentlyWatched,
  exportGymAppDataAsJson,
  exportHubDataAsJson,
  importHubDataFromJson
} from './storage';
import { canAccessVideo } from '../types/workout';
import { getWorkoutThumbnail } from './media';

test('Native Device Workout Videos contain device identifiers and self-contained poster artwork', () => {
  for (const video of DEFAULT_VIDEOS) {
    assert.ok(video.deviceVideoId, `Video ${video.id} must have a valid deviceVideoId`);
    assert.ok(typeof video.deviceFileName === 'string' && video.deviceFileName.length > 0, `Video ${video.id} must have deviceFileName`);
    assert.ok(typeof video.duration === 'string' && video.duration.length > 0, `Video ${video.id} must have duration string`);

    // Verify SVG athletic thumbnail generator produces a valid data URI
    const poster = getWorkoutThumbnail(video.muscleGroup);
    assert.ok(poster.startsWith('data:image/svg+xml;utf8,'), 'Poster must be a valid self-contained SVG data URI');
  }
});

test('Muhammad is the built-in Admin account in GYM App', () => {
  const muhammad = DEFAULT_USERS.find(u => u.name.includes('Muhammad') || u.email.includes('muhammad'));
  assert.ok(muhammad, 'Muhammad must be built-in Admin');
  assert.equal(muhammad.role, 'admin');
  assert.equal(muhammad.password, '123');
});

test('Membership stage access rules (Normal: 1, Extra: 3, Premium: 5)', () => {
  // Normal tier user
  assert.equal(canAccessVideo('Normal', 'Normal'), true);
  assert.equal(canAccessVideo('Normal', 'Extra'), false);
  assert.equal(canAccessVideo('Normal', 'Premium'), false);

  // Extra tier user
  assert.equal(canAccessVideo('Extra', 'Normal'), true);
  assert.equal(canAccessVideo('Extra', 'Extra'), true);
  assert.equal(canAccessVideo('Extra', 'Premium'), false);

  // Premium tier user
  assert.equal(canAccessVideo('Premium', 'Normal'), true);
  assert.equal(canAccessVideo('Premium', 'Extra'), true);
  assert.equal(canAccessVideo('Premium', 'Premium'), true);
});

test('Default dataset has stage configurations and clean stage requests', () => {
  assert.equal(DEFAULT_STAGE_REQUESTS.length, 0);

  const videosWithStages = DEFAULT_VIDEOS.filter(v => v.requiredStage);
  assert.ok(videosWithStages.length > 0);
});

test('WorkoutVideo has prominent duration field on all default routines', () => {
  for (const video of DEFAULT_VIDEOS) {
    assert.ok(typeof video.duration === 'string' && video.duration.length > 0, `Video ${video.id} must have a duration string`);
    assert.ok(typeof video.durationMinutes === 'number' && video.durationMinutes > 0, `Video ${video.id} must have positive durationMinutes`);
  }
});

test('Recently watched logic caps at last 3 opened routines and deduplicates', () => {
  const testUserId = 'test-athlete-42';

  // Open 1st video
  let list = recordRecentlyWatched(testUserId, 'vid-1');
  assert.deepEqual(list, ['vid-1']);

  // Open 2nd video
  list = recordRecentlyWatched(testUserId, 'vid-2');
  assert.deepEqual(list, ['vid-2', 'vid-1']);

  // Open 3rd video
  list = recordRecentlyWatched(testUserId, 'vid-3');
  assert.deepEqual(list, ['vid-3', 'vid-2', 'vid-1']);

  // Open 4th video -> should cap at 3 items, dropping oldest (vid-1)
  list = recordRecentlyWatched(testUserId, 'vid-4');
  assert.deepEqual(list, ['vid-4', 'vid-3', 'vid-2']);
  assert.equal(list.length, 3);

  // Re-open vid-3 -> should move to front without duplicates
  list = recordRecentlyWatched(testUserId, 'vid-3');
  assert.deepEqual(list, ['vid-3', 'vid-4', 'vid-2']);
  assert.equal(list.length, 3);

  // Read back via getRecentlyWatched
  const fetched = getRecentlyWatched(testUserId);
  assert.deepEqual(fetched, ['vid-3', 'vid-4', 'vid-2']);
});

test('Cross-device backup export and import correctly serializes and restores GYM App state', () => {
  const jsonStr = exportGymAppDataAsJson();
  assert.ok(jsonStr.length > 50);
  
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.source, 'GYM App');
  assert.ok(Array.isArray(parsed.users));
  assert.ok(Array.isArray(parsed.videos));
  assert.ok(Array.isArray(parsed.stageRequests));

  const importRes = importHubDataFromJson(jsonStr);
  assert.equal(importRes.success, true);
  assert.ok(importRes.counts);
  assert.ok(importRes.counts.users >= 1);
  assert.ok(importRes.counts.videos >= 6);
});

test('Video Library Search: filters correctly by video title / name', () => {
  const query = 'bench';
  const matches = DEFAULT_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(query) ||
    v.muscleGroup.toLowerCase().includes(query)
  );
  assert.ok(matches.length >= 1, 'Should find Bench Press workout');
  assert.ok(matches.some(v => v.title.toLowerCase().includes('bench')));
});

test('Video Library Search: filters correctly by muscle group', () => {
  const query = 'chest';
  const matches = DEFAULT_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(query) ||
    v.muscleGroup.toLowerCase().includes(query)
  );
  assert.ok(matches.length >= 1, 'Should find Chest workouts');
  assert.ok(matches.every(v => 
    v.muscleGroup.toLowerCase().includes('chest') || 
    v.title.toLowerCase().includes('chest')
  ));
});

test('Video Library Search: returns empty list on nonexistent search query', () => {
  const query = 'nonexistentxyzworkout123';
  const matches = DEFAULT_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(query) ||
    v.muscleGroup.toLowerCase().includes(query)
  );
  assert.equal(matches.length, 0);
});

