import { Skeleton } from '@/components/ui/skeleton'

interface TaskCardSkeletonProps {
  count?: number
}

export function TaskCardSkeleton({ count = 1 }: TaskCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          {/* Checkbox skeleton */}
          <Skeleton className="h-5 w-5 rounded" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>

          {/* Priority indicator */}
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      ))}
    </>
  )
}

export function TaskListSkeleton({ count = 5 }: TaskCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  )
}
