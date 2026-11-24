import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, CalendarIcon, SearchOutlineIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  getPlanConfirmation,
  listClientAudits,
  type ClientPlanConfirmation,
} from '@/lib/api/clientAuditsApi'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { clientAuditPlanPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

function formatAuditDate(value: string, language: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const confirmationStyles: Record<ClientPlanConfirmation, string> = {
  pending: 'bg-[#fef3c6] text-[#a58401]',
  confirmed: 'bg-[#e7f6ec] text-[#1e7e34]',
  objected: 'bg-[#fef2f2] text-[#b91c1c]',
}

function AuditCard({ plan, onOpen }: { plan: AuditPlan; onOpen: () => void }) {
  const { t, i18n } = useTranslation()
  const confirmation = getPlanConfirmation(plan)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5 text-start transition-colors hover:border-[#c7d4f7] hover:bg-[#fafbff]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
            <AppIcon icon={CalendarIcon} size={22} />
          </span>
          <span className="text-[16px] font-semibold text-neutral-900">{plan.planNumber}</span>
          <span className="rounded-full border border-[#c7d4f7] bg-[#eef2fd] px-3 py-0.5 text-[12px] font-medium text-primary">
            {plan.stage}
          </span>
          {plan.standards.map((standard) => (
            <span
              key={standard}
              className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-0.5 text-[12px] font-medium text-neutral-600"
            >
              {standard}
            </span>
          ))}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[12px] font-medium',
            confirmationStyles[confirmation]
          )}
        >
          {t(`clientAudits.confirmation.${confirmation}`)}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-neutral-500">{t('clientAudits.plan.fields.dates')}</dt>
          <dd className="mt-0.5 font-medium text-neutral-900">
            <span>
              <bdi>{formatAuditDate(plan.proposedStartDate, i18n.language)}</bdi>
              {' - '}
              <bdi>{formatAuditDate(plan.proposedEndDate, i18n.language)}</bdi>
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t('clientAudits.plan.fields.site')}</dt>
          <dd dir="auto" className="mt-0.5 text-start font-medium text-neutral-900">{plan.siteName}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t('clientAudits.plan.fields.leadAuditor')}</dt>
          <dd dir="auto" className="mt-0.5 text-start font-medium text-neutral-900">{plan.leadAuditor}</dd>
        </div>
      </dl>
    </button>
  )
}

export function ClientAuditsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<AuditPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    listClientAudits()
      .then((result) => {
        if (!cancelled) setPlans(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visiblePlans = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return plans
    return plans.filter(
      (plan) =>
        plan.planNumber.toLowerCase().includes(q) ||
        plan.stage.toLowerCase().includes(q) ||
        plan.siteName.toLowerCase().includes(q) ||
        plan.leadAuditor.toLowerCase().includes(q) ||
        plan.standards.some((standard) => standard.toLowerCase().includes(q))
    )
  }, [plans, search])

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientAudits.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
            <AppIcon icon={SearchOutlineIcon} size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('clientAudits.searchPlaceholder')}
            aria-label={t('clientAudits.searchPlaceholder')}
            className="h-11 w-full rounded-[10px] border border-[#e5e7eb] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1].map((key) => (
              <div
                key={key}
                className="h-[132px] animate-pulse rounded-[16px] border border-[#ececec] bg-white"
              />
            ))}
          </div>
        ) : visiblePlans.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-[#d7dce5] bg-white px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eef2fd] text-primary">
              <AppIcon icon={CalendarIcon} size={26} />
            </span>
            <p className="text-[16px] font-semibold text-neutral-900">
              {search ? t('clientAudits.emptySearchTitle') : t('clientAudits.emptyTitle')}
            </p>
            <p className="max-w-md text-[13px] text-neutral-500">
              {search ? t('clientAudits.emptySearchSubtitle') : t('clientAudits.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visiblePlans.map((plan) => (
              <AuditCard
                key={plan.id}
                plan={plan}
                onOpen={() => navigate(clientAuditPlanPath(plan.planNumber))}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
