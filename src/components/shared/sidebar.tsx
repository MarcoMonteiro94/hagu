'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useUserStats, useXpProgress } from '@/hooks/queries/use-gamification'
import { Progress } from '@/components/ui/progress'
import { UserMenu } from '@/components/auth'
import {
  Home,
  CheckCircle2,
  ListTodo,
  LayoutGrid,
  Settings,
  BarChart3,
  Flame,
  Star,
  Trophy,
  Timer,
} from 'lucide-react'

interface NavItem {
  href: string
  labelKey: 'home' | 'habits' | 'tasks' | 'areas' | 'stats' | 'achievements' | 'pomodoro' | 'settings'
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', icon: <Home className="h-5 w-5" /> },
  { href: '/habits', labelKey: 'habits', icon: <CheckCircle2 className="h-5 w-5" /> },
  { href: '/tasks', labelKey: 'tasks', icon: <ListTodo className="h-5 w-5" /> },
  { href: '/areas', labelKey: 'areas', icon: <LayoutGrid className="h-5 w-5" /> },
  { href: '/pomodoro', labelKey: 'pomodoro', icon: <Timer className="h-5 w-5" /> },
  { href: '/stats', labelKey: 'stats', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/achievements', labelKey: 'achievements', icon: <Trophy className="h-5 w-5" /> },
]

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', labelKey: 'settings', icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [mounted, setMounted] = useState(false)
  const { data: stats } = useUserStats()
  const xpProgress = useXpProgress()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use default values during SSR to prevent hydration mismatch
  const displayLevel = mounted ? (stats?.level ?? 1) : 1
  const displayStreak = mounted ? (stats?.currentStreak ?? 0) : 0
  const displayProgress = mounted ? xpProgress.percentage : 0

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              H
            </div>
            <span className="text-xl font-bold">Hagu</span>
          </Link>
        </div>

        {/* User Stats */}
        <div className="border-b p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Level {displayLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{displayStreak} dias</span>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={displayProgress} className="h-1.5" />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {displayProgress}% para o próximo nível
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <nav className="border-t p-3 space-y-1" aria-label="Configurações">
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}
          {/* User Menu */}
          <UserMenu />
        </nav>
      </div>
    </aside>
  )
}
