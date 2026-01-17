import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'

export default function HomeScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          <Text className="text-2xl font-bold text-foreground">
            {t('tabs.home')}
          </Text>
          <Text className="mt-1 text-muted-foreground">
            {user?.email ? `Olá, ${user.email.split('@')[0]}` : 'Bem-vindo!'}
          </Text>
        </View>

        {/* Quick stats cards */}
        <View className="gap-4">
          <View className="rounded-xl bg-card p-4 border border-border">
            <Text className="text-lg font-semibold text-card-foreground">
              {t('tasks.title')}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-primary">0</Text>
            <Text className="text-sm text-muted-foreground">tarefas pendentes</Text>
          </View>

          <View className="rounded-xl bg-card p-4 border border-border">
            <Text className="text-lg font-semibold text-card-foreground">
              {t('projects.title')}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-primary">0</Text>
            <Text className="text-sm text-muted-foreground">projetos ativos</Text>
          </View>

          <View className="rounded-xl bg-card p-4 border border-border">
            <Text className="text-lg font-semibold text-card-foreground">
              {t('finances.balance')}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-green-500">R$ 0,00</Text>
            <Text className="text-sm text-muted-foreground">saldo atual</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
