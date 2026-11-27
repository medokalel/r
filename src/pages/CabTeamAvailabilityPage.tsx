import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { AppIcon, ErrorCircleIcon, SearchIcon } from '@/components/icons'
import { fetchTeamAvailability, type TeamAvailabilityData } from '@/lib/api/teamSelectionApi'
import { UNAVAILABILITY_LABELS, type UnavailabilityReason } from '@/lib/teamSelection/catalog'
import {
  buildMonthView,
  monthOfDay,
  shiftMonth,
  type AvailabilityCell,
  type AvailabilityCellState,
} from '@/lib/teamAvailabilityView'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Points left or right on screen, in both text directions. */
function MonthArrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500" aria-hidden>
      <path
        d={direction === 'right' ? 'M9 18L15 12L9 6' : 'M15 18L9 12L15 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function todayString(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const CELL_STYLES: Record<AvailabilityCellState, string> = {
  free: 'bg-white',
  auditConfirmed: 'bg-[#1236a3] text-white',
  auditUnconfirmed: 'border border-dashed border-[#1236a3] bg-[#e8edfb] text-[#1236a3]',
  leave: 'bg-[#fff4e5] text-[#b26a00]',
  conflict: 'bg-[#fdeeee] text-[#c0392b]',
}

const CELL_MARKS: Record<AvailabilityCellState, string> = {
  free: '',
  auditConfirmed: 'A',
  auditUnconfirmed: 'A?',
  leave: 'L',
  conflict: '!',
}

const STATE_ORDER: AvailabilityCellState[] = ['auditConfirmed', 'auditUnconfirmed', 'leave', 'conflict']

