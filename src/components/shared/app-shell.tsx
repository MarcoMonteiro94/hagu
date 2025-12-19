'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSettingsStore } from '@/stores/settings'
import { OnboardingFlow } from '@/components/onboarding'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

// Routes that should not show navigation
const AUTH_ROUTES = ['/login', '/signup', '/auth']

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const onboardingCompleted = useSettingsStore((state) => state.onboardingCompleted)

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname?.startsWith(route))

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auth pages - render without navigation
  if (isAuthRoute) {
    return <>{children}</>
  }

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative min-h-screen">
        <main className="min-h-screen pb-20 lg:pb-0 lg:pl-64">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    )
  }

  // Show onboarding if not completed
  if (!onboardingCompleted) {
    return <OnboardingFlow />
  }

  // Show normal app
  return (
    <div className="relative min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="min-h-screen pb-20 lg:pb-0 lg:pl-64">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}
