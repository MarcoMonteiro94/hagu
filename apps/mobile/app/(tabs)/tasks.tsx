import { View, Text, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react-native'

export default function TasksScreen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-4">
        <View className="flex-row items-center justify-between py-6">
          <Text className="text-2xl font-bold text-foreground">
            {t('tasks.title')}
          </Text>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('tasks.noTasks')}</Text>
          <Pressable className="mt-4 rounded-lg bg-primary px-6 py-3">
            <Text className="font-semibold text-primary-foreground">
              {t('tasks.addTask')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
