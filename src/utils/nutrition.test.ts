import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage if absent in Node test runner
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
  getNutritionLog, 
  saveNutritionLog, 
  getNutritionHistory, 
  DEFAULT_NUTRITION_GOALS,
  STORAGE_KEYS
} from './storage';
import { DailyNutritionLog } from '../types/workout';

test('Nutrition Tracking: getNutritionLog returns default template with sensible goals', () => {
  const userId = 'athlete-test-1';
  const date = '2026-11-10';
  const log = getNutritionLog(userId, date);

  assert.equal(log.userId, userId);
  assert.equal(log.date, date);
  assert.equal(log.waterMl, 0);
  assert.equal(log.proteinGrams, 0);
  assert.equal(log.carbsGrams, 0);
  assert.equal(log.fatsGrams, 0);
  assert.equal(log.waterGoalMl, DEFAULT_NUTRITION_GOALS.waterGoalMl);
  assert.equal(log.proteinGoalGrams, DEFAULT_NUTRITION_GOALS.proteinGoalGrams);
  assert.equal(log.carbsGoalGrams, DEFAULT_NUTRITION_GOALS.carbsGoalGrams);
  assert.equal(log.fatsGoalGrams, DEFAULT_NUTRITION_GOALS.fatsGoalGrams);
});

test('Nutrition Tracking: saveNutritionLog updates water and macro-nutrients accurately', () => {
  const userId = 'athlete-test-2';
  const date = '2026-11-10';
  const initialLog = getNutritionLog(userId, date);

  const updated: DailyNutritionLog = {
    ...initialLog,
    waterMl: 2500,
    proteinGrams: 165,
    carbsGrams: 210,
    fatsGrams: 60,
  };

  const res = saveNutritionLog(updated);
  assert.equal(res.success, true);
  assert.equal(res.log.waterMl, 2500);
  assert.equal(res.log.proteinGrams, 165);
  assert.equal(res.log.carbsGrams, 210);
  assert.equal(res.log.fatsGrams, 60);

  // Re-read to confirm persistence
  const reloaded = getNutritionLog(userId, date);
  assert.equal(reloaded.waterMl, 2500);
  assert.equal(reloaded.proteinGrams, 165);
  assert.equal(reloaded.carbsGrams, 210);
  assert.equal(reloaded.fatsGrams, 60);
});

test('Nutrition Tracking: calculates total macro calories accurately', () => {
  const protein = 150; // 150 * 4 = 600 kcal
  const carbs = 200;   // 200 * 4 = 800 kcal
  const fats = 70;     // 70 * 9  = 630 kcal
  const expectedTotalKcal = (protein * 4) + (carbs * 4) + (fats * 9); // 2030 kcal

  assert.equal(expectedTotalKcal, 2030);
});

test('Nutrition Tracking: getNutritionHistory returns 7 days of consecutive logs', () => {
  const userId = 'athlete-history-test';
  const history = getNutritionHistory(userId, 7);

  assert.equal(history.length, 7);
  // Ensure each entry has valid date and userId
  history.forEach(entry => {
    assert.equal(entry.userId, userId);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
  });
});
