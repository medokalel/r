import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationPicker } from '@/components/dashboard/cab/ApplicationPicker'
import { markTourPending } from '@/context/TourContext'
import { WorkflowProgressCard as SharedWorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
  AttachIcon,
  CalendarIcon,
  DownloadIcon,
  ExportIcon,
  FileTextIcon,
  NotificationIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormLabel } from '@/components/ui/FormField'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { SelectField } from '@/components/ui/Select'
import { TextField, Textarea } from '@/components/ui/TextField'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ApiError } from '@/lib/api/client'
import {
  approveCabClientResponse,
  createCabInformationRequired,
  getCabApplicationInformationRequired,
  type CabApplicationInformationRequired,
  type ClientResponseRow,
  type CreateInformationRequiredPayload,
  type RequestPriority,
  type RequestStatus,
  type WorkflowStepStatus,
} from '@/lib/api/cabApplicationInformationRequiredApi'
import {
  createInternalComment,
  decodeSectionComment,
  listApplicationComments,
  type ApplicationComment,
} from '@/lib/api/cabApplicationReviewApi'
import {
  ROUTES,
  cabApplicationInformationRequiredPath,
  cabApplicationTechnicalFeasibilityPath,
} from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { StartTourButton } from '@/components/dashboard/cab/StartTourButton'
import { useApplicationInformationRequiredTourSteps } from '@/config/applicationInformationRequiredTourSteps'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

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

const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-[#fff7e6] text-[#d97706]',
  submitted: 'bg-[#e8edfc] text-[#1236a3]',
  accepted: 'bg-[#eafaf1] text-[#16a34a]',
  rejected: 'bg-[#fde8e8] text-[#e74c3c]',
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10px] font-bold',
        REQUEST_STATUS_STYLES[status]
      )}
    >
      {t(`cab.applications.informationRequired.status.${status}`)}
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

function NewRequestForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: CreateInformationRequiredPayload) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [item, setItem] = useState('')
  const [reference, setReference] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!item.trim()) {
      setError(t('cab.applications.informationRequired.form.itemRequired'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        informationItem: item.trim(),
        referenceClause: reference.trim() || undefined,
        dueDate: dueDate || undefined,
        priority: priority || undefined,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cab.applications.informationRequired.form.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 border-b border-[#ececec] px-4 py-4 sm:px-5"
    >
      <div className="flex flex-col gap-2">
        <FormLabel htmlFor="information-required-item" required>
          {t('cab.applications.informationRequired.requests.columns.description')}
        </FormLabel>
        <Textarea
          id="information-required-item"
          rows={3}
          value={item}
          onChange={(event) => {
            setItem(event.target.value)
            setError(null)
          }}
          placeholder={t('cab.applications.informationRequired.form.itemPlaceholder')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          id="information-required-reference"
          label={t('cab.applications.informationRequired.requests.columns.reference')}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder={t('cab.applications.informationRequired.form.referencePlaceholder')}
        />
        <TextField
          id="information-required-due-date"
          type="date"
          label={t('cab.applications.informationRequired.requests.columns.dueDate')}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <SelectField
          id="information-required-priority"
          label={t('cab.applications.informationRequired.requests.columns.priority')}
          value={priority}
          onChange={setPriority}
          placeholder={t('cab.applications.informationRequired.form.priorityPlaceholder')}
          options={(['HIGH', 'MEDIUM', 'LOW'] as const).map((value) => ({
            value,
            label: t(`cab.applications.informationRequired.priority.${value.toLowerCase()}`),
          }))}
        />
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-error-500">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? t('common.saving') : t('cab.applications.informationRequired.form.submit')}
        </Button>
      </div>
    </form>
  )
}

function RequestedInformationTable({
  data,
  onCreate,
}: {
  data: CabApplicationInformationRequired
  onCreate: (payload: CreateInformationRequiredPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)

  const priorityLabel = (priority: RequestPriority) =>
    t(`cab.applications.informationRequired.priority.${priority}`)

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-bold text-[#000000]">
          {t('cab.applications.informationRequired.requests.title', { count: data.requests.length })}
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-[12px] font-semibold text-[#1236a3] hover:underline"
          >
            + {t('cab.applications.informationRequired.actions.addRequest')}
          </button>
        )}
      </div>
      {adding && (
        <NewRequestForm
          onSubmit={async (payload) => {
            await onCreate(payload)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      )}
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
            {data.requests.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] font-semibold text-[#989898]">
                  {t('cab.applications.informationRequired.requests.empty')}
                </td>
              </tr>
            )}
            {data.requests.map((item, index) => (
              <tr key={item.id} className="border-b border-[#ececec] text-[12px] text-[#000000] last:border-b-0">
                <td className="px-4 py-3.5 font-semibold">{index + 1}</td>
                <td className="max-w-[240px] px-4 py-3.5 font-medium leading-snug">{item.description}</td>
                <td className="px-4 py-3.5">
                  <span className="block text-[12px] font-semibold text-[#000000]">{item.reference || '—'}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <AvatarInitials initials={item.requestedBy.initials} />
                    <span className="block text-[12px] font-bold text-[#000000]">{item.requestedBy.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="block font-semibold">{item.requestedOnDate}</span>
                  <span className="block text-[11px] font-semibold text-[#000000]">{item.requestedOnTime}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-semibold">{item.dueDate}</td>
                <td className="px-4 py-3.5 text-center">
                  {item.priority ? (
                    <PriorityBadge priority={item.priority} label={priorityLabel(item.priority)} />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <RequestStatusBadge status={item.status} />
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

function ResponsesSection({
  data,
  awaiting,
  approvingId,
  approveError,
  onApprove,
}: {
  data: CabApplicationInformationRequired
  awaiting: boolean
  approvingId: string | null
  approveError: string | null
  onApprove: (row: ClientResponseRow, approved: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-[#ececec] px-4 py-3 sm:px-5">
        <h2 className="text-[15px] font-bold text-[#000000]">
          {t('cab.applications.informationRequired.responses.title')}
        </h2>
      </div>
      {awaiting && (
        <div className="px-4 pt-4 sm:px-5">
          <div className="flex items-center gap-2 rounded-[8px] border border-[#b6d0ff] bg-[#e8edfc] px-3 py-2.5">
            <ResponsesInfoIcon />
            <p className="text-[12px] font-medium leading-snug text-[#1236a3]">
              {t('cab.applications.informationRequired.responses.awaiting')}
            </p>
          </div>
        </div>
      )}
      {approveError && (
        <p role="alert" className="px-4 pt-3 text-[13px] text-error-500 sm:px-5">
          {approveError}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="mt-4 w-full min-w-[860px] border-collapse text-start [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-white/20">
          <thead>
            <tr className="bg-[#1236a3] text-[11px] font-bold uppercase tracking-wide text-white">
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.number')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.informationItem')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.responseAttachment')}</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.submittedOn')}</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.submittedBy')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.status')}</th>
              <th className="px-4 py-3.5 text-start">{t('cab.applications.informationRequired.responses.columns.approve')}</th>
            </tr>
          </thead>
          <tbody>
            {data.responses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10">
                  <div className="flex flex-col items-center justify-center">
                    <EmptyFolderIcon />
                    <p className="mt-3 text-[13px] font-semibold text-[#989898]">
                      {t('cab.applications.informationRequired.responses.empty')}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {data.responses.map((row, index) => (
              <tr key={row.id} className="border-b border-[#ececec] text-[12px] text-[#000000] last:border-b-0">
                <td className="px-4 py-3.5 font-semibold">{index + 1}</td>
                <td className="max-w-[240px] px-4 py-3.5 font-medium leading-snug">{row.item}</td>
                <td className="max-w-[280px] px-4 py-3.5">
                  {row.text && <p className="whitespace-pre-wrap break-words font-medium leading-snug">{row.text}</p>}
                  {row.attachments.map((file, fileIndex) => (
                    <span key={`${file.url}-${fileIndex}`} className="mt-1 flex items-center gap-1.5 first:mt-0">
                      <AppIcon icon={AttachIcon} size={14} className="shrink-0 text-[#1236a3]" />
                      {/^https?:\/\//i.test(file.url) ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-semibold text-[#1236a3] hover:underline"
                        >
                          {file.name}
                        </a>
                      ) : (
                        <span className="break-all font-semibold">{file.name}</span>
                      )}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3.5">
                  <span className="block font-semibold">{row.submittedOnDate}</span>
                  <span className="block text-[11px] font-semibold text-[#000000]">{row.submittedOnTime}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-semibold">{row.submittedBy}</td>
                <td className="px-4 py-3.5">
                  <RequestStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="min-w-[110px]">
                    <SelectField
                      value={row.approved === true ? 'yes' : 'no'}
                      onChange={(value) => {
                        if (value === 'yes') onApprove(row, true)
                        if (value === 'no') onApprove(row, false)
                      }}
                      disabled={!row.sectionKey || approvingId === row.id}
                      placeholder={t('cab.applications.informationRequired.responses.approvePlaceholder')}
                      options={[
                        { value: 'yes', label: t('common.yes') },
                        { value: 'no', label: t('common.no') },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function commentInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || '—'
  )
}

function isGeneralInternalComment(comment: ApplicationComment) {
  return comment.isInternal && !comment.sectionKey
}

function InternalCommentsSection({
  comments,
  loading,
  adding,
  onAddingChange,
  onSubmit,
}: {
  comments: ApplicationComment[]
  loading: boolean
  adding: boolean
  onAddingChange: (open: boolean) => void
  onSubmit: (text: string) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) {
      setError(t('cab.applications.informationRequired.internalComments.required'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(text.trim())
      setText('')
      onAddingChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cab.applications.informationRequired.internalComments.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-5')}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[#1236a3]">
          {t('cab.applications.informationRequired.internalComments.title')}
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => onAddingChange(true)}
            className="text-[12px] font-semibold text-[#1236a3] hover:underline"
          >
            + {t('cab.applications.informationRequired.actions.addInternalComment')}
          </button>
        )}
      </div>
      {adding && (
        <form onSubmit={handleSubmit} noValidate className="mb-4 flex flex-col gap-3">
          <Textarea
            id="internal-comment"
            rows={3}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
            }}
            placeholder={t('cab.applications.informationRequired.internalComments.placeholder')}
          />
          {error && (
            <p role="alert" className="text-[13px] text-error-500">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onAddingChange(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      )}
      {loading ? (
        <p className="text-[13px] font-semibold text-[#989898]">{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="text-[13px] font-semibold text-[#989898]">
          {t('cab.applications.informationRequired.internalComments.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            const name = comment.createdBy.fullName || '—'
            const body = decodeSectionComment(comment.content).text
            return (
              <div key={comment.id}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <AvatarInitials initials={commentInitials(name)} />
                  <span className="text-[12px] font-bold text-[#000000]">{name}</span>
                  <span className="text-[10px] font-medium text-[#989898]">
                    {new Date(comment.createdAt).toLocaleString(i18n.language)}
                  </span>
                </div>
                <div className="mt-2 rounded-[8px] border border-[#ececec] bg-[#fafafa] px-3 py-2.5">
                  <p className="whitespace-pre-line text-[12px] leading-relaxed text-[#000000]">{body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
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

function InformationRequiredView({ applicationId }: { applicationId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scale = useFitScale()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId') ?? undefined
  const [data, setData] = useState<CabApplicationInformationRequired | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [internalComments, setInternalComments] = useState<ApplicationComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [addingComment, setAddingComment] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)

  const tourSteps = useApplicationInformationRequiredTourSteps()

  const load = useCallback(
    () => getCabApplicationInformationRequired(applicationId, clientId),
    [applicationId, clientId]
  )

  const loadComments = useCallback(async () => {
    try {
      const list = await listApplicationComments(applicationId)
      setInternalComments(list.filter(isGeneralInternalComment))
    } catch {
      setInternalComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    let cancelled = false
    load()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setHasError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    loadComments()
    return () => {
      cancelled = true
    }
  }, [load, loadComments, reloadKey])

  const retry = () => {
    setHasError(false)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const createRequest = async (payload: CreateInformationRequiredPayload) => {
    await createCabInformationRequired(applicationId, payload)
    load().then(setData, () => setHasError(true))
  }

  const saveInternalComment = async (text: string) => {
    await createInternalComment(applicationId, text)
    await loadComments()
  }

  const approveResponse = async (row: ClientResponseRow, approved: boolean) => {
    if (!row.sectionKey || !data) return
    setApprovingId(row.id)
    setApproveError(null)
    try {
      await approveCabClientResponse(applicationId, row.sectionKey, approved, data.applicationStatus)
      setData(await load())
    } catch (err) {
      setApproveError(err instanceof ApiError ? err.message : t('cab.applications.review.flow.saveError'))
    } finally {
      setApprovingId(null)
    }
  }

  if (loading) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6 text-[14px] text-neutral-500">
          {t('common.loading')}
        </div>
      </CabLayout>
    )
  }

  if (hasError || !data) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6">
          <ErrorState onRetry={retry} />
        </div>
      </CabLayout>
    )
  }

  const awaiting = data.requests.some((request) => request.status === 'pending')

  return (
    <CabLayout
      className="bg-white"
      tourId="cab-application-information-required"
      tourSteps={tourSteps}
      onTourComplete={() => {
        markTourPending('cab-application-technical-feasibility')
        navigate(cabApplicationTechnicalFeasibilityPath(applicationId, clientId))
      }}
    >
        <DashboardTourStep steps={tourSteps} stepId="header">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ececec] bg-white px-3 py-3 sm:gap-4 sm:px-5">
            <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] sm:text-[13px]" aria-label="breadcrumb">
              <Link to={ROUTES.workspace} className="font-light text-[#000000] hover:text-primary">
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
              <StartTourButton />
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
        </DashboardTourStep>

      <div className="flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
          <div className="flex min-w-0 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:p-6">
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5" style={{ zoom: scale }}>
                <DashboardTourStep steps={tourSteps} stepId="page-header">
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
                </DashboardTourStep>

                <DashboardTourStep steps={tourSteps} stepId="summary-card">
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
                        </div>
                      </div>
                    </div>
                  </section>
                </DashboardTourStep>

                {awaiting && (
                  <div className="flex items-start gap-3 rounded-[12px] border border-[#fde3a7] bg-[#fff7e6] px-4 py-3">
                    <InfoAlertIcon />
                    <div>
                      <p className="text-[13px] font-bold text-[#000000]">
                        {t('cab.applications.informationRequired.alert.title')}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#000000]">
                        {t('cab.applications.informationRequired.alert.description')}
                        {data.earliestDueDate &&
                          ` ${t('cab.applications.informationRequired.alert.dueDate', { date: data.earliestDueDate })}`}
                      </p>
                    </div>
                  </div>
                )}
                <DashboardTourStep steps={tourSteps} stepId="requests-table">
                  <RequestedInformationTable data={data} onCreate={createRequest} />
                </DashboardTourStep>
                <DashboardTourStep steps={tourSteps} stepId="client-responses">
                  <ResponsesSection
                    data={data}
                    awaiting={awaiting}
                    approvingId={approvingId}
                    approveError={approveError}
                    onApprove={approveResponse}
                  />
                </DashboardTourStep>
                <DashboardTourStep steps={tourSteps} stepId="internal-comments">
                  <InternalCommentsSection
                    comments={internalComments}
                    loading={commentsLoading}
                    adding={addingComment}
                    onAddingChange={setAddingComment}
                    onSubmit={saveInternalComment}
                  />
                </DashboardTourStep>
              </div>

              <DashboardTourStep steps={tourSteps} stepId="workflow-progress" className="w-full shrink-0 xl:w-[340px]">
                <div className="flex flex-col gap-4">
                  <WorkflowProgressSidebar data={data} />
                </div>
              </DashboardTourStep>
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

export function CabApplicationInformationRequiredPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { applicationId } = useParams()

  if (applicationId) {
    return <InformationRequiredView key={applicationId} applicationId={applicationId} />
  }

  return (
    <CabLayout className="bg-white">
      <CabHeader title={t('cab.applications.informationRequired.title')} notificationCount={2} />
      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <ApplicationPicker
          title={t('cab.applications.informationRequired.selectApplication')}
          hint={t('cab.applications.informationRequired.selectApplicationHint')}
          actionLabel={t('cab.applications.informationRequired.openSelected')}
          allowedStatuses={['SUBMITTED', 'UNDER_REVIEW']}
          onSelect={(application) =>
            navigate(cabApplicationInformationRequiredPath(application.id, application.clientId || undefined))
          }
        />
      </div>
    </CabLayout>
  )
}
