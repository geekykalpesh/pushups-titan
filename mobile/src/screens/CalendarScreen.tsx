import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Icon } from '../components/Icon';
import {
  getPushupContributions,
  getPushupsByDate,
  logPushupSet,
  deletePushupLog,
  PushupLog,
  DayPushupSummary,
} from '../api/pushupsApi';
import {
  getEggContributions,
  getEggsByDate,
  logEggCount,
  deleteEggLog,
  EggLog,
  DayEggSummary,
} from '../api/eggsApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

// GitHub Dark Contribution Palette
const GITHUB_COLORS = {
  canvas: '#0d1117',
  cardBg: '#161b22',
  cardBorder: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  blueAccent: '#58a6ff',
  greenL0: '#161b22',
  greenL1: '#0e4429',
  greenL2: '#006d32',
  greenL3: '#26a641',
  greenL4: '#39d353',
  // Egg fuel palette
  goldL0: '#161b22',
  goldL1: '#382800',
  goldL2: '#634800',
  goldL3: '#bb8009',
  goldL4: '#f1e05a',
};

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type HeatmapMode = 'pushups' | 'eggs' | 'titan';
type RangeWeeks = 16 | 24 | 36;

interface DayCell {
  dateStr: string;
  date: Date;
  dayOfWeek: number;
  dayOfMonth: number;
  monthIndex: number;
  isToday: boolean;
  isFuture: boolean;
  pushupCount: number;
  eggCount: number;
  proteinGrams: number;
  level: number;
}

interface WeekColumn {
  weekIndex: number;
  monthLabel?: string;
  days: DayCell[];
}

const formatDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatReadableDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  const dayName = WEEKDAY_LABELS[dateObj.getDay()];
  const monthName = FULL_MONTH_NAMES[m];
  return `${dayName}, ${monthName} ${d}, ${y}`;
};

