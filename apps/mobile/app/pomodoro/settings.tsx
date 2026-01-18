import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  Clock,
  Coffee,
  BatteryFull,
  Repeat,
  Bell,
  Smartphone,
  Volume2,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { usePomodoroSettings } from '@/hooks/use-pomodoro'

// =============================================================================
// Components
// =============================================================================

interface DurationPickerProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

function DurationPicker({ value, onChange, min = 1, max = 60, step = 1 }: DurationPickerProps) {
  const { colors } = useTheme()

  const decrease = () => {
    if (value > min) {
      onChange(value - step)
    }
  }

  const increase = () => {
    if (value < max) {
      onChange(value + step)
    }
  }

  return (
    <View style={styles.durationPicker}>
      <Pressable
        onPress={decrease}
        style={[styles.durationButton, { backgroundColor: colors.muted }]}
      >
        <Text style={[styles.durationButtonText, { color: colors.foreground }]}>−</Text>
      </Pressable>
      <Text style={[styles.durationValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Pressable
        onPress={increase}
        style={[styles.durationButton, { backgroundColor: colors.muted }]}
      >
        <Text style={[styles.durationButtonText, { color: colors.foreground }]}>+</Text>
      </Pressable>
    </View>
  )
}

interface SettingRowProps {
  icon: React.ReactNode
  label: string
  description?: string
  children: React.ReactNode
}

function SettingRow({ icon, label, description, children }: SettingRowProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.accent + '15' }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      {children}
    </View>
  )
}

interface SettingToggleRowProps {
  icon: React.ReactNode
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
}

function SettingToggleRow({ icon, label, description, value, onValueChange }: SettingToggleRowProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.accent + '15' }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.accent + '80' }}
        thumbColor={value ? colors.accent : colors.mutedForeground}
      />
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function PomodoroSettingsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { settings, updateSettings } = usePomodoroSettings()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('pomodoro.settings.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Duration Settings */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('pomodoro.settings.durations')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
            <SettingRow
              icon={<Clock size={20} color={colors.accent} />}
              label={t('pomodoro.settings.workDuration')}
              description={t('pomodoro.settings.minutes')}
            >
              <DurationPicker
                value={settings.workDuration}
                onChange={(value) => updateSettings({ workDuration: value })}
                min={5}
                max={60}
                step={5}
              />
            </SettingRow>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              icon={<Coffee size={20} color="#22c55e" />}
              label={t('pomodoro.settings.shortBreakDuration')}
              description={t('pomodoro.settings.minutes')}
            >
              <DurationPicker
                value={settings.shortBreakDuration}
                onChange={(value) => updateSettings({ shortBreakDuration: value })}
                min={1}
                max={15}
                step={1}
              />
            </SettingRow>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              icon={<BatteryFull size={20} color="#3b82f6" />}
              label={t('pomodoro.settings.longBreakDuration')}
              description={t('pomodoro.settings.minutes')}
            >
              <DurationPicker
                value={settings.longBreakDuration}
                onChange={(value) => updateSettings({ longBreakDuration: value })}
                min={5}
                max={30}
                step={5}
              />
            </SettingRow>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingRow
              icon={<Repeat size={20} color="#f97316" />}
              label={t('pomodoro.settings.sessionsBeforeLongBreak')}
              description={t('pomodoro.settings.sessions')}
            >
              <DurationPicker
                value={settings.sessionsBeforeLongBreak}
                onChange={(value) => updateSettings({ sessionsBeforeLongBreak: value })}
                min={2}
                max={8}
                step={1}
              />
            </SettingRow>
          </View>
        </Animated.View>

        {/* Auto-start Settings */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('pomodoro.settings.automation')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
            <SettingToggleRow
              icon={<Coffee size={20} color="#22c55e" />}
              label={t('pomodoro.settings.autoStartBreaks')}
              description={t('pomodoro.settings.autoStartBreaksDesc')}
              value={settings.autoStartBreaks}
              onValueChange={(value) => updateSettings({ autoStartBreaks: value })}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingToggleRow
              icon={<Clock size={20} color={colors.accent} />}
              label={t('pomodoro.settings.autoStartWork')}
              description={t('pomodoro.settings.autoStartWorkDesc')}
              value={settings.autoStartWork}
              onValueChange={(value) => updateSettings({ autoStartWork: value })}
            />
          </View>
        </Animated.View>

        {/* Notification Settings */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('pomodoro.settings.notifications')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
            <SettingToggleRow
              icon={<Volume2 size={20} color="#3b82f6" />}
              label={t('pomodoro.settings.soundEnabled')}
              description={t('pomodoro.settings.soundEnabledDesc')}
              value={settings.soundEnabled}
              onValueChange={(value) => updateSettings({ soundEnabled: value })}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SettingToggleRow
              icon={<Smartphone size={20} color="#8b5cf6" />}
              label={t('pomodoro.settings.vibrationEnabled')}
              description={t('pomodoro.settings.vibrationEnabledDesc')}
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
            />
          </View>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={[styles.infoCard, { backgroundColor: colors.accent + '10' }]}>
            <Bell size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              {t('pomodoro.settings.notificationNote')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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

  // Section
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing[6],
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },

  // Card
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginLeft: spacing[16],
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  settingLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  settingDescription: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },

  // Duration Picker
  durationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  durationButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    fontSize: 20,
    fontWeight: typography.weight.semibold,
  },
  durationValue: {
    width: 40,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
})