export function CabTeamAvailabilityPage() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const today = useMemo(() => todayString(), [])

  const [data, setData] = useState<TeamAvailabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const initial = useMemo(() => {
    const fallback = monthOfDay(today, { year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
    const requested = params.get('month')
    return requested && /^\d{4}-\d{2}$/.test(requested) && Number(requested.slice(5, 7)) >= 1 && Number(requested.slice(5, 7)) <= 12
      ? monthOfDay(`${requested}-01`, fallback)
      : fallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [cursor, setCursor] = useState(initial)

  useEffect(() => {
    let active = true
    fetchTeamAvailability()
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setLoadError(t('cab.teamAvailability.loadFailed', 'Could not load team availability.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const view = useMemo(
    () =>
      buildMonthView({
        year: cursor.year,
        month: cursor.month,
        today,
        people: data?.people ?? [],
        bookings: data?.bookings ?? [],
        unavailability: data?.unavailability ?? [],
        search,
      }),
    [cursor, data, search, today],
  )

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(Date.UTC(cursor.year, cursor.month - 1, 1)),
      ),
    [cursor, i18n.language],
  )
  const isArabic = i18n.language.startsWith('ar')
  const todayMonth = monthOfDay(today, cursor)
  const onTodayMonth = todayMonth.year === cursor.year && todayMonth.month === cursor.month

  const stateLabel = (state: AvailabilityCellState): string =>
    ({
      free: t('cab.teamAvailability.state.free', 'Available'),
      auditConfirmed: t('cab.teamAvailability.state.auditConfirmed', 'Confirmed audit'),
      auditUnconfirmed: t('cab.teamAvailability.state.auditUnconfirmed', 'Unconfirmed audit'),
      leave: t('cab.teamAvailability.state.leave', 'Unavailable'),
      conflict: t('cab.teamAvailability.state.conflict', 'Conflict'),
    })[state]

  const describeCell = (name: string, cell: AvailabilityCell): string => {
    const parts = cell.entries.map((entry) => {
      if (entry.kind === 'audit') return entry.detail ? `${entry.label} (${entry.detail})` : entry.label
      const labels = UNAVAILABILITY_LABELS[entry.label as UnavailabilityReason]
      return labels ? (isArabic ? labels.ar : labels.en) : entry.label
    })
    return [`${name}, ${cell.day}`, stateLabel(cell.state), ...parts].join(' - ')
  }

  const kpiCards = [
    { key: 'people', label: t('cab.teamAvailability.kpis.people', 'People shown'), value: view.totals.people, accent: 'text-neutral-900' },
    { key: 'audit', label: t('cab.teamAvailability.kpis.auditDays', 'Audit days this month'), value: view.totals.auditDays, accent: 'text-[#1236a3]' },
    { key: 'leave', label: t('cab.teamAvailability.kpis.leaveDays', 'Unavailable days'), value: view.totals.leaveDays, accent: 'text-[#b26a00]' },
    { key: 'conflict', label: t('cab.teamAvailability.kpis.conflicts', 'Conflicting days'), value: view.totals.conflictDays, accent: 'text-[#c0392b]' },
  ]

  return (
    <CabLayout sidebarVariant="competence">
      <CabHeader title={t('cab.teamAvailability.title', 'Team availability')} notificationCount={3} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-4 sm:p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.cabCompetence} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.title', 'Competence Register')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{t('cab.teamAvailability.title', 'Team availability')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-neutral-900 sm:text-[28px]">
              {t('cab.teamAvailability.title', 'Team availability')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {t(
                'cab.teamAvailability.subtitle',
                'Audit bookings and unavailable periods for every auditor, from the same records the team selection rules use.',
              )}
            </p>
          </div>
          <Link to={ROUTES.cabImpartiality} className="text-[13px] font-semibold text-primary hover:underline">
            {t('cab.teamAvailability.impartialityLink', 'Impartiality register')}
          </Link>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <div key={card.key} className="rounded-[16px] border border-[#ececec] bg-white p-4 sm:p-5">
              <p className="text-[12px] font-medium text-neutral-500 sm:text-[13px]">{card.label}</p>
              <p className={cn('mt-2 text-[26px] font-bold leading-none sm:text-[32px]', card.accent)}>{card.value}</p>
            </div>
          ))}
        </section>

        {loadError && (
          <p role="alert" className="flex items-center gap-2 rounded-[8px] border border-[#f5c6c6] bg-[#fdeeee] px-4 py-3 text-[13px] text-[#c0392b]">
            <AppIcon icon={ErrorCircleIcon} size={18} />
            {loadError}
          </p>
        )}

        <section className="rounded-[16px] border border-[#ececec] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-md">
              <label htmlFor="team-availability-search" className="mb-2 block text-[13px] font-semibold text-neutral-700">
                {t('cab.teamAvailability.searchLabel', 'Search people')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  id="team-availability-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('cab.teamAvailability.searchPlaceholder', 'Search by name...')}
                  className="h-11 w-full rounded-[8px] border border-[#d9d9d9] bg-white ps-10 pe-3 text-[14px] outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                aria-label={t('cab.teamAvailability.previousMonth', 'Previous month')}
                onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
              >
                <MonthArrow direction={isArabic ? 'right' : 'left'} />
              </Button>
              <span className="min-w-[120px] text-center text-[15px] font-bold text-neutral-900" aria-live="polite">
                {monthLabel}
              </span>
              <Button
                variant="secondary"
                aria-label={t('cab.teamAvailability.nextMonth', 'Next month')}
                onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
              >
                <MonthArrow direction={isArabic ? 'left' : 'right'} />
              </Button>
              <Button variant="secondary" disabled={onTodayMonth} onClick={() => setCursor(todayMonth)}>
                {t('cab.teamAvailability.today', 'Today')}
              </Button>
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-neutral-600" aria-label={t('cab.teamAvailability.legend', 'Legend')}>
            {STATE_ORDER.map((state) => (
              <li key={state} className="flex items-center gap-2">
                <span className={cn('inline-flex size-5 items-center justify-center rounded-[4px] text-[10px] font-bold', CELL_STYLES[state])}>
                  {CELL_MARKS[state]}
                </span>
                {stateLabel(state)}
              </li>
            ))}
          </ul>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : view.rows.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-neutral-500">
              {t('cab.teamAvailability.empty', 'No matching people.')}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-[8px] border border-[#ececec]">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#fafafa]">
                    <th scope="col" className="sticky start-0 z-10 min-w-[150px] border-b border-[#ececec] bg-[#fafafa] px-3 py-2 text-start text-[12px] font-semibold text-neutral-600">
                      {t('cab.teamAvailability.person', 'Person')}
                    </th>
                    {view.days.map((day) => (
                      <th
                        key={day.day}
                        scope="col"
                        className={cn(
                          'min-w-[28px] border-b border-s border-[#ececec] px-0.5 py-2 text-center font-semibold',
                          day.isToday ? 'bg-[#e8edfb] text-[#1236a3]' : day.weekday === 5 || day.weekday === 6 ? 'bg-[#f3f3f3] text-neutral-400' : 'text-neutral-600',
                        )}
                        aria-current={day.isToday ? 'date' : undefined}
                      >
                        {day.dayOfMonth}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.rows.map((row) => (
                    <tr key={row.personId} className="border-b border-[#ececec] last:border-b-0">
                      <th scope="row" className="sticky start-0 z-10 bg-white px-3 py-2 text-start font-normal">
                        <p className="text-[13px] font-semibold text-neutral-900">{row.name}</p>
                        <p className="text-[11px] text-neutral-500">{row.role}</p>
                      </th>
                      {row.cells.map((cell) => (
                        <td
                          key={cell.day}
                          title={cell.state === 'free' ? undefined : describeCell(row.name, cell)}
                          aria-label={cell.state === 'free' ? undefined : describeCell(row.name, cell)}
                          data-state={cell.state}
                          className={cn('h-9 border-s border-[#ececec] p-0 text-center text-[10px] font-bold', CELL_STYLES[cell.state])}
                        >
                          {CELL_MARKS[cell.state]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </CabLayout>
  )
}
