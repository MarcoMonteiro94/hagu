import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  Bell,
  BellOff,
  Target,
  CheckCircle2,
  Timer,
  Clock,
  Info,
} from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Note: expo-notifications would be imported here when needed
// For now, we use a placeholder for permission status
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'

// =============================================================================
// Types
// =============================================================================

interface NotificationSettings {
  enabled: boolean
  habitReminders: boolean
  taskReminders: boolean
  pomodoroNotifications: boolean
  reminderTime: string // HH:mm format
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'notification-settings'

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  habitReminders: true,
  taskReminders: true,
  pomodoroNotifications: true,
  reminderTime: '09:00',
}

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '18:00', '19:00', '20:00', '21:00',
]

// =============================================================================
// Components
// =============================================================================

interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

function ToggleRow({ icon, label, description, value, onValueChange, disabled }: ToggleRowProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <View style={[styles.toggleIcon, { backgroundColor: colors.accent + '15' }]}>
        {icon}
      </View>
      <View style={styles.toggleContent}>
        <Text style={[styles.toggleLabel, { color: disabled ? colors.mutedForeground : colors.foreground }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: colors.accent + '80' }}
        thumbColor={value ? colors.accent : colors.mutedForeground}
      />
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null)

  // Load settings and check permissions
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      }
    }

    const checkPermissions = async () => {
      // TODO: Check actual permissions when expo-notifications is installed
      // For now, we simulate 'granted' status for UI testing
      if (Platform.OS !== 'web') {
        setPermissionStatus('granted')
      }
    }

    loadSettings()
    checkPermissions()
  }, [])

  // Save settings
  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }

  // Request permission
  const requestPermission = async () => {
    if (Platform.OS === 'web') return

    // TODO: Request actual permissions when expo-notifications is installed
    // For now, we simulate the request
    Alert.alert(
      t('notifications.permissionRequired'),
      t('notifications.permissionRequiredDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'default',
          onPress: () => setPermissionStatus('granted'),
        },
      ]
    )
  }

  const notificationsAllowed = settings.enabled && permissionStatus === 'granted'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('settings.notifications'),
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
        {/* Permission Banner */}
        {Platform.OS !== 'web' && permissionStatus !== 'granted' && (
          <View>
            <Pressable
              style={[styles.permissionBanner, { backgroundColor: colors.warning + '20' }]}
              onPress={requestPermission}
            >
              <BellOff size={24} color={colors.warning} />
              <View style={styles.permissionContent}>
                <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
                  {t('notifications.permissionRequired')}
                </Text>
                <Text style={[styles.permissionDescription, { color: colors.mutedForeground }]}>
                  {t('notifications.permissionRequiredDesc')}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Master Toggle */}
        <View>
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
            <ToggleRow
              icon={<Bell size={20} color={colors.accent} />}
              label={t('notifications.enableAll')}
              description={t('notifications.enableAllDesc')}
              value={settings.enabled}
              onValueChange={(value) => updateSettings({ enabled: value })}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('notifications.types')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
            <ToggleRow
              icon={<Target size={20} color="#22c55e" />}
              label={t('notifications.habitReminders')}
              description={t('notifications.habitRemindersDesc')}
              value={settings.habitReminders}
              onValueChange={(value) => updateSettings({ habitReminders: value })}
              disabled={!notificationsAllowed}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow
              icon={<CheckCircle2 size={20} color="#3b82f6" />}
              label={t('notifications.taskReminders')}
              description={t('notifications.taskRemindersDesc')}
              value={settings.taskReminders}
              onValueChange={(value) => updateSettings({ taskReminders: value })}
              disabled={!notificationsAllowed}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow
              icon={<Timer size={20} color="#8b5cf6" />}
              label={t('notifications.pomodoroNotifications')}
              description={t('notifications.pomodoroNotificationsDesc')}
              value={settings.pomodoroNotifications}
              onValueChange={(value) => updateSettings({ pomodoroNotifications: value })}
              disabled={!notificationsAllowed}
            />
          </View>
        </View>

        {/* Reminder Time */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('notifications.reminderTime')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow]}>
            <View style={styles.timeHeader}>
              <Clock size={20} color={colors.accent} />
              <Text style={[styles.timeLabel, { color: colors.foreground }]}>
                {t('notifications.dailyReminder')}
              </Text>
            </View>
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map(time => (
                <Pressable
                  key={time}
                  style={[
                    styles.timeOption,
                    {
                      backgroundColor: settings.reminderTime === time ? colors.accent : colors.muted,
                    },
                  ]}
                  onPress={() => updateSettings({ reminderTime: time })}
                  disabled={!notificationsAllowed}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      { color: settings.reminderTime === time ? '#fff' : colors.foreground },
                    ]}
                  >
                    {time}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Info Note */}
        <View>
          <View style={[styles.infoCard, { backgroundColor: colors.accent + '10' }]}>
            <Info size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              {t('notifications.infoNote')}
            </Text>
          </View>
        </View>
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

  // Permission Banner
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  permissionDescription: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
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
    marginTop: spacing[4],
  },
  divider: {
    height: 1,
    marginLeft: spacing[16],
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  toggleRowDisabled: {
    opacity: 0.5,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  toggleLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  toggleDescription: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },

  // Time Selection
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    paddingBottom: spacing[3],
  },
  timeLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    padding: spacing[4],
    paddingTop: 0,
  },
  timeOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  timeOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
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
