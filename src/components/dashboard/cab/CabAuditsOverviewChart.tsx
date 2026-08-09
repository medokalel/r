import { useTranslation } from 'react-i18next'
import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts'
import type { AuditsOverviewEntry } from '@/lib/api/cabDashboardApi'

interface CabAuditsOverviewChartProps {
  entries: AuditsOverviewEntry[]
  footerLink?: { label: string; onClick: () => void }
}

export function CabAuditsOverviewChart({ entries, footerLink }: CabAuditsOverviewChartProps) {
  const { t } = useTranslation()

  const data = entries.map((entry) => ({
    ...entry,
    label: t(`cab.dashboard.auditsOverview.stages.${entry.stageKey}`),
  }))

  return (
    <div className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-neutral-900">
          {t('cab.dashboard.auditsOverview.title')}
        </h3>
        <div className="flex items-center gap-3 text-[12px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            {t('cab.dashboard.auditsOverview.stage1')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#93c5fd]" />
            {t('cab.dashboard.auditsOverview.stage2')}
          </span>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="28%">
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#737373' }}
            />
            <Bar dataKey="stage1" fill="#1236a3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="stage2" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {footerLink && (
        <button
          type="button"
          onClick={footerLink.onClick}
          className="mt-4 self-end text-[13px] text-neutral-400 transition-colors hover:text-primary"
        >
          {footerLink.label} →
        </button>
      )}
    </div>
  )
}