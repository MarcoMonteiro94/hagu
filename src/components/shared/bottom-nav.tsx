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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="mx-auto flex h-16 items-center justify-around px-4 sm:max-w-md">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
