/** Placeholder shown while the single sign-on settings load. */
export function SsoLoadingSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-busy="true">
      <div className="flex flex-col gap-4">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="animate-pulse rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-[var(--radius-sm)] bg-neutral-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-neutral-100" />
                <div className="h-3 w-1/4 rounded bg-neutral-100" />
              </div>
            </div>
            <div className="mt-5 h-3 w-2/3 rounded bg-neutral-100" />
            <div className="mt-3 h-3 w-1/2 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
      <div className="animate-pulse rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
        <div className="h-4 w-1/2 rounded bg-neutral-100" />
        <div className="mt-4 space-y-3">
          <div className="h-3 w-full rounded bg-neutral-100" />
          <div className="h-3 w-5/6 rounded bg-neutral-100" />
          <div className="h-3 w-4/6 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  )
}
