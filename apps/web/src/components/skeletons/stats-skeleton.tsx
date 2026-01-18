import { Skeleton } from '@/components/ui/skeleton'

export function StatsSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Level */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
      {/* Sparkline */}
      <Skeleton className="hidden h-9 w-24 rounded sm:block" />
    </div>
  )
}

export function ProgressCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}
