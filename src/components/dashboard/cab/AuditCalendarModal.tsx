import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft2, ArrowRight2 } from 'iconsax-reactjs'
import { AppIcon, CalendarIcon, DownloadIcon, FileTextIcon, MoreIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui'
import {
  getAuditCalendarEntries,
  type AuditCalendarEntry,
  type AuditCalendarStatus,
} from '@/lib/api/auditCalendarApi'
import { cn } from '@/lib/utils'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const STATUS_DOT: Record<AuditCalendarStatus, string> = {
  planned: 'bg-[#3b82f6]',
  inProgress: 'bg-[#16a34a]',
  completed: 'bg-[#9333ea]',
  reportFinalization: 'bg-[#f59e0b]',
  cancelled: 'bg-[#dc2626]',
  postponed: 'bg-[#737373]',
}

const STATUS_BADGE: Record<AuditCalendarStatus, string> = {
  planned: 'bg-[#dbeafe] text-[#2563eb]',
  inProgress: 'bg-[#dcfce7] text-[#16a34a]',
  completed: 'bg-[#f3e8ff] text-[#9333ea]',
  reportFinalization: 'bg-[#fef3c6] text-[#a58401]',
  cancelled: 'bg-[#fee2e2] text-[#dc2626]',
  postponed: 'bg-[#f0f0f0] text-neutral-500',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday-based weekday index (0=Mo … 6=Su) */
function weekdayOf(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay()
  return d === 0 ? 6 : d - 1
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface AuditCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditCalendarModal({ open, onOpenChange }: AuditCalendarModalProps) {
  const { t, i18n } = useTranslation()
  const [entries, setEntries] = useState<AuditCalendarEntry[]>([])
  // Mock "today" matches the seeded audit data.
  const [viewYear, setViewYear] = useState(2025)
  const [viewMonth, setViewMonth] = useState(0)
  const [selectedDate, setSelectedDate] = useState('2025-01-18')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getAuditCalendarEntries().then((data) => {
      if (!cancelled) setEntries(data)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const datesWithAudits = useMemo(() => new Set(entries.map((e) => e.date)), [entries])
  const entriesForSelectedDate = entries.filter((e) => e.date === selectedDate)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const leadingBlanks = weekdayOf(viewYear, viewMonth, 1)
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  })
  const selectedDateLabel = new Date(selectedDate).toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const statusKeys: AuditCalendarStatus[] = [
    'planned',
    'inProgress',
    'completed',
    'reportFinalization',
    'cancelled',
    'postponed',
  ]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(960px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-white shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-start justify-between px-6 pt-6">
            <div>
              <Dialog.Title className="text-[26px] font-bold text-neutral-900">
                {t('cab.dashboard.auditCalendar.title')}
              </Dialog.Title>
              <p className="mt-1 text-[14px] text-neutral-500">
                {t('cab.dashboard.auditCalendar.subtitle')}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 hover:border-neutral-400"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Filters */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-neutral-700">
                  {t('cab.dashboard.auditCalendar.filters.dateRange')}
                </p>
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-between rounded-[var(--radius-sm)] border border-neutral-200 px-3 text-[14px] text-neutral-700"
                >
                  {t('cab.dashboard.auditCalendar.filters.dateRangeValue')}
                  <AppIcon icon={CalendarIcon} size={16} className="text-neutral-400" />
                </button>
              </div>
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-neutral-700">
                  {t('cab.dashboard.auditCalendar.filters.auditType')}
                </p>
                <SelectField value="" onChange={() => {}} options={[]} placeholder={t('cab.dashboard.auditCalendar.filters.allTypes')} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-neutral-700">
                  {t('cab.dashboard.auditCalendar.filters.standard')}
                </p>
                <SelectField value="" onChange={() => {}} options={[]} placeholder={t('cab.dashboard.auditCalendar.filters.all')} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-neutral-700">
                  {t('cab.dashboard.auditCalendar.filters.auditStatus')}
                </p>
                <SelectField value="" onChange={() => {}} options={[]} placeholder={t('cab.dashboard.auditCalendar.filters.allStatus')} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-neutral-700">
                  {t('cab.dashboard.auditCalendar.filters.auditorTeam')}
                </p>
                <SelectField value="" onChange={() => {}} options={[]} placeholder={t('cab.dashboard.auditCalendar.filters.all')} />
              </div>
              <div className="flex items-end">
                <Button variant="secondary" className="h-11 w-full rounded-[var(--radius-sm)]">
                  {t('cab.dashboard.auditCalendar.filters.reset')}
                </Button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row">
              {/* Mini calendar */}
              <div className="w-full shrink-0 lg:w-[340px]">
                <div className="rounded-[var(--radius-md)] border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goToPrevMonth}
                      aria-label={t('cab.dashboard.auditCalendar.previousMonth')}
                      className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-50"
                    >
                      <ArrowLeft2 size={18} />
                    </button>
                    <p className="text-[15px] font-semibold text-neutral-900">{monthLabel}</p>
                    <button
                      type="button"
                      onClick={goToNextMonth}
                      aria-label={t('cab.dashboard.auditCalendar.nextMonth')}
                      className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-50"
                    >
                      <ArrowRight2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {DAYS.map((d) => (
                      <span key={d} className="pb-1 text-[12px] font-medium text-neutral-400">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: leadingBlanks }).map((_, i) => (
                      <span key={`blank-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const iso = toIsoDate(viewYear, viewMonth, day)
                      const isSelected = iso === selectedDate
                      const hasAudits = datesWithAudits.has(iso)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDate(iso)}
                          className={cn(
                            'relative mx-auto flex size-9 items-center justify-center rounded-full text-[14px]',
                            isSelected
                              ? 'border border-primary font-semibold text-primary'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          )}
                        >
                          {day}
                          {hasAudits && (
                            <span className="absolute bottom-1 size-1 rounded-full bg-primary" aria-hidden />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Dialog.Close asChild>
                      <Button variant="tertiary" className="h-10 flex-1 rounded-[var(--radius-sm)]">
                        {t('common.cancel')}
                      </Button>
                    </Dialog.Close>
                    <Button variant="primary" className="h-10 flex-1 rounded-[var(--radius-sm)]">
                      {t('cab.dashboard.auditCalendar.chooseDate')}
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[14px] font-semibold text-neutral-900">
                    {t('cab.dashboard.auditCalendar.statusLegendTitle')}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {statusKeys.map((key) => (
                      <span key={key} className="flex items-center gap-2 text-[13px] text-neutral-600">
                        <span className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT[key])} />
                        {t(`cab.dashboard.auditCalendar.status.${key}`)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected day's audits */}
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[16px] font-semibold text-primary">{selectedDateLabel}</p>
                  <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                    {t('cab.dashboard.auditCalendar.auditsCount', { count: entriesForSelectedDate.length })}
                    <AppIcon icon={CalendarIcon} size={16} />
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {entriesForSelectedDate.length === 0 ? (
                    <p className="rounded-[var(--radius-sm)] border border-dashed border-neutral-200 py-10 text-center text-[14px] text-neutral-500">
                      {t('cab.dashboard.auditCalendar.noAudits')}
                    </p>
                  ) : (
                    entriesForSelectedDate.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          'flex items-start gap-3 rounded-[var(--radius-sm)] border border-neutral-100 bg-white p-3',
                          entry.status === 'inProgress' || entry.status === 'completed'
                            ? 'border-s-4 border-s-[#16a34a]'
                            : 'border-s-4 border-s-[#f59e0b]'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-[8px]',
                            STATUS_BADGE[entry.status]
                          )}
                        >
                          <AppIcon icon={FileTextIcon} size={16} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-neutral-900">{entry.clientName}</p>
                          <span className="mt-1 inline-flex items-center rounded-[6px] border border-neutral-200 px-2 py-0.5 text-[12px] font-medium text-neutral-700">
                            {entry.standard}
                          </span>
                          <p className="mt-1 text-[12px] text-neutral-500">{entry.auditType}</p>
                        </div>

                        <div className="hidden shrink-0 flex-col items-start gap-1 sm:flex">
                          <span className="text-[11px] text-neutral-400">
                            {t('cab.dashboard.auditCalendar.auditTeam')}
                          </span>
                          <span className="text-[13px] font-medium text-neutral-700">
                            {entry.auditTeam[0]}
                            {entry.auditTeam.length > 1 && ` +${entry.auditTeam.length - 1}`}
                          </span>
                        </div>

                        <div className="hidden shrink-0 flex-col items-start gap-1 md:flex">
                          <span className="text-[11px] text-neutral-400">
                            {t('cab.dashboard.auditCalendar.time')}
                          </span>
                          <span className="text-[13px] text-neutral-700">{entry.timeRange}</span>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-[11px] text-neutral-400">
                            {t('cab.dashboard.auditCalendar.status.label')}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[11px] font-medium',
                              STATUS_BADGE[entry.status]
                            )}
                          >
                            {t(`cab.dashboard.auditCalendar.status.${entry.status}`)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="shrink-0 text-neutral-400 hover:text-neutral-700"
                          aria-label={t('common.actions')}
                        >
                          <AppIcon icon={MoreIcon} size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-[var(--radius-sm)] bg-[#f3f6fd] px-4 py-3 text-[13px] text-neutral-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-primary">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="8" r="1" fill="currentColor" />
              </svg>
              {t('cab.dashboard.auditCalendar.timezoneNote')}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="secondary" className="h-11 gap-2 rounded-[var(--radius-sm)] px-5">
                {t('cab.dashboard.auditCalendar.exportCalendar')}
                <AppIcon icon={DownloadIcon} size={16} />
              </Button>
              <Button variant="primary" className="h-11 rounded-[var(--radius-sm)] px-5">
                {t('cab.dashboard.auditCalendar.viewFullCalendar')}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}