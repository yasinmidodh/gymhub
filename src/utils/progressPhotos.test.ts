import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test runner
const memoryStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, val: string) => { memoryStorage[key] = val; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); },
};

import { 
  updateUserDailyCalorieGoal, 
  getStoredUsers, 
  getStoredProgressPhotos, 
  saveProgressPhotoCheckin, 
  reviewProgressPhotoCheckin, 
  deleteProgressPhotoCheckin 
} from './storage';

test('updateUserDailyCalorieGoal sets and validates calorie target', () => {
  const users = getStoredUsers();
  const testUser = users[0]; // Muhammad (Admin)

  // Test invalid goals
  const failLow = updateUserDailyCalorieGoal(testUser.id, 50);
  assert.equal(failLow.success, false);

  const failHigh = updateUserDailyCalorieGoal(testUser.id, 20000);
  assert.equal(failHigh.success, false);

  // Test valid goal
  const successRes = updateUserDailyCalorieGoal(testUser.id, 650);
  assert.equal(successRes.success, true);
  assert.equal(successRes.user?.dailyCalorieGoal, 650);

  // Verify persisted
  const reloaded = getStoredUsers().find(u => u.id === testUser.id);
  assert.equal(reloaded?.dailyCalorieGoal, 650);
});

test('saveProgressPhotoCheckin stores optional before/after training photos', () => {
  const checkinData = {
    userId: 'user-athlete-test',
    userName: 'Test Athlete',
    userEmail: 'athlete@gymapp.com',
    beforePhotoUrl: 'data:image/png;base64,sampleBefore',
    afterPhotoUrl: 'data:image/png;base64,sampleAfter',
    workoutDate: '2026-11-07',
    muscleFocus: 'Chest',
    userNote: 'Felt great pump today',
  };

  const res = saveProgressPhotoCheckin(checkinData);
  assert.equal(res.success, true);
  assert.ok(res.checkin?.id);
  assert.equal(res.checkin?.userNote, 'Felt great pump today');

  const photos = getStoredProgressPhotos('user-athlete-test');
  const found = photos.find(p => p.id === res.checkin?.id);
  assert.ok(found);
  assert.equal(found.muscleFocus, 'Chest');
});

test('reviewProgressPhotoCheckin records Coach assessment and personalized feedback', () => {
  const saved = saveProgressPhotoCheckin({
    userId: 'user-review-test',
    userName: 'Review Test',
    userEmail: 'review@gymapp.com',
    beforePhotoUrl: 'data:image/png;base64,sampleBefore',
    workoutDate: '2026-11-07',
    muscleFocus: 'Chest',
  });
  assert.ok(saved.checkin?.id);
  const targetId = saved.checkin.id;

  const res = reviewProgressPhotoCheckin(
    targetId,
    'Significant Improvement',
    'Massive improvement in chest contraction and scapular depression!',
    'Muhammad (Admin Coach)'
  );

  assert.equal(res.success, true);
  assert.equal(res.checkin?.adminFeedback?.assessment, 'Significant Improvement');
  assert.equal(res.checkin?.adminFeedback?.coachName, 'Muhammad (Admin Coach)');

  // Verify reload
  const reloaded = getStoredProgressPhotos().find(p => p.id === targetId);
  assert.equal(reloaded?.adminFeedback?.assessment, 'Significant Improvement');
});

test('deleteProgressPhotoCheckin removes checkin cleanly', () => {
  const checkin = saveProgressPhotoCheckin({
    userId: 'temp-user',
    userName: 'Temp',
    userEmail: 'temp@test.com',
    beforePhotoUrl: 'data:image/png;base64,test',
    workoutDate: '2026-11-07',
  });
  assert.ok(checkin.checkin?.id);

  const delRes = deleteProgressPhotoCheckin(checkin.checkin.id);
  assert.equal(delRes.success, true);

  const checkins = getStoredProgressPhotos();
  assert.equal(checkins.some(p => p.id === checkin.checkin?.id), false);
});
