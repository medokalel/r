import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

interface DonutEntry {
  key: string
  count: number
  color: string
}

interface CabDonutCardProps {
  title: string
  entries: DonutEntry[]
  labelPrefix: string
  totalLabel: string
  footerLink?: { label: string; onClick: () => void }
  /** Optional extra content rendered inside the same card, below the chart/legend. */
  footer?: ReactNode
}

export function CabDonutCard({ title, entries, labelPrefix, totalLabel, footerLink, footer }: CabDonutCardProps) {
  const { t } = useTranslation()
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
      <h3 className="mb-4 text-[16px] font-semibold text-neutral-900">{title}</h3>

      <div className="flex flex-1 items-center gap-6">
        <div className="relative size-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={entries}
                dataKey="count"
                nameKey="key"
                innerRadius="70%"
                outerRadius="100%"
                paddingAngle={1}
                stroke="none"
              >
                {entries.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-bold leading-none text-neutral-900">{total}</span>
            <span className="text-[12px] text-neutral-500">{totalLabel}</span>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.key} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 text-neutral-600">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{t(`${labelPrefix}.${entry.key}`)}</span>
              </span>
              <span className="font-semibold text-neutral-900">{entry.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {footer}

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