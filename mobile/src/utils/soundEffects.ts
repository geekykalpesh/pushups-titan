export type SoundType =
  | 'rep'
  | 'egg'
  | 'goal'
  | 'tap'
  | 'select'
  | 'streak';

/**
 * Sound effects disabled per user request
 */
export const playSound = (_type: SoundType, _volume: number = 1.0): void => {
  // Silent - all audio feedback removed
};
