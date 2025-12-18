'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings'
import { OnboardingFlow } from '@/components/onboarding'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mounted, setMounted] = useState(false)
  const onboardingCompleted = useSettingsStore((state) => state.onboardingCompleted)

  useEffect(() => {
    setMounted(true)
  }, [])

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
