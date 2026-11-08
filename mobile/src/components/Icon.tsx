import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type IconName =
  | 'flame'
  | 'pushup'
  | 'egg'
  | 'chart'
  | 'alarm'
  | 'lock'
  | 'fingerprint'
  | 'check'
  | 'plus'
  | 'trash'
  | 'user'
  | 'bell'
  | 'calendar'
  | 'trophy'
  | 'protein'
  | 'chevron-left'
  | 'chevron-right'
  | 'zap'
  | 'eye'
  | 'eye-off';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const ICON_MAP: Record<IconName, string> = {
  flame: '🔥',
  pushup: '💪',
  egg: '🥚',
  chart: '📊',
  alarm: '⏰',
  lock: '🔒',
  fingerprint: '🛡️',
  check: '✓',
  plus: '+',
  trash: '🗑️',
  user: '👤',
  bell: '🔔',
  calendar: '📅',
  trophy: '🏆',
  protein: '⚡',
  'chevron-left': '‹',
  'chevron-right': '›',
  zap: '⚡',
  eye: '👁️',
  'eye-off': '🙈',
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#FFFFFF' }) => {
  const glyph = ICON_MAP[name] || '•';

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: size, color }]}>{glyph}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
