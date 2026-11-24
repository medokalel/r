import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppIcon, CalendarIcon } from '@/components/icons'
import { getPlanConfirmation } from '@/lib/api/clientAuditsApi'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { clientAuditPlanPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

interface UpcomingAuditCardProps {
  plan: AuditPlan
}

function formatAuditDate(value: string, language: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** "Upcoming audit" card on the audit client's dashboard, fed by the shared
 *  demo plans source (plans the CAB has sent to the client). */
export function UpcomingAuditCard({ plan }: UpcomingAuditCardProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const confirmation = getPlanConfirmation(plan)

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
            <AppIcon icon={CalendarIcon} size={22} />
          </span>
          <h2 className="text-[18px] font-semibold text-neutral-900">
            {t('clientAudits.upcomingCard.title')}
          </h2>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[12px] font-medium',
            confirmation === 'confirmed'
              ? 'bg-[#e7f6ec] text-[#1e7e34]'
              : confirmation === 'objected'
                ? 'bg-[#fef2f2] text-[#b91c1c]'
                : 'bg-[#fef3c6] text-[#a58401]'
          )}
        >
          {t(`clientAudits.confirmation.${confirmation}`)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[16px] font-semibold text-neutral-900">{plan.planNumber}</span>
        <span className="rounded-full border border-[#c7d4f7] bg-[#eef2fd] px-3 py-0.5 text-[12px] font-medium text-primary">
          {plan.stage}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
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
      </dl>

      <button
        type="button"
        onClick={() => navigate(clientAuditPlanPath(plan.planNumber))}
        className="self-start rounded-[8px] bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#0f2d8a]"
      >
        {t('clientAudits.upcomingCard.viewPlan')}
      </button>
    </div>
  )
}
