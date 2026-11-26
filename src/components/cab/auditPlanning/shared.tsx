import { useTranslation } from 'react-i18next'
import { useRef, useState } from 'react'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'

export function CheckmarkSvg({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function BreadcrumbChevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-400 rtl-flip"
      aria-hidden
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface WizardStepItem<TStep extends number = number> {
  id: TStep
  label: string
  completed: boolean
}

export function IcascoConnectedStepper<TStep extends number>({
  steps,
  activeStep,
  onSelectStep,
  rightSlot,
}: {
  steps: WizardStepItem<TStep>[]
  activeStep: TStep
  onSelectStep: (step: TStep) => void
  rightSlot?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
      {rightSlot && <div className="mb-4 flex items-center justify-end">{rightSlot}</div>}
      <ol className="flex w-full items-start">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          const isCurrent = activeStep === step.id
          const isCompleted = step.completed
          return (
            <li
              key={step.id}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {!isLast && (
                <span
                  className={cn(
                    'absolute top-[18px] start-1/2 h-0.5 w-full transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-[#e0e0e0]',
                  )}
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => onSelectStep(step.id)}
                className="group relative z-10 flex flex-col items-center focus:outline-none"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold transition-all',
                    isCompleted && !isCurrent && 'border-primary bg-primary text-white',
                    isCurrent && 'border-primary bg-white text-primary ring-4 ring-[#e8edfc]',
                    !isCompleted &&
                      !isCurrent &&
                      'border-[#e0e0e0] bg-white text-neutral-400 group-hover:border-primary/50 group-hover:text-primary',
                  )}
                >
                  {isCompleted && !isCurrent ? <CheckmarkSvg size={16} /> : step.id}
                </span>
                <span
                  className={cn(
                    'mt-2.5 whitespace-nowrap text-[13px] transition-colors',
                    isCurrent
                      ? 'font-bold text-primary'
                      : isCompleted
                        ? 'font-semibold text-neutral-900'
                        : 'font-medium text-neutral-500 group-hover:text-neutral-800',
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    'mt-1.5 rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium',
                    isCompleted && !isCurrent && 'bg-[#dcfce7] text-[#15803d]',
                    isCurrent && 'bg-[#e8edfc] text-primary',
                    !isCompleted && !isCurrent && 'bg-[#f1f5f9] text-[#475569]',
                  )}
                >
                  {isCompleted && !isCurrent
                    ? t('cab.auditPlanning.stepper.completed', 'Completed')
                    : isCurrent
                      ? t('cab.auditPlanning.stepper.current', 'Current stage')
                      : t('cab.auditPlanning.stepper.pending', 'Pending')}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function IcascoFileDropzone({
  fileName,
  onSelectFile,
  onClear,
  hint,
  compact = false,
}: {
  fileName?: string
  onSelectFile: (file: File) => void
  onClear?: () => void
  hint?: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const resolvedHint = hint ?? t('execution.dropzone.hintImage')

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onSelectFile(file)
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'cursor-pointer rounded-[10px] border border-dashed bg-white px-4 transition-colors hover:border-primary hover:bg-[#f8faff]',
          compact ? 'py-3.5' : 'py-5',
          dragging ? 'border-primary bg-[#f5f8ff]' : 'border-[#d4d4d4]',
        )}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M4 14v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="text-center sm:text-start">
            <p className="text-[14px] text-neutral-600">
              {t('execution.dropzone.dragDrop')}{' '}
              <span className="font-semibold text-primary underline">{t('execution.dropzone.browse')}</span>
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-400">{resolvedHint}</p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-3 rounded-[10px] bg-[#f9fafc] px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef2ff] text-[10px] font-bold text-[#4f46e5]">
            IMG
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900">
            {fileName}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-[12px] font-semibold text-neutral-400 hover:text-error-600"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function parseIsoDate(iso?: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function IsoDateField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (isoDate: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <DatePicker
      value={parseIsoDate(value)}
      onChange={(date) => onChange(toIsoDateString(date))}
      placeholder={placeholder}
      className={className}
    />
  )
}

/** Date locale for Audit Planning screens; Latin digits are kept in Arabic, matching the rest of the app. */
export function auditDateLocale(language?: string): string {
  return language?.startsWith('ar') ? 'ar-u-nu-latn' : 'en-GB'
}

/** Keeps each Arabic date as its own right-to-left unit so ranges do not reorder inside mixed text. */
export function isolateDate(text: string, locale: string): string {
  return locale.startsWith('ar') ? `\u2067${text}\u2069` : text
}

export function formatIcascoDate(iso?: string, locale = 'en-GB'): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return iso
  return isolateDate(
    date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    locale,
  )
}

export function AuditStatusBadge({ status }: { status: AuditPlan['status'] }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
        status === 'Planned' && 'bg-[#e8edfc] text-primary',
        status === 'Completed' && 'bg-[#ecfdf5] text-[#16a34a]',
        status === 'Under review' && 'bg-[#f3e8ff] text-[#7e22ce]',
        (status === 'Draft' || status === 'In progress') && 'bg-[#fff7ed] text-[#ea580c]',
      )}
    >
      {auditStatusLabel(t, status)}
    </span>
  )
}

const AUDIT_STATUS_KEYS: Record<string, string> = {
  Draft: 'draft',
  'Under review': 'underReview',
  Planned: 'planned',
  'In progress': 'inProgress',
  Completed: 'completed',
}

export function auditStatusLabel(
  t: (key: string, defaultValue: string) => string,
  status: string,
): string {
  const key = AUDIT_STATUS_KEYS[status]
  return key ? t(`cab.auditPlanning.status.${key}`, status) : status
}

const AUDIT_STAGE_KEYS: Record<string, string> = {
  'Stage 1': 'stage1',
  'Stage 2': 'stage2',
  'Surveillance 1': 'surveillance1',
  'Surveillance 2': 'surveillance2',
  Recertification: 'recertification',
  'Special Audit': 'specialAudit',
}

export function auditStageLabel(
  t: (key: string, defaultValue: string) => string,
  stage: string,
): string {
  const key = AUDIT_STAGE_KEYS[stage]
  return key ? t(`cab.auditPlanning.stages.${key}`, stage) : stage
}

interface ExecutionGateFooterProps {
  /** Remaining blockers for the step; empty means the step can be completed. */
  blockers: Array<{ code: string; count?: number }>
  completeLabel: string
  onComplete: () => void
  /** Disables the complete button (e.g. the report step before the opening meeting). */
  completeDisabled?: boolean
}

/**
 * The "To complete this step" footer shared by all six execution steps: lists
 * what is still missing, or confirms the step is ready, next to its complete
 * button. Blocker texts come from the execution.blockers.* locale keys.
 */
export function ExecutionGateFooter({ blockers, completeLabel, onComplete, completeDisabled }: ExecutionGateFooterProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 sm:flex-row sm:items-center">
      <div className="text-[13px]">
        <p className="font-bold text-[#92400e]">{t('execution.blockers.title', 'To complete this step')}</p>
        {blockers.length === 0 ? (
          <p className="mt-1 text-[12px] text-[#b45309]">
            {t('execution.readyToComplete', 'All gates are met. You can complete this step.')}
          </p>
        ) : (
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12px] text-[#b45309]">
            {blockers.map((blocker) => (
              <li key={blocker.code}>
                {t(`execution.blockers.${blocker.code}`, { count: blocker.count ?? 0 })}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={completeDisabled}
        data-testid="complete-step"
        className="h-10 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {completeLabel}
      </button>
    </div>
  )
}