export const CalendarScreen: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateStr(today), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [mode, setMode] = useState<HeatmapMode>('pushups');
  const [rangeWeeks, setRangeWeeks] = useState<RangeWeeks>(24);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Contributions maps
  const [pushupContributions, setPushupContributions] = useState<Record<string, number>>({});
  const [eggContributions, setEggContributions] = useState<
    Record<string, { eggs: number; protein: number }>
  >({});
  const [totalPushupsInRange, setTotalPushupsInRange] = useState<number>(0);
  const [totalEggsInRange, setTotalEggsInRange] = useState<number>(0);
  const [totalProteinInRange, setTotalProteinInRange] = useState<number>(0);

  // Day Telemetry for selectedDate
  const [dayLoading, setDayLoading] = useState<boolean>(false);
  const [dayPushups, setDayPushups] = useState<DayPushupSummary | null>(null);
  const [dayEggs, setDayEggs] = useState<DayEggSummary | null>(null);

  // Quick Log Modals
  const [pushupModalVisible, setPushupModalVisible] = useState<boolean>(false);
  const [pushupCountInput, setPushupCountInput] = useState<string>('25');
  const [pushupSubmitting, setPushupSubmitting] = useState<boolean>(false);

  const [eggModalVisible, setEggModalVisible] = useState<boolean>(false);
  const [eggCountInput, setEggCountInput] = useState<string>('2');
  const [eggSubmitting, setEggSubmitting] = useState<boolean>(false);

  const scrollRef = useRef<any>(null);

  const goToPreviousDay = useCallback(() => {
    console.log('>>> [NAV] goToPreviousDay clicked! Current:', selectedDate);
    const parts = selectedDate.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    cur.setDate(cur.getDate() - 1);
    const nextStr = formatDateStr(cur);
    console.log('>>> [NAV] Setting new date:', nextStr);
    setSelectedDate(nextStr);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    console.log('>>> [NAV] goToNextDay clicked! Current:', selectedDate);
    const parts = selectedDate.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    cur.setDate(cur.getDate() + 1);
    if (cur.getTime() <= today.getTime()) {
      const nextStr = formatDateStr(cur);
      console.log('>>> [NAV] Setting new date:', nextStr);
      setSelectedDate(nextStr);
    }
  }, [selectedDate, today]);

  // Fetch Contribution Maps from backend
  const fetchContributions = useCallback(async () => {
    try {
      const days = rangeWeeks * 7 + 7;
      const [pRes, eRes] = await Promise.all([
        getPushupContributions(days).catch(() => null),
        getEggContributions(days).catch(() => null),
      ]);

      if (pRes && pRes.contributions) {
        setPushupContributions(pRes.contributions);
        setTotalPushupsInRange(pRes.total || 0);
      }
      if (eRes && eRes.contributions) {
        setEggContributions(eRes.contributions);
        setTotalEggsInRange(eRes.totalEggs || 0);
        setTotalProteinInRange(eRes.totalProtein || 0);
      }
    } catch (err) {
      console.warn('Error fetching contributions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rangeWeeks]);

  // Fetch Telemetry for selectedDate
  const fetchDayTelemetry = useCallback(async (dateToFetch: string) => {
    setDayLoading(true);
    try {
      const [pushupRes, eggRes] = await Promise.all([
        getPushupsByDate(dateToFetch).catch(() => null),
        getEggsByDate(dateToFetch).catch(() => null),
      ]);
      setDayPushups(pushupRes);
      setDayEggs(eggRes);
    } catch (err) {
      console.warn('Day telemetry error:', err);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  useEffect(() => {
    fetchDayTelemetry(selectedDate);
  }, [selectedDate, fetchDayTelemetry]);

  // Auto-scroll to the end (current week) on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [rangeWeeks, loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchContributions(), fetchDayTelemetry(selectedDate)]);
    setRefreshing(false);
  }, [fetchContributions, fetchDayTelemetry, selectedDate]);

  // Build GitHub Matrix Columns (exact 7 rows: Sunday to Saturday)
  const { columns, currentStreak, longestStreak, activeDaysCount } = useMemo(() => {
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 6 is Sat
    const currentSunday = new Date(today);
    currentSunday.setHours(0, 0, 0, 0);
    currentSunday.setDate(today.getDate() - currentDayOfWeek);

    const startSunday = new Date(currentSunday);
    startSunday.setDate(currentSunday.getDate() - (rangeWeeks - 1) * 7);

    const cols: WeekColumn[] = [];
    let lastRenderedMonth = -1;

    let activeDays = 0;
    const dailyCountsList: { dateStr: string; hasActivity: boolean }[] = [];

    for (let w = 0; w < rangeWeeks; w++) {
      const weekSun = new Date(startSunday);
      weekSun.setDate(startSunday.getDate() + w * 7);

      const days: DayCell[] = [];
      let monthLabel: string | undefined = undefined;

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(weekSun);
        cellDate.setDate(weekSun.getDate() + d);

        const dateStr = formatDateStr(cellDate);
        const isToday = dateStr === todayStr;
        const isFuture = cellDate.getTime() > today.getTime();

        const pCount = pushupContributions[dateStr] || 0;
        const eggData = eggContributions[dateStr] || { eggs: 0, protein: 0 };
        const eCount = eggData.eggs || 0;
        const prot = eggData.protein || 0;

        let level = 0;
        if (mode === 'pushups') {
          if (pCount > 0) {
            if (pCount >= 100) level = 4;
            else if (pCount >= 50) level = 3;
            else if (pCount >= 25) level = 2;
            else level = 1;
          }
        } else if (mode === 'eggs') {
          if (eCount > 0) {
            if (eCount >= 6) level = 4;
            else if (eCount >= 4) level = 3;
            else if (eCount >= 2) level = 2;
            else level = 1;
          }
        } else {
          // titan combined
          const pL = pCount >= 100 ? 4 : pCount >= 50 ? 3 : pCount >= 25 ? 2 : pCount > 0 ? 1 : 0;
          const eL = eCount >= 6 ? 4 : eCount >= 4 ? 3 : eCount >= 2 ? 2 : eCount > 0 ? 1 : 0;
          level = Math.max(pL, eL);
        }

        const hasAct = mode === 'pushups' ? pCount > 0 : mode === 'eggs' ? eCount > 0 : pCount > 0 || eCount > 0;
        if (!isFuture) {
          if (hasAct) activeDays++;
          dailyCountsList.push({ dateStr, hasActivity: hasAct });
        }

        const mIdx = cellDate.getMonth();
        // Check if this week contains the 1st of a month or is a new month
        if (cellDate.getDate() <= 7 && mIdx !== lastRenderedMonth) {
          lastRenderedMonth = mIdx;
          monthLabel = MONTH_SHORT_NAMES[mIdx];
        }

        days.push({
          dateStr,
          date: cellDate,
          dayOfWeek: d,
          dayOfMonth: cellDate.getDate(),
          monthIndex: mIdx,
          isToday,
          isFuture,
          pushupCount: pCount,
          eggCount: eCount,
          proteinGrams: prot,
          level,
        });
      }

      cols.push({
        weekIndex: w,
        monthLabel,
        days,
      });
    }

    // Calculate streaks
    let currentStreakCount = 0;
    let longestStreakCount = 0;
    let tempStreak = 0;

    for (let i = 0; i < dailyCountsList.length; i++) {
      if (dailyCountsList[i].hasActivity) {
        tempStreak++;
        if (tempStreak > longestStreakCount) longestStreakCount = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Current streak from end backwards
    for (let i = dailyCountsList.length - 1; i >= 0; i--) {
      if (dailyCountsList[i].hasActivity) {
        currentStreakCount++;
      } else {
        // If today has 0 activity yet, allow yesterday's streak to count
        if (i === dailyCountsList.length - 1) continue;
        break;
      }
    }

    return {
      columns: cols,
      currentStreak: currentStreakCount,
      longestStreak: longestStreakCount,
      activeDaysCount: activeDays,
    };
  }, [today, todayStr, rangeWeeks, pushupContributions, eggContributions, mode, selectedDate]);

  // Pixel Color Resolver
  const getPixelColor = useCallback((level: number, modeType: HeatmapMode) => {
    if (modeType === 'pushups') {
      switch (level) {
        case 1:
          return GITHUB_COLORS.greenL1;
        case 2:
          return GITHUB_COLORS.greenL2;
        case 3:
          return GITHUB_COLORS.greenL3;
        case 4:
          return GITHUB_COLORS.greenL4;
        default:
          return GITHUB_COLORS.greenL0;
      }
    } else if (modeType === 'eggs') {
      switch (level) {
        case 1:
          return GITHUB_COLORS.goldL1;
        case 2:
          return GITHUB_COLORS.goldL2;
        case 3:
          return GITHUB_COLORS.goldL3;
        case 4:
          return GITHUB_COLORS.goldL4;
        default:
          return GITHUB_COLORS.goldL0;
      }
    } else {
      // titan mode
      switch (level) {
        case 1:
          return '#0e4429';
        case 2:
          return '#196127';
        case 3:
          return '#d29922';
        case 4:
          return '#39d353';
        default:
          return GITHUB_COLORS.greenL0;
      }
    }
  }, []);

  // Quick Log Pushup Handler
  const handleQuickLogPushup = async () => {
    const val = parseInt(pushupCountInput, 10);
    if (isNaN(val) || val <= 0) return;
    setPushupSubmitting(true);
    try {
      await logPushupSet(val, 'Logged via GitHub Calendar', selectedDate);
      setPushupModalVisible(false);
      // Refresh data
      await Promise.all([fetchContributions(), fetchDayTelemetry(selectedDate)]);
    } catch (err) {
      console.warn('Quick log pushup error:', err);
    } finally {
      setPushupSubmitting(false);
    }
  };

  // Quick Log Egg Handler
  const handleQuickLogEgg = async () => {
    const val = parseInt(eggCountInput, 10);
    if (isNaN(val) || val <= 0) return;
    setEggSubmitting(true);
    try {
      await logEggCount(val, 'Logged via GitHub Calendar', selectedDate);
      setEggModalVisible(false);
      // Refresh data
      await Promise.all([fetchContributions(), fetchDayTelemetry(selectedDate)]);
    } catch (err) {
      console.warn('Quick log egg error:', err);
    } finally {
      setEggSubmitting(false);
    }
  };

  // Delete Pushup Handler
  const handleDeletePushup = async (id: number) => {
    try {
      await deletePushupLog(id);
      await Promise.all([fetchContributions(), fetchDayTelemetry(selectedDate)]);
    } catch (err) {
      console.warn('Delete pushup error:', err);
    }
  };

  // Delete Egg Handler
  const handleDeleteEgg = async (id: number) => {
    try {
      await deleteEggLog(id);
      await Promise.all([fetchContributions(), fetchDayTelemetry(selectedDate)]);
    } catch (err) {
      console.warn('Delete egg error:', err);
    }
  };

  // Selected date cell telemetry summary info
  const selectedPushupCount = pushupContributions[selectedDate] || 0;
  const selectedEggData = eggContributions[selectedDate] || { eggs: 0, protein: 0 };
  const pushupGoal = dayPushups?.goal || 100;
  const pushupPercent = Math.min(100, Math.round((selectedPushupCount / pushupGoal) * 100));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GITHUB_COLORS.blueAccent}
            colors={[GITHUB_COLORS.blueAccent]}
          />
        }
      >
        {/* Header Title */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Icon name="calendar" size={24} color={GITHUB_COLORS.blueAccent} />
            <Text style={styles.headerTitle}>CONTRIBUTION GRAPH</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Square Pixel Heatmap & Activity Telemetry
          </Text>
        </View>

        {/* View Mode Selector Tabs */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'pushups' && styles.modeTabActiveGreen]}
            onPress={() => setMode('pushups')}
            activeOpacity={0.8}
          >
            <Icon
              name="zap"
              size={15}
              color={mode === 'pushups' ? '#000' : GITHUB_COLORS.greenL4}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'pushups' && styles.modeTabTextActiveDark,
              ]}
            >
              Pushups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'eggs' && styles.modeTabActiveGold]}
            onPress={() => setMode('eggs')}
            activeOpacity={0.8}
          >
            <Icon
              name="egg"
              size={15}
              color={mode === 'eggs' ? '#000' : GITHUB_COLORS.goldL4}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'eggs' && styles.modeTabTextActiveDark,
              ]}
            >
              Eggs & Fuel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'titan' && styles.modeTabActiveTitan]}
            onPress={() => setMode('titan')}
            activeOpacity={0.8}
          >
            <Icon
              name="trophy"
              size={15}
              color={mode === 'titan' ? '#000' : GITHUB_COLORS.blueAccent}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'titan' && styles.modeTabTextActiveDark,
              ]}
            >
              Titan Combined
            </Text>
          </TouchableOpacity>
        </View>

        {/* GitHub Graph Card Container */}
        <View style={styles.githubCard}>
          {/* Card Top Banner: Volume + Streaks */}
          <View style={styles.githubCardHeader}>
            <View>
              <Text style={styles.githubVolumeNumber}>
                {mode === 'pushups'
                  ? `${totalPushupsInRange.toLocaleString()} pushups`
                  : mode === 'eggs'
                  ? `${totalEggsInRange} eggs (${totalProteinInRange.toFixed(0)}g protein)`
                  : `${totalPushupsInRange} reps • ${totalEggsInRange} eggs`}
              </Text>
              <Text style={styles.githubVolumeSub}>
                logged in the last {rangeWeeks} weeks
              </Text>
            </View>

            {/* Range Weeks Switcher */}
            <View style={styles.rangePillGroup}>
              {([16, 24, 36] as RangeWeeks[]).map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.rangePill, rangeWeeks === w && styles.rangePillActive]}
                  onPress={() => setRangeWeeks(w)}
                >
                  <Text
                    style={[
                      styles.rangePillText,
                      rangeWeeks === w && styles.rangePillTextActive,
                    ]}
                  >
                    {w}w
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Streak & Stats Badges */}
          <View style={styles.streakBadgesRow}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeEmoji}>🔥</Text>
              <Text style={styles.streakBadgeLabel}>Current Streak</Text>
              <Text style={styles.streakBadgeValue}>{currentStreak} days</Text>
            </View>

            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeEmoji}>⚡</Text>
              <Text style={styles.streakBadgeLabel}>Longest Streak</Text>
              <Text style={styles.streakBadgeValue}>{longestStreak} days</Text>
            </View>

            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeEmoji}>🎯</Text>
              <Text style={styles.streakBadgeLabel}>Active Days</Text>
              <Text style={styles.streakBadgeValue}>{activeDaysCount} days</Text>
            </View>
          </View>

          {/* Tooltip Preview Banner */}
          <View style={styles.tooltipBanner}>
            <Icon name="check" size={14} color={GITHUB_COLORS.blueAccent} />
            <Text style={styles.tooltipBannerText}>
              {formatReadableDate(selectedDate)}:
              <Text style={styles.tooltipBannerBold}>
                {' '}
                {selectedPushupCount} pushups
                {selectedEggData.eggs > 0 ? `, ${selectedEggData.eggs} eggs` : ''}
              </Text>
            </Text>
          </View>

          {/* Matrix View (Horizontally Scrollable) */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={GITHUB_COLORS.greenL4} />
              <Text style={styles.loadingText}>Building contribution matrix...</Text>
            </View>
          ) : (
            <View style={styles.matrixWrapper}>
              {/* Left Y-Axis Weekday Labels (GitHub standard: Mon, Wed, Fri) */}
              <View style={styles.yAxisLabels}>
                <View style={styles.monthHeaderSpacer} />
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}> </Text>
                </View>
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}>Mon</Text>
                </View>
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}> </Text>
                </View>
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}>Wed</Text>
                </View>
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}> </Text>
                </View>
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}>Fri</Text>
                </View>
                <View style={styles.yAxisRow}>
                  <Text style={styles.yAxisText}> </Text>
                </View>
              </View>

              {/* Horizontally scrolling week columns */}
              <ScrollView
                ref={scrollRef}
                horizontal
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.matrixScrollContent}
              >
                {columns.map((col) => (
                  <View key={`col-${col.weekIndex}`} style={styles.weekColumn}>
                    {/* Month Label Header */}
                    <View style={styles.monthLabelContainer}>
                      {col.monthLabel ? (
                        <Text style={styles.monthLabelText} numberOfLines={1}>{col.monthLabel}</Text>
                      ) : (
                        <Text style={styles.monthLabelText}> </Text>
                      )}
                    </View>

                    {/* 7 Days: Sun (0) to Sat (6) */}
                    {col.days.map((day) => {
                      const isSelected = day.dateStr === selectedDate;
                      const cellColor = day.isFuture
                        ? 'transparent'
                        : getPixelColor(day.level, mode);

                      return (
                        <TouchableOpacity
                          key={day.dateStr}
                          style={[
                            styles.squarePixel,
                            { backgroundColor: cellColor },
                            day.isFuture && styles.futurePixel,
                            day.isToday && styles.todayPixelGlow,
                            isSelected && styles.selectedPixel,
                          ]}
                          disabled={day.isFuture}
                          onPress={() => {
                            console.log('>>> [PIXEL] Pressed:', day.dateStr);
                            setSelectedDate(day.dateStr);
                          }}
                          hitSlop={{ top: 5, bottom: 5, left: 3, right: 3 }}
                          activeOpacity={0.6}
                        >
                          {day.isToday && (
                            <View style={styles.todayInnerDot} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* GitHub Exact Legend: "Less [◽◽◽◽◽] More" */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendText}>Less</Text>
            <View
              style={[
                styles.legendPixel,
                { backgroundColor: getPixelColor(0, mode) },
              ]}
            />
            <View
              style={[
                styles.legendPixel,
                { backgroundColor: getPixelColor(1, mode) },
              ]}
            />
            <View
              style={[
                styles.legendPixel,
                { backgroundColor: getPixelColor(2, mode) },
              ]}
            />
            <View
              style={[
                styles.legendPixel,
                { backgroundColor: getPixelColor(3, mode) },
              ]}
            />
            <View
              style={[
                styles.legendPixel,
                { backgroundColor: getPixelColor(4, mode) },
              ]}
            />
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        {/* Selected Day Telemetry Inspector */}
        <View style={styles.telemetryCard}>
          {/* Top Title & Today Badge */}
          <View style={styles.telemetryHeaderTopRow}>
            <View style={styles.telemetryHeaderTitleGroup}>
              <Text style={styles.telemetryHeaderTitle}>
                {formatReadableDate(selectedDate)}
              </Text>
              <Text style={styles.telemetryHeaderSubtitle}>
                Detailed Activity & Fuel Breakdown
              </Text>
            </View>
            {selectedDate === todayStr && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </View>

          {/* Quick Date Stepper Toolbar */}
          <View style={styles.dayNavToolbar}>
            <TouchableOpacity
              style={styles.navDayBtn}
              onPress={goToPreviousDay}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={14} color={GITHUB_COLORS.blueAccent} />
              <Text style={styles.navDayBtnText}>Previous Day</Text>
            </TouchableOpacity>

            {selectedDate !== todayStr && (
              <TouchableOpacity
                style={styles.todayJumpBtn}
                onPress={() => setSelectedDate(todayStr)}
                activeOpacity={0.7}
              >
                <Text style={styles.todayJumpBtnText}>Jump to Today</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.navDayBtn,
                selectedDate === todayStr && styles.navDayBtnDisabled,
              ]}
              onPress={goToNextDay}
              disabled={selectedDate === todayStr}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.navDayBtnText,
                  selectedDate === todayStr && styles.navDayBtnTextDisabled,
                ]}
              >
                Next Day
              </Text>
              <Icon
                name="chevron-right"
                size={14}
                color={
                  selectedDate === todayStr
                    ? GITHUB_COLORS.cardBorder
                    : GITHUB_COLORS.blueAccent
                }
              />
            </TouchableOpacity>
          </View>

          {/* Key Metrics Row */}
          <View style={styles.telemetryMetricsRow}>
            {/* Pushups Metric */}
            <View style={styles.telemetryMetricItem}>
              <View style={styles.metricIconCircleGreen}>
                <Icon name="zap" size={18} color={GITHUB_COLORS.greenL4} />
              </View>
              <Text style={styles.metricValue}>{selectedPushupCount}</Text>
              <Text style={styles.metricLabel}>Pushups Logged</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${pushupPercent}%`,
                      backgroundColor: GITHUB_COLORS.greenL4,
                    },
                  ]}
                />
              </View>
              <Text style={styles.metricSub}>
                {pushupPercent}% of {pushupGoal} goal
              </Text>
            </View>

            {/* Egg / Fuel Metric */}
            <View style={styles.telemetryMetricItem}>
              <View style={styles.metricIconCircleGold}>
                <Icon name="egg" size={18} color={GITHUB_COLORS.goldL4} />
              </View>
              <Text style={styles.metricValue}>{selectedEggData.eggs}</Text>
              <Text style={styles.metricLabel}>Eggs Eaten</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, (selectedEggData.eggs / 4) * 100)}%`,
                      backgroundColor: GITHUB_COLORS.goldL4,
                    },
                  ]}
                />
              </View>
              <Text style={styles.metricSub}>
                +{selectedEggData.protein}g protein
              </Text>
            </View>
          </View>

          {/* Quick Actions for Selected Date */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionButtonGreen}
              onPress={() => setPushupModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={18} color="#000" />
              <Text style={styles.quickActionTextDark}>Log Pushup Set</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButtonGold}
              onPress={() => setEggModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="egg" size={18} color="#000" />
              <Text style={styles.quickActionTextDark}>Log Egg Fuel</Text>
            </TouchableOpacity>
          </View>

          {/* Pushup Sets Timeline */}
          <View style={styles.setsSection}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="chart" size={16} color={GITHUB_COLORS.textSecondary} />
              <Text style={styles.sectionTitle}>PUSHUP SETS LOGGED</Text>
            </View>

            {dayLoading ? (
              <ActivityIndicator size="small" color={GITHUB_COLORS.greenL4} />
            ) : dayPushups?.sets && dayPushups.sets.length > 0 ? (
              <View style={styles.setsList}>
                {dayPushups.sets.map((set, idx) => (
                  <View key={set.id} style={styles.setItem}>
                    <View style={styles.setIndexBadge}>
                      <Text style={styles.setIndexText}>#{dayPushups.sets.length - idx}</Text>
                    </View>
                    <View style={styles.setInfo}>
                      <Text style={styles.setCountText}>+{set.count} Pushups</Text>
                      {set.formatted_time && (
                        <Text style={styles.setTimeText}>{set.formatted_time}</Text>
                      )}
                      {set.notes ? (
                        <Text style={styles.setNotesText}>{set.notes}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePushup(set.id)}
                    >
                      <Icon name="trash" size={16} color={COLORS.urgentRed} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySetsBox}>
                <Text style={styles.emptySetsText}>
                  No pushup sets recorded for this date.
                </Text>
                <Text style={styles.emptySetsSub}>
                  Use "Log Pushup Set" above to record sets for {selectedDate}.
                </Text>
              </View>
            )}
          </View>

          {/* Egg Nutrition Fuel Logs */}
          <View style={[styles.setsSection, { marginTop: 18 }]}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="egg" size={16} color={GITHUB_COLORS.textSecondary} />
              <Text style={styles.sectionTitle}>EGG FUEL LOGS</Text>
            </View>

            {dayLoading ? (
              <ActivityIndicator size="small" color={GITHUB_COLORS.goldL4} />
            ) : dayEggs?.logs && dayEggs.logs.length > 0 ? (
              <View style={styles.setsList}>
                {dayEggs.logs.map((log) => (
                  <View key={log.id} style={styles.setItem}>
                    <View style={styles.setIndexBadgeGold}>
                      <Text style={styles.setIndexTextDark}>🥚</Text>
                    </View>
                    <View style={styles.setInfo}>
                      <Text style={styles.setCountTextGold}>
                        +{log.count} Eggs (+{log.protein_grams}g Protein)
                      </Text>
                      {log.notes ? (
                        <Text style={styles.setNotesText}>{log.notes}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEgg(log.id)}
                    >
                      <Icon name="trash" size={16} color={COLORS.urgentRed} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySetsBox}>
                <Text style={styles.emptySetsText}>
                  No egg logs recorded for this date.
                </Text>
                <Text style={styles.emptySetsSub}>
                  Fuel your pushup recovery with quality protein.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Quick Log Pushup Modal */}
      <Modal
        visible={pushupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPushupModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Icon name="zap" size={24} color={GITHUB_COLORS.greenL4} />
              <Text style={styles.modalTitle}>Log Pushup Set</Text>
            </View>
            <Text style={styles.modalSubtitle}>Date: {selectedDate}</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={pushupCountInput}
              onChangeText={setPushupCountInput}
              placeholder="e.g. 25"
              placeholderTextColor={GITHUB_COLORS.textSecondary}
              autoFocus
            />

            {/* Quick selector presets */}
            <View style={styles.presetRow}>
              {[15, 20, 25, 30, 50].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => setPushupCountInput(String(preset))}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPushupModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtnGreen}
                onPress={handleQuickLogPushup}
                disabled={pushupSubmitting}
              >
                {pushupSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSubmitTextDark}>Save Set</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Log Egg Modal */}
      <Modal
        visible={eggModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEggModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Icon name="egg" size={24} color={GITHUB_COLORS.goldL4} />
              <Text style={styles.modalTitle}>Log Egg Fuel</Text>
            </View>
            <Text style={styles.modalSubtitle}>Date: {selectedDate}</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={eggCountInput}
              onChangeText={setEggCountInput}
              placeholder="e.g. 2"
              placeholderTextColor={GITHUB_COLORS.textSecondary}
              autoFocus
            />

            {/* Quick selector presets */}
            <View style={styles.presetRow}>
              {[1, 2, 3, 4, 6].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => setEggCountInput(String(preset))}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEggModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtnGold}
                onPress={handleQuickLogEgg}
                disabled={eggSubmitting}
              >
                {eggSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSubmitTextDark}>Save Fuel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const PIXEL_SIZE = 13;
const PIXEL_GAP = 3;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d13',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GITHUB_COLORS.textSecondary,
    marginTop: 4,
  },
  // Mode tabs
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GITHUB_COLORS.cardBg,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
  },
  modeTabActiveGreen: {
    backgroundColor: GITHUB_COLORS.greenL4,
    borderColor: GITHUB_COLORS.greenL4,
  },
  modeTabActiveGold: {
    backgroundColor: GITHUB_COLORS.goldL4,
    borderColor: GITHUB_COLORS.goldL4,
  },
  modeTabActiveTitan: {
    backgroundColor: GITHUB_COLORS.blueAccent,
    borderColor: GITHUB_COLORS.blueAccent,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: GITHUB_COLORS.textPrimary,
  },
  modeTabTextActiveDark: {
    color: '#000000',
  },
  // GitHub Main Card
  githubCard: {
    backgroundColor: GITHUB_COLORS.cardBg,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  githubCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  githubVolumeNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  githubVolumeSub: {
    fontSize: 12,
    color: GITHUB_COLORS.textSecondary,
    marginTop: 2,
  },
  rangePillGroup: {
    flexDirection: 'row',
    backgroundColor: GITHUB_COLORS.canvas,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GITHUB_COLORS.cardBorder,
    padding: 2,
  },
  rangePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rangePillActive: {
    backgroundColor: GITHUB_COLORS.cardBorder,
  },
  rangePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: GITHUB_COLORS.textSecondary,
  },
  rangePillTextActive: {
    color: '#ffffff',
  },
  // Streak Badges
  streakBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  streakBadge: {
    flex: 1,
    backgroundColor: GITHUB_COLORS.canvas,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  streakBadgeEmoji: {
    fontSize: 14,
    marginBottom: 2,
  },
  streakBadgeLabel: {
    fontSize: 10,
    color: GITHUB_COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakBadgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  // Tooltip Banner
  tooltipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    borderColor: 'rgba(88, 166, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  tooltipBannerText: {
    fontSize: 12,
    color: GITHUB_COLORS.blueAccent,
    flex: 1,
  },
  tooltipBannerBold: {
    fontWeight: '800',
    color: '#ffffff',
  },
  // Matrix Layout
  matrixWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  yAxisLabels: {
    width: 28,
    marginRight: 4,
  },
  monthHeaderSpacer: {
    height: 18,
  },
  yAxisRow: {
    height: PIXEL_SIZE + PIXEL_GAP,
    justifyContent: 'center',
  },
  yAxisText: {
    fontSize: 9,
    fontWeight: '600',
    color: GITHUB_COLORS.textSecondary,
  },
  matrixScrollContent: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  weekColumn: {
    width: PIXEL_SIZE + PIXEL_GAP,
    marginRight: 0,
  },
  monthLabelContainer: {
    height: 18,
    width: 36,
    overflow: 'visible',
    justifyContent: 'flex-start',
  },
  monthLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: GITHUB_COLORS.textSecondary,
    width: 36,
  },
  squarePixel: {
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    borderRadius: 2,
    marginBottom: PIXEL_GAP,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  futurePixel: {
    borderColor: 'transparent',
  },
  selectedPixel: {
    borderColor: GITHUB_COLORS.blueAccent,
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
    zIndex: 10,
  },
  todayPixelGlow: {
    borderColor: '#ffffff',
  },
  todayInnerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ffffff',
  },
  // Legend
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
    paddingTop: 8,
    borderTopColor: GITHUB_COLORS.cardBorder,
    borderTopWidth: 1,
  },
  legendText: {
    fontSize: 10,
    color: GITHUB_COLORS.textSecondary,
    marginHorizontal: 3,
  },
  legendPixel: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Telemetry Card
  telemetryCard: {
    backgroundColor: GITHUB_COLORS.cardBg,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  telemetryHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  telemetryHeaderTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  telemetryHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  telemetryHeaderSubtitle: {
    fontSize: 12,
    color: GITHUB_COLORS.textSecondary,
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
    borderColor: GITHUB_COLORS.blueAccent,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: GITHUB_COLORS.blueAccent,
    letterSpacing: 0.8,
  },
  dayNavToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: GITHUB_COLORS.canvas,
    borderRadius: 8,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    padding: 4,
  },
  navDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  navDayBtnDisabled: {
    opacity: 0.35,
  },
  navDayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: GITHUB_COLORS.blueAccent,
  },
  navDayBtnTextDisabled: {
    color: GITHUB_COLORS.cardBorder,
  },
  todayJumpBtn: {
    flex: 1,
    backgroundColor: 'rgba(88, 166, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  todayJumpBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: GITHUB_COLORS.blueAccent,
  },
  telemetryMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  telemetryMetricItem: {
    flex: 1,
    backgroundColor: GITHUB_COLORS.canvas,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  metricIconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(57, 211, 83, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconCircleGold: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(241, 224, 90, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: GITHUB_COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: GITHUB_COLORS.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  metricSub: {
    fontSize: 10,
    color: GITHUB_COLORS.textSecondary,
    marginTop: 4,
  },
  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionButtonGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GITHUB_COLORS.greenL4,
    borderRadius: 8,
    paddingVertical: 10,
  },
  quickActionButtonGold: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GITHUB_COLORS.goldL4,
    borderRadius: 8,
    paddingVertical: 10,
  },
  quickActionTextDark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  // Sets Breakdown
  setsSection: {
    borderTopWidth: 1,
    borderTopColor: GITHUB_COLORS.cardBorder,
    paddingTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: GITHUB_COLORS.textSecondary,
    letterSpacing: 1,
  },
  setsList: {
    gap: 8,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GITHUB_COLORS.canvas,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  setIndexBadge: {
    backgroundColor: 'rgba(57, 211, 83, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  setIndexBadgeGold: {
    backgroundColor: 'rgba(241, 224, 90, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  setIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: GITHUB_COLORS.greenL4,
  },
  setIndexTextDark: {
    fontSize: 12,
  },
  setInfo: {
    flex: 1,
  },
  setCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  setCountTextGold: {
    fontSize: 14,
    fontWeight: '700',
    color: GITHUB_COLORS.goldL4,
  },
  setTimeText: {
    fontSize: 11,
    color: GITHUB_COLORS.textSecondary,
    marginTop: 2,
  },
  setNotesText: {
    fontSize: 11,
    color: GITHUB_COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
  },
  emptySetsBox: {
    backgroundColor: GITHUB_COLORS.canvas,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GITHUB_COLORS.cardBorder,
  },
  emptySetsText: {
    fontSize: 12,
    fontWeight: '600',
    color: GITHUB_COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySetsSub: {
    fontSize: 11,
    color: '#555f6d',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: GITHUB_COLORS.textSecondary,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: GITHUB_COLORS.cardBg,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: GITHUB_COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: GITHUB_COLORS.canvas,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 12,
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  presetChip: {
    backgroundColor: GITHUB_COLORS.canvas,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: GITHUB_COLORS.textPrimary,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: GITHUB_COLORS.canvas,
    borderColor: GITHUB_COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: GITHUB_COLORS.textSecondary,
  },
  modalSubmitBtnGreen: {
    flex: 1,
    backgroundColor: GITHUB_COLORS.greenL4,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalSubmitBtnGold: {
    flex: 1,
    backgroundColor: GITHUB_COLORS.goldL4,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalSubmitTextDark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
});
