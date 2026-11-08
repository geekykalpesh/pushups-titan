import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { ConfettiCanvas } from './ConfettiCanvas';
import { Icon } from './Icon';
import { safeVibrate } from '../utils/haptics';
import { playSound } from '../utils/soundEffects';

interface CelebrationProps {
  visible: boolean;
  title?: string;
  count: number;
  totalToday: number;
  quote?: string;
  isGoalHit?: boolean;
  onDismiss: () => void;
}

export const CelebrationModal: React.FC<CelebrationProps> = ({
  visible,
  title = 'REP CONQUERED!',
  count,
  totalToday,
  quote,
  isGoalHit = false,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (isGoalHit) {
        playSound('goal');
      } else {
        playSound('rep');
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <ConfettiCanvas active={visible} />

        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              borderColor: isGoalHit ? COLORS.goldStreak : COLORS.flamePrimary,
            },
          ]}
        >
          {/* Top Badge */}
          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: isGoalHit ? COLORS.goldStreak : COLORS.flamePrimary },
            ]}
          >
            <Icon name={isGoalHit ? 'trophy' : 'flame'} size={28} />
          </View>

          <Text style={styles.heading}>
            {isGoalHit ? '🔥 DAILY GOAL CRUSHED! 🔥' : title}
          </Text>

          <View style={styles.countRow}>
            <Text style={styles.addedCount}>+{count}</Text>
            <Text style={styles.repsText}>REPS LOGGED</Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TODAY'S TOTAL</Text>
            <Text style={styles.totalValue}>{totalToday} PUSHUPS</Text>
          </View>

          {quote ? (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{quote}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: isGoalHit ? COLORS.goldStreak : COLORS.flamePrimary },
            ]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.actionButtonText,
                { color: isGoalHit ? COLORS.black : COLORS.white },
              ]}
            >
              KEEP CRUSHING IT 💪
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  badgeContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -48,
    borderWidth: 4,
    borderColor: COLORS.surfaceCard,
  },
  heading: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.2,
    marginTop: 16,
    textAlign: 'center',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  addedCount: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.flameBright,
    marginRight: 8,
  },
  repsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  totalBox: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.vitalityGreen,
    marginTop: 2,
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 87, 34, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.flamePrimary,
  },
  quoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
