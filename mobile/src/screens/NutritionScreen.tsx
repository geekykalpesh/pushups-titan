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
import { COLORS } from '../theme/colors';
import { safeVibrate } from '../utils/haptics';
import { playSound } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import {
  EggLog,
  getEggsByDate,
  logEggCount,
  deleteEggLog,
} from '../api/eggsApi';
import { Icon } from '../components/Icon';

const QUICK_EGG_AMOUNTS = [1, 2, 3, 4, 6];

export const NutritionScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [totalEggs, setTotalEggs] = useState<number>(0);
  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [eggGoal, setEggGoal] = useState<number>(user?.daily_egg_goal || 4);
  const [proteinGoal, setProteinGoal] = useState<number>(
    user?.daily_protein_goal || 30.0
  );
  const [logs, setLogs] = useState<EggLog[]>([]);
  const [eggInput, setEggInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNutrition = useCallback(async (dateStr: string) => {
    try {
      const res = await getEggsByDate(dateStr);
      if (res.success) {
        setTotalEggs(res.total_eggs);
        setTotalProtein(res.total_protein);
        setEggGoal(res.egg_goal);
        setProteinGoal(res.protein_goal);
        setLogs(res.logs);
      }
    } catch (err: any) {
      console.warn('Fetch eggs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNutrition(selectedDate);
  }, [selectedDate, fetchNutrition]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNutrition(selectedDate);
  };

  const navigateDay = (offset: number) => {
    playSound('tap');
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleQuickAdd = (num: number) => {
    playSound('tap');
    const curr = parseInt(eggInput, 10) || 0;
    setEggInput(String(curr + num));
  };

  const handleLogEggs = async () => {
    const parsed = parseInt(eggInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Count', 'Please enter a valid egg count greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      playSound('egg');
      const res = await logEggCount(parsed, notesInput.trim(), selectedDate);

      if (res.success) {
        Alert.alert(
          '🍳 Nutrition Locked In!',
          `Logged ${parsed} eggs. Added +${res.log.protein_grams}g protein toward muscle recovery!`
        );
        setEggInput('');
        setNotesInput('');
        await fetchNutrition(selectedDate);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not log eggs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = (id: number, count: number) => {
    Alert.alert('Delete Entry', `Remove ${count} eggs log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEggLog(id);
            fetchNutrition(selectedDate);
          } catch {
            Alert.alert('Error', 'Failed to delete egg log.');
          }
        },
      },
    ]);
  };

  const proteinPercentage = Math.min(
    100,
    Math.round((totalProtein / (proteinGoal || 1)) * 100)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Date Navigation */}
          <View style={styles.dateBar}>
            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => navigateDay(-1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={24} color={COLORS.vitalityGreen} />
            </TouchableOpacity>

            <View style={styles.dateCenter}>
              <Text style={styles.dateHeading}>
                {isToday ? '🍳 TODAY' : selectedDate}
              </Text>
              <Text style={styles.dateSubtext}>EGGS & PROTEIN FUEL</Text>
            </View>

            <TouchableOpacity
              style={styles.dateNavButton}
              onPress={() => navigateDay(1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-right" size={24} color={COLORS.vitalityGreen} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.vitalityGreen} />}
          >
        {/* Today's Fuel Summary Card */}
        <View style={styles.fuelCard}>
          <View style={styles.fuelHeader}>
            <Text style={styles.fuelTitle}>ANABOLIC PROTEIN SYNTHESIS</Text>
            <View style={styles.vitalityBadge}>
              <Text style={styles.vitalityBadgeText}>~6.3g Protein / Egg</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            {/* Eggs Box */}
            <View style={styles.metricBox}>
              <Text style={styles.metricIcon}>🥚</Text>
              <Text style={styles.metricValue}>{totalEggs}</Text>
              <Text style={styles.metricLabel}>EGGS EATEN</Text>
              <Text style={styles.metricGoal}>Goal: {eggGoal}</Text>
            </View>

            {/* Protein Box */}
            <View style={[styles.metricBox, styles.proteinBox]}>
              <Text style={styles.metricIcon}>⚡</Text>
              <Text style={[styles.metricValue, { color: COLORS.vitalityGreen }]}>
                {totalProtein}g
              </Text>
              <Text style={styles.metricLabel}>PROTEIN INTAKE</Text>
              <Text style={styles.metricGoal}>Goal: {proteinGoal}g</Text>
            </View>
          </View>

          {/* Protein Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${proteinPercentage}%`,
                  backgroundColor: COLORS.vitalityGreen,
                },
              ]}
            />
          </View>

          <View style={styles.progressMeta}>
            <Text style={styles.progressPercentText}>{proteinPercentage}% of Daily Protein Target</Text>
            <Text style={styles.progressStatusText}>
              {totalProtein >= proteinGoal ? '🔥 TARGET MET' : `${(proteinGoal - totalProtein).toFixed(1)}g left`}
            </Text>
          </View>
        </View>

        {/* Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>ADD EGGS CONSUMED</Text>
          <Text style={styles.inputCardSub}>
            Select or enter the number of eggs eaten in this meal
          </Text>

          {/* Quick Amount Chips */}
          <View style={styles.chipsRow}>
            {QUICK_EGG_AMOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.chipButton}
                onPress={() => handleQuickAdd(val)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>+{val} 🥚</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <View style={styles.inputFieldRow}>
            <TextInput
              style={styles.eggNumberInput}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={eggInput}
              onChangeText={setEggInput}
              maxLength={3}
            />
            <Text style={styles.eggInputLabel}>EGGS</Text>
            {parseInt(eggInput, 10) > 0 && (
              <View style={styles.calcPreview}>
                <Text style={styles.calcPreviewText}>
                  ={(parseInt(eggInput, 10) * 6.3).toFixed(1)}g protein
                </Text>
              </View>
            )}
          </View>

          {/* Notes */}
          <TextInput
            style={styles.notesInput}
            placeholder="Meal note (e.g. Boiled, 3 scrambled with toast, post-workout)"
            placeholderTextColor={COLORS.textMuted}
            value={notesInput}
            onChangeText={setNotesInput}
            maxLength={60}
          />

          {/* Submit */}
          <TouchableOpacity
            style={styles.logButton}
            onPress={handleLogEggs}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.logButtonText}>LOG EGGS & PROTEIN 🥚</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Meal Logs */}
        <View style={styles.historyCard}>
          <Text style={styles.historyHeader}>TODAY'S EGG MEALS</Text>

          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍳</Text>
              <Text style={styles.emptyTitle}>No eggs logged for this date</Text>
              <Text style={styles.emptySub}>
                Fuel your muscles! Add your breakfast or post-workout eggs above.
              </Text>
            </View>
          ) : (
            logs.map((item) => {
              const timeFormatted = new Date(item.logged_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={item.id} style={styles.mealRow}>
                  <View style={styles.mealBadge}>
                    <Text style={styles.mealBadgeText}>🥚 {item.count}</Text>
                  </View>

                  <View style={styles.mealInfo}>
                    <Text style={styles.mealProtein}>+{item.protein_grams}g Protein</Text>
                    <Text style={styles.mealTime}>
                      ⏰ {timeFormatted} {item.notes ? `• ${item.notes}` : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteLog(item.id, item.count)}
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.vitalityGreen,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 240,
  },
  fuelCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.vitalityGreen,
    marginBottom: 14,
  },
  fuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fuelTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  vitalityBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vitalityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.vitalityGreen,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 16,
    padding: 14,
    marginRight: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  proteinBox: {
    marginRight: 0,
    marginLeft: 6,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  metricIcon: {
    fontSize: 22,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  metricGoal: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  progressStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.vitalityGreen,
  },
  inputCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  inputCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  inputCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chipButton: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.vitalityGreen,
  },
  inputFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.vitalityGreen,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 12,
  },
  eggNumberInput: {
    flex: 1,
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.white,
    padding: 0,
  },
  eggInputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginRight: 10,
  },
  calcPreview: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calcPreviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.vitalityGreen,
  },
  notesInput: {
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
    backgroundColor: COLORS.vitalityGreen,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.vitalityGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1.2,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
  },
  mealBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.vitalityGreen,
  },
  mealInfo: {
    flex: 1,
  },
  mealProtein: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  mealTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
});
