import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  Heart,
  Scale,
  Smile,
  Zap,
  Moon,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import {
  useHealthArea,
  useMetricsByArea,
  useCreateMetric,
  useLatestMetric,
  useMetricTrend,
  METRIC_CONFIGS,
  type MetricType,
  type MetricEntry,
} from '@/hooks'
import { DatePicker } from '@/components/tasks/DatePicker'

const MOOD_LABELS = ['', 'Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem']
const ENERGY_LABELS = ['', 'Exausto', 'Cansado', 'Normal', 'Energizado', 'Muito energizado']

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatMetricValue(type: MetricType, value: number): string {
  if (type === 'mood') return MOOD_LABELS[value] || String(value)
  if (type === 'energy') return ENERGY_LABELS[value] || String(value)

  const config = METRIC_CONFIGS.find((c) => c.type === type)
  return `${value}${config?.unit ? ` ${config.unit}` : ''}`
}

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

interface MetricCardProps {
  type: MetricType
  metrics: MetricEntry[]
  delay: number
  onPress: () => void
}

function MetricCard({ type, metrics, delay, onPress }: MetricCardProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const config = METRIC_CONFIGS.find((c) => c.type === type)!
  const latestMetric = useLatestMetric(metrics)
  const trend = useMetricTrend(metrics)

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.metricCardContainer}
    >
      <Pressable
        onPress={onPress}
        style={[styles.metricCard, { backgroundColor: colors.card }, cardShadow]}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: config.color + '20' }]}>
            {getMetricIcon(type, config.color)}
          </View>
          {latestMetric && (
            <View style={styles.trendIcon}>
              {trend === 'up' && <TrendingUp size={16} color={colors.success} />}
              {trend === 'down' && <TrendingDown size={16} color={colors.error} />}
              {trend === 'neutral' && <Minus size={16} color={colors.mutedForeground} />}
            </View>
          )}
        </View>
        <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
          {t(`health.${type}`)}
        </Text>
        <Text style={[styles.metricValue, { color: colors.foreground }]}>
          {latestMetric ? formatMetricValue(type, latestMetric.value) : '-'}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

function EmptyState({ onAddMetric }: { onAddMetric: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.success + '15' }]}>
        <Heart size={48} color={colors.success} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('health.noMetrics')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('health.emptyDescription')}
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.success }]}
        onPress={onAddMetric}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>{t('health.addMetric')}</Text>
      </Pressable>
    </Animated.View>
  )
}

interface AddMetricModalProps {
  visible: boolean
  onClose: () => void
  areaId: string
  selectedType?: MetricType
}

