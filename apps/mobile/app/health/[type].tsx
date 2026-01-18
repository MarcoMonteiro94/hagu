import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  Scale,
  Smile,
  Zap,
  Moon,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Trash2,
  Calendar,
  X,
  Check,
  Activity,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import {
  useHealthArea,
  useMetricsByType,
  useDeleteMetric,
  useWeightStats,
  METRIC_CONFIGS,
  type MetricType,
  type MetricEntry,
  type WeightGoal,
} from '@/hooks'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LineChart } from '@/components/finances'

const MOOD_LABELS = ['', 'Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem']
const ENERGY_LABELS = ['', 'Exausto', 'Cansado', 'Normal', 'Energizado', 'Muito energizado']

type ChartPeriod = '7d' | '30d' | '90d' | '1y' | 'all'

function getMetricIcon(type: MetricType, color: string, size = 20) {
  switch (type) {
    case 'weight':
      return <Scale size={size} color={color} />
    case 'mood':
      return <Smile size={size} color={color} />
    case 'energy':
      return <Zap size={size} color={color} />
    case 'sleep':
      return <Moon size={size} color={color} />
    case 'water':
      return <Droplets size={size} color={color} />
  }
}

function formatMetricValue(type: MetricType, value: number): string {
  if (type === 'mood') return MOOD_LABELS[value] || String(value)
  if (type === 'energy') return ENERGY_LABELS[value] || String(value)

  const config = METRIC_CONFIGS.find((c) => c.type === type)
  return `${value}${config?.unit ? ` ${config.unit}` : ''}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function filterByPeriod(metrics: MetricEntry[], period: ChartPeriod): MetricEntry[] {
  if (period === 'all') return metrics

  const now = new Date()
  let cutoffDate: Date

  switch (period) {
    case '7d':
      cutoffDate = new Date(now.setDate(now.getDate() - 7))
      break
    case '30d':
      cutoffDate = new Date(now.setDate(now.getDate() - 30))
      break
    case '90d':
      cutoffDate = new Date(now.setDate(now.getDate() - 90))
      break
    case '1y':
      cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    default:
      return metrics
  }

  const cutoffStr = cutoffDate.toISOString().split('T')[0]
  return metrics.filter((m) => m.date >= cutoffStr)
}

// BMI calculation
const WEIGHT_GOAL_KEY = '@hagu/weight_goal'

interface BMIResult {
  value: number
  category: 'underweight' | 'normal' | 'overweight' | 'obese'
  color: string
}

function calculateBMI(weightKg: number, heightCm: number = 170): BMIResult {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)

  let category: BMIResult['category']
  let color: string

  if (bmi < 18.5) {
    category = 'underweight'
    color = '#3b82f6'
  } else if (bmi < 25) {
    category = 'normal'
    color = '#22c55e'
  } else if (bmi < 30) {
    category = 'overweight'
    color = '#f97316'
  } else {
    category = 'obese'
    color = '#ef4444'
  }

  return { value: Math.round(bmi * 10) / 10, category, color }
}

// Weight Goal Modal Component
interface WeightGoalModalProps {
  visible: boolean
  onClose: () => void
  currentGoal: WeightGoal | null
  onSave: (goal: WeightGoal | null) => void
}

function WeightGoalModal({ visible, onClose, currentGoal, onSave }: WeightGoalModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [targetWeight, setTargetWeight] = useState(currentGoal?.target?.toString() || '')

  const handleSave = () => {
    const target = parseFloat(targetWeight)
    if (isNaN(target) || target <= 0) {
      onSave(null)
    } else {
      onSave({ target, unit: 'kg', startDate: new Date().toISOString() })
    }
    onClose()
  }

  const handleRemove = () => {
    onSave(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.modalContent, { backgroundColor: colors.card }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('health.goal.title')}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={[styles.goalInputLabel, { color: colors.mutedForeground }]}>
              {t('health.goal.targetWeight')}
            </Text>
            <View style={styles.goalInputRow}>
              <TextInput
                style={[
                  styles.goalInput,
                  { backgroundColor: colors.secondary, color: colors.foreground },
                ]}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
                placeholder="70.0"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.goalInputUnit, { color: colors.mutedForeground }]}>kg</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            {currentGoal && (
              <Pressable
                style={[styles.removeButton, { borderColor: colors.error }]}
                onPress={handleRemove}
              >
                <Text style={[styles.removeButtonText, { color: colors.error }]}>
                  {t('health.goal.removeGoal')}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSave}
            >
              <Check size={18} color="#fff" />
              <Text style={styles.saveButtonText}>{t('health.goal.setGoal')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

interface StatCardProps {
  label: string
  value: string | null
  color?: string
  delay: number
}

function StatCard({ label, value, color, delay }: StatCardProps) {
  const { colors } = useTheme()

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}
    >
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color || colors.foreground }]}>
        {value ?? '-'}
      </Text>
    </Animated.View>
  )
}

interface EntryItemProps {
  entry: MetricEntry
  type: MetricType
  color: string
  onDelete: () => void
}

function EntryItem({ entry, type, color, onDelete }: EntryItemProps) {
  const { colors } = useTheme()

  const handleDelete = () => {
    Alert.alert(
      'Excluir registro',
      'Tem certeza que deseja excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: onDelete },
      ]
    )
  }

  return (
    <View style={[styles.entryItem, { backgroundColor: colors.card }, cardShadow]}>
      <View style={styles.entryContent}>
        <View style={styles.entryDateRow}>
          <Calendar size={14} color={colors.mutedForeground} />
          <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>
            {formatDate(entry.date)}
          </Text>
        </View>
        <Text style={[styles.entryValue, { color: color }]}>
          {formatMetricValue(type, entry.value)}
        </Text>
      </View>
      <Pressable onPress={handleDelete} hitSlop={8}>
        <Trash2 size={18} color={colors.error} />
      </Pressable>
    </View>
  )
}

export default function MetricDetailScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { type } = useLocalSearchParams<{ type: MetricType }>()

  const { data: healthArea } = useHealthArea()
  const {
    data: metrics = [],
    isLoading,
    refetch,
  } = useMetricsByType(healthArea?.id, type)

  const deleteMetric = useDeleteMetric()

  const [period, setPeriod] = useState<ChartPeriod>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)

  const config = METRIC_CONFIGS.find((c) => c.type === type)!
  const weightStats = useWeightStats(type === 'weight' ? metrics : undefined, weightGoal ?? undefined)

  // Load weight goal from storage
  const loadWeightGoal = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WEIGHT_GOAL_KEY)
      if (stored) {
        setWeightGoal(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load weight goal:', error)
    }
  }, [])

  // Save weight goal to storage
  const saveWeightGoal = useCallback(async (goal: WeightGoal | null) => {
    try {
      if (goal) {
        await AsyncStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify(goal))
      } else {
        await AsyncStorage.removeItem(WEIGHT_GOAL_KEY)
      }
      setWeightGoal(goal)
    } catch (error) {
      console.error('Failed to save weight goal:', error)
    }
  }, [])

  // Load goal on mount
  useEffect(() => {
    if (type === 'weight') {
      loadWeightGoal()
    }
  }, [type, loadWeightGoal])

  // Calculate BMI if weight
  const bmi = useMemo(() => {
    if (type !== 'weight' || !weightStats.current) return null
    return calculateBMI(weightStats.current)
  }, [type, weightStats.current])

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!weightGoal || !weightStats.current) return null
    const startWeight = weightStats.highest || weightStats.current
    const targetWeight = weightGoal.target
    const currentWeight = weightStats.current

    if (startWeight <= targetWeight) return null // Goal is to gain weight

    const totalToLose = startWeight - targetWeight
    const lost = startWeight - currentWeight
    const progress = Math.min(100, Math.max(0, (lost / totalToLose) * 100))

    return {
      progress,
      remaining: currentWeight - targetWeight,
    }
  }, [weightGoal, weightStats])

  const filteredMetrics = useMemo(() => {
    return filterByPeriod(metrics, period)
  }, [metrics, period])

  const chartData = useMemo(() => {
    const sorted = [...filteredMetrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Sample data for chart (max 20 points)
    const step = Math.max(1, Math.floor(sorted.length / 20))
    const sampled = sorted.filter((_, i) => i % step === 0 || i === sorted.length - 1)

    return sampled.map((m) => ({
      label: formatDate(m.date),
      value: m.value,
    }))
  }, [filteredMetrics])

  const recentEntries = useMemo(() => {
    return [...metrics]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }, [metrics])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      if (!healthArea) return
      try {
        await deleteMetric.mutateAsync({ id, areaId: healthArea.id })
      } catch (error) {
        console.error('Failed to delete metric:', error)
      }
    },
    [deleteMetric, healthArea]
  )

  const periods: { key: ChartPeriod; label: string }[] = [
    { key: '7d', label: t('health.chart.week') },
    { key: '30d', label: t('health.chart.month') },
    { key: '90d', label: t('health.chart.quarter') },
    { key: '1y', label: t('health.chart.year') },
    { key: 'all', label: t('health.chart.all') },
  ]

  if (isLoading && !metrics.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={config.color} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={config.color}
            colors={[config.color]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              {getMetricIcon(type, config.color, 24)}
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t(`health.${type}`)}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t('health.evolution')}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {type === 'weight' && (
              <Pressable
                style={[styles.goalButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => setShowGoalModal(true)}
              >
                <Target size={18} color={colors.accent} />
              </Pressable>
            )}
            <Pressable
              style={[styles.addButton, { backgroundColor: config.color }]}
              onPress={() => router.push('/health' as any)}
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Period Selector */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.periodContainer}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScroll}
          >
            {periods.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: period === p.key ? config.color + '20' : colors.secondary,
                    borderColor: period === p.key ? config.color : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: period === p.key ? config.color : colors.mutedForeground },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Stats for Weight */}
        {type === 'weight' && metrics.length > 0 && (
          <View style={styles.statsRow}>
            <StatCard
              label={t('health.stats.current')}
              value={weightStats.current ? `${weightStats.current} kg` : null}
              color={config.color}
              delay={150}
            />
            <StatCard
              label={t('health.stats.lowest')}
              value={weightStats.lowest ? `${weightStats.lowest} kg` : null}
              delay={200}
            />
            <StatCard
              label={t('health.stats.highest')}
              value={weightStats.highest ? `${weightStats.highest} kg` : null}
              delay={250}
            />
            {weightStats.variation7d !== null && (
              <StatCard
                label={t('health.stats.variation7d')}
                value={`${weightStats.variation7d > 0 ? '+' : ''}${weightStats.variation7d.toFixed(1)} kg`}
                color={
                  weightStats.variation7d > 0
                    ? colors.error
                    : weightStats.variation7d < 0
                      ? colors.success
                      : undefined
                }
                delay={300}
              />
            )}
          </View>
        )}

        {/* Goal Progress Card */}
        {type === 'weight' && weightGoal && goalProgress && (
          <Animated.View
            entering={FadeInDown.delay(320).duration(400)}
            style={[styles.goalCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <View style={styles.goalCardHeader}>
              <Target size={20} color={colors.accent} />
              <Text style={[styles.goalCardTitle, { color: colors.foreground }]}>
                {t('health.goal.progress')}
              </Text>
            </View>
            <View style={styles.goalProgress}>
              <View style={styles.goalProgressBar}>
                <View
                  style={[
                    styles.goalProgressFill,
                    { backgroundColor: colors.accent, width: `${goalProgress.progress}%` },
                  ]}
                />
              </View>
              <Text style={[styles.goalProgressText, { color: colors.accent }]}>
                {Math.round(goalProgress.progress)}%
              </Text>
            </View>
            <View style={styles.goalStats}>
              <View style={styles.goalStatItem}>
                <Text style={[styles.goalStatLabel, { color: colors.mutedForeground }]}>
                  {t('health.stats.current')}
                </Text>
                <Text style={[styles.goalStatValue, { color: colors.foreground }]}>
                  {weightStats.current} kg
                </Text>
              </View>
              <View style={styles.goalStatDivider} />
              <View style={styles.goalStatItem}>
                <Text style={[styles.goalStatLabel, { color: colors.mutedForeground }]}>
                  {t('health.stats.goal')}
                </Text>
                <Text style={[styles.goalStatValue, { color: colors.accent }]}>
                  {weightGoal.target} kg
                </Text>
              </View>
              <View style={styles.goalStatDivider} />
              <View style={styles.goalStatItem}>
                <Text style={[styles.goalStatLabel, { color: colors.mutedForeground }]}>
                  {t('health.stats.remaining')}
                </Text>
                <Text style={[styles.goalStatValue, { color: colors.foreground }]}>
                  {goalProgress.remaining.toFixed(1)} kg
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* BMI Card */}
        {type === 'weight' && bmi && (
          <Animated.View
            entering={FadeInDown.delay(340).duration(400)}
            style={[styles.bmiCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <View style={styles.bmiHeader}>
              <Activity size={20} color={bmi.color} />
              <Text style={[styles.bmiTitle, { color: colors.foreground }]}>
                {t('health.bmi.title')}
              </Text>
            </View>
            <View style={styles.bmiContent}>
              <Text style={[styles.bmiValue, { color: bmi.color }]}>{bmi.value}</Text>
              <View style={[styles.bmiCategoryBadge, { backgroundColor: bmi.color + '20' }]}>
                <Text style={[styles.bmiCategoryText, { color: bmi.color }]}>
                  {t(`health.bmi.${bmi.category}`)}
                </Text>
              </View>
            </View>
            <View style={styles.bmiScale}>
              <View style={[styles.bmiScaleItem, { backgroundColor: '#3b82f6' }]} />
              <View style={[styles.bmiScaleItem, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.bmiScaleItem, { backgroundColor: '#f97316' }]} />
              <View style={[styles.bmiScaleItem, { backgroundColor: '#ef4444' }]} />
            </View>
            <View style={styles.bmiLabels}>
              <Text style={[styles.bmiLabelText, { color: colors.mutedForeground }]}>{'<18.5'}</Text>
              <Text style={[styles.bmiLabelText, { color: colors.mutedForeground }]}>18.5-25</Text>
              <Text style={[styles.bmiLabelText, { color: colors.mutedForeground }]}>25-30</Text>
              <Text style={[styles.bmiLabelText, { color: colors.mutedForeground }]}>{'>30'}</Text>
            </View>
          </Animated.View>
        )}

        {/* Chart */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={[styles.chartCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>
            {t('health.evolution')}
          </Text>
          {chartData.length > 1 ? (
            <LineChart data={chartData} height={200} color={config.color} />
          ) : (
            <View style={styles.noChartData}>
              <Text style={[styles.noChartText, { color: colors.mutedForeground }]}>
                {t('health.chart.noData')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.entriesSection}
          >
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {t('health.recentEntries')}
            </Text>
            <View style={styles.entriesList}>
              {recentEntries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  type={type}
                  color={config.color}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Weight Goal Modal */}
      {type === 'weight' && (
        <WeightGoalModal
          visible={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          currentGoal={weightGoal}
          onSave={saveWeightGoal}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[8],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Period
  periodContainer: {
    paddingVertical: spacing[2],
  },
  periodScroll: {
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  periodButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  periodText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  statCard: {
    width: '47%',
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },

  // Chart
  chartCard: {
    marginHorizontal: spacing[6],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  chartTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[4],
  },
  noChartData: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChartText: {
    fontSize: typography.size.sm,
  },

  // Entries
  entriesSection: {
    paddingHorizontal: spacing[6],
    marginTop: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  entriesList: {
    gap: spacing[2],
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  entryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  entryDate: {
    fontSize: typography.size.sm,
  },
  entryValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  // Header buttons
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Goal Card
  goalCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  goalCardTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  goalProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  goalProgressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    width: 40,
    textAlign: 'right',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  goalStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  goalStatLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing[1],
  },
  goalStatValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },

  // BMI Card
  bmiCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  bmiTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  bmiValue: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
  },
  bmiCategoryBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  bmiCategoryText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  bmiScale: {
    flexDirection: 'row',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  bmiScaleItem: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
  },
  bmiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiLabelText: {
    fontSize: typography.size.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    padding: spacing[6],
    borderRadius: radius['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  goalInputContainer: {
    marginBottom: spacing[6],
  },
  goalInputLabel: {
    fontSize: typography.size.sm,
    marginBottom: spacing[2],
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  goalInput: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    fontSize: typography.size.lg,
  },
  goalInputUnit: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  removeButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: '#fff',
  },
})
