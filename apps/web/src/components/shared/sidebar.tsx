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
  HelpCircle,
} from 'lucide-react'

interface NavItem {
  href: string
  labelKey: 'home' | 'habits' | 'tasks' | 'areas' | 'stats' | 'achievements' | 'pomodoro' | 'settings'
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', icon: <Home className="h-4.5 w-4.5" /> },
  { href: '/habits', labelKey: 'habits', icon: <CheckCircle2 className="h-4.5 w-4.5" /> },
  { href: '/tasks', labelKey: 'tasks', icon: <ListTodo className="h-4.5 w-4.5" /> },
  { href: '/areas', labelKey: 'areas', icon: <LayoutGrid className="h-4.5 w-4.5" /> },
  { href: '/pomodoro', labelKey: 'pomodoro', icon: <Timer className="h-4.5 w-4.5" /> },
]

const SECONDARY_ITEMS: NavItem[] = [
  { href: '/stats', labelKey: 'stats', icon: <BarChart3 className="h-4.5 w-4.5" /> },
  { href: '/achievements', labelKey: 'achievements', icon: <Trophy className="h-4.5 w-4.5" /> },
]

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', labelKey: 'settings', icon: <Settings className="h-4.5 w-4.5" /> },
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

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href))

    return (
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span>{t(item.labelKey)}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            H
          </div>
          <span className="text-lg font-semibold tracking-tight">Hagu</span>
        </Link>
      </div>

      {/* User Stats Card */}
      <div className="p-3">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <span className="font-medium">Level {displayLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs">{displayStreak} dias</span>
            </div>
          </div>
          <div className="mt-2.5">
            <Progress value={displayProgress} className="h-1.5" />
            <p className="mt-1 text-[10px] text-muted-foreground text-right">
              {displayProgress}% próximo nível
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 scrollbar-thin" aria-label="Navegação principal">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Secondary section */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Insights
          </p>
          <div className="space-y-1">
            {SECONDARY_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
        {/* User Menu */}
        <div className="mt-2">
          <UserMenu />
        </div>
      </div>
    </aside>
  )
}
