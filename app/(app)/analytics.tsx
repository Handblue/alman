import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { auth } from '@/firebase';
import {
  useAnalyticsStore,
  useTodayMetrics,
  useWeeklyProgress,
  useTopRecommendations,
  usePredictions,
  useLearningPaths,
  useStreakInsights,
} from '@/store/useAnalyticsStore';
import { useUserStore } from '@/store/useUserStore';
import { useProgressStore } from '@/store/useProgressStore';
import { WKCard, WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - Spacing.s32 - Spacing.s32; // screen - screen padding - card padding
const CHART_H = 120;
const BAR_H = 100;

// ─── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({
  data,
  color = Colors.brand.primary,
  fillColor,
}: {
  data: number[];
  color?: string;
  fillColor?: string;
}) {
  if (data.length < 2) {
    return (
      <View style={{ width: CHART_W, height: CHART_H, justifyContent: 'center', alignItems: 'center' }}>
        <WKText variant="caption" color={Colors.text.secondary}>Henüz veri yok</WKText>
      </View>
    );
  }

  const padL = 32;
  const padR = 8;
  const padT = 12;
  const padB = 20;
  const w = CHART_W - padL - padR;
  const h = CHART_H - padT - padB;

  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: padL + (i / (data.length - 1)) * w,
    y: padT + (1 - (v - min) / range) * h,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fillPath = fillColor
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + h).toFixed(1)} L ${padL} ${(padT + h).toFixed(1)} Z`
    : null;

  // y-axis labels
  const yLabels = [max, Math.round((max + min) / 2), min];

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Grid lines */}
      {yLabels.map((val, i) => {
        const y = padT + (1 - (val - min) / range) * h;
        return (
          <React.Fragment key={i}>
            <Line
              x1={padL}
              y1={y}
              x2={padL + w}
              y2={y}
              stroke={Colors.bg.cardDark}
              strokeWidth={1}
            />
            <SvgText
              x={padL - 4}
              y={y + 4}
              fontSize={9}
              fill={Colors.text.secondary}
              textAnchor="end"
            >
              {val}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Fill area */}
      {fillPath && (
        <Path d={fillPath} fill={fillColor} opacity={0.15} />
      )}

      {/* Line */}
      <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}

      {/* x-axis day labels */}
      {pts.map((p, i) => (
        <SvgText
          key={`xl-${i}`}
          x={p.x}
          y={CHART_H - 4}
          fontSize={9}
          fill={Colors.text.secondary}
          textAnchor="middle"
        >
          {`G${i + 1}`}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = Colors.brand.primary,
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <View style={{ width: CHART_W, height: BAR_H, justifyContent: 'center', alignItems: 'center' }}>
        <WKText variant="caption" color={Colors.text.secondary}>Henüz veri yok</WKText>
      </View>
    );
  }

  const padL = 8;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const w = CHART_W - padL - padR;
  const h = BAR_H - padT - padB;

  const max = Math.max(...data.map(d => d.value)) || 1;
  const barW = w / data.length - 6;

  return (
    <Svg width={CHART_W} height={BAR_H}>
      {data.map((d, i) => {
        const barH = (d.value / max) * h;
        const x = padL + i * (w / data.length) + 3;
        const y = padT + h - barH;

        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              opacity={0.85}
            />
            <SvgText
              x={x + barW / 2}
              y={BAR_H - 4}
              fontSize={9}
              fill={Colors.text.secondary}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Risk Badge ────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: 'none' | 'low' | 'medium' | 'high' }) {
  const config = {
    none: { color: Colors.status.success, label: 'Güvende' },
    low: { color: Colors.status.info, label: 'Düşük Risk' },
    medium: { color: Colors.status.warning, label: 'Orta Risk' },
    high: { color: Colors.status.error, label: 'Yüksek Risk' },
  }[level];

  return (
    <View style={[styles.riskBadge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
      <WKText variant="caption" color={config.color}>{config.label}</WKText>
    </View>
  );
}

// ─── Prediction Card ───────────────────────────────────────────────────────────

function PredictionCard({ prediction }: { prediction: ReturnType<typeof usePredictions>[number] }) {
  const iconMap: Record<string, string> = {
    progress: '📈',
    retention: '🧠',
    completion: '🏁',
    difficulty: '⚡',
  };

  const timeFrameLabel: Record<string, string> = {
    day: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    quarter: 'Bu Çeyrek',
  };

  return (
    <WKCard style={styles.predictionCard}>
      <View style={styles.predictionHeader}>
        <WKText variant="heading2">{iconMap[prediction.type] ?? '🤖'}</WKText>
        <View style={{ flex: 1, marginLeft: Spacing.s12 }}>
          <WKText variant="bodySm" style={{ fontWeight: '600' }}>{prediction.title}</WKText>
          <WKText variant="caption" color={Colors.text.secondary}>{timeFrameLabel[prediction.timeFrame]}</WKText>
        </View>
        <View style={styles.confidenceBadge}>
          <WKText variant="caption" color={Colors.brand.primary}>%{prediction.confidence}</WKText>
        </View>
      </View>
      <WKText variant="bodySm" color={Colors.text.secondary} style={{ marginTop: Spacing.s8 }}>
        {prediction.description}
      </WKText>
      <View style={styles.basedOnRow}>
        {prediction.basedOn.map((b, i) => (
          <View key={i} style={styles.basedOnChip}>
            <WKText variant="caption" color={Colors.text.secondary}>{b.replace(/_/g, ' ')}</WKText>
          </View>
        ))}
      </View>
    </WKCard>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

type Tab = 'overview' | 'predictions' | 'paths';

const FOCUS_OPTIONS = [
  { id: 'vocabulary', label: 'Kelime', emoji: '📖' },
  { id: 'grammar', label: 'Dilbilgisi', emoji: '✏️' },
  { id: 'conversation', label: 'Konuşma', emoji: '💬' },
  { id: 'reading', label: 'Okuma', emoji: '📰' },
  { id: 'listening', label: 'Dinleme', emoji: '🎧' },
];

export default function AnalyticsScreen() {
  const userId = auth?.currentUser?.uid;
  const {
    loadAnalyticsData,
    loadAIData,
    loadStreakInsights,
    generateRecommendations,
    generatePredictions,
    acceptRecommendation,
    createLearningPath,
  } = useAnalyticsStore();

  // Local store data used as fallback when Firebase unavailable
  const { xp, streak, level } = useUserStore();
  const { wordProgress, unitProgress } = useProgressStore();
  const knownWords = Object.values(wordProgress).filter(w => w.status === 'known').length;
  const completedUnits = Object.values(unitProgress).filter(u => u.isCompleted).length;

  const todayMetricsRaw = useTodayMetrics();
  const weeklyProgress = useWeeklyProgress();
  const topRecommendations = useTopRecommendations();
  const predictions = usePredictions();
  const learningPaths = useLearningPaths();
  const streakInsightsRaw = useStreakInsights();

  // Fallback today metrics from local store when Firebase unavailable
  const todayMetrics = todayMetricsRaw ?? (knownWords > 0 || streak > 0 ? {
    userId: 'local',
    date: new Date(),
    wordsLearnedToday: Math.min(knownWords, 15),
    accuracyRate: completedUnits > 0 ? 78 : 0,
    studyStreak: streak,
    retentionRate: completedUnits > 0 ? 80 : 0,
    averageSessionLength: completedUnits > 0 ? 8 : 0,
    studyVelocity: completedUnits > 0 ? 12 : 0,
    consistencyScore: Math.min(100, streak * 14),
    weakCategories: [] as string[],
    strongCategories: [] as string[],
  } : undefined);

  // Fallback streak insights from local store
  const streakInsights = streakInsightsRaw ?? (streak > 0 ? {
    currentStreak: streak,
    longestStreak: streak,
    weeklyConsistency: Math.min(100, streak * 14),
    riskLevel: 'none' as const,
    recommendation: 'Harika gidiyorsun! Serisini sürdür.',
    nextMilestone: 7,
    nextMilestoneGap: Math.max(0, 7 - streak),
    isAtRisk: false,
    recoveryPlan: [] as string[],
    optimalStudyHour: 19,
    pattern: 'consistent',
  } : null);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [creatingPath, setCreatingPath] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadAnalyticsData(userId);
    loadAIData(userId);
    loadStreakInsights(userId);
  }, [userId]);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadAnalyticsData(userId),
        generateRecommendations(userId),
        generatePredictions(userId),
        loadStreakInsights(userId),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreatePath = async () => {
    if (!userId || selectedFocus.length === 0) return;
    setCreatingPath(true);
    try {
      await createLearningPath(userId, selectedFocus);
      setSelectedFocus([]);
    } finally {
      setCreatingPath(false);
    }
  };

  const toggleFocus = (id: string) => {
    setSelectedFocus(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Weekly chart data (last 7 days oldest → newest)
  const weekWords: number[] = weeklyProgress.dailyWords;
  const weekAccuracy: number[] = weeklyProgress.dailyAccuracy;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={styles.backBtn}
        >
          <WKText variant="bodyLg" color={Colors.brand.primary}>←</WKText>
        </TouchableOpacity>
        <WKText variant="heading1" style={{ flex: 1 }}>Analitik</WKText>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Yenile"
          style={[styles.refreshBtn, refreshing && { opacity: 0.5 }]}
        >
          {refreshing
            ? <ActivityIndicator size="small" color={Colors.brand.primary} />
            : <WKText variant="bodySm" color={Colors.brand.primary}>Yenile</WKText>
          }
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { id: 'overview', label: 'Genel', emoji: '📊' },
          { id: 'predictions', label: 'Tahminler', emoji: '🔮' },
          { id: 'paths', label: 'Yolum', emoji: '🗺️' },
        ] as { id: Tab; label: string; emoji: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
          >
            <WKText
              variant="caption"
              color={activeTab === tab.id ? Colors.brand.primary : Colors.text.secondary}
              style={{ fontWeight: activeTab === tab.id ? '700' : '400' }}
            >
              {tab.emoji} {tab.label}
            </WKText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {/* Today Stats */}
            <WKCard style={styles.card}>
              <WKText variant="bodySm" style={styles.cardTitle}>Bugün</WKText>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <WKText variant="heading1" color={Colors.brand.primary}>
                    {todayMetrics?.wordsLearnedToday ?? 0}
                  </WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>Kelime</WKText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <WKText variant="heading1" color={Colors.status.success}>
                    %{Math.round(todayMetrics?.accuracyRate ?? 0)}
                  </WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>Doğruluk</WKText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <WKText variant="heading1" color={Colors.accent.gold}>
                    {todayMetrics?.studyStreak ?? streakInsights?.currentStreak ?? 0}🔥
                  </WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>Seri</WKText>
                </View>
              </View>
            </WKCard>

            {/* Streak AI */}
            {streakInsights && (
              <WKCard style={styles.card}>
                <View style={styles.streakHeader}>
                  <WKText variant="bodySm" style={styles.cardTitle}>Seri Analizi</WKText>
                  <RiskBadge level={streakInsights.riskLevel} />
                </View>

                <View style={styles.streakStats}>
                  <View style={styles.streakStat}>
                    <WKText variant="heading2" color={Colors.accent.gold}>
                      {streakInsights.currentStreak}
                    </WKText>
                    <WKText variant="caption" color={Colors.text.secondary}>Mevcut</WKText>
                  </View>
                  <View style={styles.streakStat}>
                    <WKText variant="heading2" color={Colors.brand.primary}>
                      {streakInsights.longestStreak}
                    </WKText>
                    <WKText variant="caption" color={Colors.text.secondary}>En Uzun</WKText>
                  </View>
                  <View style={styles.streakStat}>
                    <WKText variant="heading2" color={Colors.status.info}>
                      %{streakInsights.weeklyConsistency}
                    </WKText>
                    <WKText variant="caption" color={Colors.text.secondary}>7 Günlük</WKText>
                  </View>
                  <View style={styles.streakStat}>
                    <WKText variant="heading2" color={Colors.status.success}>
                      {streakInsights.nextMilestoneGap}
                    </WKText>
                    <WKText variant="caption" color={Colors.text.secondary}>
                      Hedefe ({streakInsights.nextMilestone}g)
                    </WKText>
                  </View>
                </View>

                {streakInsights.recoveryPlan.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <WKText variant="caption" color={Colors.text.secondary} style={{ marginRight: Spacing.s4 }}>
                      {streakInsights.isAtRisk ? '⚠️' : '✅'}
                    </WKText>
                    <WKText variant="caption" color={Colors.text.secondary} style={{ flex: 1 }}>
                      {tip}
                    </WKText>
                  </View>
                ))}
              </WKCard>
            )}

            {/* Weekly Line Chart */}
            <WKCard style={styles.card}>
              <WKText variant="bodySm" style={styles.cardTitle}>Haftalık Kelime</WKText>
              <LineChart
                data={weekWords.length > 0 ? weekWords : [0, 0, 0, 0, 0, 0, 0]}
                color={Colors.brand.primary}
                fillColor={Colors.brand.primary}
              />
            </WKCard>

            {/* Weekly Bar Chart - Accuracy */}
            <WKCard style={styles.card}>
              <WKText variant="bodySm" style={styles.cardTitle}>Haftalık Doğruluk (%)</WKText>
              <BarChart
                color={Colors.status.success}
                data={(weekAccuracy.length > 0 ? weekAccuracy : Array(7).fill(0)).map((v, i) => ({
                  label: `G${i + 1}`,
                  value: Math.round(v),
                }))}
              />
            </WKCard>

            {/* Weekly Summary */}
            <WKCard style={styles.card}>
              <WKText variant="bodySm" style={styles.cardTitle}>Bu Hafta Özeti</WKText>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <WKText variant="heading2" color={Colors.brand.primary}>
                    {weeklyProgress.totalWords}
                  </WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>Toplam Kelime</WKText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <WKText variant="heading2" color={Colors.status.success}>
                    %{Math.round(weeklyProgress.averageAccuracy)}
                  </WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>Ort. Doğruluk</WKText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <WKText variant="heading2" color={Colors.status.info}>
                    {Math.round(weeklyProgress.averageSessionLength)}d
                  </WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>Ort. Süre</WKText>
                </View>
              </View>
            </WKCard>

            {/* AI Recommendations */}
            {topRecommendations.length > 0 && (
              <WKCard style={styles.card}>
                <WKText variant="bodySm" style={styles.cardTitle}>AI Önerileri</WKText>
                {topRecommendations.map(rec => (
                  <View key={rec.id} style={styles.recRow}>
                    <View style={{ flex: 1 }}>
                      <WKText variant="bodySm" style={{ fontWeight: '600' }}>{rec.title}</WKText>
                      <WKText variant="caption" color={Colors.text.secondary}>{rec.description}</WKText>
                      <WKText variant="caption" color={Colors.brand.primary} style={{ marginTop: 2 }}>
                        %{rec.confidence} güven
                      </WKText>
                    </View>
                    <WKButton
                      label="Dene"
                      variant="secondary"
                      onPress={() => acceptRecommendation(rec.id)}
                      style={styles.tryBtn}
                    />
                  </View>
                ))}
              </WKCard>
            )}
          </>
        )}

        {/* ── TAB: PREDICTIONS ── */}
        {activeTab === 'predictions' && (
          <>
            <WKCard style={styles.card}>
              <WKText variant="bodySm" style={styles.cardTitle}>Öğrenme Tahmini</WKText>
              <WKText variant="caption" color={Colors.text.secondary}>
                Geçmiş verilerine göre AI tarafından üretilen öngörüler.
              </WKText>
            </WKCard>

            {predictions.length === 0 ? (
              <WKCard style={styles.emptyCard}>
                <WKText variant="heading2">🔮</WKText>
                <WKText variant="body" style={{ textAlign: 'center', marginTop: Spacing.s8 }}>
                  Henüz tahmin yok
                </WKText>
                <WKText variant="caption" color={Colors.text.secondary} style={{ textAlign: 'center', marginTop: Spacing.s4 }}>
                  Daha fazla çalışma seansı tamamlandıkça AI tahminler üretmeye başlar.
                </WKText>
                <WKButton
                  label="Tahmin Üret"
                  variant="primary"
                  onPress={() => userId && generatePredictions(userId)}
                  style={{ marginTop: Spacing.s16 }}
                />
              </WKCard>
            ) : (
              predictions.map(pred => (
                <PredictionCard key={pred.id} prediction={pred} />
              ))
            )}

            {predictions.length > 0 && (
              <WKButton
                label="Tahminleri Güncelle"
                variant="ghost"
                onPress={() => userId && generatePredictions(userId)}
                style={{ marginTop: Spacing.s8 }}
              />
            )}

            {/* Trajectory Summary */}
            <WKCard style={[styles.card, { marginTop: Spacing.s16 }]}>
              <WKText variant="bodySm" style={styles.cardTitle}>Yörünge Özeti</WKText>
              <View style={styles.trajectoryRow}>
                <View style={styles.trajectoryItem}>
                  <WKText variant="caption" color={Colors.text.secondary}>Tahmini Tamamlanma</WKText>
                  <WKText variant="bodySm" color={Colors.brand.primary} style={{ fontWeight: '700', marginTop: 4 }}>
                    {(() => {
                      const completionPred = predictions.find(p => p.type === 'completion');
                      if (completionPred?.predictedValue?.completionDate) {
                        return new Date(completionPred.predictedValue.completionDate as string)
                          .toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
                      }
                      return 'Hesaplanıyor...';
                    })()}
                  </WKText>
                </View>
                <View style={styles.trajectoryItem}>
                  <WKText variant="caption" color={Colors.text.secondary}>Haftalık Kelime Tahmini</WKText>
                  <WKText variant="bodySm" color={Colors.status.success} style={{ fontWeight: '700', marginTop: 4 }}>
                    {(() => {
                      const progressPred = predictions.find(p => p.type === 'progress');
                      return progressPred?.predictedValue?.wordsLearned
                        ? `${progressPred.predictedValue.wordsLearned} kelime`
                        : 'Hesaplanıyor...';
                    })()}
                  </WKText>
                </View>
              </View>
              <View style={styles.trajectoryRow}>
                <View style={styles.trajectoryItem}>
                  <WKText variant="caption" color={Colors.text.secondary}>Tahmini Akılda Kalma</WKText>
                  <WKText variant="bodySm" color={Colors.accent.gold} style={{ fontWeight: '700', marginTop: 4 }}>
                    {(() => {
                      const retPred = predictions.find(p => p.type === 'retention');
                      return retPred?.predictedValue?.retentionRate
                        ? `%${retPred.predictedValue.retentionRate}`
                        : 'Hesaplanıyor...';
                    })()}
                  </WKText>
                </View>
              </View>
            </WKCard>
          </>
        )}

        {/* ── TAB: LEARNING PATH ── */}
        {activeTab === 'paths' && (
          <>
            {/* Active paths */}
            {learningPaths.length > 0 ? (
              <>
                <WKText variant="bodySm" style={[styles.sectionLabel]}>Öğrenme Yollarım</WKText>
                {learningPaths.map(path => (
                  <WKCard key={path.id} style={styles.card}>
                    <View style={styles.pathHeader}>
                      <View style={{ flex: 1 }}>
                        <WKText variant="bodySm" style={{ fontWeight: '700' }}>{path.name}</WKText>
                        <WKText variant="caption" color={Colors.text.secondary}>{path.description}</WKText>
                      </View>
                      <View style={[
                        styles.diffBadge,
                        { backgroundColor: (
                          path.difficulty === 'beginner' ? Colors.status.success :
                          path.difficulty === 'intermediate' ? Colors.status.warning :
                          Colors.status.error
                        ) + '22' }
                      ]}>
                        <WKText variant="caption" color={
                          path.difficulty === 'beginner' ? Colors.status.success :
                          path.difficulty === 'intermediate' ? Colors.status.warning :
                          Colors.status.error
                        }>
                          {path.difficulty === 'beginner' ? 'Başlangıç' :
                           path.difficulty === 'intermediate' ? 'Orta' : 'İleri'}
                        </WKText>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${path.progress}%` as any },
                        ]}
                      />
                    </View>
                    <View style={styles.pathMeta}>
                      <WKText variant="caption" color={Colors.text.secondary}>
                        {path.units.length} ünite · ~{path.estimatedDuration} gün
                      </WKText>
                      <WKText variant="caption" color={Colors.brand.primary}>
                        %{path.progress} tamamlandı
                      </WKText>
                    </View>

                    <WKButton
                      label="Devam Et"
                      variant="primary"
                      onPress={() => router.push('/(app)/categories')}
                      style={{ marginTop: Spacing.s12 }}
                    />
                  </WKCard>
                ))}
              </>
            ) : (
              <WKCard style={styles.emptyCard}>
                <WKText variant="heading2">🗺️</WKText>
                <WKText variant="body" style={{ textAlign: 'center', marginTop: Spacing.s8 }}>
                  Henüz bir öğrenme yolun yok
                </WKText>
                <WKText variant="caption" color={Colors.text.secondary} style={{ textAlign: 'center', marginTop: Spacing.s4 }}>
                  Aşağıdan odak alanlarını seçerek kişisel öğrenme yolunu oluştur.
                </WKText>
              </WKCard>
            )}

            {/* Create new path */}
            <WKCard style={[styles.card, { marginTop: Spacing.s16 }]}>
              <WKText variant="bodySm" style={styles.cardTitle}>Yeni Öğrenme Yolu</WKText>
              <WKText variant="caption" color={Colors.text.secondary} style={{ marginBottom: Spacing.s12 }}>
                Odaklanmak istediğin alanları seç:
              </WKText>

              <View style={styles.focusGrid}>
                {FOCUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => toggleFocus(opt.id)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={opt.label}
                    style={[
                      styles.focusChip,
                      selectedFocus.includes(opt.id) && styles.focusChipSelected,
                    ]}
                  >
                    <WKText variant="bodySm">{opt.emoji}</WKText>
                    <WKText
                      variant="caption"
                      color={selectedFocus.includes(opt.id) ? Colors.brand.primary : Colors.text.secondary}
                      style={{ marginLeft: Spacing.s4 }}
                    >
                      {opt.label}
                    </WKText>
                  </TouchableOpacity>
                ))}
              </View>

              <WKButton
                label={creatingPath ? 'Oluşturuluyor...' : 'Öğrenme Yolu Oluştur'}
                variant="primary"
                disabled={selectedFocus.length === 0 || creatingPath}
                onPress={handleCreatePath}
                style={{ marginTop: Spacing.s16 }}
              />
            </WKCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s12,
    paddingBottom: Spacing.s8,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.s8,
  },
  refreshBtn: {
    padding: Spacing.s8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.s16,
    marginBottom: Spacing.s8,
    gap: Spacing.s8,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.s8,
    alignItems: 'center',
    borderRadius: Radius.chip,
    backgroundColor: Colors.bg.card,
  },
  tabActive: {
    backgroundColor: Colors.brand.primary + '22',
    borderWidth: 1,
    borderColor: Colors.brand.primary + '55',
  },
  scroll: {
    paddingHorizontal: Spacing.s16,
    paddingBottom: Spacing.s32,
    gap: Spacing.s12,
  },
  card: {
    gap: Spacing.s8,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: Spacing.s4,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.s4,
    color: Colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.s8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.bg.card,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
    borderWidth: 1,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.s8,
  },
  streakStat: {
    alignItems: 'center',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.s2,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: Spacing.s12,
  },
  tryBtn: {
    minWidth: 70,
    minHeight: 36,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.s32,
    gap: Spacing.s4,
  },
  predictionCard: {
    gap: Spacing.s4,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: Colors.brand.primary + '22',
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
  },
  basedOnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s4,
    marginTop: Spacing.s4,
  },
  basedOnChip: {
    backgroundColor: Colors.bg.light,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s2,
    borderRadius: Radius.chip,
  },
  trajectoryRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
    marginTop: Spacing.s8,
  },
  trajectoryItem: {
    flex: 1,
    backgroundColor: Colors.bg.light,
    borderRadius: Radius.card,
    padding: Spacing.s12,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s12,
  },
  diffBadge: {
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s4,
    borderRadius: Radius.chip,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.bg.light,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.s8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: 3,
  },
  pathMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.s4,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s8,
    borderRadius: Radius.chip,
    backgroundColor: Colors.bg.light,
    borderWidth: 1,
    borderColor: Colors.bg.cardDark,
  },
  focusChipSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '22',
  },
});
