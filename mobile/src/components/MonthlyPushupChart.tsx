import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Icon } from './Icon';
import { safeVibrate } from '../utils/haptics';

interface ChartItem {
  day: number;
  label: string;
  pushups: number;
}

interface MonthlyPushupChartProps {
  data: ChartItem[];
  grandTotal: number;
  averagePerDay: number;
  highestDay: { date: string | null; count: number };
  targetGoal?: number;
}

type ViewMode = 'wave' | 'matrix' | 'weekly';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 190;
const POINT_WIDTH = 42;

export const MonthlyPushupChart: React.FC<MonthlyPushupChartProps> = ({
  data,
  grandTotal,
  averagePerDay,
  highestDay,
  targetGoal = 100,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('wave');
  const [selectedDay, setSelectedDay] = useState<ChartItem | null>(() => {
    // Default to highest day or latest active day
    const peak = data.find((d) => d.pushups === highestDay.count && d.pushups > 0);
    return peak || data[data.length - 1] || null;
  });

  // Calculate scales and metrics
  const maxPushups = useMemo(() => {
    const rawMax = Math.max(...data.map((d) => d.pushups), targetGoal);
    return Math.ceil(rawMax * 1.15); // 15% headroom for aesthetic wave breathing room
  }, [data, targetGoal]);

  const activeDaysCount = useMemo(() => {
    return data.filter((d) => d.pushups > 0).length;
  }, [data]);

  const consistencyRate = useMemo(() => {
    return data.length > 0 ? Math.round((activeDaysCount / data.length) * 100) : 0;
  }, [data, activeDaysCount]);

  // Compute (X, Y) coordinates for vector line rendering
  const coordinates = useMemo(() => {
    return data.map((item, index) => {
      const x = index * POINT_WIDTH + POINT_WIDTH / 2;
      const ratio = maxPushups > 0 ? item.pushups / maxPushups : 0;
      // Invert Y: 0 is at bottom (CHART_HEIGHT - 28), max is near top (20)
      const y = CHART_HEIGHT - 32 - ratio * (CHART_HEIGHT - 54);
      return { ...item, x, y };
    });
  }, [data, maxPushups]);

  // Compute connecting line segments
  const lineSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      segments.push({
        id: `seg-${i}`,
        left: midX - length / 2,
        top: midY - 1.5,
        length,
        angleDeg,
        hasActivity: p1.pushups > 0 || p2.pushups > 0,
      });
    }
    return segments;
  }, [coordinates]);

  // Compute Week-by-Week Velocity
  const weeklyData = useMemo(() => {
    const weeks: { weekNum: number; range: string; total: number; avg: number; active: number }[] = [];
    for (let i = 0; i < data.length; i += 7) {
      const slice = data.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      const total = slice.reduce((sum, d) => sum + d.pushups, 0);
      const active = slice.filter((d) => d.pushups > 0).length;
      const avg = Math.round(total / slice.length);
      const range = `Day ${slice[0].day} - ${slice[slice.length - 1].day}`;
      weeks.push({ weekNum, range, total, avg, active });
    }
    return weeks;
  }, [data]);

  // Target Goal Y line
  const targetGoalY = useMemo(() => {
    const ratio = maxPushups > 0 ? targetGoal / maxPushups : 0;
    return CHART_HEIGHT - 32 - ratio * (CHART_HEIGHT - 54);
  }, [maxPushups, targetGoal]);

  // Average Velocity Y line
  const avgVelocityY = useMemo(() => {
    const ratio = maxPushups > 0 ? averagePerDay / maxPushups : 0;
    return CHART_HEIGHT - 32 - ratio * (CHART_HEIGHT - 54);
  }, [maxPushups, averagePerDay]);

  const handleSelectDay = (dayItem: ChartItem) => {
    safeVibrate(20);
    setSelectedDay(dayItem);
  };

  // Rank title generator based on reps
  const getRankBadge = (count: number) => {
    if (count >= 150) return { title: 'TITAN OVERLORD', color: COLORS.goldStreak, icon: 'trophy' };
    if (count >= 100) return { title: 'CENTURION WARRIOR', color: COLORS.vitalityGreen, icon: 'shield' };
    if (count >= 50) return { title: 'SPARTAN CRUSHER', color: COLORS.flameBright, icon: 'flame' };
    if (count > 0) return { title: 'IRON DISCIPLINE', color: COLORS.textSecondary, icon: 'pushup' };
    return { title: 'REST & RECHARGE', color: COLORS.textMuted, icon: 'clock' };
  };

  return (
    <View style={styles.cardContainer}>
      {/* Sleek Header & Mode Switcher */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.cardTag}>PERFORMANCE TELEMETRY</Text>
          <Text style={styles.cardMainHeading}>Pushup Trajectory</Text>
        </View>

        {/* View Mode Pill Selector */}
        <View style={styles.modePillContainer}>
          <TouchableOpacity
            style={[styles.modePill, viewMode === 'wave' && styles.activeModePill]}
            onPress={() => {
              safeVibrate(15);
              setViewMode('wave');
            }}
          >
            <Text style={[styles.modePillText, viewMode === 'wave' && styles.activeModePillText]}>
              🌊 Wave
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, viewMode === 'matrix' && styles.activeModePill]}
            onPress={() => {
              safeVibrate(15);
              setViewMode('matrix');
            }}
          >
            <Text style={[styles.modePillText, viewMode === 'matrix' && styles.activeModePillText]}>
              🗓️ Matrix
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, viewMode === 'weekly' && styles.activeModePill]}
            onPress={() => {
              safeVibrate(15);
              setViewMode('weekly');
            }}
          >
            <Text style={[styles.modePillText, viewMode === 'weekly' && styles.activeModePillText]}>
              📊 Pace
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Stat Badges */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryLabel}>MONTH TOTAL</Text>
          <Text style={[styles.telemetryValue, { color: COLORS.flameBright }]}>
            {grandTotal.toLocaleString()}
          </Text>
          <Text style={styles.telemetrySub}>reps mastered</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryLabel}>DAILY AVERAGE</Text>
          <Text style={[styles.telemetryValue, { color: COLORS.goldStreak }]}>
            {averagePerDay}
          </Text>
          <Text style={styles.telemetrySub}>reps / day</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryLabel}>DISCIPLINE RATE</Text>
          <Text style={[styles.telemetryValue, { color: COLORS.vitalityGreen }]}>
            {consistencyRate}%
          </Text>
          <Text style={styles.telemetrySub}>{activeDaysCount} active days</Text>
        </View>
      </View>

      {/* Interactive Floating Heads-Up Display (HUD) */}
      {selectedDay && (
        <View style={styles.hudCard}>
          <View style={styles.hudTopRow}>
            <View style={styles.hudDayBadge}>
              <Text style={styles.hudDayText}>DAY {selectedDay.day}</Text>
            </View>

            <View
              style={[
                styles.hudRankBadge,
                { backgroundColor: `${getRankBadge(selectedDay.pushups).color}20` },
              ]}
            >
              <Text
                style={[
                  styles.hudRankText,
                  { color: getRankBadge(selectedDay.pushups).color },
                ]}
              >
                {getRankBadge(selectedDay.pushups).title}
              </Text>
            </View>
          </View>

          <View style={styles.hudBottomRow}>
            <Text style={styles.hudRepsCount}>
              {selectedDay.pushups}{' '}
              <Text style={styles.hudRepsLabel}>REPS</Text>
            </Text>
            <Text style={styles.hudCalories}>
              ≈ {Math.round(selectedDay.pushups * 0.45)} kcal burned •{' '}
              {selectedDay.pushups >= targetGoal
                ? '🎯 Target Smashed!'
                : `${Math.round((selectedDay.pushups / targetGoal) * 100)}% of goal`}
            </Text>
          </View>
        </View>
      )}

      {/* MODE 1: NEON WAVE & TRENDLINE */}
      {viewMode === 'wave' && (
        <View style={styles.waveChartContainer}>
          {/* Target & Avg Benchmarks Legend */}
          <View style={styles.benchmarkLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { borderColor: COLORS.goldStreak }]} />
              <Text style={styles.legendText}>Target ({targetGoal})</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendLine,
                  { borderColor: 'rgba(255, 255, 255, 0.4)', borderStyle: 'dashed' },
                ]}
              />
              <Text style={styles.legendText}>Avg Pace ({averagePerDay})</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendText, { color: COLORS.goldStreak }]}>
                👑 Peak ({highestDay.count})
              </Text>
            </View>
          </View>

          {/* Horizontally Scrollable Wave Canvas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.canvasScrollContent}
          >
            <View style={[styles.canvasArea, { width: coordinates.length * POINT_WIDTH + 30 }]}>
              {/* Background Grid Lines */}
              <View style={[styles.gridHorizonLine, { top: 20 }]} />
              <View style={[styles.gridHorizonLine, { top: CHART_HEIGHT * 0.45 }]} />
              <View style={[styles.gridHorizonLine, { top: CHART_HEIGHT - 32 }]} />

              {/* Target Benchmark Horizon Line */}
              {targetGoalY > 20 && targetGoalY < CHART_HEIGHT - 32 && (
                <View style={[styles.targetHorizonLine, { top: targetGoalY }]} />
              )}

              {/* Average Velocity Line */}
              {avgVelocityY > 20 && avgVelocityY < CHART_HEIGHT - 32 && (
                <View style={[styles.avgHorizonLine, { top: avgVelocityY }]} />
              )}

              {/* Vector Connecting Line Segments */}
              {lineSegments.map((seg) => (
                <View
                  key={seg.id}
                  style={[
                    styles.vectorSegment,
                    {
                      left: seg.left,
                      top: seg.top,
                      width: seg.length,
                      transform: [{ rotate: `${seg.angleDeg}deg` }],
                      backgroundColor: seg.hasActivity
                        ? COLORS.flameBright
                        : 'rgba(255, 255, 255, 0.1)',
                      shadowColor: seg.hasActivity ? COLORS.flamePrimary : 'transparent',
                      shadowOpacity: seg.hasActivity ? 0.8 : 0,
                      shadowRadius: 4,
                    },
                  ]}
                />
              ))}

              {/* Data Points, Shaded Vertical Beams & Glowing Nodes */}
              {coordinates.map((pt) => {
                const isSelected = selectedDay?.day === pt.day;
                const isPeak = highestDay.count > 0 && pt.pushups === highestDay.count;
                const isGoalMet = pt.pushups >= targetGoal;
                const beamHeight = Math.max(0, CHART_HEIGHT - 32 - pt.y);

                return (
                  <TouchableOpacity
                    key={`node-${pt.day}`}
                    style={[styles.nodeColumn, { left: pt.x - POINT_WIDTH / 2 }]}
                    onPress={() => handleSelectDay(pt)}
                    activeOpacity={0.7}
                  >
                    {/* Selected Day Vertical Laser Guide */}
                    {isSelected && (
                      <View style={[styles.laserBeam, { height: CHART_HEIGHT - 32 }]} />
                    )}

                    {/* Gradient Shaded Area Pillar */}
                    {pt.pushups > 0 && (
                      <View
                        style={[
                          styles.areaPillar,
                          {
                            top: pt.y,
                            height: beamHeight,
                            backgroundColor: isPeak
                              ? 'rgba(255, 214, 0, 0.18)'
                              : isGoalMet
                              ? 'rgba(0, 230, 118, 0.16)'
                              : 'rgba(255, 87, 34, 0.14)',
                            borderColor: isPeak
                              ? 'rgba(255, 214, 0, 0.35)'
                              : isGoalMet
                              ? 'rgba(0, 230, 118, 0.3)'
                              : 'rgba(255, 87, 34, 0.25)',
                          },
                        ]}
                      />
                    )}

                    {/* Peak Crown Icon */}
                    {isPeak && (
                      <View style={[styles.crownBadge, { top: pt.y - 20 }]}>
                        <Text style={styles.crownText}>👑</Text>
                      </View>
                    )}

                    {/* Vertex Glow Node */}
                    <View
                      style={[
                        styles.vertexNode,
                        {
                          top: pt.y - (isSelected ? 7 : 5),
                          width: isSelected ? 14 : isPeak ? 12 : 10,
                          height: isSelected ? 14 : isPeak ? 12 : 10,
                          borderRadius: isSelected ? 7 : isPeak ? 6 : 5,
                          backgroundColor: isPeak
                            ? COLORS.goldStreak
                            : isGoalMet
                            ? COLORS.vitalityGreen
                            : pt.pushups > 0
                            ? COLORS.flameBright
                            : 'rgba(255, 255, 255, 0.2)',
                          borderColor: isSelected
                            ? COLORS.white
                            : isPeak
                            ? COLORS.goldAmber
                            : COLORS.surfaceCard,
                          borderWidth: isSelected ? 2.5 : 1.5,
                          shadowColor: isPeak
                            ? COLORS.goldStreak
                            : isGoalMet
                            ? COLORS.vitalityGreen
                            : COLORS.flamePrimary,
                          shadowOpacity: pt.pushups > 0 ? 0.9 : 0,
                          shadowRadius: isSelected ? 8 : 4,
                          elevation: isSelected ? 5 : 2,
                        },
                      ]}
                    />

                    {/* X-Axis Day Number Label */}
                    <View style={styles.xAxisLabelWrapper}>
                      <Text
                        style={[
                          styles.xAxisDayText,
                          isSelected && styles.activeXAxisText,
                          isPeak && { color: COLORS.goldStreak, fontWeight: '900' },
                        ]}
                      >
                        {pt.day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* MODE 2: HABIT INTENSITY MATRIX (Calendar Grid) */}
      {viewMode === 'matrix' && (
        <View style={styles.matrixContainer}>
          <Text style={styles.matrixSubheader}>
            CONSISTENCY MATRIX • TILE SHADING INDICATES VOLUME INTENSITY
          </Text>

          <View style={styles.matrixGrid}>
            {data.map((item) => {
              const isSelected = selectedDay?.day === item.day;
              const isPeak = highestDay.count > 0 && item.pushups === highestDay.count;
              const isGoalMet = item.pushups >= targetGoal;

              let tileBg = COLORS.backgroundElevated;
              let borderCol = 'rgba(255, 255, 255, 0.05)';
              let textColor = COLORS.textMuted;

              if (isPeak) {
                tileBg = 'rgba(255, 214, 0, 0.25)';
                borderCol = COLORS.goldStreak;
                textColor = COLORS.goldStreak;
              } else if (isGoalMet) {
                tileBg = 'rgba(0, 230, 118, 0.22)';
                borderCol = COLORS.vitalityGreen;
                textColor = COLORS.vitalityGreen;
              } else if (item.pushups >= 50) {
                tileBg = 'rgba(255, 87, 34, 0.24)';
                borderCol = COLORS.flameBright;
                textColor = COLORS.flameBright;
              } else if (item.pushups > 0) {
                tileBg = 'rgba(255, 87, 34, 0.12)';
                borderCol = 'rgba(255, 87, 34, 0.3)';
                textColor = COLORS.textPrimary;
              }

              if (isSelected) {
                borderCol = COLORS.white;
              }

              return (
                <TouchableOpacity
                  key={`matrix-${item.day}`}
                  style={[
                    styles.matrixTile,
                    { backgroundColor: tileBg, borderColor: borderCol },
                    isSelected && { borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectDay(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.matrixDayNum, { color: textColor }]}>
                    {item.day}
                  </Text>
                  {isPeak ? (
                    <Text style={styles.matrixMiniCrown}>👑</Text>
                  ) : item.pushups > 0 ? (
                    <Text style={styles.matrixRepsShort}>{item.pushups}</Text>
                  ) : (
                    <View style={styles.matrixZeroDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Matrix Legend */}
          <View style={styles.matrixLegendRow}>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: COLORS.backgroundElevated }]} />
              <Text style={styles.matrixLegendLabel}>0 reps</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(255, 87, 34, 0.2)' }]} />
              <Text style={styles.matrixLegendLabel}>1-49</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(255, 87, 34, 0.45)' }]} />
              <Text style={styles.matrixLegendLabel}>50-99</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(0, 230, 118, 0.4)' }]} />
              <Text style={styles.matrixLegendLabel}>100+ Goal</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(255, 214, 0, 0.5)' }]} />
              <Text style={styles.matrixLegendLabel}>Peak 👑</Text>
            </View>
          </View>
        </View>
      )}

      {/* MODE 3: WEEK-BY-WEEK VELOCITY */}
      {viewMode === 'weekly' && (
        <View style={styles.weeklyContainer}>
          <Text style={styles.matrixSubheader}>
            WEEKLY PROGRESSION & STRENGTH VELOCITY
          </Text>

          {weeklyData.map((wk, idx) => {
            const prevTotal = idx > 0 ? weeklyData[idx - 1].total : null;
            const diffPercent =
              prevTotal && prevTotal > 0
                ? Math.round(((wk.total - prevTotal) / prevTotal) * 100)
                : null;
            const maxWk = Math.max(...weeklyData.map((w) => w.total), 100);
            const progressRatio = maxWk > 0 ? wk.total / maxWk : 0;

            return (
              <View key={`wk-${wk.weekNum}`} style={styles.weeklyCard}>
                <View style={styles.weeklyTopRow}>
                  <View style={styles.weeklyBadge}>
                    <Text style={styles.weeklyBadgeText}>WEEK {wk.weekNum}</Text>
                  </View>
                  <Text style={styles.weeklyRangeText}>{wk.range}</Text>
                  {diffPercent !== null && (
                    <Text
                      style={[
                        styles.velocityDelta,
                        { color: diffPercent >= 0 ? COLORS.vitalityGreen : COLORS.urgentRed },
                      ]}
                    >
                      {diffPercent >= 0 ? `+${diffPercent}% ↗` : `${diffPercent}% ↘`}
                    </Text>
                  )}
                </View>

                <View style={styles.weeklyStatRow}>
                  <Text style={styles.weeklyTotalReps}>{wk.total.toLocaleString()} reps</Text>
                  <Text style={styles.weeklySubStat}>
                    {wk.avg} reps/day avg • {wk.active}/7 active days
                  </Text>
                </View>

                {/* Velocity Progress Bar */}
                <View style={styles.weeklyProgressTrack}>
                  <View
                    style={[
                      styles.weeklyProgressBar,
                      {
                        width: `${Math.max(6, progressRatio * 100)}%`,
                        backgroundColor:
                          progressRatio >= 0.8
                            ? COLORS.goldStreak
                            : progressRatio >= 0.5
                            ? COLORS.vitalityGreen
                            : COLORS.flamePrimary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  headerTitleGroup: {
    width: '100%',
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.flamePrimary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardMainHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  modePillContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
  },
  activeModePill: {
    backgroundColor: COLORS.flamePrimary,
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeModePillText: {
    color: COLORS.white,
  },
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telemetryBadge: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  telemetryValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  telemetrySub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  hudCard: {
    backgroundColor: 'rgba(255, 87, 34, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.25)',
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hudBottomRow: {
    flexDirection: 'column',
    gap: 2,
  },
  hudDayBadge: {
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hudDayText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudRepsCount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  hudRepsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.flameBright,
  },
  hudCalories: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  hudRankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  hudRankText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  waveChartContainer: {
    marginTop: 4,
  },
  benchmarkLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
    marginBottom: 8,
    paddingRight: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  canvasScrollContent: {
    paddingRight: 20,
  },
  canvasArea: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridHorizonLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  targetHorizonLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.4)',
    borderStyle: 'dashed',
  },
  avgHorizonLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
  },
  vectorSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
  },
  nodeColumn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: POINT_WIDTH,
    alignItems: 'center',
  },
  laserBeam: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.white,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  areaPillar: {
    position: 'absolute',
    width: POINT_WIDTH - 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  crownBadge: {
    position: 'absolute',
  },
  crownText: {
    fontSize: 14,
  },
  vertexNode: {
    position: 'absolute',
  },
  xAxisLabelWrapper: {
    position: 'absolute',
    bottom: 2,
  },
  xAxisDayText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeXAxisText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  matrixContainer: {
    marginTop: 6,
  },
  matrixSubheader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  matrixTile: {
    width: (SCREEN_WIDTH - 36 - 36) / 7,
    height: (SCREEN_WIDTH - 36 - 36) / 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  matrixDayNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  matrixMiniCrown: {
    fontSize: 9,
    marginTop: -2,
  },
  matrixRepsShort: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: -1,
  },
  matrixZeroDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 2,
  },
  matrixLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  matrixLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matrixLegendBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  matrixLegendLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  weeklyContainer: {
    marginTop: 6,
  },
  weeklyCard: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  weeklyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weeklyBadge: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  weeklyBadgeText: {
    color: COLORS.flamePrimary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  weeklyRangeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  velocityDelta: {
    fontSize: 12,
    fontWeight: '900',
  },
  weeklyStatRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    marginBottom: 10,
  },
  weeklyTotalReps: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  weeklySubStat: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  weeklyProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weeklyProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