function AddMetricModal({ visible, onClose, areaId, selectedType: initialType }: AddMetricModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const createMetric = useCreateMetric()

  const [selectedType, setSelectedType] = useState<MetricType>(initialType || 'weight')
  const [value, setValue] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)

  const selectedConfig = METRIC_CONFIGS.find((c) => c.type === selectedType)!

  const handleSubmit = async () => {
    if (!value || !areaId) return

    try {
      await createMetric.mutateAsync({
        areaId,
        type: selectedType,
        value: parseFloat(value.replace(',', '.')),
        unit: selectedConfig.unit || undefined,
        date: date?.toISOString().split('T')[0] || getTodayString(),
      })

      setValue('')
      setDate(new Date())
      onClose()
    } catch (error) {
      console.error('Failed to add metric:', error)
    }
  }

  const isValid = value.trim().length > 0 && parseFloat(value.replace(',', '.')) > 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {t('health.addMetric')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
          {/* Metric Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {t('health.metricType')}
            </Text>
            <Pressable
              onPress={() => setShowTypePicker(!showTypePicker)}
              style={[
                styles.selectButton,
                { backgroundColor: colors.secondary, borderColor: selectedConfig.color },
              ]}
            >
              <View style={[styles.selectIcon, { backgroundColor: selectedConfig.color + '20' }]}>
                {getMetricIcon(selectedType, selectedConfig.color)}
              </View>
              <Text style={[styles.selectText, { color: colors.foreground }]}>
                {t(`health.${selectedType}`)}
              </Text>
              <ChevronDown size={18} color={colors.mutedForeground} />
            </Pressable>

            {showTypePicker && (
              <View
                style={[styles.optionsList, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {METRIC_CONFIGS.map((config) => (
                  <Pressable
                    key={config.type}
                    onPress={() => {
                      setSelectedType(config.type)
                      setShowTypePicker(false)
                      setValue('')
                    }}
                    style={[
                      styles.optionItem,
                      selectedType === config.type && { backgroundColor: colors.secondary },
                    ]}
                  >
                    <View style={[styles.selectIcon, { backgroundColor: config.color + '20' }]}>
                      {getMetricIcon(config.type, config.color)}
                    </View>
                    <Text style={[styles.optionText, { color: colors.foreground }]}>
                      {t(`health.${config.type}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {t('health.selectDate')}
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Calendar size={18} color={colors.mutedForeground} />
              <Text style={[styles.dateText, { color: colors.foreground }]}>
                {date?.toLocaleDateString() || t('health.selectDate')}
              </Text>
            </Pressable>
            <DatePicker
              value={date}
              onChange={setDate}
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              colors={colors}
            />
          </View>

          {/* Value */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {t('health.value')} {selectedConfig.unit && `(${selectedConfig.unit})`}
            </Text>

            {selectedType === 'mood' || selectedType === 'energy' ? (
              <View style={styles.scaleButtons}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setValue(String(v))}
                    style={[
                      styles.scaleButton,
                      {
                        backgroundColor:
                          value === String(v) ? selectedConfig.color + '20' : colors.secondary,
                        borderColor: value === String(v) ? selectedConfig.color : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        { color: value === String(v) ? selectedConfig.color : colors.foreground },
                      ]}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border },
                ]}
                value={value}
                onChangeText={setValue}
                placeholder={`Ex: ${selectedConfig.min}`}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            )}

            {selectedType === 'mood' && value && (
              <Text style={[styles.scaleLabel, { color: colors.mutedForeground }]}>
                {MOOD_LABELS[parseInt(value)]}
              </Text>
            )}
            {selectedType === 'energy' && value && (
              <Text style={[styles.scaleLabel, { color: colors.mutedForeground }]}>
                {ENERGY_LABELS[parseInt(value)]}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!isValid || createMetric.isPending}
              style={[
                styles.button,
                styles.submitButton,
                { backgroundColor: isValid ? colors.success : colors.muted },
              ]}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {createMetric.isPending ? t('common.loading') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

export default function HealthScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: healthArea, isLoading: isLoadingArea } = useHealthArea()
  const {
    data: metrics = [],
    isLoading: isLoadingMetrics,
    refetch,
  } = useMetricsByArea(healthArea?.id)

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType | undefined>()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

  const handleMetricPress = useCallback((type: MetricType) => {
    router.push(`/health/${type}` as any)
  }, [])

  const handleAddMetric = useCallback((type?: MetricType) => {
    setSelectedMetricType(type)
    setShowAddModal(true)
  }, [])

  const getMetricsByType = useCallback(
    (type: MetricType) => metrics.filter((m) => m.type === type),
    [metrics]
  )

  const isLoading = isLoadingArea || isLoadingMetrics

  if (isLoading && !metrics.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.success} />
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
            tintColor={colors.success}
            colors={[colors.success]}
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
              <Heart size={24} color={colors.success} />
              <Text style={[styles.title, { color: colors.foreground }]}>{t('health.title')}</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t('health.subtitle')}
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.success }]}
            onPress={() => handleAddMetric()}
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </Animated.View>

        {/* Quick Stats Grid */}
        {metrics.length === 0 ? (
          <EmptyState onAddMetric={() => handleAddMetric()} />
        ) : (
          <View style={styles.metricsGrid}>
            {METRIC_CONFIGS.map((config, index) => (
              <MetricCard
                key={config.type}
                type={config.type}
                metrics={getMetricsByType(config.type)}
                delay={100 + index * 50}
                onPress={() => handleMetricPress(config.type)}
              />
            ))}
          </View>
        )}

        {/* Quick Actions */}
        {metrics.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(350).duration(400)}
            style={styles.quickActionsSection}
          >
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {t('health.addMetric')}
            </Text>
            <View style={styles.quickActionsGrid}>
              {METRIC_CONFIGS.map((config) => (
                <Pressable
                  key={config.type}
                  onPress={() => handleAddMetric(config.type)}
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    cardShadow,
                  ]}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: config.color + '20' }]}>
                    {getMetricIcon(config.type, config.color, 18)}
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>
                    {t(`health.${config.type}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Metric Modal */}
      {healthArea && (
        <AddMetricModal
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setSelectedMetricType(undefined)
          }}
          areaId={healthArea.id}
          selectedType={selectedMetricType}
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
    paddingBottom: spacing[6],
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

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[6],
    justifyContent: 'space-between',
  },
  metricCardContainer: {
    width: '48%',
    marginBottom: spacing[3],
  },
  metricCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIcon: {},
  metricLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing[1],
  },
  metricValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },

  // Quick Actions
  quickActionsSection: {
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing[2],
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3.5],
    borderRadius: radius.lg,
    marginTop: spacing[6],
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: spacing[6],
    gap: spacing[5],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  selectIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  optionsList: {
    marginTop: spacing[2],
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3.5],
  },
  optionText: {
    fontSize: typography.size.base,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  dateText: {
    fontSize: typography.size.base,
  },
  input: {
    fontSize: typography.size.base,
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  scaleButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  scaleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  scaleButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  scaleLabel: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
  },
  cancelButton: {},
  submitButton: {},
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  submitButtonText: {
    color: '#fff',
  },
})
