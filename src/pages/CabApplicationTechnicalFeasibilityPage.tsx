import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { WorkflowProgressCard as SharedWorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CalendarIcon,
  CommentIcon,
  CorrectiveActionIcon,
  DownloadIcon,
  ExportIcon,
  FileTextIcon,
  HistoryIcon,
  NotificationIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  getCabApplicationTechnicalFeasibility,
  type AssessmentStatus,
  type CabApplicationTechnicalFeasibility,
} from '@/lib/api/cabApplicationTechnicalFeasibilityApi'
import { ROUTES, cabApplicationQuotationPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

type Translate = ReturnType<typeof useTranslation>['t']
import { useFitScale } from '@/lib/useFitScale'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

type TabKey =
  | 'details'
  | 'documents'
  | 'reviewComments'
  | 'informationRequired'
  | 'technicalFeasibility'
  | 'history'

function StatusBadge({
  label,
  variant,
  pill = false,
  showCheck = true,
}: {
  label: string
  variant: 'inProgress' | 'feasible' | 'partial' | 'notFeasible' | 'neutral'
  pill?: boolean
  showCheck?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold',
        pill ? 'rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none' : 'rounded-[4px]',
        variant === 'inProgress' && 'bg-[#e8edfc] text-[#1236a3]',
        variant === 'feasible' && 'bg-[#eafaf1] text-[#16a34a]',
        variant === 'partial' && 'bg-[#fff7e6] text-[#d97706]',
        variant === 'notFeasible' && 'bg-[#fde8e8] text-[#e74c3c]',
        variant === 'neutral' && 'bg-[#f3f4f6] text-[#989898]'
      )}
    >
      {variant === 'feasible' && showCheck && <span aria-hidden>✓</span>}
      {label}
    </span>
  )
}

function assessmentVariant(status: AssessmentStatus): 'feasible' | 'partial' | 'notFeasible' | 'neutral' {
  if (status === 'feasible') return 'feasible'
  if (status === 'partiallyFeasible') return 'partial'
  if (status === 'notFeasible') return 'notFeasible'
  return 'neutral'
}

function SummaryField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 shrink-0 items-start gap-2">
      {icon ? <span className="mt-0.5 shrink-0 text-[#1236a3]">{icon}</span> : null}
      <div className="min-w-0 whitespace-nowrap">
        <p className="text-[11px] font-semibold text-[#989898]">{label}</p>
        <div className="text-[13px] font-bold leading-snug text-[#000000]">{value}</div>
      </div>
    </div>
  )
}

