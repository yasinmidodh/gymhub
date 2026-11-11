import { DailyCaloriePoint } from './calorieAnalytics';

export interface WeeklyD3Datum {
  date: string;
  dayLabel: string;
  displayDate: string;
  calories: number;
  targetCalories: number;
  sessions: number;
  diffFromYesterday: number;
  diffPercent: number;
  burnPerSession: number;
  isActive: boolean;
  isToday: boolean;
}

export interface WeeklyD3Summary {
  totalCalories: number;
  totalSessions: number;
  activeDaysCount: number;
  dailyAvgCalories: number;
  avgSessionsPerActiveDay: number;
  peakDay: {
    dayLabel: string;
    displayDate: string;
    calories: number;
    sessions: number;
  };
  consistencyPercent: number;
  calorieDomain: [number, number];
  sessionDomain: [number, number];
}

export interface WeeklyD3Processed {
  data: WeeklyD3Datum[];
  summary: WeeklyD3Summary;
}

export function processWeeklyD3Data(
  history: DailyCaloriePoint[] = [],
  customDailyGoal?: number
): WeeklyD3Processed {
  const goalVal = (customDailyGoal && customDailyGoal > 0) ? Math.round(customDailyGoal) : undefined;

  if (!history || history.length === 0) {
    const fallbackTarget = goalVal || 500;
    return {
      data: [],
      summary: {
        totalCalories: 0,
        totalSessions: 0,
        activeDaysCount: 0,
        dailyAvgCalories: 0,
        avgSessionsPerActiveDay: 0,
        peakDay: { dayLabel: 'N/A', displayDate: '', calories: 0, sessions: 0 },
        consistencyPercent: 0,
        calorieDomain: [0, Math.max(500, fallbackTarget + 100)],
        sessionDomain: [0, 5],
      },
    };
  }

  const data: WeeklyD3Datum[] = history.map((pt, idx) => {
    const isToday = idx === history.length - 1;
    const calories = Math.max(0, pt.caloriesBurned || 0);
    const sessions = Math.max(0, pt.completedWorkouts || 0);
    const burnPerSession = sessions > 0 ? Math.round(calories / sessions) : 0;
    const targetCalories = goalVal || pt.targetCalories || 500;

    return {
      date: pt.date,
      dayLabel: pt.dayLabel,
      displayDate: pt.displayDate,
      calories,
      targetCalories,
      sessions,
      diffFromYesterday: pt.diffFromYesterday || 0,
      diffPercent: pt.diffPercent || 0,
      burnPerSession,
      isActive: sessions > 0 || calories > 0,
      isToday,
    };
  });

  const totalCalories = data.reduce((acc, d) => acc + d.calories, 0);
  const totalSessions = data.reduce((acc, d) => acc + d.sessions, 0);
  const activeDaysCount = data.filter((d) => d.isActive).length;
  const dailyAvgCalories = Math.round(totalCalories / Math.max(1, data.length));
  const avgSessionsPerActiveDay = activeDaysCount > 0 
    ? Math.round((totalSessions / activeDaysCount) * 10) / 10 
    : 0;

  // Find peak day
  let peak = data[0];
  for (const d of data) {
    if (d.calories > peak.calories) {
      peak = d;
    }
  }

  const consistencyPercent = Math.round((activeDaysCount / Math.max(1, data.length)) * 100);

  // Compute domains for D3 axes with pleasant padding
  const maxCalories = Math.max(
    ...data.map((d) => Math.max(d.calories, d.targetCalories)),
    goalVal || 0,
    100
  );
  const calorieDomainMax = Math.ceil((maxCalories * 1.12) / 100) * 100;

  const maxSessions = Math.max(...data.map((d) => d.sessions), 3);
  const sessionDomainMax = Math.max(4, Math.ceil(maxSessions) + 1);

  return {
    data,
    summary: {
      totalCalories,
      totalSessions,
      activeDaysCount,
      dailyAvgCalories,
      avgSessionsPerActiveDay,
      peakDay: {
        dayLabel: peak ? peak.dayLabel : 'N/A',
        displayDate: peak ? peak.displayDate : '',
        calories: peak ? peak.calories : 0,
        sessions: peak ? peak.sessions : 0,
      },
      consistencyPercent,
      calorieDomain: [0, calorieDomainMax],
      sessionDomain: [0, sessionDomainMax],
    },
  };
}
