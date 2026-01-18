'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Home,
  CheckCircle2,
  ListTodo,
  LayoutGrid,
  Settings,
} from 'lucide-react'

interface NavItem {
  href: string
  labelKey: 'home' | 'habits' | 'tasks' | 'areas' | 'settings'
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', icon: <Home className="h-5 w-5" /> },
  { href: '/habits', labelKey: 'habits', icon: <CheckCircle2 className="h-5 w-5" /> },
  { href: '/tasks', labelKey: 'tasks', icon: <ListTodo className="h-5 w-5" /> },
  { href: '/areas', labelKey: 'areas', icon: <LayoutGrid className="h-5 w-5" /> },
  { href: '/settings', labelKey: 'settings', icon: <Settings className="h-5 w-5" /> },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:hidden safe-area-inset-bottom"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-16 items-center justify-around px-2 sm:max-w-md">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <span className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                isActive && 'bg-primary/10'
              )}>
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
