import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { WorkflowProgressCard as SharedWorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
  BuildingsIcon,
  CalendarIcon,
  CommentIcon,
  DownloadIcon,
  ExportIcon,
  FileTextIcon,
  HistoryIcon,
  MapPinIcon,
  NotificationIcon,
  PdfFileIcon,
  ExcelFileIcon,
  UsersIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  getCabApplicationQuotation,
  type CabApplicationQuotation,
  type DocumentStatus,
} from '@/lib/api/cabApplicationQuotationApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

type TabKey =
  | 'details'
  | 'documents'
  | 'reviewComments'
  | 'informationRequired'
  | 'technicalFeasibility'
  | 'quotation'
  | 'history'

function StatusBadge({
  label,
  variant,
  pill = false,
}: {
  label: string
  variant: 'inProgress' | 'valid' | 'draft' | 'expired' | 'neutral'
  pill?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-bold',
        pill ? 'rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none' : 'rounded-[4px]',
        variant === 'inProgress' && 'bg-[#e8edfc] text-[#1236a3]',
        variant === 'valid' && 'bg-[#eafaf1] text-[#16a34a]',
        variant === 'draft' && 'bg-[#fff7e6] text-[#d97706]',
        variant === 'expired' && 'bg-[#fde8e8] text-[#e74c3c]',
        variant === 'neutral' && 'bg-[#f3f4f6] text-[#000000]'
      )}
    >
      {label}
    </span>
  )
}

function SummaryField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 shrink-0 items-start gap-2">
      {icon ? <span className="mt-0.5 shrink-0 text-[#989898]">{icon}</span> : null}
      <div className="min-w-0 whitespace-nowrap">
        <p className="text-[11px] font-semibold text-[#989898]">{label}</p>
        <div className="text-[13px] font-bold leading-snug text-[#000000]">{value}</div>
      </div>
    </div>
  )
}

