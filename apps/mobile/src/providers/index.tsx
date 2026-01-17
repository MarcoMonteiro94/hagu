import { GluestackUIProvider } from '@gluestack-ui/themed'
import { config } from '@gluestack-ui/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme } from 'react-native'
import type { ReactNode } from 'react'

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
  const colorScheme = useColorScheme()

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider config={config} colorMode={colorScheme || 'light'}>
        {children}
      </GluestackUIProvider>
    </QueryClientProvider>
  )
}
