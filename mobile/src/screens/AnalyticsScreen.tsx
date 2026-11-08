import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { MonthlyPushupChart } from '../components/MonthlyPushupChart';
import { MonthlyEggChart } from '../components/MonthlyEggChart';
import { getMonthlyPushupStats, MonthlyPushupStats } from '../api/pushupsApi';
import { getMonthlyEggStats, MonthlyEggStats } from '../api/eggsApi';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const AnalyticsScreen: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [activeTab, setActiveTab] = useState<'pushups' | 'eggs'>('pushups');

  const [pushupStats, setPushupStats] = useState<MonthlyPushupStats | null>(null);
  const [eggStats, setEggStats] = useState<MonthlyEggStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchMonthlyData = useCallback(async (year: number, month: number) => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        getMonthlyPushupStats(year, month),
        getMonthlyEggStats(year, month),
      ]);

      if (pRes.success) setPushupStats(pRes);
      if (eRes.success) setEggStats(eRes);
    } catch (err: any) {
      console.warn('Fetch monthly stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchMonthlyData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMonthlyData(selectedYear, selectedMonth);
  };

  const changeMonth = (offset: number) => {
    let nextMonth = selectedMonth + offset;
    let nextYear = selectedYear;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Month Navigator Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeMonth(-1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-left" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.monthDisplay}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </Text>
          <Text style={styles.monthSub}>MONTHLY PROGRESS REPORT</Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeMonth(1)}
          activeOpacity={0.7}
        >
          <Icon name="chevron-right" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Metric Mode Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pushups' && styles.activePushupTab]}
          onPress={() => setActiveTab('pushups')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'pushups' && { color: COLORS.white },
            ]}
          >
            💪 PUSHUPS GRAPH
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'eggs' && styles.activeEggTab]}
          onPress={() => setActiveTab('eggs')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'eggs' && { color: COLORS.black },
            ]}
          >
            🥚 EGGS & PROTEIN
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.flamePrimary} />}
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={COLORS.flamePrimary} />
            <Text style={styles.loaderText}>Calculating Monthly Gains...</Text>
          </View>
        ) : activeTab === 'pushups' ? (
          pushupStats ? (
            <View>
              {/* Motivational Insight Card */}
              <View style={styles.insightCard}>
                <View style={styles.insightIconBadge}>
                  <Icon name="trophy" size={20} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightHeading}>DISCIPLINE TRAJECTORY</Text>
                  <Text style={styles.insightBody}>
                    You logged pushups on {pushupStats.activeDays} days this month.
                    {pushupStats.grandTotal > 0
                      ? ` Total of ${pushupStats.grandTotal} pushups! Consistency turns reps into steel.`
                      : ' No pushups logged yet this month. Begin your comeback today!'}
                  </Text>
                </View>
              </View>

              {/* Monthly Pushup Graph */}
              <MonthlyPushupChart
                data={pushupStats.chartData}
                grandTotal={pushupStats.grandTotal}
                averagePerDay={pushupStats.averagePerDay}
                highestDay={pushupStats.highestDay}
                targetGoal={user?.daily_pushup_goal || 100}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>No pushup data available for this month</Text>
          )
        ) : eggStats ? (
          <View>
            {/* Protein Synthesis Card */}
            <View style={[styles.insightCard, styles.eggInsightCard]}>
              <View style={[styles.insightIconBadge, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]}>
                <Icon name="protein" size={20} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightHeading, { color: COLORS.vitalityGreen }]}>
                  NUTRITION INSIGHT
                </Text>
                <Text style={styles.insightBody}>
                  Consumed {eggStats.grandTotalEggs} eggs delivering {eggStats.grandTotalProtein}g of pure
                  albumin protein fuel this month!
                </Text>
              </View>
            </View>

            {/* Monthly Eggs & Protein Graph */}
            <MonthlyEggChart
              data={eggStats.chartData}
              grandTotalEggs={eggStats.grandTotalEggs}
              grandTotalProtein={eggStats.grandTotalProtein}
              averageEggsPerDay={eggStats.averageEggsPerDay}
              targetProteinGoal={user?.daily_protein_goal || 25}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>No nutrition data available for this month</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  monthSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activePushupTab: {
    backgroundColor: COLORS.flamePrimary,
  },
  activeEggTab: {
    backgroundColor: COLORS.vitalityGreen,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: '600',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.3)',
    marginBottom: 12,
    alignItems: 'center',
  },
  eggInsightCard: {
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  insightIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  insightContent: {
    flex: 1,
  },
  insightHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.flameBright,
    letterSpacing: 1.2,
  },
  insightBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
