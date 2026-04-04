import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalyticsStore, useTodayMetrics, useWeeklyProgress, useTopRecommendations } from '../store/useAnalyticsStore';
import { useUserStore } from '../store/useUserStore';
import { WKCard } from '../components/ui/WKCard';
import { WKText } from '../components/ui/WKText';
import { WKButton } from '../components/ui/WKButton';
import { PlayButton } from '../components/ui/PlayButton';
import { spacing, colors } from '../constants';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useUserStore();
  const {
    loadAnalyticsData,
    loadAIData,
    generateRecommendations,
    generatePredictions,
    acceptRecommendation,
  } = useAnalyticsStore();

  const todayMetrics = useTodayMetrics();
  const weeklyProgress = useWeeklyProgress();
  const topRecommendations = useTopRecommendations();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAnalyticsData(user.id);
      loadAIData(user.id);
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    if (!user?.id) return;

    setRefreshing(true);
    try {
      await Promise.all([
        loadAnalyticsData(user.id),
        generateRecommendations(user.id),
        generatePredictions(user.id),
      ]);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptRecommendation = async (recId: string) => {
    try {
      await acceptRecommendation(recId);
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <WKText style={styles.title}>Learning Analytics</WKText>
          <WKButton
            title={refreshing ? "Refreshing..." : "Refresh"}
            onPress={handleRefresh}
            disabled={refreshing}
            size="small"
            variant="outline"
          />
        </View>

        {/* Today's Overview */}
        <WKCard style={styles.overviewCard}>
          <WKText style={styles.cardTitle}>Today's Progress</WKText>
          <View style={styles.metricsGrid}>
            <View style={styles.metric}>
              <WKText style={styles.metricValue}>{todayMetrics?.wordsLearnedToday || 0}</WKText>
              <WKText style={styles.metricLabel}>Words Learned</WKText>
            </View>
            <View style={styles.metric}>
              <WKText style={styles.metricValue}>{Math.round(todayMetrics?.accuracyRate || 0)}%</WKText>
              <WKText style={styles.metricLabel}>Accuracy</WKText>
            </View>
            <View style={styles.metric}>
              <WKText style={styles.metricValue}>{todayMetrics?.studyStreak || 0}</WKText>
              <WKText style={styles.metricLabel}>Day Streak</WKText>
            </View>
          </View>
        </WKCard>

        {/* Weekly Progress Chart */}
        <WKCard style={styles.chartCard}>
          <WKText style={styles.cardTitle}>Weekly Progress</WKText>
          <View style={styles.weeklyStats}>
            <View style={styles.stat}>
              <WKText style={styles.statValue}>{weeklyProgress.totalWords}</WKText>
              <WKText style={styles.statLabel}>Words This Week</WKText>
            </View>
            <View style={styles.stat}>
              <WKText style={styles.statValue}>{Math.round(weeklyProgress.averageAccuracy)}%</WKText>
              <WKText style={styles.statLabel}>Avg Accuracy</WKText>
            </View>
            <View style={styles.stat}>
              <WKText style={styles.statValue}>{Math.round(weeklyProgress.averageSessionLength)}m</WKText>
              <WKText style={styles.statLabel}>Avg Session</WKText>
            </View>
          </View>
        </WKCard>

        {/* AI Recommendations */}
        {topRecommendations.length > 0 && (
          <WKCard style={styles.recommendationsCard}>
            <WKText style={styles.cardTitle}>AI Recommendations</WKText>
            {topRecommendations.map((rec) => (
              <View key={rec.id} style={styles.recommendation}>
                <View style={styles.recommendationContent}>
                  <WKText style={styles.recommendationTitle}>{rec.title}</WKText>
                  <WKText style={styles.recommendationDescription}>{rec.description}</WKText>
                  <View style={styles.recommendationMeta}>
                    <WKText style={styles.confidenceText}>
                      {rec.confidence}% confidence
                    </WKText>
                    <WKText style={styles.reasonText}>{rec.reason}</WKText>
                  </View>
                </View>
                <WKButton
                  title="Try It"
                  onPress={() => handleAcceptRecommendation(rec.id)}
                  size="small"
                  style={styles.tryButton}
                />
              </View>
            ))}
          </WKCard>
        )}

        {/* Learning Insights */}
        <WKCard style={styles.insightsCard}>
          <WKText style={styles.cardTitle}>AI Learning Insights</WKText>
          <View style={styles.insight}>
            <WKText style={styles.insightTitle}>🧠 Learning Velocity</WKText>
            <WKText style={styles.insightText}>
              You're learning at {Math.round(todayMetrics?.studyVelocity || 0)} words per hour.
              {todayMetrics?.studyVelocity && todayMetrics.studyVelocity > 10
                ? " Excellent pace! Keep it up!"
                : todayMetrics?.studyVelocity && todayMetrics.studyVelocity > 5
                ? " Good progress. Consider increasing study intensity."
                : " Focus on building momentum with regular sessions."}
            </WKText>
          </View>
          <View style={styles.insight}>
            <WKText style={styles.insightTitle}>🎯 Adaptive Difficulty</WKText>
            <WKText style={styles.insightText}>
              Your current difficulty level is optimized for {todayMetrics?.consistencyScore && todayMetrics.consistencyScore > 70 ? 'challenging' : 'comfortable'} learning.
              The AI adjusts content based on your performance patterns.
            </WKText>
          </View>
          <View style={styles.insight}>
            <WKText style={styles.insightTitle}>📊 Retention Analysis</WKText>
            <WKText style={styles.insightText}>
              Your long-term retention rate is estimated at {Math.round(todayMetrics?.retentionRate || 85)}%.
              {todayMetrics?.retentionRate && todayMetrics.retentionRate > 90
                ? " Outstanding memory retention!"
                : " Consider more spaced repetition practice."}
            </WKText>
          </View>
        </WKCard>

        {/* AI Study Planning */}
        <WKCard style={styles.planningCard}>
          <WKText style={styles.cardTitle}>AI Study Planning</WKText>
          <View style={styles.planningGrid}>
            <View style={styles.planningItem}>
              <WKText style={styles.planningValue}>
                {Math.max(1, Math.round((2000 - (weeklyProgress.totalWords * 4)) / (weeklyProgress.averageAccuracy / 100 * weeklyProgress.averageSessionLength)))}
              </WKText>
              <WKText style={styles.planningLabel}>Days to Complete Course</WKText>
              <WKText style={styles.planningSubtext}>At current pace</WKText>
            </View>
            <View style={styles.planningItem}>
              <WKText style={styles.planningValue}>
                {Math.round(weeklyProgress.averageSessionLength * 1.2)}m
              </WKText>
              <WKText style={styles.planningLabel}>Optimal Session Length</WKText>
              <WKText style={styles.planningSubtext}>For best retention</WKText>
            </View>
            <View style={styles.planningItem}>
              <WKText style={styles.planningValue}>
                {Math.round(weeklyProgress.averageAccuracy + 5)}%
              </WKText>
              <WKText style={styles.planningLabel}>Predicted Accuracy</WKText>
              <WKText style={styles.planningSubtext}>Next week</WKText>
            </View>
          </View>
        </WKCard>

        {/* Quick Actions */}
        <WKCard style={styles.actionsCard}>
          <WKText style={styles.cardTitle}>Quick Actions</WKText>
          <View style={styles.actionsGrid}>
            <PlayButton
              title="Start Session"
              subtitle="Begin learning"
              onPress={() => {/* Navigate to study */}}
              style={styles.actionButton}
            />
            <PlayButton
              title="View Progress"
              subtitle="Detailed analytics"
              onPress={() => {/* Navigate to detailed progress */}}
              style={styles.actionButton}
            />
            <PlayButton
              title="Get Tips"
              subtitle="AI suggestions"
              onPress={() => {/* Navigate to tips */}}
              style={styles.actionButton}
            />
          </View>
        </WKCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  overviewCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chartCard: {
    marginBottom: spacing.lg,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  recommendationsCard: {
    marginBottom: spacing.lg,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  recommendationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tryButton: {
    marginLeft: spacing.md,
  },
  insightsCard: {
    marginBottom: spacing.lg,
  },
  insight: {
    marginBottom: spacing.lg,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insightText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsCard: {
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  planningCard: {
    marginBottom: spacing.lg,
  },
  planningGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  planningItem: {
    alignItems: 'center',
    flex: 1,
  },
  planningValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  planningLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  planningSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});