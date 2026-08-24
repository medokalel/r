import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { WorkflowProgressCard as SharedWorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
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
  getCabApplicationInformationRequired,
  type CabApplicationInformationRequired,
  type RequestPriority,
  type WorkflowStepStatus,
} from '@/lib/api/cabApplicationInformationRequiredApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

type TabKey = 'details' | 'documents' | 'reviewComments' | 'informationRequired' | 'internalComments' | 'history'

function StatusBadge({ label, variant }: { label: string; variant: 'inProgress' | 'neutral' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none',
        variant === 'inProgress' && 'bg-[#e8edfc] text-[#1236a3]',
        variant === 'neutral' && 'bg-[#f3f4f6] text-[#000000]'
      )}
    >
      {label}
    </span>
  )
}

function PriorityBadge({ priority, label }: { priority: RequestPriority; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10px] font-bold',
        priority === 'high' && 'bg-[#fde8e8] text-[#e74c3c]',
        priority === 'medium' && 'bg-[#fff7e6] text-[#d97706]',
        priority === 'low' && 'bg-[#eafaf1] text-[#16a34a]'
      )}
    >
      {label}
    </span>
  )
}

function RequestStatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[#fff7e6] px-2 py-0.5 text-[10px] font-bold text-[#d97706]">
      {label}
    </span>
  )
}

