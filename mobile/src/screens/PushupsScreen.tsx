import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, PSYCHOLOGY_QUOTES } from '../theme/colors';
import { safeVibrate } from '../utils/haptics';
import { playSound } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import {
  PushupLog,
  getPushupsByDate,
  logPushupSet,
  deletePushupLog,
  LogPushupResponse,
} from '../api/pushupsApi';
import { DailyProgressRing } from '../components/DailyProgressRing';
import { CelebrationModal } from '../components/CelebrationModal';
import { Icon } from '../components/Icon';

const QUICK_INCREMENTS = [10, 15, 20, 25, 50];

export const PushupsScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [totalPushups, setTotalPushups] = useState<number>(0);
  const [goal, setGoal] = useState<number>(user?.daily_pushup_goal || 100);
  const [sets, setSets] = useState<PushupLog[]>([]);
  const [countInput, setCountInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Celebration state
  const [celebrationData, setCelebrationData] = useState<{
    visible: boolean;
    count: number;
    totalToday: number;
    quote: string;
    isGoalHit: boolean;
  }>({
    visible: false,
    count: 0,
    totalToday: 0,
    quote: '',
    isGoalHit: false,
  });

  // Random psychology quote
  const [quoteIndex, setQuoteIndex] = useState(0);

  const fetchDayData = useCallback(async (dateStr: string) => {
    try {
      const res = await getPushupsByDate(dateStr);
      if (res.success) {
        setTotalPushups(res.total);
        setGoal(res.goal || 100);
        setSets(res.sets);
      }
    } catch (err: any) {
      console.warn('Fetch day pushups error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDayData(selectedDate);
  }, [selectedDate, fetchDayData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDayData(selectedDate);
  };

  // Day Navigation
  const navigateDay = (offset: number) => {
    playSound('tap');
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const jumpToToday = () => {
    playSound('select');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  };

  const handleQuickAdd = (num: number) => {
    playSound('tap');
    const currentVal = parseInt(countInput, 10) || 0;
    setCountInput(String(currentVal + num));
  };

  const handleLogPushups = async () => {
    const parsed = parseInt(countInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Count', 'Please enter a valid pushup count greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res: LogPushupResponse = await logPushupSet(
        parsed,
        notesInput.trim(),
        selectedDate
      );

      if (res.success) {
        // Trigger Celebration Effect
        setCelebrationData({
          visible: true,
          count: parsed,
          totalToday: res.todaySummary.total_today,
          quote: res.celebration.quote,
          isGoalHit: res.todaySummary.goal_completed,
        });

        // Reset input fields
        setCountInput('');
        setNotesInput('');

        // Refresh data
        await fetchDayData(selectedDate);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not log pushups.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSet = (id: number, count: number) => {
    Alert.alert(
      'Remove Set',
      `Delete this set of ${count} pushups?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePushupLog(id);
              fetchDayData(selectedDate);
            } catch {
              Alert.alert('Error', 'Failed to delete set.');
            }
          },
        },
      ]
    );
  };

  const currentQuote = PSYCHOLOGY_QUOTES[quoteIndex % PSYCHOLOGY_QUOTES.length];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Date Navigation Bar */}
          <View style={styles.dateBar}>
            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => navigateDay(-1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={24} color={COLORS.flameBright} />
            </TouchableOpacity>

            <TouchableOpacity onPress={jumpToToday} activeOpacity={0.8} style={styles.dateCenter}>
              <Text style={styles.dateHeading}>
                {isToday ? '🔥 TODAY' : formatDisplayDate(selectedDate).toUpperCase()}
              </Text>
              <Text style={styles.dateSubtext}>{formatDisplayDate(selectedDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => navigateDay(1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-right" size={24} color={COLORS.flameBright} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.flamePrimary} />}
          >
        {/* Psychology Motivational Banner */}
        <TouchableOpacity
          style={styles.quoteCard}
          onPress={() => setQuoteIndex((prev) => prev + 1)}
          activeOpacity={0.85}
        >
          <View style={styles.quoteIconBadge}>
            <Icon name="zap" size={16} />
          </View>
          <View style={styles.quoteContent}>
            <Text style={styles.quoteText}>"{currentQuote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {currentQuote.author}</Text>
          </View>
        </TouchableOpacity>

        {/* Daily Progress Ring */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.flamePrimary} />
          </View>
        ) : (
          <DailyProgressRing
            current={totalPushups}
            goal={goal}
            label={isToday ? "TODAY'S CONQUEST" : `${formatDisplayDate(selectedDate).toUpperCase()}`}
            unit="PUSHUPS"
            streakDays={isToday ? 1 : 0}
          />
        )}

        {/* Pushup Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.cardHeader}>CONQUER A NEW SET</Text>
          <Text style={styles.cardSub}>Add pushups done after an hour, minutes, or right now!</Text>

          {/* Quick Increment Chips */}
          <View style={styles.quickChipsRow}>
            {QUICK_INCREMENTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.chipButton}
                onPress={() => handleQuickAdd(val)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>+{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input Box */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.countTextInput}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={countInput}
              onChangeText={setCountInput}
              maxLength={4}
            />
            <Text style={styles.inputUnitLabel}>REPS</Text>
          </View>

          {/* Optional Notes */}
          <TextInput
            style={styles.notesTextInput}
            placeholder="Set details (e.g. Diamond, 10 min break, failure)"
            placeholderTextColor={COLORS.textMuted}
            value={notesInput}
            onChangeText={setNotesInput}
            maxLength={60}
          />

          {/* Big Action Button */}
          <TouchableOpacity
            style={styles.logButton}
            onPress={handleLogPushups}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.logButtonText}>LOG PUSHUPS</Text>
                <Icon name="pushup" size={20} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* History Sets Feed */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>RECORDED SETS</Text>
            <Text style={styles.historyCount}>{sets.length} SETS</Text>
          </View>

          {sets.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedEmoji}>🛡️</Text>
              <Text style={styles.emptyFeedTitle}>No sets logged yet</Text>
              <Text style={styles.emptyFeedSub}>
                Drop down and do your first set! Every single rep counts.
              </Text>
            </View>
          ) : (
            sets.map((item, index) => {
              const timeFormatted = item.formatted_time || new Date(item.logged_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={item.id} style={styles.setRow}>
                  <View style={styles.setNumberBadge}>
                    <Text style={styles.setNumberText}>#{sets.length - index}</Text>
                  </View>

                  <View style={styles.setInfo}>
                    <Text style={styles.setReps}>{item.count} Pushups</Text>
                    <Text style={styles.setTime}>
                      ⏰ {timeFormatted} {item.notes ? `• ${item.notes}` : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSet(item.id, item.count)}
                    activeOpacity={0.7}
                  >
                    <Icon name="trash" size={16} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>

      {/* Celebration Modal with Confetti */}
      <CelebrationModal
        visible={celebrationData.visible}
        count={celebrationData.count}
        totalToday={celebrationData.totalToday}
        quote={celebrationData.quote}
        isGoalHit={celebrationData.isGoalHit}
        onDismiss={() =>
          setCelebrationData((prev) => ({ ...prev, visible: false }))
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  dateSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 240,
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 87, 34, 0.08)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.25)',
    marginBottom: 8,
  },
  quoteIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.flameGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.white,
    lineHeight: 17,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.flameBright,
    marginTop: 3,
  },
  loadingBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 12,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chipButton: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 54,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.flameBright,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.flamePrimary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 12,
  },
  countTextInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    padding: 0,
  },
  inputUnitLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  notesTextInput: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  logButton: {
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.2,
    marginRight: 8,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.flameBright,
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyFeedEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyFeedSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  setNumberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 87, 34, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.flameBright,
  },
  setInfo: {
    flex: 1,
  },
  setReps: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  setTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
});
