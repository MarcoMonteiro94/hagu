import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import { Home, CheckSquare, FolderKanban, Wallet, Settings } from 'lucide-react-native'

const ICON_SIZE = 24

export default function TabsLayout() {
  const { t } = useTranslation()
  const colorScheme = useColorScheme()

  const activeColor = colorScheme === 'dark' ? '#fff' : '#0a0a0a'
  const inactiveColor = colorScheme === 'dark' ? '#666' : '#999'
  const backgroundColor = colorScheme === 'dark' ? '#0a0a0a' : '#fff'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: colorScheme === 'dark' ? '#222' : '#eee',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabs.tasks'),
          tabBarIcon: ({ color }) => <CheckSquare size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tabs.projects'),
          tabBarIcon: ({ color }) => <FolderKanban size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: t('tabs.finances'),
          tabBarIcon: ({ color }) => <Wallet size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <Settings size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  )
}
