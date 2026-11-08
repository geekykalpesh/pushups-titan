import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface DailyProgressRingProps {
  current: number;
  goal: number;
  label?: string;
  unit?: string;
  streakDays?: number;
  color?: string;
  glowColor?: string;
}

export const DailyProgressRing: React.FC<DailyProgressRingProps> = ({
  current,
  goal,
  label = 'DAILY PROGRESS',
  unit = 'PUSHUPS',
  streakDays = 0,
  color = COLORS.flamePrimary,
  glowColor = COLORS.flameGlow,
}) => {
  const percentage = Math.min(100, Math.round((current / (goal || 1)) * 100));
  const isGoalReached = current >= goal;

  return (
    <View style={[styles.card, { borderColor: isGoalReached ? COLORS.goldStreak : COLORS.border }]}>
      {/* Top Header with Label & Streak */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {streakDays > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakDays}d Streak</Text>
          </View>
        ) : null}
      </View>

      {/* Main Big Counter Display */}
      <View style={styles.counterCenter}>
        <View style={[styles.ringOuter, { borderColor: glowColor }]}>
          <View
            style={[
              styles.ringInner,
              {
                borderColor: isGoalReached ? COLORS.goldStreak : color,
                backgroundColor: isGoalReached ? 'rgba(255, 214, 0, 0.08)' : 'rgba(255, 87, 34, 0.06)',
              },
            ]}
          >
            <Text style={[styles.currentNumber, { color: isGoalReached ? COLORS.goldStreak : COLORS.white }]}>
              {current}
            </Text>
            <Text style={styles.unitText}>{unit}</Text>
            <Text style={styles.goalText}>Target: {goal}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar & Percentage */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: isGoalReached ? COLORS.goldStreak : color,
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.percentageText}>{percentage}% Complete</Text>
          <Text style={[styles.statusText, { color: isGoalReached ? COLORS.goldStreak : COLORS.textSecondary }]}>
            {isGoalReached ? '⚡ GOAL CRUSHED' : `${Math.max(0, goal - current)} remaining`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 214, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.3)',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.goldStreak,
  },
  counterCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  ringOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentNumber: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: -2,
  },
  goalText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 16,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
