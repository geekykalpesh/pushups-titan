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
import { safeVibrate } from '../utils/haptics';

interface EggChartItem {
  day: number;
  label: string;
  eggs: number;
  protein: number;
}

interface MonthlyEggChartProps {
  data: EggChartItem[];
  grandTotalEggs: number;
  grandTotalProtein: number;
  averageEggsPerDay: number;
  targetProteinGoal?: number;
}

type ViewMode = 'wave' | 'matrix' | 'weekly';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 190;
const POINT_WIDTH = 42;

export const MonthlyEggChart: React.FC<MonthlyEggChartProps> = ({
  data,
  grandTotalEggs,
  grandTotalProtein,
  averageEggsPerDay,
  targetProteinGoal = 25,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('wave');
  const [selectedDay, setSelectedDay] = useState<EggChartItem | null>(() => {
    const peak = data.reduce<EggChartItem | null>((best, item) => {
      if (!best || item.protein > best.protein) return item;
      return best;
    }, null);
    return peak && peak.protein > 0 ? peak : data[data.length - 1] || null;
  });

  const maxProtein = useMemo(() => {
    const rawMax = Math.max(...data.map((d) => d.protein), targetProteinGoal);
    return Math.ceil(rawMax * 1.2); // 20% visual breathing room
  }, [data, targetProteinGoal]);

  const activeDaysCount = useMemo(() => {
    return data.filter((d) => d.eggs > 0).length;
  }, [data]);

  const consistencyRate = useMemo(() => {
    return data.length > 0 ? Math.round((activeDaysCount / data.length) * 100) : 0;
  }, [data, activeDaysCount]);

  // Compute vector coordinates for protein & egg waves
  const coordinates = useMemo(() => {
    return data.map((item, index) => {
      const x = index * POINT_WIDTH + POINT_WIDTH / 2;
      const ratio = maxProtein > 0 ? item.protein / maxProtein : 0;
      const y = CHART_HEIGHT - 32 - ratio * (CHART_HEIGHT - 54);
      return { ...item, x, y };
    });
  }, [data, maxProtein]);

  // Connecting vector segments
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
        id: `seg-egg-${i}`,
        left: midX - length / 2,
        top: midY - 1.5,
        length,
        angleDeg,
        hasActivity: p1.protein > 0 || p2.protein > 0,
      });
    }
    return segments;
  }, [coordinates]);

  // Weekly Protein Velocity
  const weeklyData = useMemo(() => {
    const weeks: { weekNum: number; range: string; eggs: number; protein: number; active: number }[] = [];
    for (let i = 0; i < data.length; i += 7) {
      const slice = data.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      const eggs = slice.reduce((sum, d) => sum + d.eggs, 0);
      const protein = Math.round(slice.reduce((sum, d) => sum + d.protein, 0) * 10) / 10;
      const active = slice.filter((d) => d.eggs > 0).length;
      const range = `Day ${slice[0].day} - ${slice[slice.length - 1].day}`;
      weeks.push({ weekNum, range, eggs, protein, active });
    }
    return weeks;
  }, [data]);

  const targetProteinY = useMemo(() => {
    const ratio = maxProtein > 0 ? targetProteinGoal / maxProtein : 0;
    return CHART_HEIGHT - 32 - ratio * (CHART_HEIGHT - 54);
  }, [maxProtein, targetProteinGoal]);

  const handleSelectDay = (dayItem: EggChartItem) => {
    safeVibrate(20);
    setSelectedDay(dayItem);
  };

  const getRecoveryBadge = (protein: number) => {
    if (protein >= targetProteinGoal) {
      return { title: 'PEAK ANABOLIC 🟢', color: COLORS.vitalityGreen };
    }
    if (protein > 0) {
      return { title: 'PROTEIN REPAIR 🟡', color: COLORS.goldStreak };
    }
    return { title: 'FASTING / ZERO FUEL ⚪', color: COLORS.textMuted };
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header & Mode Switcher */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.cardTag}>BIO-FUEL & PROTEIN SYNTHESIS</Text>
          <Text style={styles.cardMainHeading}>Nutrition Dynamics</Text>
        </View>

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

      {/* Telemetry Grid */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryLabel}>PURE PROTEIN</Text>
          <Text style={[styles.telemetryValue, { color: COLORS.vitalityGreen }]}>
            {grandTotalProtein}g
          </Text>
          <Text style={styles.telemetrySub}>total muscle fuel</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryLabel}>TOTAL EGGS</Text>
          <Text style={[styles.telemetryValue, { color: COLORS.goldStreak }]}>
            {grandTotalEggs}
          </Text>
          <Text style={styles.telemetrySub}>eggs consumed</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryLabel}>DAILY AVERAGE</Text>
          <Text style={[styles.telemetryValue, { color: COLORS.white }]}>
            {averageEggsPerDay}
          </Text>
          <Text style={styles.telemetrySub}>eggs / day</Text>
        </View>
      </View>

      {/* Interactive HUD */}
      {selectedDay && (
        <View style={styles.hudCard}>
          <View style={styles.hudTopRow}>
            <View style={styles.hudDayBadge}>
              <Text style={styles.hudDayText}>DAY {selectedDay.day}</Text>
            </View>

            <View
              style={[
                styles.hudRankBadge,
                { backgroundColor: `${getRecoveryBadge(selectedDay.protein).color}20` },
              ]}
            >
              <Text
                style={[
                  styles.hudRankText,
                  { color: getRecoveryBadge(selectedDay.protein).color },
                ]}
              >
                {getRecoveryBadge(selectedDay.protein).title}
              </Text>
            </View>
          </View>

          <View style={styles.hudBottomRow}>
            <Text style={styles.hudProteinCount}>
              {selectedDay.protein}g{' '}
              <Text style={styles.hudEggCount}>({selectedDay.eggs} Eggs)</Text>
            </Text>
            <Text style={styles.hudSubtitle}>
              {selectedDay.protein >= targetProteinGoal
                ? `⚡ Protein Target Smashed (+${Math.round(selectedDay.protein - targetProteinGoal)}g)`
                : `${Math.round((selectedDay.protein / targetProteinGoal) * 100)}% of daily protein target`}
            </Text>
          </View>
        </View>
      )}

      {/* MODE 1: BIO-WAVE & PROTEIN CURVE */}
      {viewMode === 'wave' && (
        <View style={styles.waveChartContainer}>
          <View style={styles.benchmarkLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { borderColor: COLORS.vitalityGreen }]} />
              <Text style={styles.legendText}>Target ({targetProteinGoal}g)</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendText, { color: COLORS.goldStreak }]}>
                🥚 Pure Albumin Fuel
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.canvasScrollContent}
          >
            <View style={[styles.canvasArea, { width: coordinates.length * POINT_WIDTH + 30 }]}>
              {/* Grid Lines */}
              <View style={[styles.gridHorizonLine, { top: 20 }]} />
              <View style={[styles.gridHorizonLine, { top: CHART_HEIGHT * 0.45 }]} />
              <View style={[styles.gridHorizonLine, { top: CHART_HEIGHT - 32 }]} />

              {/* Target Protein Line */}
              {targetProteinY > 20 && targetProteinY < CHART_HEIGHT - 32 && (
                <View style={[styles.targetHorizonLine, { top: targetProteinY }]} />
              )}

              {/* Vector Connecting Lines */}
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
                        ? COLORS.vitalityGreen
                        : 'rgba(255, 255, 255, 0.1)',
                      shadowColor: seg.hasActivity ? COLORS.vitalityGreen : 'transparent',
                      shadowOpacity: seg.hasActivity ? 0.8 : 0,
                      shadowRadius: 4,
                    },
                  ]}
                />
              ))}

              {/* Nodes and Shaded Columns */}
              {coordinates.map((pt) => {
                const isSelected = selectedDay?.day === pt.day;
                const isTargetMet = pt.protein >= targetProteinGoal;
                const beamHeight = Math.max(0, CHART_HEIGHT - 32 - pt.y);

                return (
                  <TouchableOpacity
                    key={`node-egg-${pt.day}`}
                    style={[styles.nodeColumn, { left: pt.x - POINT_WIDTH / 2 }]}
                    onPress={() => handleSelectDay(pt)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <View style={[styles.laserBeam, { height: CHART_HEIGHT - 32 }]} />
                    )}

                    {pt.protein > 0 && (
                      <View
                        style={[
                          styles.areaPillar,
                          {
                            top: pt.y,
                            height: beamHeight,
                            backgroundColor: isTargetMet
                              ? 'rgba(0, 230, 118, 0.18)'
                              : 'rgba(255, 214, 0, 0.14)',
                            borderColor: isTargetMet
                              ? 'rgba(0, 230, 118, 0.35)'
                              : 'rgba(255, 214, 0, 0.25)',
                          },
                        ]}
                      />
                    )}

                    {/* Vertex Node */}
                    <View
                      style={[
                        styles.vertexNode,
                        {
                          top: pt.y - (isSelected ? 7 : 5),
                          width: isSelected ? 14 : 10,
                          height: isSelected ? 14 : 10,
                          borderRadius: isSelected ? 7 : 5,
                          backgroundColor: isTargetMet
                            ? COLORS.vitalityGreen
                            : pt.protein > 0
                            ? COLORS.goldStreak
                            : 'rgba(255, 255, 255, 0.2)',
                          borderColor: isSelected ? COLORS.white : COLORS.surfaceCard,
                          borderWidth: isSelected ? 2.5 : 1.5,
                          shadowColor: isTargetMet ? COLORS.vitalityGreen : COLORS.goldStreak,
                          shadowOpacity: pt.protein > 0 ? 0.9 : 0,
                          shadowRadius: isSelected ? 8 : 4,
                          elevation: isSelected ? 5 : 2,
                        },
                      ]}
                    />

                    <View style={styles.xAxisLabelWrapper}>
                      <Text
                        style={[
                          styles.xAxisDayText,
                          isSelected && styles.activeXAxisText,
                          isTargetMet && { color: COLORS.vitalityGreen, fontWeight: '800' },
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

      {/* MODE 2: FUEL MATRIX */}
      {viewMode === 'matrix' && (
        <View style={styles.matrixContainer}>
          <Text style={styles.matrixSubheader}>
            NUTRITION DENSITY MATRIX • PROTEIN REPAIR STATUS
          </Text>

          <View style={styles.matrixGrid}>
            {data.map((item) => {
              const isSelected = selectedDay?.day === item.day;
              const isTargetMet = item.protein >= targetProteinGoal;

              let tileBg = COLORS.backgroundElevated;
              let borderCol = 'rgba(255, 255, 255, 0.05)';
              let textColor = COLORS.textMuted;

              if (isTargetMet) {
                tileBg = 'rgba(0, 230, 118, 0.25)';
                borderCol = COLORS.vitalityGreen;
                textColor = COLORS.vitalityGreen;
              } else if (item.eggs >= 3) {
                tileBg = 'rgba(255, 214, 0, 0.2)';
                borderCol = COLORS.goldStreak;
                textColor = COLORS.goldStreak;
              } else if (item.eggs > 0) {
                tileBg = 'rgba(0, 230, 118, 0.1)';
                borderCol = 'rgba(0, 230, 118, 0.3)';
                textColor = COLORS.textPrimary;
              }

              if (isSelected) {
                borderCol = COLORS.white;
              }

              return (
                <TouchableOpacity
                  key={`matrix-egg-${item.day}`}
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
                  {item.eggs > 0 ? (
                    <Text style={styles.matrixEggShort}>{item.eggs}🥚</Text>
                  ) : (
                    <View style={styles.matrixZeroDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.matrixLegendRow}>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: COLORS.backgroundElevated }]} />
              <Text style={styles.matrixLegendLabel}>0 eggs</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(0, 230, 118, 0.2)' }]} />
              <Text style={styles.matrixLegendLabel}>1-2 eggs</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(255, 214, 0, 0.4)' }]} />
              <Text style={styles.matrixLegendLabel}>3-4 eggs</Text>
            </View>
            <View style={styles.matrixLegendItem}>
              <View style={[styles.matrixLegendBox, { backgroundColor: 'rgba(0, 230, 118, 0.5)' }]} />
              <Text style={styles.matrixLegendLabel}>5+ Target</Text>
            </View>
          </View>
        </View>
      )}

      {/* MODE 3: PROTEIN PACE */}
      {viewMode === 'weekly' && (
        <View style={styles.weeklyContainer}>
          <Text style={styles.matrixSubheader}>
            WEEKLY PROTEIN SYNTHESIS & RECOVERY PACING
          </Text>

          {weeklyData.map((wk) => {
            const maxWkProtein = Math.max(...weeklyData.map((w) => w.protein), 100);
            const ratio = maxWkProtein > 0 ? wk.protein / maxWkProtein : 0;

            return (
              <View key={`wk-egg-${wk.weekNum}`} style={styles.weeklyCard}>
                <View style={styles.weeklyTopRow}>
                  <View style={styles.weeklyBadge}>
                    <Text style={styles.weeklyBadgeText}>WEEK {wk.weekNum}</Text>
                  </View>
                  <Text style={styles.weeklyRangeText}>{wk.range}</Text>
                  <Text style={styles.weeklyEggCount}>{wk.eggs} eggs total</Text>
                </View>

                <View style={styles.weeklyStatRow}>
                  <Text style={styles.weeklyTotalProtein}>{wk.protein}g protein</Text>
                  <Text style={styles.weeklySubStat}>
                    {Math.round((wk.protein / 7) * 10) / 10}g/day avg • {wk.active}/7 active days
                  </Text>
                </View>

                <View style={styles.weeklyProgressTrack}>
                  <View
                    style={[
                      styles.weeklyProgressBar,
                      {
                        width: `${Math.max(6, ratio * 100)}%`,
                        backgroundColor:
                          ratio >= 0.8
                            ? COLORS.vitalityGreen
                            : ratio >= 0.5
                            ? COLORS.goldStreak
                            : 'rgba(0, 230, 118, 0.5)',
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
    color: COLORS.vitalityGreen,
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
    backgroundColor: COLORS.vitalityGreen,
    shadowColor: COLORS.vitalityGreen,
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
    color: COLORS.black,
    fontWeight: '900',
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
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
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
    backgroundColor: COLORS.vitalityGreen,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hudDayText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudProteinCount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  hudEggCount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.goldStreak,
  },
  hudSubtitle: {
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
    borderColor: 'rgba(0, 230, 118, 0.4)',
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
  matrixEggShort: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.goldStreak,
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
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  weeklyBadgeText: {
    color: COLORS.vitalityGreen,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  weeklyRangeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  weeklyEggCount: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.goldStreak,
  },
  weeklyStatRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    marginBottom: 10,
  },
  weeklyTotalProtein: {
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
