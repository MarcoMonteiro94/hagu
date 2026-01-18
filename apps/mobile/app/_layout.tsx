import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useColorScheme, Platform } from 'react-native'
import { Providers } from '@/providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// SplashScreen is native-only
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {})
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [])

  return (
    <ErrorBoundary>
      <Providers>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notes" />
          <Stack.Screen
            name="task/[id]"
            options={{
              presentation: 'modal',
            }}
          />
        </Stack>
      </Providers>
    </ErrorBoundary>
  )
}
