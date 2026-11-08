import { apiRequest } from './client';

export interface EggLog {
  id: number;
  count: number;
  protein_grams: number | string;
  logged_at: string;
  log_date: string;
  notes?: string;
}

export interface DayEggSummary {
  success: boolean;
  date: string;
  total_eggs: number;
  total_protein: number;
  egg_goal: number;
  protein_goal: number;
  egg_percentage: number;
  protein_percentage: number;
  logs: EggLog[];
}

export interface LogEggResponse {
  success: boolean;
  message: string;
  log: EggLog;
  todaySummary: {
    date: string;
    total_eggs: number;
    total_protein: string;
    egg_goal: number;
    protein_goal: number;
    egg_percentage: number;
    protein_percentage: number;
  };
  celebration: {
    quote: string;
    eggCount: number;
    proteinGrams: number;
  };
}

export interface MonthlyEggStats {
  success: boolean;
  year: number;
  month: number;
  grandTotalEggs: number;
  grandTotalProtein: number;
  averageEggsPerDay: number;
  averageProteinPerDay: number;
  chartData: Array<{ day: number; label: string; eggs: number; protein: number }>;
}

export const logEggCount = async (count: number, notes?: string, logDate?: string): Promise<LogEggResponse> => {
  return await apiRequest<LogEggResponse>('/eggs/log', {
    method: 'POST',
    body: { count, notes, log_date: logDate },
  });
};

export const getEggsByDate = async (date: string): Promise<DayEggSummary> => {
  return await apiRequest<DayEggSummary>(`/eggs/by-date?date=${encodeURIComponent(date)}`, {
    method: 'GET',
  });
};

export const getMonthlyEggStats = async (year: number, month: number): Promise<MonthlyEggStats> => {
  return await apiRequest<MonthlyEggStats>(`/eggs/monthly-stats?year=${year}&month=${month}`, {
    method: 'GET',
  });
};

export const deleteEggLog = async (id: number): Promise<{ success: boolean; message: string }> => {
  return await apiRequest(`/eggs/${id}`, {
    method: 'DELETE',
  });
};

export interface EggContributions {
  success: boolean;
  days: number;
  startDate: string;
  totalEggs: number;
  totalProtein: number;
  activeDays: number;
  contributions: Record<string, { eggs: number; protein: number }>;
  raw: Array<{ date: string; eggs: number; protein: number; logs_count: number }>;
}

export const getEggContributions = async (days = 150): Promise<EggContributions> => {
  return await apiRequest<EggContributions>(`/eggs/contributions?days=${days}`, {
    method: 'GET',
  });
};
