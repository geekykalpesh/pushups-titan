import { Vibration } from 'react-native';

/**
 * Safe vibration wrapper to prevent crashes if vibration permission or hardware is unavailable
 */
export const safeVibrate = (pattern: number | number[] = 30, repeat: boolean = false) => {
  try {
    Vibration.vibrate(pattern as any, repeat);
  } catch {
    // Gracefully ignore on devices without vibration support
  }
};

export const safeVibrateCancel = () => {
  try {
    Vibration.cancel();
  } catch {
    // Gracefully ignore
  }
};
