import { useTranslation } from 'react-i18next'
import type { WorkQueueItem, WorkQueuePriority } from '@/lib/api/cabDashboardApi'
import { cn } from '@/lib/utils'

const priorityStyles: Record<WorkQueuePriority, string> = {
  high: 'bg-[#fee2e2] text-[#dc2626]',
  medium: 'bg-[#fef3c6] text-[#a58401]',
  low: 'bg-[#dcfce7] text-[#16a34a]',
}

interface CabWorkQueueProps {
  items: WorkQueueItem[]
  onViewAll?: () => void
}

export function CabWorkQueue({ items, onViewAll }: CabWorkQueueProps) {
  const { t, i18n } = useTranslation()

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short', day: '2-digit', year: 'numeric' }).format(
      new Date(iso)
    )

  return (
    <div className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold text-neutral-900">
            {t('cab.dashboard.workQueue.title')}
          </h3>
          <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600">
            {items.length}
          </span>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-[13px] text-primary hover:underline">
            {t('cab.dashboard.viewAll')}
          </button>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-[#f0f0f0]">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-neutral-900">
                {t(item.titleKey)}
              </p>
              <p className="text-[13px] text-neutral-500">{item.clientName}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium',
                  priorityStyles[item.priority]
                )}
              >
                {t(`cab.dashboard.workQueue.priority.${item.priority}`)}
              </span>
              <span className="text-[12px] text-neutral-400">{formatDate(item.dueDate)}</span>
            </div>
          </li>
        ))}
      </ul>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-2 self-center text-[13px] text-primary hover:underline"
        >
          {t('cab.dashboard.workQueue.goToWorkQueue')} →
        </button>
      )}
    </div>
  )
}