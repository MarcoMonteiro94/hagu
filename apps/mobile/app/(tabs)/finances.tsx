import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react-native'

export default function FinancesScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4">
        <View className="flex-row items-center justify-between py-6">
          <Text className="text-2xl font-bold text-foreground">
            {t('finances.title')}
          </Text>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        {/* Balance card */}
        <View className="mb-6 rounded-xl bg-card p-6 border border-border">
          <Text className="text-sm text-muted-foreground">{t('finances.balance')}</Text>
          <Text className="mt-1 text-3xl font-bold text-foreground">R$ 0,00</Text>
          <View className="mt-4 flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">{t('finances.income')}</Text>
              <Text className="text-lg font-semibold text-green-500">R$ 0,00</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">{t('finances.expense')}</Text>
              <Text className="text-lg font-semibold text-red-500">R$ 0,00</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('finances.noTransactions')}</Text>
          <Pressable className="mt-4 rounded-lg bg-primary px-6 py-3">
            <Text className="font-semibold text-primary-foreground">
              {t('finances.addTransaction')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
