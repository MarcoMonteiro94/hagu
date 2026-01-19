import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import {
  LogOut,
  Bell,
  Globe,
  Moon,
  ChevronRight,
  Shield,
  HelpCircle,
  Info,
  Heart,
  Trophy,
  BarChart3,
  Timer,
  StickyNote,
  LayoutGrid,
} from 'lucide-react-native'
import { useAuth } from '@/lib/auth'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  description?: string
  onPress?: () => void
  danger?: boolean
  showChevron?: boolean
}

function SettingsItem({
  icon,
  label,
  description,
  onPress,
  danger,
  showChevron = true,
}: SettingsItemProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Pressable
      onPress={() => {
        console.log('SettingsItem pressed:', label)
        onPress?.()
      }}
      style={({ pressed }) => [
        styles.settingsItem,
        { backgroundColor: pressed ? colors.secondary : colors.card },
        cardShadow,
      ]}
    >
      <View
        style={[
          styles.settingsItemIcon,
          { backgroundColor: danger ? colors.error + '15' : colors.accent + '15' },
        ]}
      >
        {icon}
      </View>
      <View style={styles.settingsItemContent}>
        <Text
          style={[
            styles.settingsItemLabel,
            { color: danger ? colors.error : colors.foreground },
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text style={[styles.settingsItemDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      {showChevron && <ChevronRight size={20} color={colors.mutedForeground} />}
    </Pressable>
  )
}

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  delay: number
}

function SettingsSection({ title, children, delay }: SettingsSectionProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { signOut, user } = useAuth()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const handleLogout = async () => {
    console.log('handleLogout called') // Debug
    try {
      await signOut()
      console.log('signOut completed')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      router.replace('/(auth)/login')
    }
  }

  const userName = user?.email?.split('@')[0] || 'Usuário'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing[8]) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('tabs.settings')}</Text>
        </View>

        {/* User Profile Card */}
        <View
         
          style={[styles.profileCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={styles.profileContent}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{userName}</Text>
              <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
                {user?.email || ''}
              </Text>
            </View>
            <Pressable style={[styles.editButton, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.editButtonText, { color: colors.foreground }]}>Editar</Text>
            </Pressable>
          </View>
        </View>

        {/* Life & Progress */}
        <SettingsSection title={t('settings.sections.lifeProgress')} delay={150}>
          <SettingsItem
            icon={<Heart size={20} color="#ef4444" />}
            label={t('health.title')}
            description={t('settings.healthDescription')}
            onPress={() => router.push('/health')}
          />
          <SettingsItem
            icon={<Trophy size={20} color="#eab308" />}
            label={t('gamification.achievements.title')}
            description={t('settings.achievementsDescription')}
            onPress={() => router.push('/achievements')}
          />
          <SettingsItem
            icon={<BarChart3 size={20} color={colors.accent} />}
            label={t('analytics.title')}
            description={t('settings.statisticsDescription')}
            onPress={() => router.push('/analytics')}
          />
        </SettingsSection>

        {/* Productivity */}
        <SettingsSection title={t('settings.sections.productivity')} delay={175}>
          <SettingsItem
            icon={<Timer size={20} color="#8b5cf6" />}
            label={t('pomodoro.title')}
            description={t('settings.pomodoroDescription')}
            onPress={() => router.push('/pomodoro')}
          />
          <SettingsItem
            icon={<StickyNote size={20} color="#f97316" />}
            label={t('notes.title')}
            description={t('settings.notesDescription')}
            onPress={() => router.push('/notes')}
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title={t('settings.sections.preferences')} delay={200}>
          <SettingsItem
            icon={<Bell size={20} color={colors.accent} />}
            label={t('settings.notifications')}
            description={t('settings.notificationsDescription')}
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsItem
            icon={<Moon size={20} color={colors.accent} />}
            label={t('settings.appearance')}
            description={t('settings.themeTitle') + ' & ' + t('settings.languageTitle')}
            onPress={() => router.push('/settings/appearance')}
          />
          <SettingsItem
            icon={<LayoutGrid size={20} color={colors.accent} />}
            label={t('widgets.title')}
            description={t('settings.widgetsDescription')}
            onPress={() => router.push('/settings/widgets')}
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title={t('settings.sections.security')} delay={250}>
          <SettingsItem
            icon={<Shield size={20} color={colors.accent} />}
            label={t('settings.privacy')}
            description={t('settings.privacyDescription')}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title={t('settings.sections.support')} delay={300}>
          <SettingsItem
            icon={<HelpCircle size={20} color={colors.accent} />}
            label={t('settings.help')}
            description={t('settings.helpDescription')}
          />
          <SettingsItem
            icon={<Info size={20} color={colors.accent} />}
            label={t('settings.about')}
            description={t('settings.version', { version: '1.0.0' })}
          />
        </SettingsSection>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <SettingsItem
            icon={<LogOut size={20} color={colors.error} />}
            label={t('auth.logout')}
            description="Encerrar sessão"
            onPress={handleLogout}
            danger
            showChevron={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
  },

  // Header
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },

  // Profile Card
  profileCard: {
    marginBottom: spacing[6],
    padding: spacing[5],
    borderRadius: radius['2xl'],
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  profileEmail: {
    fontSize: typography.size.sm,
    marginTop: spacing[0.5],
  },
  editButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
  },
  editButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Section
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
    paddingLeft: spacing[1],
  },
  sectionContent: {
    gap: spacing[2],
  },

  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
    borderRadius: radius.xl,
    gap: spacing[3.5],
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: typography.size.base - 1,
    fontWeight: typography.weight.medium,
  },
  settingsItemDescription: {
    fontSize: typography.size.sm - 1,
    marginTop: spacing[0.5],
  },

  // Logout Section
  logoutSection: {
    marginTop: spacing[2],
  },
})
