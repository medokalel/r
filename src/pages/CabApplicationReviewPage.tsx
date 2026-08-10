import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import {
  AppIcon,
  ArrowRightIcon,
  CalendarIcon,
  CommentIcon,
  DownloadIcon,
  ExternalLinkArrowIcon,
  FileTextIcon,
  HistoryIcon,
  LockIcon,
  NotificationIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { SelectField } from '@/components/ui/Select'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  getCabApplicationReview,
  type CabApplicationReview,
  type ChecklistStatus,
  type CommentTag,
  type DocumentStatus,
} from '@/lib/api/cabApplicationReviewApi'
import { WorkflowTimelineItem } from '@/pages/CabApplicationReceiptPage'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

type TabKey = 'checklist' | 'details' | 'documents' | 'reviewComments' | 'internalComments' | 'history'

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

function ChecklistStatusPill({ status, label }: { status: ChecklistStatus; label: string }) {
  const color =
    status === 'complete'
      ? '#22c55e'
      : status === 'partiallyComplete'
        ? '#f59e0b'
        : status === 'incomplete'
          ? '#e74c3c'
          : '#9ca3af'
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color }}>
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden>
        <circle cx="7" cy="7" r="6" fill={status === 'complete' ? color : 'none'} stroke={color} strokeWidth="1.5" />
        {status === 'complete' && (
          <path d="M4.2 7.1l1.8 1.8 3.8-3.9" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {label}
    </span>
  )
}

function DocStatusBadge({ status, label }: { status: DocumentStatus; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
        status === 'valid' && 'bg-[#eafaf1] text-[#22c55e]',
        status === 'expired' && 'bg-[#fde8e8] text-[#e74c3c]',
        status === 'pending' && 'bg-[#fff7e6] text-[#d97706]'
      )}
    >
      {label}
    </span>
  )
}

function CommentTagBadge({ tag, label }: { tag: CommentTag; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        tag === 'minor' && 'bg-[#fff7e6] text-[#d97706]',
        tag === 'note' && 'bg-[#eafaf1] text-[#16a34a]',
        tag === 'major' && 'bg-[#fde8e8] text-[#e74c3c]'
      )}
    >
      {label}
    </span>
  )
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-[#000000]">{label}</span>
      <div className="text-[13px] font-bold leading-snug text-[#000000]">{value}</div>
    </div>
  )
}