function SummaryField({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0 text-[#1236a3]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#000000]">{label}</p>
        <div className="text-[13px] font-bold leading-snug text-[#000000]">{value}</div>
      </div>
    </div>
  )
}

function AvatarInitials({ initials }: { initials: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] font-bold text-white">
      {initials}
    </span>
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

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoAlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#d97706]" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ResponsesInfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1236a3]" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function NoteInfoIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={cn('shrink-0', className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

function EmptyFolderIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="text-[#c4c4c4]" aria-hidden>
      <path
        d="M8 18h18l4 4h26v30a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V18Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M8 22h48" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}

function RequestedInformationTable({ data }: { data: CabApplicationInformationRequired }) {
  const { t } = useTranslation()

  const priorityLabel = (priority: RequestPriority) =>
    t(`cab.applications.informationRequired.priority.${priority}`)

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-bold text-[#000000]">
          {t('cab.applications.informationRequired.requests.title', { count: data.requests.length })}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-start [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-[#ececec] [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-white/20">
          <thead>
            <tr className="bg-[#1236a3] text-[11px] font-bold uppercase tracking-wide text-white">
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.requests.columns.number')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.requests.columns.description')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.requests.columns.reference')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.requests.columns.requestedBy')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.requests.columns.requestedOn')}</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-start">{t('cab.applications.informationRequired.requests.columns.dueDate')}</th>
              <th className="px-4 py-3.5 text-center">{t('cab.applications.informationRequired.requests.columns.priority')}</th>
              <th className="px-4 py-3.5 text-center">{t('cab.applications.informationRequired.requests.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {data.requests.map((item) => (
              <tr key={item.id} className="border-b border-[#ececec] text-[12px] text-[#000000] last:border-b-0">
                <td className="px-4 py-3.5 font-semibold">{item.id}</td>
                <td className="max-w-[240px] px-4 py-3.5 font-medium leading-snug">{item.description}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="block text-[12px] font-medium text-[#989898]">{item.referenceStandard}</span>
                  <span className="block text-[12px] font-semibold text-[#000000]">{item.referenceClause}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <AvatarInitials initials={item.requestedBy.initials} />
                    <div className="min-w-0">
                      <span className="block text-[12px] font-bold text-[#000000]">{item.requestedBy.name}</span>
                      <span className="block text-[11px] font-medium text-[#989898]">{item.requestedBy.role}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="block font-semibold">{item.requestedOnDate}</span>
                  <span className="block text-[11px] font-semibold text-[#000000]">{item.requestedOnTime}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-semibold">{item.dueDate}</td>
                <td className="px-4 py-3.5 text-center">
                  <PriorityBadge priority={item.priority} label={priorityLabel(item.priority)} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <RequestStatusBadge label={t('cab.applications.informationRequired.status.pending')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-[#ececec] px-4 py-3 text-[11px] font-semibold sm:px-5">
        <span className="text-[#000000]">{t('cab.applications.informationRequired.priorityLegend.title')}</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#e74c3c]" />
          {t('cab.applications.informationRequired.priority.high')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#f59e0b]" />
          {t('cab.applications.informationRequired.priority.medium')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#22c55e]" />
          {t('cab.applications.informationRequired.priority.low')}
        </span>
      </div>
    </section>
  )
}

function ResponsesSection() {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-bold text-[#000000]">
          {t('cab.applications.informationRequired.responses.title')}
        </h2>
      </div>
      <div className="px-4 pt-4 sm:px-5">
        <div className="flex items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 py-2.5">
          <ResponsesInfoIcon />
          <p className="text-[12px] font-medium leading-snug text-[#1236a3]">
            {t('cab.applications.informationRequired.responses.awaiting')}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="mt-4 w-full min-w-[760px] border-collapse text-start [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-white/20">
          <thead>
            <tr className="bg-[#1236a3] text-[11px] font-bold uppercase tracking-wide text-white">
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.number')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.informationItem')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.responseAttachment')}</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.submittedOn')}</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.submittedBy')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-10">
                <div className="flex flex-col items-center justify-center">
                  <EmptyFolderIcon />
                  <p className="mt-3 text-[13px] font-semibold text-[#989898]">
                    {t('cab.applications.informationRequired.responses.empty')}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function InternalCommentsSection({ data }: { data: CabApplicationInformationRequired }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-5')}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[#1236a3]">
          {t('cab.applications.informationRequired.internalComments.title')}
        </h2>
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          + {t('cab.applications.informationRequired.actions.addInternalComment')}
        </button>
      </div>
      <div className="space-y-4">
        {data.internalComments.map((comment) => (
          <div key={`${comment.author}-${comment.date}`}>
            <div className="flex flex-wrap items-center gap-2">
              <AvatarInitials initials={comment.initials} />
              <span className="text-[13px] font-bold text-[#000000]">{comment.author}</span>
              <span className="rounded-full bg-[#e8edfc] px-2 py-0.5 text-[10px] font-semibold text-[#1236a3]">
                {comment.role}
              </span>
              <span className="text-[11px] font-medium text-[#989898]">
                {comment.date} {comment.time}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#F3F6FD] px-3 py-2.5">
              <NoteInfoIcon className="shrink-0 text-[#1236a3]" />
              <p className="text-[12px] font-medium leading-snug text-[#1236a3]">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function WorkflowProgressSidebar({ data }: { data: CabApplicationInformationRequired }) {
  const { t } = useTranslation()

  const steps = useMemo(
    () =>
      data.workflowSteps.map((step) => ({
        key: step.key,
        label: t(`cab.applications.informationRequired.workflowSteps.${step.key}`),
        description: t(`cab.applications.informationRequired.workflowStepDescriptions.${step.key}`),
        status: step.status as WorkflowStepStatus,
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

function KeyActionsCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col gap-2 p-4')}>
      <h2 className="mb-1 text-[14px] font-bold text-[#000000]">
        {t('cab.applications.informationRequired.keyActions.title')}
      </h2>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={ExportIcon} size={14} />
        {t('cab.applications.informationRequired.keyActions.sendReminder')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b7ecc7] bg-[#eafaf1] px-3 text-[12px] font-semibold text-[#16a34a] hover:opacity-90"
      >
        <AppIcon icon={CalendarIcon} size={14} />
        {t('cab.applications.informationRequired.keyActions.extendDueDate')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={CommentIcon} size={14} />
        {t('cab.applications.informationRequired.keyActions.addInternalComment')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#f8c9c9] bg-[#fde8e8] px-3 text-[12px] font-semibold text-[#e74c3c] hover:opacity-90"
      >
        <AppIcon icon={CorrectiveActionIcon} size={14} />
        {t('cab.applications.informationRequired.keyActions.escalate')}
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

const TABS: TabKey[] = ['details', 'documents', 'reviewComments', 'informationRequired', 'internalComments', 'history']

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  details: 'cab.applications.review.tabs.applicationDetails',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  informationRequired: 'cab.sidebar.informationRequired',
  internalComments: 'cab.applications.review.tabs.internalComments',
  history: 'cab.applications.review.tabs.history',
}

export function CabApplicationInformationRequiredPage() {
  const { t } = useTranslation()
  const scale = useFitScale()
  const [data, setData] = useState<CabApplicationInformationRequired | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('informationRequired')

  useEffect(() => {
    let cancelled = false
    getCabApplicationInformationRequired().then((result) => {
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

  return (
    <CabLayout className="bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ececec] bg-white px-3 py-3 sm:gap-4 sm:px-5">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] sm:text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.cabDashboard} className="font-light text-[#000000] hover:text-primary">
            {t('cab.applications.informationRequired.breadcrumb.home')}
          </Link>
          <Chevron />
          <span className="font-light text-[#000000]">{t('cab.applications.informationRequired.breadcrumb.applications')}</span>
          <Chevron />
          <span className="font-light text-[#000000]">{data.applicationId}</span>
          <Chevron />
          <span className="font-bold text-[#000000]">{t('cab.applications.informationRequired.breadcrumb.current')}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ececec] text-[#1236a3]"
            aria-label={t('cab.applications.informationRequired.help')}
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
                        {t('cab.applications.informationRequired.title')}
                      </h1>
                      <StatusBadge label={t('cab.applications.informationRequired.status.inProgress')} variant="inProgress" />
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#000000]">{t('cab.applications.informationRequired.subtitle')}</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-0 flex-1 gap-1.5 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000] sm:flex-none"
                    >
                      <AppIcon icon={DownloadIcon} size={16} />
                      {t('cab.applications.informationRequired.actions.downloadRequest')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-0 flex-1 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000] sm:flex-none"
                    >
                      {t('cab.applications.informationRequired.actions.moreActions')} ▾
                    </Button>
                    <Button className="h-9 w-full gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold sm:w-auto">
                      <AppIcon icon={ExportIcon} size={14} />
                      {t('cab.applications.informationRequired.actions.sendReminder')}
                    </Button>
                  </div>
                </div>

                <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-[#1236a3]">
                      <AppIcon icon={FileTextIcon} size={28} />
                    </span>
                    <span className="text-[24px] font-bold leading-none text-[#000000] sm:text-[26px]">{data.applicationId}</span>
                    <StatusBadge label={t('cab.applications.informationRequired.status.inProgress')} variant="inProgress" />
                  </div>

                  <div className="mt-6 flex min-w-0 flex-wrap items-start justify-between gap-x-8 gap-y-4">
                    <SummaryField icon={<ClientIcon />} label={t('cab.applications.informationRequired.summary.client')} value={data.client} />
                    <SummaryField icon={<BoxIcon />} label={t('cab.applications.informationRequired.summary.applicationType')} value={data.applicationType} />
                    <SummaryField icon={<GearIcon />} label={t('cab.applications.informationRequired.summary.certificationBody')} value={data.certificationBody} />
                    <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.informationRequired.summary.primaryStandard')} value={data.primaryStandard} />
                    <SummaryField
                      icon={<AppIcon icon={CalendarIcon} size={18} />}
                      label={t('cab.applications.informationRequired.summary.requestedOn')}
                      value={
                        <>
                          <span className="block">{data.requestedOnDate}</span>
                          <span className="block text-[11px] font-semibold text-[#000000]">{data.requestedOnTime}</span>
                        </>
                      }
                    />
                    <div className="flex min-w-0 items-center gap-2">
                      <AvatarInitials initials={data.requestedBy.initials} />
                      <div>
                        <p className="text-[11px] font-semibold text-[#000000]">
                          {t('cab.applications.informationRequired.summary.requestedBy')}
                        </p>
                        <p className="text-[13px] font-bold leading-tight text-[#000000]">{data.requestedBy.name}</p>
                        <p className="text-[10px] font-medium text-[#000000]">{data.requestedBy.role}</p>
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

                {activeTab === 'informationRequired' && (
                  <>
                    <div className="flex items-start gap-3 rounded-[12px] border border-[#fde3a7] bg-[#fff7e6] px-4 py-3">
                      <InfoAlertIcon />
                      <div>
                        <p className="text-[13px] font-bold text-[#000000]">
                          {t('cab.applications.informationRequired.alert.title')}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[#000000]">
                          {t('cab.applications.informationRequired.alert.description', { date: data.deadlineDate })}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[#000000]">{data.deadlineNote}</p>
                      </div>
                    </div>
                    <RequestedInformationTable data={data} />
                    <ResponsesSection />
                    <InternalCommentsSection data={data} />
                  </>
                )}

                {activeTab !== 'informationRequired' && activeTab !== 'internalComments' && (
                  <TabPlaceholder message={t('cab.applications.informationRequired.tabPlaceholder')} />
                )}

                {activeTab === 'internalComments' && <InternalCommentsSection data={data} />}
              </div>

              <aside className="hidden flex-col gap-4 xl:flex">
                <WorkflowProgressSidebar data={data} />
                <KeyActionsCard />
              </aside>

              <div className="flex flex-col gap-4 xl:hidden">
                <WorkflowProgressSidebar data={data} />
                <KeyActionsCard />
              </div>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#ececec] bg-white px-3 py-3 sm:px-6">
            <p className="text-[12px] text-[#000000]">{t('cab.applications.informationRequired.footer.copyright')}</p>
            <div className="flex items-center gap-4 text-[12px]">
              <Link to={ROUTES.privacyPolicy} className="text-[#1236a3] hover:underline">
                {t('cab.applications.informationRequired.footer.privacyPolicy')}
              </Link>
              <span className="text-[#000000]">{t('cab.applications.informationRequired.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>
    </CabLayout>
  )
}
