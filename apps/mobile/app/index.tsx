import { Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/theme'

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth()
  const { colors } = useTheme()

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
