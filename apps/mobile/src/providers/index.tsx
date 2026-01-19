import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'
import { AchievementNotificationProvider } from '@/components/AchievementNotification'
import { ThemeProvider } from '@/theme'

import '@/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AchievementNotificationProvider>
            {children}
          </AchievementNotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