function AvatarInitials({ initials, color = '#7c3aed', size = 'md' }: { initials: string; color?: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        size === 'lg' ? 'size-9 text-[11px]' : 'size-7 text-[10px]'
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  )
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClientIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3.5 7.5L12 3l8.5 4.5V16.5L12 21l-8.5-4.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a7.5 7.5 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.4 7.4 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.4 7.4 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.5 7.5 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7c.75.66 1.63 1.17 2.6 1.5L10 22h4l.4-2.3a7.4 7.4 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChecklistDocIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.5 3h8l4 4v13.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12.5l1.8 1.8 3.7-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={cn('shrink-0', className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FeasibilityDonut({ percent }: { percent: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex size-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#ececec" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#16a34a"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[22px] font-bold text-[#16a34a]">{percent}%</span>
    </div>
  )
}

function AssessmentTable({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  const legend = [
    { key: 'feasible', color: 'bg-[#16a34a]' },
    { key: 'partiallyFeasible', color: 'bg-[#f59e0b]' },
    { key: 'notFeasible', color: 'bg-[#e74c3c]' },
    { key: 'notApplicable', color: 'bg-[#989898]' },
  ] as const

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-bold text-[#1236a3]">
          {t('cab.applications.technicalFeasibility.assessment.title')}
        </h2>
      </div>
      <table className="w-full table-fixed border-collapse text-start [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-[#ececec] [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-white/20">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[38%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#1236a3] text-[11px] font-bold uppercase tracking-wide text-white">
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.area')}</th>
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.assessment')}</th>
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.status')}</th>
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.comments')}</th>
            </tr>
          </thead>
          <tbody>
            {data.assessments.map((row) => (
              <tr key={row.id} className="border-b border-[#ececec] text-[12px] text-[#000000] last:border-b-0">
                <td className="px-3 py-3 font-semibold align-top">{t(`cab.applications.technicalFeasibility.assessment.areas.${row.areaKey}`)}</td>
                <td className="px-3 py-3 font-medium align-top break-words">{row.assessment}</td>
                <td className="px-3 py-3 text-center align-top">
                  <StatusBadge
                    label={t(`cab.applications.technicalFeasibility.assessment.status.${row.status}`)}
                    variant={assessmentVariant(row.status)}
                  />
                </td>
                <td className="px-3 py-3 font-medium align-top break-words text-[#000000]">{row.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      <div className="flex flex-wrap items-center gap-4 border-t border-[#ececec] px-4 py-3 text-[11px] font-semibold sm:px-5">
        <span className="text-[#000000]">{t('cab.applications.technicalFeasibility.assessment.legend.title')}</span>
        {legend.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-[#000000]">
            <span className={cn('size-2.5 rounded-full', item.color)} />
            {t(`cab.applications.technicalFeasibility.assessment.status.${item.key}`)}
          </span>
        ))}
      </div>
    </section>
  )
}

function CommentsSection({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[#1236a3]">
          {t('cab.applications.technicalFeasibility.comments.title')}
        </h2>
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          + {t('cab.applications.technicalFeasibility.actions.addInternalComment')}
        </button>
      </div>
      <div className="space-y-4">
        {data.internalComments.map((comment) => (
          <div key={`${comment.author}-${comment.time}`}>
            <div className="flex flex-wrap items-center gap-2">
              <AvatarInitials initials={comment.initials} color={comment.color} />
              <span className="text-[13px] font-bold text-[#000000]">{comment.author}</span>
              <span className="rounded-full bg-[#e8edfc] px-2 py-0.5 text-[10px] font-semibold text-[#1236a3]">
                {comment.role}
              </span>
              <span className="text-[11px] font-medium text-[#989898]">
                {comment.date} {comment.time}
              </span>
            </div>
            <div className="mt-2 rounded-[8px] border border-[#ececec] bg-[#fafafa] px-4 py-3">
              <p className="text-[12px] leading-relaxed text-[#000000]">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AuditTeamCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-5')}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-[#1236a3]">
          {t('cab.applications.technicalFeasibility.auditTeam.title')}
        </h3>
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          {t('cab.applications.technicalFeasibility.auditTeam.edit')}
        </button>
      </div>
      <ul className="space-y-4">
        {data.auditTeam.map((member) => (
          <li key={member.name} className="flex items-start gap-3">
            <AvatarInitials initials={member.initials} color={member.color} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-bold text-[#000000]">{member.name}</p>
                <span className="rounded-full bg-[#e8edfc] px-2.5 py-0.5 text-[10px] font-semibold text-[#1236a3]">
                  {t(`cab.applications.technicalFeasibility.auditTeam.roles.${member.roleKey}`)}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-[#989898]">{member.certification}</p>
              <p className="text-[11px] font-medium text-[#989898]">
                {t('cab.applications.technicalFeasibility.auditTeam.experience', { value: member.experience })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResourcesCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-5')}>
      <h3 className="mb-4 text-[14px] font-bold text-[#1236a3]">
        {t('cab.applications.technicalFeasibility.resources.title')}
      </h3>
      <ul className="space-y-3">
        {data.resources.map((resource) => (
          <li key={resource.key} className="flex items-center justify-between gap-3 text-[12px] font-medium text-[#000000]">
            <span>{t(`cab.applications.technicalFeasibility.resources.items.${resource.key}`)}</span>
            <StatusBadge
              label={t('cab.applications.technicalFeasibility.resources.available')}
              variant="feasible"
              pill
              showCheck={false}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function RecommendationCard({ t, onProceed }: { t: Translate; onProceed: () => void }) {
  return (
    <section className="rounded-[16px] border border-[#b6d0ff] bg-[#e8edfc] p-5">
      <div className="flex items-start gap-2.5">
        <InfoIcon className="mt-0.5 text-[#1236a3]" />
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[#1236a3]">
            {t('cab.applications.technicalFeasibility.recommendation.title')}
          </h3>
          <p className="mt-1.5 text-[12px] font-medium leading-snug text-[#000000]">
            {t('cab.applications.technicalFeasibility.recommendation.text')}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onProceed}
        className="mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#1236a3] bg-white text-[12px] font-semibold text-[#1236a3] transition hover:bg-[#f8faff]"
      >
        {t('cab.applications.technicalFeasibility.actions.proceedToQuotation')}
        <AppIcon icon={ArrowRightIcon} size={14} className="text-[#1236a3]" />
      </button>
    </section>
  )
}

function ReviewSummaryCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col items-center p-4 sm:flex-row sm:items-center sm:gap-6')}>
      <div>
        <h3 className="mb-3 text-[14px] font-bold text-[#1236a3]">
          {t('cab.applications.technicalFeasibility.reviewSummary.title')}
        </h3>
        <p className="text-[12px] font-semibold text-[#16a34a]">
          {t('cab.applications.technicalFeasibility.reviewSummary.feasibleCount', {
            count: data.feasibleCount,
            total: data.totalAssessments,
          })}
        </p>
      </div>
      <FeasibilityDonut percent={data.feasibilityPercent} />
    </section>
  )
}

function KeyInformationCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-5')}>
      <h3 className="mb-4 text-[14px] font-bold text-[#1236a3]">
        {t('cab.applications.technicalFeasibility.keyInformation.title')}
      </h3>
      <dl className="space-y-4 text-[12px]">
        <div>
          <dt className="font-semibold text-[#989898]">{t('cab.applications.technicalFeasibility.keyInformation.requestedOn')}</dt>
          <dd className="mt-0.5 font-bold text-[#000000]">
            {data.requestedOnDate} {data.requestedOnTime}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#989898]">{t('cab.applications.technicalFeasibility.keyInformation.requestedBy')}</dt>
          <dd className="mt-0.5 font-bold text-[#000000]">{data.requestedBy.name}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#989898]">{t('cab.applications.technicalFeasibility.keyInformation.dueDate')}</dt>
          <dd className="mt-0.5 font-bold text-[#000000]">{data.assessmentDueDate}</dd>
        </div>
      </dl>
    </section>
  )
}

function WorkflowProgressSidebar({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  const steps = useMemo(
    () =>
      data.workflowSteps.map((step) => ({
        key: step.key,
        label: t(`cab.applications.technicalFeasibility.workflowSteps.${step.key}`),
        description: t(`cab.applications.technicalFeasibility.workflowStepDescriptions.${step.key}`),
        status: step.status,
      })),
    [data.workflowSteps, t]
  )

  return (
    <SharedWorkflowProgressCard
      steps={steps}
      title={t('cab.applications.receipt.sections.workflowProgress')}
      viewFullLabel={t('cab.applications.receipt.actions.viewFullWorkflow')}
      statusLabels={{
        completed: t('cab.applications.receipt.workflow.completed'),
        inProgress: t('cab.applications.receipt.workflow.inProgress'),
        pending: t('cab.applications.receipt.workflow.pending'),
      }}
    />
  )
}

function QuickActionsCard({ t }: { t: Translate }) {
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col gap-2 p-4')}>
      <h2 className="mb-1 text-[14px] font-bold text-[#000000]">
        {t('cab.applications.technicalFeasibility.quickActions.title')}
      </h2>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={CommentIcon} size={14} />
        {t('cab.applications.technicalFeasibility.quickActions.addInternalComment')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#ececec] bg-white px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={ExportIcon} size={14} />
        {t('cab.applications.technicalFeasibility.quickActions.sendReminder')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#f8c9c9] bg-[#fde8e8] px-3 text-[12px] font-semibold text-[#e74c3c] hover:opacity-90"
      >
        <AppIcon icon={CorrectiveActionIcon} size={14} />
        {t('cab.applications.technicalFeasibility.quickActions.escalate')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b7ecc7] bg-[#eafaf1] px-3 text-[12px] font-semibold text-[#16a34a] hover:opacity-90"
      >
        <AppIcon icon={CalendarIcon} size={18} />
        {t('cab.applications.technicalFeasibility.quickActions.extendDueDate')}
      </button>
    </section>
  )
}

function TabPlaceholder({ message }: { message: string }) {
  return (
    <section className={cn(cardClassName, 'flex min-h-[200px] items-center justify-center p-6')}>
      <p className="text-center text-[13px] font-medium text-[#989898]">{message}</p>
    </section>
  )
}

const TABS: TabKey[] = [
  'details',
  'documents',
  'reviewComments',
  'informationRequired',
  'technicalFeasibility',
  'history',
]

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  details: 'cab.applications.review.tabs.applicationDetails',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  informationRequired: 'cab.sidebar.informationRequired',
  technicalFeasibility: 'cab.sidebar.technicalFeasibility',
  history: 'cab.applications.review.tabs.history',
}

export function CabApplicationTechnicalFeasibilityPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scale = useFitScale()
  const [data, setData] = useState<CabApplicationTechnicalFeasibility | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('technicalFeasibility')

  useEffect(() => {
    let cancelled = false
    getCabApplicationTechnicalFeasibility().then((result) => {
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !data) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6 text-[14px] text-neutral-500">
          {t('common.loading')}
        </div>
      </CabLayout>
    )
  }

  const proceedToQuotation = () => navigate(cabApplicationQuotationPath(data.applicationId))

  return (
    <CabLayout className="bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ececec] bg-white px-3 py-3 sm:gap-4 sm:px-5">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] sm:text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.cabDashboard} className="font-light text-[#000000] hover:text-primary">
            {t('cab.applications.technicalFeasibility.breadcrumb.home')}
          </Link>
          <Chevron />
          <span className="font-light text-[#000000]">{t('cab.applications.technicalFeasibility.breadcrumb.applications')}</span>
          <Chevron />
          <span className="font-light text-[#000000]">{data.applicationId}</span>
          <Chevron />
          <span className="font-bold text-[#000000]">{t('cab.applications.technicalFeasibility.breadcrumb.current')}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ececec] text-[#1236a3]"
            aria-label={t('cab.applications.technicalFeasibility.help')}
          >
            ?
          </button>
          <button
            type="button"
            className="relative flex size-9 items-center justify-center text-neutral-600"
            aria-label={t('cab.header.notifications')}
          >
            <AppIcon icon={NotificationIcon} size={24} />
            <span className="absolute end-0 top-0 flex size-4 items-center justify-center rounded-full bg-[#1236a3] text-[10px] font-semibold text-white">
              5
            </span>
          </button>
          <LanguageToggle variant="icon" />
          <div className="flex items-center gap-2">
            <UserAvatar alt="Arjun Verma" className="size-10 border-2" />
            <div className="hidden text-end sm:block">
              <p className="text-[13px] font-semibold text-[#000000]">Arjun Verma</p>
              <p className="text-[12px] text-[#000000]">Lead Auditor</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
          <div className="flex min-w-0 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:p-6">
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5" style={{ zoom: scale }}>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 lg:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-[18px] font-bold text-[#000000] sm:text-[22px]">
                        {t('cab.applications.technicalFeasibility.title')}
                      </h1>
                      <StatusBadge
                        label={t('cab.applications.technicalFeasibility.status.inProgress')}
                        variant="inProgress"
                        pill
                      />
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#000000]">
                      {t('cab.applications.technicalFeasibility.subtitle')}
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-0 flex-1 gap-1.5 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000] sm:flex-none"
                    >
                      <AppIcon icon={DownloadIcon} size={16} />
                      {t('cab.applications.technicalFeasibility.actions.downloadAssessment')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-0 flex-1 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000] sm:flex-none"
                    >
                      {t('cab.applications.technicalFeasibility.actions.moreActions')} ▾
                    </Button>
                    <Button className="h-9 w-full gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold sm:w-auto" onClick={proceedToQuotation}>
                      {t('cab.applications.technicalFeasibility.actions.proceedToQuotation')}
                      <AppIcon icon={ArrowRightIcon} size={14} className="text-white" />
                    </Button>
                  </div>
                </div>

                <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-[#1236a3]">
                      <AppIcon icon={FileTextIcon} size={28} />
                    </span>
                    <span className="text-[24px] font-bold leading-none text-[#000000] sm:text-[26px]">{data.applicationId}</span>
                    <StatusBadge
                      label={t('cab.applications.technicalFeasibility.status.inProgress')}
                      variant="inProgress"
                      pill
                    />
                  </div>

                  <div className="mt-6 flex items-start gap-x-5 overflow-x-auto pb-1 xl:justify-between xl:gap-x-6">
                    <SummaryField icon={<ClientIcon />} label={t('cab.applications.technicalFeasibility.summary.client')} value={data.client} />
                    <SummaryField icon={<BoxIcon />} label={t('cab.applications.technicalFeasibility.summary.applicationType')} value={data.applicationType} />
                    <SummaryField icon={<GearIcon />} label={t('cab.applications.technicalFeasibility.summary.certificationBody')} value={data.certificationBody} />
                    <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.technicalFeasibility.summary.standardScheme')} value={data.primaryStandard} />
                    <SummaryField
                      icon={<AppIcon icon={BuildingsIcon} size={18} />}
                      label={t('cab.applications.technicalFeasibility.summary.sites')}
                      value={String(data.sitesCount)}
                    />
                    <SummaryField
                      label={t('cab.applications.technicalFeasibility.summary.requestedOn')}
                      value={
                        <>
                          <span className="block">{data.requestedOnDate}</span>
                          <span className="block text-[11px] font-medium text-[#989898]">{data.requestedOnTime}</span>
                        </>
                      }
                    />
                    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                      <AvatarInitials initials={data.requestedBy.initials} color="#7c3aed" />
                      <div>
                        <p className="text-[11px] font-semibold text-[#989898]">
                          {t('cab.applications.technicalFeasibility.summary.requestedBy')}
                        </p>
                        <p className="text-[13px] font-bold leading-tight text-[#000000]">{data.requestedBy.name}</p>
                        <p className="text-[10px] font-medium text-[#989898]">{data.requestedBy.role}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-wrap items-center gap-1 border-b border-[#ececec]">
                  {TABS.map((tab) => {
                    const active = activeTab === tab
                    const badge = tab === 'documents' ? data.documentCount : undefined
                    return (
                      <button
                        key={tab}
                        type="button"
                        aria-selected={active}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors',
                          active ? 'border-[#1236a3] text-[#1236a3]' : 'border-transparent text-[#000000] hover:text-[#000000]'
                        )}
                      >
                        {t(TAB_LABEL_KEYS[tab])}
                        {badge !== undefined && <span>({badge})</span>}
                        {tab === 'history' && <AppIcon icon={HistoryIcon} size={13} />}
                      </button>
                    )
                  })}
                </div>

                {activeTab === 'technicalFeasibility' && (
                  <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="flex min-w-0 flex-col gap-4">
                      <AssessmentTable data={data} t={t} />
                      <CommentsSection data={data} t={t} />
                      <ReviewSummaryCard data={data} t={t} />
                    </div>
                    <div className="flex min-w-0 flex-col gap-4">
                      <AuditTeamCard data={data} t={t} />
                      <ResourcesCard data={data} t={t} />
                      <RecommendationCard t={t} onProceed={proceedToQuotation} />
                      <KeyInformationCard data={data} t={t} />
                    </div>
                  </div>
                )}

                {activeTab !== 'technicalFeasibility' && (
                  <TabPlaceholder message={t('cab.applications.technicalFeasibility.tabPlaceholder')} />
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <WorkflowProgressSidebar data={data} t={t} />
                <QuickActionsCard t={t} />
              </div>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#ececec] px-5 py-4">
            <p className="text-[12px] text-[#000000]">{t('cab.applications.technicalFeasibility.footer.copyright')}</p>
            <div className="flex items-center gap-4 text-[12px]">
              <button type="button" className="font-semibold text-[#1236a3] hover:underline">
                {t('cab.applications.technicalFeasibility.footer.privacyPolicy')}
              </button>
              <span className="text-[#000000]">{t('cab.applications.technicalFeasibility.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>
    </CabLayout>
  )
}
