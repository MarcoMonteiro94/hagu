import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  LayoutGrid,
  GripVertical,
  Flame,
  Target,
  CheckSquare,
  Wallet,
  FolderKanban,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { useHomeWidgets, AppSettings } from '@/hooks/use-settings'

// =============================================================================
// Types
// =============================================================================

type WidgetKey = keyof AppSettings['homeWidgets']

interface WidgetInfo {
  key: WidgetKey
  labelKey: string
  descriptionKey: string
  icon: typeof Flame
  iconColor: string
}

// =============================================================================
// Constants
// =============================================================================

const WIDGET_INFO: WidgetInfo[] = [
  {
    key: 'quickStats',
    labelKey: 'widgets.quickStats',
    descriptionKey: 'widgets.quickStatsDesc',
    icon: Flame,
    iconColor: '#f97316',
  },
  {
    key: 'habits',
    labelKey: 'widgets.habits',
    descriptionKey: 'widgets.habitsDesc',
    icon: Target,
    iconColor: '#22c55e',
  },
  {
    key: 'tasks',
    labelKey: 'widgets.tasks',
    descriptionKey: 'widgets.tasksDesc',
    icon: CheckSquare,
    iconColor: '#3b82f6',
  },
  {
    key: 'finances',
    labelKey: 'widgets.finances',
    descriptionKey: 'widgets.financesDesc',
    icon: Wallet,
    iconColor: '#eab308',
  },
  {
    key: 'projects',
    labelKey: 'widgets.projects',
    descriptionKey: 'widgets.projectsDesc',
    icon: FolderKanban,
    iconColor: '#8b5cf6',
  },
]

// =============================================================================
// Components
// =============================================================================

interface WidgetRowProps {
  widget: WidgetInfo
  isVisible: boolean
  onToggle: () => void
  index: number
}

function WidgetRow({ widget, isVisible, onToggle, index }: WidgetRowProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const Icon = widget.icon

  return (
    <View
     
      style={[
        styles.widgetRow,
        {
          backgroundColor: colors.card,
          opacity: isVisible ? 1 : 0.6,
        },
        cardShadow,
      ]}
    >
      <View style={styles.dragHandle}>
        <GripVertical size={20} color={colors.mutedForeground} />
      </View>

      <View style={[styles.widgetIcon, { backgroundColor: widget.iconColor + '20' }]}>
        <Icon size={20} color={widget.iconColor} />
      </View>

      <View style={styles.widgetContent}>
        <Text style={[styles.widgetLabel, { color: colors.foreground }]}>
          {t(widget.labelKey)}
        </Text>
        <Text style={[styles.widgetDescription, { color: colors.mutedForeground }]}>
          {t(widget.descriptionKey)}
        </Text>
      </View>

      <Pressable
        style={[
          styles.visibilityButton,
          { backgroundColor: isVisible ? colors.accent + '20' : colors.muted },
        ]}
        onPress={onToggle}
      >
        {isVisible ? (
          <Eye size={18} color={colors.accent} />
        ) : (
          <EyeOff size={18} color={colors.mutedForeground} />
        )}
      </Pressable>
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function WidgetsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { widgets, widgetOrder, toggleWidget, reorderWidgets } = useHomeWidgets()

  // Get widgets in order
  const orderedWidgets = widgetOrder
    .map(key => WIDGET_INFO.find(w => w.key === key))
    .filter((w): w is WidgetInfo => w !== undefined)

  // Add any widgets that might be missing from the order
  const allWidgets = [
    ...orderedWidgets,
    ...WIDGET_INFO.filter(w => !widgetOrder.includes(w.key)),
  ]

  const visibleCount = Object.values(widgets).filter(Boolean).length

  const handleReset = () => {
    Alert.alert(
      t('widgets.resetTitle'),
      t('widgets.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            reorderWidgets(['quickStats', 'habits', 'tasks', 'finances', 'projects'])
            // Reset visibility to all visible
            WIDGET_INFO.forEach(w => {
              if (!widgets[w.key]) {
                toggleWidget(w.key)
              }
            })
          },
        },
      ]
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen
          options={{
            title: t('widgets.title'),
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
            headerRight: () => (
              <Pressable onPress={handleReset} style={styles.headerButton}>
                <RotateCcw size={20} color={colors.mutedForeground} />
              </Pressable>
            ),
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Info */}
          <View>
            <View style={[styles.headerCard, { backgroundColor: colors.accent + '10' }]}>
              <LayoutGrid size={24} color={colors.accent} />
              <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                  {t('widgets.customizeHome')}
                </Text>
                <Text style={[styles.headerDescription, { color: colors.mutedForeground }]}>
                  {t('widgets.customizeHomeDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* Visibility Summary */}
          <View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }, cardShadow]}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                {t('widgets.visibleWidgets')}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {visibleCount} / {WIDGET_INFO.length}
              </Text>
            </View>
          </View>

          {/* Section Title */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('widgets.homeWidgets')}
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
              {t('widgets.dragToReorder')}
            </Text>
          </View>

          {/* Widget List */}
          <View style={styles.widgetList}>
            {allWidgets.map((widget, index) => (
              <WidgetRow
                key={widget.key}
                widget={widget}
                isVisible={widgets[widget.key]}
                onToggle={() => toggleWidget(widget.key)}
                index={index}
              />
            ))}
          </View>

          {/* Info Note */}
          <View>
            <Text style={[styles.infoNote, { color: colors.mutedForeground }]}>
              {t('widgets.infoNote')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  headerButton: {
    padding: spacing[2],
  },

  // Header Card
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  headerDescription: {
    fontSize: typography.size.sm,
    marginTop: spacing[0.5],
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  summaryLabel: {
    fontSize: typography.size.sm,
  },
  summaryValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },

  // Section
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[6],
    marginBottom: spacing[1],
  },
  sectionDescription: {
    fontSize: typography.size.sm,
    marginBottom: spacing[3],
  },

  // Widget List
  widgetList: {
    gap: spacing[2],
  },

  // Widget Row
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.xl,
    gap: spacing[3],
  },
  dragHandle: {
    padding: spacing[1],
  },
  widgetIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetContent: {
    flex: 1,
  },
  widgetLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  widgetDescription: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  visibilityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info Note
  infoNote: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    lineHeight: 20,
  },
})
