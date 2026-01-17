import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useColorScheme } from 'react-native'
import { Providers } from '@/providers'

import '../src/styles/global.css'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <Providers>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </Providers>
  )
}
