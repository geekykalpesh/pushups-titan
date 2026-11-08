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
import { Reminder } from '../api/remindersApi';
import { Icon } from './Icon';

interface AlarmNotificationProps {
  alarm: Reminder | null;
  onAccept: (targetCount: number) => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export const AlarmNotificationModal: React.FC<AlarmNotificationProps> = ({
  alarm,
  onAccept,
  onSnooze,
  onDismiss,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (alarm) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [alarm]);

  if (!alarm) return null;

  return (
    <Modal visible={!!alarm} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Animated Alarm Bell */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Icon name="bell" size={40} />
          </Animated.View>

          <Text style={styles.badgeText}>🚨 PUSHUP ALARM TRIGGERED</Text>
          <Text style={styles.timeText}>{alarm.reminder_time.substring(0, 5)}</Text>

          <Text style={styles.titleText}>{alarm.title}</Text>
          <Text style={styles.subtitleText}>
            No excuses! Drop right now and crush{' '}
            <Text style={styles.targetReps}>{alarm.target_count || 20} pushups</Text>!
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onAccept(alarm.target_count || 20)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>
              DROP & DO {alarm.target_count || 20} NOW! 💪
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.snoozeButton} onPress={onSnooze} activeOpacity={0.7}>
              <Text style={styles.snoozeText}>Snooze 5 Min ⏳</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.92)',
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
    borderColor: COLORS.urgentRed,
    shadowColor: COLORS.urgentRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 23, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.urgentRed,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.urgentRed,
    letterSpacing: 1.5,
  },
  timeText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
    marginVertical: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  targetReps: {
    color: COLORS.flameBright,
    fontWeight: '900',
  },
  actionButton: {
    width: '100%',
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  secondaryRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  snoozeButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 6,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  snoozeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 6,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
