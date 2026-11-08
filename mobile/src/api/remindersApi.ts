import { apiRequest } from './client';

export interface Reminder {
  id: number;
  title: string;
  reminder_time: string; // "14:30"
  is_active: boolean;
  target_count: number;
  days_of_week: string;
}

export const getReminders = async (): Promise<{ success: boolean; reminders: Reminder[] }> => {
  return await apiRequest('/reminders', { method: 'GET' });
};

export const createReminder = async (
  reminder: Omit<Reminder, 'id'>
): Promise<{ success: boolean; reminder: Reminder }> => {
  return await apiRequest('/reminders', {
    method: 'POST',
    body: reminder,
  });
};

export const updateReminder = async (
  id: number,
  updates: Partial<Reminder>
): Promise<{ success: boolean; reminder: Reminder }> => {
  return await apiRequest(`/reminders/${id}`, {
    method: 'PUT',
    body: updates,
  });
};

export const deleteReminder = async (id: number): Promise<{ success: boolean; message: string }> => {
  return await apiRequest(`/reminders/${id}`, {
    method: 'DELETE',
  });
};
