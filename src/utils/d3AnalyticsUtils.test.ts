import test from 'node:test';
import assert from 'node:assert/strict';
import { processWeeklyD3Data } from './d3AnalyticsUtils';
import { DailyCaloriePoint } from './calorieAnalytics';

test('processWeeklyD3Data handles empty history gracefully', () => {
  const result = processWeeklyD3Data([]);
  assert.equal(result.data.length, 0);
  assert.equal(result.summary.totalCalories, 0);
  assert.equal(result.summary.totalSessions, 0);
  assert.equal(result.summary.activeDaysCount, 0);
});

test('processWeeklyD3Data correctly calculates weekly metrics and D3 domains', () => {
  const mockHistory: DailyCaloriePoint[] = [
    { date: '2026-11-01', dayLabel: 'Sun', displayDate: 'Nov 1', caloriesBurned: 150, targetCalories: 500, completedWorkouts: 1, diffFromYesterday: 0, diffPercent: 0 },
    { date: '2026-11-02', dayLabel: 'Mon', displayDate: 'Nov 2', caloriesBurned: 0, targetCalories: 500, completedWorkouts: 0, diffFromYesterday: -150, diffPercent: -100 },
    { date: '2026-11-03', dayLabel: 'Tue', displayDate: 'Nov 3', caloriesBurned: 240, targetCalories: 500, completedWorkouts: 2, diffFromYesterday: 240, diffPercent: 100 },
    { date: '2026-11-04', dayLabel: 'Wed', displayDate: 'Nov 4', caloriesBurned: 110, targetCalories: 500, completedWorkouts: 1, diffFromYesterday: -130, diffPercent: -54 },
    { date: '2026-11-05', dayLabel: 'Thu', displayDate: 'Nov 5', caloriesBurned: 0, targetCalories: 500, completedWorkouts: 0, diffFromYesterday: -110, diffPercent: -100 },
    { date: '2026-11-06', dayLabel: 'Fri', displayDate: 'Nov 6', caloriesBurned: 320, targetCalories: 500, completedWorkouts: 2, diffFromYesterday: 320, diffPercent: 100 },
    { date: '2026-11-07', dayLabel: 'Sat', displayDate: 'Nov 7', caloriesBurned: 180, targetCalories: 500, completedWorkouts: 1, diffFromYesterday: -140, diffPercent: -44 },
  ];

  const processed = processWeeklyD3Data(mockHistory);

  assert.equal(processed.data.length, 7);
  // Total calories: 150 + 0 + 240 + 110 + 0 + 320 + 180 = 1000
  assert.equal(processed.summary.totalCalories, 1000);
  // Total sessions: 1 + 0 + 2 + 1 + 0 + 2 + 1 = 7
  assert.equal(processed.summary.totalSessions, 7);
  // Active days: 5 (Sun, Tue, Wed, Fri, Sat)
  assert.equal(processed.summary.activeDaysCount, 5);
  // Daily average: 1000 / 7 = 143
  assert.equal(processed.summary.dailyAvgCalories, 143);
  // Peak day: Fri with 320 kcal
  assert.equal(processed.summary.peakDay.dayLabel, 'Fri');
  assert.equal(processed.summary.peakDay.calories, 320);

  // Check last item isToday
  assert.equal(processed.data[6].isToday, true);
  assert.equal(processed.data[0].isToday, false);

  // Check domains
  assert.ok(processed.summary.calorieDomain[1] >= 500);
  assert.ok(processed.summary.sessionDomain[1] >= 3);
});

test('processWeeklyD3Data dynamically adjusts targetCalories and expands calorie domain for custom daily goal', () => {
  const mockHistory: DailyCaloriePoint[] = [
    { date: '2026-11-07', dayLabel: 'Today', displayDate: 'Nov 7', caloriesBurned: 450, targetCalories: 350, completedWorkouts: 2, diffFromYesterday: 50, diffPercent: 12 },
  ];

  const processed = processWeeklyD3Data(mockHistory, 850);
  assert.equal(processed.data[0].targetCalories, 850);
  assert.ok(processed.summary.calorieDomain[1] >= 850, `Expected domain max to be >= 850, got ${processed.summary.calorieDomain[1]}`);
});
