import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // Auth pages don't need the AppShell (no navigation)
  return <>{children}</>
}
