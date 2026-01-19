import { View, Pressable, Text, StyleSheet, Platform } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, Target, CheckSquare, LayoutGrid, Settings } from 'lucide-react-native'
import { useTheme, spacing, typography } from '@/theme'

const ICON_SIZE = 24

interface TabItem {
  name: string
  path: string
  icon: typeof Home
  labelKey: string
}

const TABS: TabItem[] = [
  { name: 'index', path: '/(tabs)', icon: Home, labelKey: 'tabs.home' },
  { name: 'habits', path: '/(tabs)/habits', icon: Target, labelKey: 'tabs.habits' },
  { name: 'tasks', path: '/(tabs)/tasks', icon: CheckSquare, labelKey: 'tabs.tasks' },
  { name: 'areas', path: '/(tabs)/areas', icon: LayoutGrid, labelKey: 'tabs.areas' },
  { name: 'settings', path: '/(tabs)/settings', icon: Settings, labelKey: 'tabs.settings' },
]

export function BottomNav() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.startsWith('/notes') || pathname.startsWith('/areas')) return 'areas'
    if (pathname.startsWith('/health')) return 'areas'
    if (pathname.startsWith('/finances')) return 'areas'
    if (pathname.startsWith('/projects')) return 'areas'
    if (pathname.startsWith('/habits') || pathname.startsWith('/habit')) return 'habits'
    if (pathname.startsWith('/tasks') || pathname.startsWith('/task')) return 'tasks'
    if (pathname.startsWith('/settings')) return 'settings'
    return 'index'
  }

  const activeTab = getActiveTab()

  const handlePress = (tab: TabItem) => {
    router.push(tab.path as any)
  }

  const containerStyle = {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64 + insets.bottom,
    paddingBottom: Platform.OS === 'ios' ? 28 : Math.max(insets.bottom, 8),
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name
        const Icon = tab.icon
        const color = isActive ? colors.primary : colors.mutedForeground

        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => handlePress(tab)}
          >
            <Icon size={ICON_SIZE} color={color} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.label, { color }]}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
})
