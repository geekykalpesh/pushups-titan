import React, { createContext, useContext, useState, useEffect } from 'react';
import { Reminder, getReminders, createReminder, updateReminder, deleteReminder } from '../api/remindersApi';
import { useAuth } from './AuthContext';
import { safeVibrate, safeVibrateCancel } from '../utils/haptics';

interface ReminderContextType {
  reminders: Reminder[];
  isLoading: boolean;
  activeAlarm: Reminder | null;
  dismissAlarm: () => void;
  snoozeAlarm: (minutes?: number) => void;
  triggerManualAlarmTest: (reminder: Reminder) => void;
  addReminder: (rem: Omit<Reminder, 'id'>) => Promise<void>;
  toggleReminder: (id: number, currentStatus: boolean) => Promise<void>;
  removeReminder: (id: number) => Promise<void>;
  reloadReminders: () => Promise<void>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
  const [lastTriggeredMinute, setLastTriggeredMinute] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadReminders();
    } else {
      setReminders([]);
    }
  }, [user]);

  // Alarm scheduler ticker
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      // Avoid double triggering within the same minute
      if (currentTimeStr === lastTriggeredMinute) return;

      const matching = reminders.find(
        (r) => r.is_active && r.reminder_time.substring(0, 5) === currentTimeStr
      );

      if (matching) {
        setLastTriggeredMinute(currentTimeStr);
        fireAlarm(matching);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [reminders, user, lastTriggeredMinute]);

  const fireAlarm = (reminder: Reminder) => {
    // Vibrate tactical pulse
    safeVibrate([0, 600, 300, 600, 300, 800], false);
    setActiveAlarm(reminder);
  };

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const res = await getReminders();
      if (res.success) {
        setReminders(res.reminders);
      }
    } catch (err) {
      console.warn('Failed to load reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addReminder = async (rem: Omit<Reminder, 'id'>) => {
    const res = await createReminder(rem);
    if (res.success) {
      setReminders((prev) => [...prev, res.reminder]);
    }
  };

  const toggleReminder = async (id: number, currentStatus: boolean) => {
    const res = await updateReminder(id, { is_active: !currentStatus });
    if (res.success) {
      setReminders((prev) => prev.map((r) => (r.id === id ? res.reminder : r)));
    }
  };

  const removeReminder = async (id: number) => {
    const res = await deleteReminder(id);
    if (res.success) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const dismissAlarm = () => {
    safeVibrateCancel();
    setActiveAlarm(null);
  };

  const snoozeAlarm = (minutes = 5) => {
    safeVibrateCancel();
    setActiveAlarm(null);
    setTimeout(() => {
      if (activeAlarm) {
        fireAlarm(activeAlarm);
      }
    }, minutes * 60 * 1000);
  };

  const triggerManualAlarmTest = (reminder: Reminder) => {
    fireAlarm(reminder);
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        isLoading,
        activeAlarm,
        dismissAlarm,
        snoozeAlarm,
        triggerManualAlarmTest,
        addReminder,
        toggleReminder,
        removeReminder,
        reloadReminders: loadReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};