function AvatarInitials({ initials, color = '#7c3aed' }: { initials: string; color?: string }) {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={cn('shrink-0', className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function SummaryStatIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#1236a3] text-[#1236a3]">
      {children}
    </span>
  )
}

function CurrencyStatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v20M15 6H10.5a2.5 2.5 0 0 0 0 5H13.5a2.5 2.5 0 0 1 0 5H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClockStatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type SummaryStatIconType = 'amount' | 'calendar' | 'team' | 'sites' | 'validity'

function SummaryStatIconByType({ type }: { type: SummaryStatIconType }) {
  switch (type) {
    case 'amount':
      return (
        <SummaryStatIcon>
          <CurrencyStatIcon />
        </SummaryStatIcon>
      )
    case 'calendar':
      return (
        <SummaryStatIcon>
          <CalendarIcon className="size-[18px]" />
        </SummaryStatIcon>
      )
    case 'team':
      return (
        <SummaryStatIcon>
          <AppIcon icon={UsersIcon} size={18} />
        </SummaryStatIcon>
      )
    case 'sites':
      return (
        <SummaryStatIcon>
          <AppIcon icon={MapPinIcon} size={18} />
        </SummaryStatIcon>
      )
    case 'validity':
      return (
        <SummaryStatIcon>
          <ClockStatIcon />
        </SummaryStatIcon>
      )
  }
}

function SummaryStatCard({
  label,
  primary,
  secondary,
  icon,
}: {
  label: string
  primary: string
  secondary: string
  icon: SummaryStatIconType
}) {
  return (
    <div className="flex min-w-[160px] flex-1 items-center gap-3 rounded-[8px] border border-[#ececec] bg-white p-3 sm:min-w-0 sm:p-4">
      <SummaryStatIconByType type={icon} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-tight text-[#1236a3]">{label}</p>
        <p className="mt-0.5 text-[15px] font-bold leading-tight text-[#1236a3] sm:text-[16px]">{primary}</p>
        <p className="mt-0.5 text-[11px] font-medium text-[#989898]">{secondary}</p>
      </div>
    </div>
  )
}

function QuotationBreakdownTable({ data, t }: { data: CabApplicationQuotation; t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-bold text-[#1236a3]">{t('cab.applications.quotation.breakdown.title')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-start [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-[#ececec] [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-[#ececec]">
          <thead>
            <tr className="border-b border-[#ececec] bg-[#fafafa] text-[11px] font-bold uppercase tracking-wide text-[#000000]">
              <th className="px-4 py-3 text-start">{t('cab.applications.quotation.breakdown.columns.number')}</th>
              <th className="px-4 py-3 text-start">{t('cab.applications.quotation.breakdown.columns.description')}</th>
              <th className="px-4 py-3 text-start">{t('cab.applications.quotation.breakdown.columns.basis')}</th>
              <th className="px-4 py-3 text-start">{t('cab.applications.quotation.breakdown.columns.quantity')}</th>
              <th className="px-4 py-3 text-end">{t('cab.applications.quotation.breakdown.columns.unitRate')}</th>
              <th className="px-4 py-3 text-end">{t('cab.applications.quotation.breakdown.columns.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-[#ececec] text-[12px] text-[#000000] last:border-b-0">
                <td className="px-4 py-3.5 font-semibold">{item.id}</td>
                <td className="px-4 py-3.5 font-medium">{item.description}</td>
                <td className="px-4 py-3.5">{item.basis}</td>
                <td className="px-4 py-3.5">{item.quantity}</td>
                <td className="px-4 py-3.5 text-end">{item.unitRate}</td>
                <td className="px-4 py-3.5 text-end font-semibold">{item.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#ececec] bg-[#fafafa] text-[12px] text-[#000000]">
              <td colSpan={5} className="px-4 py-3 text-end font-semibold">
                {t('cab.applications.quotation.breakdown.subTotal')}
              </td>
              <td className="px-4 py-3 text-end font-semibold">{data.subTotal}</td>
            </tr>
            <tr className="border-t border-[#ececec] text-[12px] text-[#000000]">
              <td colSpan={5} className="px-4 py-3 text-end font-semibold text-[#16a34a]">
                {t('cab.applications.quotation.breakdown.discount')} ({data.discountLabel})
              </td>
              <td className="px-4 py-3 text-end font-semibold text-[#16a34a]">{data.discountAmount}</td>
            </tr>
            <tr className="border-t border-[#ececec] bg-[#f8faff] text-[13px] font-bold text-[#1236a3]">
              <td colSpan={5} className="px-4 py-3.5 text-end">
                {t('cab.applications.quotation.breakdown.total')}
              </td>
              <td className="px-4 py-3.5 text-end">USD {data.totalExcludingTaxes}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

function IncludedExcludedSidebar({ data, t }: { data: CabApplicationQuotation; t: (key: string) => string }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className={cn(cardClassName, 'min-w-0 p-4')}>
        <h3 className="mb-3 text-[13px] font-bold text-[#16a34a]">{t('cab.applications.quotation.included.title')}</h3>
        <ul className="space-y-2.5">
          {data.includedItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12px] leading-snug text-[#000000]">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eafaf1] text-[10px] font-bold text-[#16a34a]">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className={cn(cardClassName, 'min-w-0 p-4')}>
        <h3 className="mb-3 text-[13px] font-bold text-[#e74c3c]">{t('cab.applications.quotation.excluded.title')}</h3>
        <ul className="space-y-2.5">
          {data.excludedItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12px] leading-snug text-[#000000]">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#fde8e8] text-[10px] font-bold text-[#e74c3c]">
                ✕
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function BreakdownWithSidebarSection({ data, t }: { data: CabApplicationQuotation; t: (key: string) => string }) {
  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <QuotationBreakdownTable data={data} t={t} />
      <IncludedExcludedSidebar data={data} t={t} />
    </div>
  )
}

function PaymentTermsCard({ data, t }: { data: CabApplicationQuotation; t: (key: string) => string }) {
  const rows = [
    { label: t('cab.applications.quotation.paymentTerms.terms'), value: data.paymentTerms.terms },
    { label: t('cab.applications.quotation.paymentTerms.method'), value: data.paymentTerms.method },
    { label: t('cab.applications.quotation.paymentTerms.currency'), value: data.paymentTerms.currency },
    { label: t('cab.applications.quotation.paymentTerms.notes'), value: data.paymentTerms.notes },
  ]

  return (
    <section className={cn(cardClassName, 'relative flex min-h-[320px] min-w-0 flex-col overflow-hidden')}>
      <div className="border-b border-[#ececec] px-4 py-3">
        <h2 className="text-[14px] font-bold text-[#1236a3]">{t('cab.applications.quotation.paymentTerms.title')}</h2>
      </div>
      <div className="flex-1 px-4 py-3">
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-[11px] font-semibold text-[#989898]">{row.label}</dt>
              <dd className="mt-0.5 text-[12px] font-semibold leading-snug text-[#000000]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <span className="absolute bottom-4 start-4 flex size-10 items-center justify-center rounded-full bg-[#e8edfc] text-[#1236a3]">
        <AppIcon icon={FileTextIcon} size={18} />
      </span>
    </section>
  )
}

function InternalCommentsCard({ data, t }: { data: CabApplicationQuotation; t: (key: string) => string }) {
  const avatarColors: Record<string, string> = {
    NP: '#7c3aed',
    RK: '#1236a3',
  }

  return (
    <section className={cn(cardClassName, 'flex min-h-[320px] min-w-0 flex-col')}>
      <div className="flex items-center justify-between gap-3 border-b border-[#ececec] px-4 py-3">
        <h2 className="text-[14px] font-bold text-[#1236a3]">{t('cab.applications.quotation.internalComments.title')}</h2>
        <button type="button" className="text-[11px] font-semibold text-[#1236a3] hover:underline">
          + {t('cab.applications.quotation.actions.addInternalComment')}
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {data.internalComments.map((comment) => (
          <div key={`${comment.author}-${comment.time}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <AvatarInitials initials={comment.initials} color={avatarColors[comment.initials] ?? '#7c3aed'} />
              <span className="text-[12px] font-bold text-[#000000]">{comment.author}</span>
              <span className="rounded-full bg-[#e8edfc] px-2 py-0.5 text-[9px] font-semibold text-[#1236a3]">
                {comment.role}
              </span>
              <span className="text-[10px] font-medium text-[#989898]">
                {comment.date} {comment.time}
              </span>
              {comment.tag ? (
                <StatusBadge label={comment.tag} variant="valid" />
              ) : null}
            </div>
            <div className="mt-2 rounded-[8px] border border-[#ececec] bg-[#fafafa] px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-[#000000]">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function DocumentsCard({ data, t }: { data: CabApplicationQuotation; t: ReturnType<typeof useTranslation>['t'] }) {
  const statusLabel = (status: DocumentStatus) => {
    if (status === 'valid') return t('cab.applications.quotation.documents.status.valid')
    if (status === 'draft') return t('cab.applications.quotation.documents.status.draft')
    return t('cab.applications.quotation.documents.status.expired')
  }

  const statusVariant = (status: DocumentStatus): 'valid' | 'draft' | 'expired' => {
    if (status === 'valid') return 'valid'
    if (status === 'draft') return 'draft'
    return 'expired'
  }

  const validCount = data.documents.filter((d) => d.status === 'valid').length
  const draftCount = data.documents.filter((d) => d.status === 'draft').length
  const expiredCount = data.documents.filter((d) => d.status === 'expired').length

  return (
    <section className={cn(cardClassName, 'flex min-h-[320px] min-w-0 flex-col overflow-hidden')}>
      <div className="flex items-center justify-between gap-3 border-b border-[#ececec] px-4 py-3">
        <h2 className="text-[14px] font-bold text-[#1236a3]">
          {t('cab.applications.quotation.documents.title', { count: data.documents.length })}
        </h2>
        <button type="button" className="text-[11px] font-semibold text-[#1236a3] hover:underline">
          {t('cab.applications.quotation.documents.viewAll')}
        </button>
      </div>
      <ul className="flex-1 divide-y divide-[#ececec] overflow-y-auto">
        {data.documents.map((doc) => (
          <li key={doc.name} className="flex items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <AppIcon
                icon={doc.fileType === 'excel' ? ExcelFileIcon : PdfFileIcon}
                size={22}
                className={cn('shrink-0', doc.fileType === 'excel' ? 'text-[#16a34a]' : 'text-[#e74c3c]')}
              />
              <span className="truncate text-[11px] font-semibold text-[#1236a3]">{doc.name}</span>
            </div>
            <StatusBadge label={statusLabel(doc.status)} variant={statusVariant(doc.status)} />
          </li>
        ))}
      </ul>
      <div className="border-t border-[#ececec] px-4 py-2.5 text-[10px] font-semibold text-[#989898]">
        {t('cab.applications.quotation.documents.stats.total', { count: data.documents.length })}{' '}
        <span className="text-[#16a34a]">
          {t('cab.applications.quotation.documents.stats.valid', { count: validCount })}
        </span>{' '}
        <span className="text-[#d97706]">
          {t('cab.applications.quotation.documents.stats.draft', { count: draftCount })}
        </span>{' '}
        <span className="text-[#e74c3c]">
          {t('cab.applications.quotation.documents.stats.expired', { count: expiredCount })}
        </span>
      </div>
    </section>
  )
}

function BottomThreeColumnSection({ data, t }: { data: CabApplicationQuotation; t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
      <PaymentTermsCard data={data} t={t} />
      <InternalCommentsCard data={data} t={t} />
      <DocumentsCard data={data} t={t} />
    </div>
  )
}

function WorkflowProgressSidebar({ data, t }: { data: CabApplicationQuotation; t: (key: string) => string }) {
  const steps = useMemo(
    () =>
      data.workflowSteps.map((step) => ({
        key: step.key,
        label: t(`cab.applications.quotation.workflowSteps.${step.key}`),
        description: t(`cab.applications.quotation.workflowStepDescriptions.${step.key}`),
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

function QuickActionsCard({ t }: { t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col gap-2 p-4')}>
      <h2 className="mb-1 text-[14px] font-bold text-[#000000]">{t('cab.applications.quotation.quickActions.title')}</h2>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#ececec] bg-white px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={DownloadIcon} size={14} />
        {t('cab.applications.quotation.quickActions.download')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#ececec] bg-white px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={FileTextIcon} size={14} />
        {t('cab.applications.quotation.quickActions.preview')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={CommentIcon} size={14} />
        {t('cab.applications.quotation.quickActions.addInternalComment')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b7ecc7] bg-[#eafaf1] px-3 text-[12px] font-semibold text-[#16a34a] hover:opacity-90"
      >
        ✓ {t('cab.applications.quotation.quickActions.requestApproval')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#1236a3] px-3 text-[12px] font-semibold text-white hover:opacity-90"
      >
        <AppIcon icon={ExportIcon} size={14} className="text-white" />
        {t('cab.applications.quotation.quickActions.sendToClient')}
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
  'quotation',
  'history',
]

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  details: 'cab.applications.review.tabs.applicationDetails',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  informationRequired: 'cab.sidebar.informationRequired',
  technicalFeasibility: 'cab.sidebar.technicalFeasibility',
  quotation: 'cab.sidebar.quotation',
  history: 'cab.applications.review.tabs.history',
}

export function CabApplicationQuotationPage() {
  const { t } = useTranslation()
  const scale = useFitScale()
  const [data, setData] = useState<CabApplicationQuotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('quotation')

  useEffect(() => {
    let cancelled = false
    getCabApplicationQuotation().then((result) => {
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
            {t('cab.applications.quotation.breadcrumb.home')}
          </Link>
          <Chevron />
          <span className="font-light text-[#000000]">{t('cab.applications.quotation.breadcrumb.applications')}</span>
          <Chevron />
          <span className="font-light text-[#000000]">{data.applicationId}</span>
          <Chevron />
          <span className="font-bold text-[#000000]">{t('cab.applications.quotation.breadcrumb.current')}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ececec] text-[#1236a3]"
            aria-label={t('cab.applications.quotation.help')}
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
                        {t('cab.applications.quotation.title')}
                      </h1>
                      <StatusBadge label={t('cab.applications.quotation.status.inProgress')} variant="inProgress" />
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#000000]">{t('cab.applications.quotation.subtitle')}</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-0 flex-1 gap-1.5 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000] sm:flex-none"
                    >
                      <AppIcon icon={DownloadIcon} size={16} />
                      {t('cab.applications.quotation.actions.downloadQuotation')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-w-0 flex-1 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000] sm:flex-none"
                    >
                      {t('cab.applications.quotation.actions.moreActions')} ▾
                    </Button>
                    <Button className="h-9 w-full gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold sm:w-auto">
                      <AppIcon icon={ExportIcon} size={14} />
                      {t('cab.applications.quotation.actions.sendToClient')}
                    </Button>
                  </div>
                </div>

                <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-[#1236a3]">
                      <AppIcon icon={FileTextIcon} size={28} />
                    </span>
                    <span className="text-[24px] font-bold leading-none text-[#000000] sm:text-[26px]">{data.applicationId}</span>
                    <StatusBadge label={t('cab.applications.quotation.status.inProgress')} variant="inProgress" pill />
                  </div>

                  <div className="mt-6 flex items-start gap-x-5 overflow-x-auto pb-1 xl:justify-between xl:gap-x-6">
                    <SummaryField icon={<ClientIcon />} label={t('cab.applications.quotation.summary.client')} value={data.client} />
                    <SummaryField icon={<BoxIcon />} label={t('cab.applications.quotation.summary.applicationType')} value={data.applicationType} />
                    <SummaryField icon={<GearIcon />} label={t('cab.applications.quotation.summary.certificationBody')} value={data.certificationBody} />
                    <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.quotation.summary.standardScheme')} value={data.primaryStandard} />
                    <SummaryField
                      icon={<AppIcon icon={BuildingsIcon} size={18} />}
                      label={t('cab.applications.quotation.summary.sites')}
                      value={String(data.sitesCount)}
                    />
                    <SummaryField
                      label={t('cab.applications.quotation.summary.requestedOn')}
                      value={
                        <>
                          <span className="block">{data.requestedOnDate}</span>
                          <span className="block text-[11px] font-medium text-[#989898]">{data.requestedOnTime}</span>
                        </>
                      }
                    />
                    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                      <AvatarInitials initials={data.assignedTo.initials} />
                      <div>
                        <p className="text-[11px] font-semibold text-[#989898]">{t('cab.applications.quotation.summary.assignedTo')}</p>
                        <p className="text-[13px] font-bold leading-tight text-[#000000]">{data.assignedTo.name}</p>
                        <p className="text-[10px] font-medium text-[#989898]">{data.assignedTo.role}</p>
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

                {activeTab === 'quotation' && (
                  <>
                    <div className="flex items-start gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 py-2.5">
                      <InfoIcon className="text-[#1236a3]" />
                      <p className="text-[12px] font-medium leading-snug text-[#1236a3]">
                        {t('cab.applications.quotation.alert.description')}
                      </p>
                    </div>

                    <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
                      <SummaryStatCard
                        icon="amount"
                        label={t('cab.applications.quotation.stats.totalAmount')}
                        primary={data.totalAmount}
                        secondary={data.totalAmountNote}
                      />
                      <SummaryStatCard
                        icon="calendar"
                        label={t('cab.applications.quotation.stats.proposedAuditDates')}
                        primary={data.proposedAuditDates}
                        secondary={data.proposedAuditDays}
                      />
                      <SummaryStatCard
                        icon="team"
                        label={t('cab.applications.quotation.stats.auditTeam')}
                        primary={data.auditTeamSummary}
                        secondary={data.auditTeamDetail}
                      />
                      <SummaryStatCard
                        icon="sites"
                        label={t('cab.applications.quotation.stats.sites')}
                        primary={data.sitesSummary}
                        secondary={data.sitesDetail}
                      />
                      <SummaryStatCard
                        icon="validity"
                        label={t('cab.applications.quotation.stats.validity')}
                        primary={data.validitySummary}
                        secondary={data.validityDetail}
                      />
                    </div>

                    <BreakdownWithSidebarSection data={data} t={t} />
                    <BottomThreeColumnSection data={data} t={t} />
                  </>
                )}

                {activeTab !== 'quotation' && (
                  <TabPlaceholder message={t('cab.applications.quotation.tabPlaceholder')} />
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <WorkflowProgressSidebar data={data} t={t} />
                <QuickActionsCard t={t} />
              </div>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#ececec] px-5 py-4">
            <p className="text-[12px] text-[#000000]">{t('cab.applications.quotation.footer.copyright')}</p>
            <div className="flex items-center gap-4 text-[12px]">
              <button type="button" className="font-semibold text-[#1236a3] hover:underline">
                {t('cab.applications.quotation.footer.privacyPolicy')}
              </button>
              <span className="text-[#000000]">{t('cab.applications.quotation.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>
    </CabLayout>
  )
}
