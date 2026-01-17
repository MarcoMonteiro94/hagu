import { View, Text, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import { LogOut, User, Bell, Globe, Moon } from 'lucide-react-native'
import { useAuth } from '@/lib/auth'

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  onPress?: () => void
  danger?: boolean
}

function SettingsItem({ icon, label, onPress, danger }: SettingsItemProps) {
  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-lg bg-card px-4 py-4 border border-border"
      onPress={onPress}
    >
      {icon}
      <Text className={`flex-1 text-base ${danger ? 'text-destructive' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { signOut, user } = useAuth()

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      'Tem certeza que deseja sair?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4">
        <View className="py-6">
          <Text className="text-2xl font-bold text-foreground">
            {t('tabs.settings')}
          </Text>
        </View>

        {/* User info */}
        <View className="mb-6 rounded-xl bg-card p-4 border border-border">
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
              <User size={24} color="#666" />
            </View>
            <View>
              <Text className="text-base font-semibold text-foreground">
                {user?.email?.split('@')[0] || 'Usuário'}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {user?.email || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings items */}
        <View className="gap-2">
          <SettingsItem
            icon={<Bell size={20} color="#666" />}
            label="Notificações"
          />
          <SettingsItem
            icon={<Globe size={20} color="#666" />}
            label="Idioma"
          />
          <SettingsItem
            icon={<Moon size={20} color="#666" />}
            label="Tema"
          />
        </View>

        <View className="mt-6">
          <SettingsItem
            icon={<LogOut size={20} color="#ef4444" />}
            label={t('auth.logout')}
            onPress={handleLogout}
            danger
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
