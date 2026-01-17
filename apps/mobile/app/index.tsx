import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth'

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}
