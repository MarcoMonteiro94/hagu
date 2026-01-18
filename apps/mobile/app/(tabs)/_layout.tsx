import { Tabs, Redirect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useColorScheme, Platform, View, ActivityIndicator, StyleSheet } from 'react-native'
import { Home, Target, CheckSquare, LayoutGrid, Settings } from 'lucide-react-native'
import { colors } from '@/theme'
import { useAuth } from '@/lib/auth'

const ICON_SIZE = 24

export default function TabsLayout() {
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const { isLoading, isAuthenticated } = useAuth()

  const isDark = colorScheme === 'dark'
  const theme = isDark ? colors.dark : colors.light

  // Colors matching web exactly - using neutral primary (not violet)
  const activeColor = theme.primary // #1a1a1a (light) / #e5e5e5 (dark)
  const inactiveColor = theme.mutedForeground // #6e6e6e (light) / #a3a3a3 (dark)
  const backgroundColor = theme.background // #ffffff (light) / #0a0a0a (dark)
  const borderColor = theme.border // #e5e5e5 (light) / #262626 (dark)

  // Auth protection - redirect to login if not authenticated
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('tabs.habits'),
          tabBarIcon: ({ color, focused }) => (
            <Target
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabs.tasks'),
          tabBarIcon: ({ color, focused }) => (
            <CheckSquare
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="areas"
        options={{
          title: t('tabs.areas'),
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      {/* Hide finances tab, accessible from areas */}
      <Tabs.Screen
        name="finances"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Settings
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      {/* Hide projects tab for now, accessible from home */}
      <Tabs.Screen
        name="projects"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
