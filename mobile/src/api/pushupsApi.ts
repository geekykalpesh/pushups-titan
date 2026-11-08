import { apiRequest } from './client';

export interface PushupLog {
  id: number;
  count: number;
  logged_at: string;
  log_date: string;
  notes?: string;
  formatted_time?: string;
}

export interface DayPushupSummary {
  success: boolean;
  date: string;
  total: number;
  goal: number;
  percentage: number;
  sets: PushupLog[];
}

export interface LogPushupResponse {
  success: boolean;
  message: string;
  log: PushupLog;
  todaySummary: {
    date: string;
    total_today: number;
    sets_count: number;
    goal: number;
    percentage: number;
    goal_completed: boolean;
  };
  celebration: {
    trigger: boolean;
    type: 'GOAL_EXPLOSION' | 'MEGA_BURST' | 'SPARKLE_BURST';
    quote: string;
    addedCount: number;
    totalToday: number;
  };
}

export interface MonthlyPushupStats {
  success: boolean;
  year: number;
  month: number;
  grandTotal: number;
  averagePerDay: number;
  activeDays: number;
  highestDay: { date: string | null; count: number };
  chartData: Array<{ day: number; label: string; pushups: number }>;
}

export const logPushupSet = async (count: number, notes?: string, logDate?: string): Promise<LogPushupResponse> => {
  return await apiRequest<LogPushupResponse>('/pushups/log', {
    method: 'POST',
    body: { count, notes, log_date: logDate },
  });
};

export const getPushupsByDate = async (date: string): Promise<DayPushupSummary> => {
  return await apiRequest<DayPushupSummary>(`/pushups/by-date?date=${encodeURIComponent(date)}`, {
    method: 'GET',
  });
};

export const getMonthlyPushupStats = async (year: number, month: number): Promise<MonthlyPushupStats> => {
  return await apiRequest<MonthlyPushupStats>(`/pushups/monthly-stats?year=${year}&month=${month}`, {
    method: 'GET',
  });
};

export const deletePushupLog = async (id: number): Promise<{ success: boolean; message: string }> => {
  return await apiRequest(`/pushups/${id}`, {
    method: 'DELETE',
  });
};

export interface PushupContributions {
  success: boolean;
  days: number;
  startDate: string;
  total: number;
  activeDays: number;
  contributions: Record<string, number>;
  raw: Array<{ date: string; count: number; sets: number }>;
}

export const getPushupContributions = async (days = 150): Promise<PushupContributions> => {
  return await apiRequest<PushupContributions>(`/pushups/contributions?days=${days}`, {
    method: 'GET',
  });
};
