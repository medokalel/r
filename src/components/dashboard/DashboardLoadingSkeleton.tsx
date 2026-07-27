import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Shimmer placeholder for the four stat cards at the top of the dashboard. */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-6 rounded-[16px] border border-[#ececec] bg-white p-5"
        >
          <SkeletonBlock className="size-10 rounded-[10px]" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-8 w-2/5" />
            <SkeletonBlock className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Shimmer placeholder for the "Tasks required now" table. */
export function DashboardTasksTableSkeleton() {
  return (
    <div
      className="flex flex-1 flex-col rounded-[16px] border border-[#ececec] bg-white py-5"
      aria-hidden
    >
      <div className="mx-5 mb-5 mt-1 flex items-center justify-between">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-5 w-16" />
      </div>
      <div className="mx-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-[10px] border border-[#f0f0f0] p-4"
          >
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonBlock className="h-4 w-2/5" />
              <SkeletonBlock className="h-3 w-1/4" />
            </div>
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-7 w-[126px] rounded-[6px]" />
            <SkeletonBlock className="h-4 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Shimmer placeholder for the "Latest activities" feed. */
export function DashboardActivitiesSkeleton() {
  return (
    <div
      className="flex w-full max-w-[400px] flex-col rounded-[16px] border border-[#ececec] bg-white"
      aria-hidden
    >
      <div className="mb-4 flex items-center gap-2 rounded-t-[16px] bg-[#f3f6fd] p-[25px]">
        <SkeletonBlock className="size-8 rounded-[8px]" />
        <SkeletonBlock className="h-6 w-32" />
      </div>
      <div className="flex flex-col gap-6 p-[24px]">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <SkeletonBlock className="size-9 shrink-0 rounded-[10px]" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonBlock className="h-3 w-1/4" />
              <SkeletonBlock className="h-4 w-3/5" />
              <SkeletonBlock className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 