import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, CalendarIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  getClientAuditPlan,
  getPlanConfirmation,
} from '@/lib/api/clientAuditsApi'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { ROUTES } from '@/lib/routes'
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

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-neutral-500">{label}</dt>
      <dd dir="auto" className="mt-0.5 text-start text-[14px] font-medium text-neutral-900">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5">
      <h2 className="text-[16px] font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  )
}

export function ClientAuditPlanPage() {
  const { t, i18n } = useTranslation()
  const { planId } = useParams<{ planId: string }>()
  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getClientAuditPlan(planId ?? '')
      .then((result) => {
        if (!cancelled) setPlan(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [planId])

  const confirmation = plan ? getPlanConfirmation(plan) : null

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientAudits.plan.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        <Link
          to={ROUTES.audits}
          className="self-start text-[14px] font-medium text-primary hover:underline"
        >
          {t('clientAudits.plan.backToAudits')}
        </Link>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-[160px] animate-pulse rounded-[16px] border border-[#ececec] bg-white"
              />
            ))}
          </div>
        ) : !plan ? (
          <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-[#d7dce5] bg-white px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eef2fd] text-primary">
              <AppIcon icon={CalendarIcon} size={26} />
            </span>
            <p className="text-[16px] font-semibold text-neutral-900">
              {t('clientAudits.plan.notFoundTitle')}
            </p>
            <p className="max-w-md text-[13px] text-neutral-500">
              {t('clientAudits.plan.notFoundSubtitle')}
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'rounded-[12px] border px-4 py-3 text-[13px] font-medium',
                confirmation === 'confirmed'
                  ? 'border-[#bbe5c8] bg-[#e7f6ec] text-[#1e7e34]'
                  : 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]'
              )}
            >
              {t(`clientAudits.plan.banner.${confirmation ?? 'pending'}`)}
            </div>

            <section className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[18px] font-semibold text-neutral-900">
                  {plan.planNumber}
                </span>
                {plan.standards.map((standard) => (
                  <span
                    key={standard}
                    className="rounded-full border border-[#c7d4f7] bg-[#eef2fd] px-3 py-0.5 text-[12px] font-medium text-primary"
                  >
                    {standard}
                  </span>
                ))}
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label={t('clientAudits.plan.fields.auditType')} value={plan.stage} />
                <Fact
                  label={t('clientAudits.plan.fields.dates')}
                  value={
                    <span>
                      <bdi>{formatAuditDate(plan.proposedStartDate, i18n.language)}</bdi>
                      {' - '}
                      <bdi>{formatAuditDate(plan.proposedEndDate, i18n.language)}</bdi>
                    </span>
                  }
                />
                <Fact label={t('clientAudits.plan.fields.site')} value={plan.siteName} />
                <Fact label={t('clientAudits.plan.fields.leadAuditor')} value={plan.leadAuditor} />
                <Fact
                  label={t('clientAudits.plan.fields.auditTeam')}
                  value={plan.teamMembers.map((member) => member.name).join(', ')}
                />
                <Fact
                  label={t('clientAudits.plan.fields.remoteActivities')}
                  value={
                    plan.remoteActivities.enabled
                      ? t('clientAudits.plan.remoteYes', {
                          platform: plan.remoteActivities.platform,
                        })
                      : t('clientAudits.plan.remoteNo')
                  }
                />
              </dl>
            </section>

            <Section title={t('clientAudits.plan.sections.schedule')}>
              {plan.agendaActivities.length === 0 ? (
                <p className="text-[13px] text-neutral-500">
                  {t('clientAudits.plan.scheduleEmpty')}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {plan.agendaActivities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex flex-col gap-1 rounded-[10px] border border-[#eef0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <span className="shrink-0 text-[13px] font-semibold text-primary">
                          <bdi>{formatAuditDate(activity.date, i18n.language)}</bdi>
                          {' · '}
                          <bdi dir="ltr">{`${activity.startTime} - ${activity.endTime}`}</bdi>
                        </span>
                        <span dir="auto" className="min-w-0 text-start text-[13px] text-neutral-900">
                          {activity.activity}
                        </span>
                      </div>
                      <span dir="auto" className="shrink-0 text-[12px] text-neutral-500">
                        {activity.auditors.join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={t('clientAudits.plan.sections.team')}>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {plan.teamMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-[10px] border border-[#eef0f4] px-4 py-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-[13px] font-semibold text-primary">
                      {member.initials}
                    </span>
                    <div className="min-w-0">
                      <p dir="auto" className="truncate text-start text-[14px] font-medium text-neutral-900">
                        {member.name}
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        {t(`clientAudits.plan.roles.${member.role}`, member.role)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={t('clientAudits.plan.sections.objectivesScope')}>
              <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-neutral-800">
                <div>
                  <h3 className="mb-1 text-[13px] font-semibold text-neutral-900">
                    {t('clientAudits.plan.objectives')}
                  </h3>
                  <p dir="auto" className="text-start">{plan.auditObjectives || t('clientAudits.plan.notProvided')}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-[13px] font-semibold text-neutral-900">
                    {t('clientAudits.plan.scope')}
                  </h3>
                  <p dir="auto" className="text-start">{plan.scopeSummary || t('clientAudits.plan.notProvided')}</p>
                </div>
              </div>
            </Section>

            <Section title={t('clientAudits.plan.sections.siteLogistics')}>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Fact
                  label={t('clientAudits.plan.fields.siteAddress')}
                  value={<span className="whitespace-pre-line">{plan.siteAllocation.siteAddress}</span>}
                />
                <Fact
                  label={t('clientAudits.plan.fields.onSitePersonnel')}
                  value={plan.siteAllocation.onSitePersonnel.join(', ')}
                />
                {plan.travelNotes.details ? (
                  <Fact label={t('clientAudits.plan.fields.travelNotes')} value={plan.travelNotes.details} />
                ) : null}
                {plan.remoteActivities.enabled && plan.remoteActivities.activities.length > 0 ? (
                  <Fact
                    label={t('clientAudits.plan.fields.remoteActivities')}
                    value={`${plan.remoteActivities.activities.join(', ')} (${plan.remoteActivities.platform})`}
                  />
                ) : null}
              </dl>
            </Section>
          </>
        )}
      </div>
    </AppLayout>
  )
}