function SummaryField({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0 text-[#000000]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#000000]">{label}</p>
        <div className="text-[13px] font-bold leading-snug text-[#000000]">{value}</div>
      </div>
    </div>
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

function AvatarInitials({ initials }: { initials: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] font-bold text-white">
      {initials}
    </span>
  )
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Review Checklist tab                                                       */
/* -------------------------------------------------------------------------- */

function ChecklistTable({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
      <h2 className="mb-4 text-[15px] font-bold text-[#000000]">
        {t('cab.applications.review.checklist.title')}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-start">
          <thead>
            <tr className="border-b border-[#ececec] bg-[#F4F7FC] text-[11px] font-bold text-[#000000]">
              <th className="w-10 py-2 ps-2 text-start">{t('cab.applications.review.checklist.columns.number')}</th>
              <th className="py-2 text-start">{t('cab.applications.review.checklist.columns.area')}</th>
              <th className="py-2 text-start">{t('cab.applications.review.checklist.columns.description')}</th>
              <th className="w-36 py-2 text-start">{t('cab.applications.review.checklist.columns.status')}</th>
              <th className="py-2 text-start">{t('cab.applications.review.checklist.columns.comments')}</th>
              <th className="w-16 py-2 text-start">{t('cab.applications.review.checklist.columns.action')}</th>
            </tr>
          </thead>
          <tbody>
            {review.checklist.map((row) => (
              <tr key={row.id} className="border-b border-[#f4f4f4] align-top text-[12px] text-[#000000]">
                <td className="py-3 font-semibold">{row.id}</td>
                <td className="py-3 font-bold">{row.area}</td>
                <td className="max-w-[220px] py-3 text-[#000000]">{row.description}</td>
                <td className="py-3">
                  <ChecklistStatusPill
                    status={row.status}
                    label={t(`cab.applications.review.checklist.status.${row.status}`)}
                  />
                </td>
                <td className="max-w-[240px] py-3 text-[#000000]">{row.comment}</td>
                <td className="py-3">
                  {row.status !== 'notApplicable' ? (
                    <button
                      type="button"
                      className="flex size-7 items-center justify-center rounded-[6px] border border-[#ececec] text-[#1236a3] hover:bg-[#f9fafb]"
                      aria-label={t('cab.applications.review.actions.addComment')}
                    >
                      <AppIcon icon={CommentIcon} size={14} />
                    </button>
                  ) : (
                    <span className="text-[#000000]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#000000]">
        <ChecklistStatusPill status="complete" label={t('cab.applications.review.checklist.status.complete')} />
        <ChecklistStatusPill
          status="partiallyComplete"
          label={t('cab.applications.review.checklist.status.partiallyComplete')}
        />
        <ChecklistStatusPill status="incomplete" label={t('cab.applications.review.checklist.status.incomplete')} />
        <ChecklistStatusPill
          status="notApplicable"
          label={t('cab.applications.review.checklist.status.notApplicable')}
        />
      </div>
    </section>
  )
}

function OverallReviewCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()
  const percent = review.overallReviewPercent
  const circumference = 2 * Math.PI * 34
  const offset = circumference * (1 - percent / 100)

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-4 sm:p-5')}>
      <h2 className="mb-4 text-[14px] font-bold text-[#000000]">
        {t('cab.applications.review.overallReview.title')}
      </h2>
      <div className="flex items-center gap-4">
        <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
          <g transform="rotate(-90 42 42)">
            <circle cx="42" cy="42" r="34" fill="none" stroke="#eef1f6" strokeWidth="8" />
            <circle
              cx="42"
              cy="42"
              r="34"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </g>
          <text
            x="42"
            y="42"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fill: '#464646', fontSize: 16, fontWeight: 700 }}
          >
            {percent}%
          </text>
        </svg>
        <p className="min-w-0 text-[12px] leading-snug text-[#000000]">
          <span className="font-bold text-[#1a1a1a]">{review.overallReviewSummary.split('.')[0]}.</span>{' '}
          {review.overallReviewSummary.split('.').slice(1).join('.').trim()}
        </p>
      </div>
      <div className="mt-5">
        <SelectField
          id="review-decision"
          label={t('cab.applications.review.overallReview.decisionLabel')}
          value={review.reviewDecision}
          options={review.reviewDecisionOptions}
        />
      </div>
    </section>
  )
}

function ReviewerCommentsPreviewCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()
  const last = review.reviewComments[review.reviewComments.length - 1]

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-4 sm:p-5')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-bold text-[#000000]">
          {t('cab.applications.review.reviewerComments.title')}
        </h2>
        <button type="button" className="shrink-0 text-[12px] font-semibold text-[#1236a3] hover:underline">
          + {t('cab.applications.review.actions.addInternalComment')}
        </button>
      </div>
      <div className="rounded-[8px] bg-[#fff7e6] p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#d97706]">
          <span aria-hidden>⚠</span>
          {review.overallReviewSummary.split('.')[0]}.
        </p>
        <ul className="list-disc space-y-0.5 ps-4 text-[11px] text-[#000000]">
          {review.reviewerCommentsWarning.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-start gap-2">
        <AvatarInitials initials={initialsOf(last.author)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[12px] font-bold text-[#000000]">{last.author}</p>
            <span className="text-[10px] text-[#000000]">
              {last.date} {last.time}
            </span>
            <span className="ms-auto shrink-0 rounded-full bg-[#f1f2f4] px-2 py-0.5 text-[10px] font-medium text-[#000000]">
              {last.role}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#000000]">{last.text}</p>
        </div>
      </div>
    </section>
  )
}

function DocumentsOverviewCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()
  const total = review.documents.length
  const valid = review.documents.filter((doc) => doc.status === 'valid').length
  const expired = review.documents.filter((doc) => doc.status === 'expired').length
  const pending = review.documents.filter((doc) => doc.status === 'pending').length

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-4 sm:p-5')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-bold text-[#000000]">
          {t('cab.applications.review.documentsOverview.title')}
        </h2>
        <button type="button" className="shrink-0 text-[12px] font-semibold text-[#1236a3] hover:underline">
          {t('cab.applications.review.actions.viewAll')}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {review.documents.map((doc) => (
          <div key={doc.fileName} className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
            <span className="min-w-0 flex-1 truncate text-[#000000]">
              <AppIcon icon={FileTextIcon} size={13} className="me-1 inline text-[#000000]" />
              {doc.name}
            </span>
            <span className="shrink-0 text-[#000000]">{doc.size}</span>
            <DocStatusBadge status={doc.status} label={t(`cab.applications.review.documentsOverview.${doc.status}`)} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#f4f4f4] pt-3 text-[11px] font-semibold">
        <span className="text-[#000000]">
          {t('cab.applications.review.documentsOverview.total')}: {total}
        </span>
        <span className="text-[#22c55e]">
          {t('cab.applications.review.documentsOverview.valid')}: {valid}
        </span>
        <span className="text-[#e74c3c]">
          {t('cab.applications.review.documentsOverview.expired')}: {expired}
        </span>
        <span className="text-[#d97706]">
          {t('cab.applications.review.documentsOverview.pending')}: {pending}
        </span>
      </div>
    </section>
  )
}

function NextStepsCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <h2 className="mb-5 text-[14px] font-bold text-[#000000]">{t('cab.applications.review.nextSteps.title')}</h2>
      <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
        {review.nextSteps.map((step, index) => {
          const active = step.status === 'inProgress'
          return (
            <div key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center">
              {index !== 0 && (
                <span className="absolute end-1/2 top-5 -z-0 hidden h-px w-full bg-[#dbe3ef] sm:block" aria-hidden />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-10 items-center justify-center rounded-full border-2 text-[13px] font-bold',
                  active ? 'border-[#1236a3] bg-[#1236a3] text-white' : 'border-[#e5e7eb] bg-white text-[#000000]'
                )}
              >
                {index + 1}
              </span>
              <p className={cn('mt-2 text-center text-[12px] font-bold', active ? 'text-[#1236a3]' : 'text-[#000000]')}>
                {t(`cab.applications.review.nextSteps.${step.key}`)}
              </p>
              <span className={cn('mt-1 text-[11px] font-medium', active ? 'text-[#1236a3]' : 'text-[#000000]')}>
                {t(`cab.applications.review.workflow.${active ? 'inProgress' : 'pending'}`)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function NotesBanner({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()
  return (
    <section className="flex min-w-0 items-start gap-2.5 rounded-[12px] border border-[#ececec] bg-[#F7F8FD] p-4 sm:p-5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1236a3] text-[11px] font-bold text-white">
        i
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-[#000000]">{t('cab.applications.review.notesTitle')}</p>
        <p className="mt-3 text-[14px] font-bold leading-[1.9] text-[#000000]">{review.notes}</p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Application Details tab                                                    */
/* -------------------------------------------------------------------------- */

function ApplicationDetailsCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()
  const d = review.applicationDetails

  return (
    <section className={cn(cardClassName, 'grid min-w-0 grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.3fr)_1px_minmax(0,1fr)]')}>
      <div>
        <h2 className="mb-4 text-[15px] font-bold text-[#000000]">
          {t('cab.applications.review.applicationDetailsSection.title')}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.applicationType')} value={d.applicationType} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.applicationDate')} value={d.applicationDate} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.primaryStandard')} value={d.primaryStandard} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.requestedCertificationDate')} value={d.requestedCertificationDate} />
          <DetailField
            label={t('cab.applications.review.applicationDetailsSection.fields.additionalStandards')}
            value={
              <div className="flex flex-wrap gap-1.5">
                {d.additionalStandards.map((standard) => (
                  <span key={standard} className="rounded-[4px] bg-[#eef1f6] px-2 py-1 text-[11px] font-semibold text-[#000000]">
                    {standard}
                  </span>
                ))}
              </div>
            }
          />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.numberOfSites')} value={d.numberOfSites} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.applicableScheme')} value={d.applicableScheme} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.auditLanguage')} value={d.auditLanguage} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.certificationBody')} value={d.certificationBody} />
          <DetailField label={t('cab.applications.review.applicationDetailsSection.fields.referenceNo')} value={d.referenceNo} />
        </div>
      </div>

      <div className="hidden bg-[#ececec] lg:block" aria-hidden />

      <div>
        <h2 className="mb-4 text-[15px] font-bold text-[#000000]">
          {t('cab.applications.review.applicationDetailsSection.scopeOfCertification')}
        </h2>
        <p className="text-[13px] leading-[1.7] text-[#000000]">{review.scopeSummary}</p>
        <button
          type="button"
          className="mt-6 inline-flex items-center gap-1.5 rounded-[6px] border border-[#d0d5dd] bg-white px-3.5 py-2 text-[12px] font-medium text-[#1236a3] hover:bg-[#f9fafb]"
        >
          {t('cab.applications.review.actions.editScope')}
          <AppIcon icon={ExternalLinkArrowIcon} size={12} className="text-[#1236a3]" />
        </button>
      </div>
    </section>
  )
}

function DocumentsListCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()
  const valid = review.documents.filter((doc) => doc.status === 'valid').length
  const expired = review.documents.filter((doc) => doc.status === 'expired').length

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-[#000000]">
          {t('cab.applications.review.documentsSection.title')} ({review.documents.length})
        </h2>
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          {t('cab.applications.review.actions.viewAll')}
        </button>
      </div>
      <div className="mb-1 flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase text-[#8a96a8]">
        <span className="w-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">{t('cab.applications.review.documentsSection.columns.name')}</span>
        <span className="min-w-0 flex-1">
          {t('cab.applications.review.documentsSection.columns.fileName')}
        </span>
        <span className="w-16 shrink-0 text-end">
          {t('cab.applications.review.documentsSection.columns.status')}
        </span>
      </div>
      <div className="flex flex-col text-[12px]">
        {review.documents.map((doc, index) => (
          <div
            key={doc.fileName}
            className={cn('flex min-w-0 items-center gap-2 py-2.5', index > 0 && 'border-t border-[#f4f4f4]')}
          >
            <AppIcon
              icon={FileTextIcon}
              size={20}
              className={cn('shrink-0', doc.fileName.endsWith('.pdf') ? 'text-[#e74c3c]' : 'text-[#8a96a8]')}
            />
            <span className="min-w-0 flex-1 break-words font-bold text-[#000000]">{doc.name}</span>
            <span className="min-w-0 flex-1 break-words text-[#8a96a8]">
              {doc.fileName}
            </span>
            <span className="w-16 shrink-0 text-end">
              <DocStatusBadge status={doc.status} label={t(`cab.applications.review.documentsOverview.${doc.status}`)} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-[#f4f4f4] pt-3 text-[12px] font-semibold text-[#000000]">
        {t('cab.applications.review.documentsSection.total')}: {review.documents.length}{' '}
        <span className="ms-3 text-[#22c55e]">
          {t('cab.applications.review.documentsSection.valid')}: {valid}
        </span>{' '}
        <span className="ms-3 text-[#e74c3c]">
          {t('cab.applications.review.documentsSection.expired')}: {expired}
        </span>
      </p>
    </section>
  )
}

function ReviewCommentsCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-[#000000]">{t('cab.applications.review.tabs.reviewComments')}</h2>
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          + {t('cab.applications.review.actions.addComment')}
        </button>
      </div>
      <div className="flex flex-1 flex-col">
        {review.reviewComments.map((comment, index) => (
          <div
            key={`${comment.author}-${index}`}
            className={cn('min-w-0', index > 0 && 'mt-4 border-t border-[#ececec] pt-4')}
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <AvatarInitials initials={initialsOf(comment.author)} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[#000000]">
                    {comment.author} <span className="font-normal text-[#8a96a8]">{comment.role}</span>
                  </p>
                  <p className="text-[10px] text-[#8a96a8]">
                    {comment.date} {comment.time}
                  </p>
                </div>
              </div>
              {comment.tag && <CommentTagBadge tag={comment.tag} label={comment.tag} />}
            </div>
            <p
              className={cn(
                'mt-2 whitespace-pre-line text-[12px] leading-snug text-[#000000]',
                comment.tag === 'minor' && 'rounded-[8px] bg-[#fffbea] p-2.5'
              )}
            >
              {comment.text}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-[#ececec] pt-3 text-center">
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          {t('cab.applications.review.actions.viewAllComments')}
        </button>
      </div>
    </section>
  )
}

function InternalCommentsCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()

  return (
    <section className={cn('rounded-[16px] border border-[#ececec] bg-white', 'flex min-w-0 flex-col p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-[#000000]">{t('cab.applications.review.tabs.internalComments')}</h2>
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          + {t('cab.applications.review.actions.addInternalComment')}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        {review.internalComments.map((comment, index) => (
          <div key={`${comment.author}-${index}`} className="min-w-0">
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <AvatarInitials initials={initialsOf(comment.author)} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[#000000]">
                    {comment.author} <span className="font-normal text-[#8a96a8]">{comment.role}</span>
                  </p>
                  <p className="text-[10px] text-[#8a96a8]">
                    {comment.date} {comment.time}
                  </p>
                </div>
              </div>
              <AppIcon icon={LockIcon} size={13} className="mt-1 shrink-0 text-[#8a96a8]" />
            </div>
            <p className="mt-2 whitespace-pre-line rounded-[8px] bg-[#fffbea] p-2.5 text-[12px] leading-snug text-[#000000]">{comment.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-[#ececec] pt-3 text-center">
        <button type="button" className="text-[12px] font-semibold text-[#1236a3] hover:underline">
          {t('cab.applications.review.actions.viewAllInternalComments')}
        </button>
      </div>
    </section>
  )
}

function HistoryTable({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <h2 className="mb-3 text-[14px] font-bold text-[#000000]">{t('cab.applications.review.historySection.title')}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-start">
          <thead>
            <tr className="border-b border-[#ececec] text-[11px] font-bold text-[#000000]">
              <th className="py-2 text-start">{t('cab.applications.review.historySection.columns.dateTime')}</th>
              <th className="py-2 text-start">{t('cab.applications.review.historySection.columns.by')}</th>
              <th className="py-2 text-start">{t('cab.applications.review.historySection.columns.action')}</th>
              <th className="py-2 text-start">{t('cab.applications.review.historySection.columns.details')}</th>
            </tr>
          </thead>
          <tbody>
            {review.history.map((entry, index) => (
              <tr key={index} className="border-b border-[#f4f4f4] text-[12px] text-[#000000]">
                <td className="whitespace-nowrap py-2.5">
                  {entry.date} {entry.time}
                </td>
                <td className="py-2.5">{entry.by}</td>
                <td className="py-2.5 font-semibold">{entry.action}</td>
                <td className="py-2.5 text-[#000000]">{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="mt-3 text-[12px] font-semibold text-[#1236a3] hover:underline">
        {t('cab.applications.review.actions.viewFullHistory')}
      </button>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Right sidebar                                                              */
/* -------------------------------------------------------------------------- */

function WorkflowProgressCard({ review }: { review: CabApplicationReview }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-3')}>
      <h2 className="mb-1.5 shrink-0 text-[14px] font-bold text-[#000000]">
        {t('cab.applications.receipt.sections.workflowProgress')}
      </h2>
      <div className="flex flex-col justify-start gap-16.5 pt-2">
        {review.workflowSteps.map((step, index) => (
          <WorkflowTimelineItem
            key={step.key}
            index={index + 1}
            label={t(`cab.applications.review.workflowSteps.${step.key}`)}
            description={t(`cab.applications.review.workflowStepDescriptions.${step.key}`)}
            status={step.status}
            isLast={index === review.workflowSteps.length - 1}
          />
        ))}
      </div>
      <button
        type="button"
        className="mt-auto inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#ececec] bg-white text-[11px] font-semibold text-[#1236a3] hover:bg-[#f9fafb]"
      >
        {t('cab.applications.review.actions.viewFullWorkflow')}
        <AppIcon icon={FileTextIcon} size={12} className="text-[#1236a3]" />
      </button>
    </section>
  )
}

function ReviewActionsCard() {
  const { t } = useTranslation()
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col gap-2 p-4')}>
      <h2 className="mb-1 text-[14px] font-bold text-[#000000]">{t('cab.applications.review.reviewActions.title')}</h2>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 text-[12px] font-semibold text-[#1236a3] hover:opacity-90"
      >
        <AppIcon icon={FileTextIcon} size={14} />
        {t('cab.applications.review.reviewActions.requestInformation')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#b7ecc7] bg-[#eafaf1] px-3 text-[12px] font-semibold text-[#16a34a] hover:opacity-90"
      >
        ✓ {t('cab.applications.review.reviewActions.approveCompleteness')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#fde3a7] bg-[#fff7e6] px-3 text-[12px] font-semibold text-[#d97706] hover:opacity-90"
      >
        ! {t('cab.applications.review.reviewActions.holdReview')}
      </button>
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-[#f8c9c9] bg-[#fde8e8] px-3 text-[12px] font-semibold text-[#e74c3c] hover:opacity-90"
      >
        ✕ {t('cab.applications.review.reviewActions.rejectApplication')}
      </button>
      <Button className="mt-1 h-9 w-full gap-1.5 rounded-[8px] text-[12px] font-semibold">
        {t('cab.applications.review.actions.sendForTechnicalFeasibility')}
        <AppIcon icon={ArrowRightIcon} size={14} />
      </Button>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const TABS: TabKey[] = ['checklist', 'details', 'documents', 'reviewComments', 'internalComments', 'history']
const TAB_LABEL_KEYS: Record<TabKey, string> = {
  checklist: 'cab.applications.review.tabs.reviewChecklist',
  details: 'cab.applications.review.tabs.applicationDetails',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  internalComments: 'cab.applications.review.tabs.internalComments',
  history: 'cab.applications.review.tabs.history',
}

export function CabApplicationReviewPage() {
  const { t } = useTranslation()
  const [review, setReview] = useState<CabApplicationReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('checklist')

  useEffect(() => {
    let cancelled = false
    getCabApplicationReview().then((data) => {
      if (!cancelled) {
        setReview(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !review) {
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
          <Link to="/cab/dashboard" className="font-light text-[#000000] hover:text-primary">
            {t('cab.applications.review.breadcrumb.home')}
          </Link>
          <Chevron />
          <span className="font-light text-[#000000]">{t('cab.applications.review.breadcrumb.applications')}</span>
          <Chevron />
          <span className="font-light text-[#000000]">{review.applicationId}</span>
          <Chevron />
          <span className="font-bold text-[#000000]">{t('cab.applications.review.breadcrumb.current')}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ececec] text-[#1236a3]"
            aria-label={t('cab.applications.review.help')}
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
              6
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
          <div className="flex min-w-0 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:p-6" style={{ zoom: 0.78 }}>
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 lg:flex-nowrap">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[22px] font-bold text-[#000000] sm:text-[26px]">
                    {t('cab.applications.review.title')}
                  </h1>
                  <StatusBadge label={t('cab.applications.review.status.inProgress')} variant="inProgress" />
                </div>
                <p className="mt-1.5 text-[13px] text-[#000000]">{t('cab.applications.review.subtitle')}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000]"
                >
                  <AppIcon icon={DownloadIcon} size={16} />
                  {t('cab.applications.review.actions.downloadApplication')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#000000]"
                >
                  {t('cab.applications.review.actions.moreActions')} ▾
                </Button>
                <Button className="h-9 gap-1.5 rounded-[8px] px-3 text-[12px] font-semibold">
                  {t('cab.applications.review.actions.sendForTechnicalFeasibility')}
                  <AppIcon icon={ArrowRightIcon} size={14} />
                </Button>
              </div>
            </div>

            {/* Summary card */}
            <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-[#1236a3]">
                  <AppIcon icon={FileTextIcon} size={28} />
                </span>
                <span className="text-[24px] font-bold leading-none text-[#000000] sm:text-[26px]">
                  {review.applicationId}
                </span>
                <StatusBadge label={t('cab.applications.review.status.inProgress')} variant="inProgress" />
              </div>

              <div className="mt-6 flex min-w-0 flex-wrap items-start justify-between gap-x-8 gap-y-4">
                <SummaryField icon={<ClientIcon />} label={t('cab.applications.review.summary.client')} value={review.client} />
                <SummaryField icon={<BoxIcon />} label={t('cab.applications.review.summary.applicationType')} value={review.applicationType} />
                <SummaryField icon={<GearIcon />} label={t('cab.applications.review.summary.certificationBody')} value={review.certificationBody} />
                <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.review.summary.primaryStandard')} value={review.primaryStandard} />
                <SummaryField
                  icon={<AppIcon icon={CalendarIcon} size={18} />}
                  label={t('cab.applications.review.summary.receivedOn')}
                  value={
                    <>
                      <span className="block">{review.receivedOnDate}</span>
                      <span className="block text-[11px] font-semibold text-[#000000]">{review.receivedOnTime}</span>
                    </>
                  }
                />
                <div className="flex min-w-0 items-center gap-2">
                  <AvatarInitials initials={review.assignedReviewer.initials} />
                  <div>
                    <p className="text-[11px] font-semibold text-[#000000]">{t('cab.applications.review.summary.assignedReviewer')}</p>
                    <p className="text-[13px] font-bold leading-tight text-[#000000]">{review.assignedReviewer.name}</p>
                    <p className="text-[10px] font-medium text-[#000000]">{review.assignedReviewer.role}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1 border-b border-[#ececec]">
              {TABS.map((tab) => {
                const active = activeTab === tab
                const badge = tab === 'documents' ? review.documents.length : undefined
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

            {activeTab === 'checklist' && (
              <>
                <ChecklistTable review={review} />
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                  <OverallReviewCard review={review} />
                  <ReviewerCommentsPreviewCard review={review} />
                  <DocumentsOverviewCard review={review} />
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.99fr)_minmax(0,1fr)]">
                  <NextStepsCard review={review} />
                  <NotesBanner review={review} />
                </div>
              </>
            )}

            {activeTab === 'details' && (
              <>
                <ApplicationDetailsCard review={review} />
                <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
                  <DocumentsListCard review={review} />
                  <ReviewCommentsCard review={review} />
                  <InternalCommentsCard review={review} />
                </div>
                <HistoryTable review={review} />
              </>
            )}

            {activeTab === 'documents' && <DocumentsListCard review={review} />}
            {activeTab === 'reviewComments' && <ReviewCommentsCard review={review} />}
            {activeTab === 'internalComments' && <InternalCommentsCard review={review} />}
            {activeTab === 'history' && <HistoryTable review={review} />}
            </div>

            <aside className="hidden flex-col gap-4 xl:flex">
              <WorkflowProgressCard review={review} />
              {activeTab === 'details' && <ReviewActionsCard />}
            </aside>

            <div className="flex flex-col gap-4 xl:hidden">
              <WorkflowProgressCard review={review} />
              {activeTab === 'details' && <ReviewActionsCard />}
            </div>
          </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#ececec] bg-white px-3 py-3 sm:px-6">
            <p className="text-[12px] text-[#000000]">{t('cab.applications.review.footer.copyright')}</p>
            <div className="flex items-center gap-4 text-[12px]">
              <Link to={ROUTES.privacyPolicy} className="text-[#1236a3] hover:underline">
                {t('cab.applications.review.footer.privacyPolicy')}
              </Link>
              <span className="text-[#000000]">{t('cab.applications.review.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-6 end-6 flex size-12 items-center justify-center rounded-full bg-[#1236a3] text-white shadow-lg"
        aria-label={t('cab.applications.review.chat')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 11.5C21 16.75 16.75 21 11.5 21C9.9 21 8.4 20.6 7.1 19.9L3 21L4.1 16.9C3.4 15.6 3 14.1 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 21 7.25 21 11.5Z"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </CabLayout>
  )
}
