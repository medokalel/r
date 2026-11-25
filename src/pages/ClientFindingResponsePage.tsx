import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { EvidenceUploadField } from '@/components/dashboard/cab/EvidenceUploadField'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/TextField'
import { DatePicker } from '@/components/ui/DatePicker'
import { FormLabel } from '@/components/ui/FormField'
import { ErrorState } from '@/components/ui/ErrorState'
import { AppIcon, ArrowRightIcon, ExternalLinkIcon, HistoryIcon, LinkIcon, MoreIcon } from '@/components/icons'
import {
  EFFECTIVENESS_RESULTS,
  EVIDENCE_ACCEPT,
  EVIDENCE_MAX_BYTES,
  RESPONSE_TABS,
  RESPONSE_TEXT_LIMIT,
  type EvidenceFile,
  type ResponseTab,
} from '@/lib/api/cabNonconformityResponseApi'
import type { NonconformityItem } from '@/lib/api/cabNonconformitiesApi'
import { getClientFinding } from '@/lib/api/clientFindingsApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-400 rtl-flip"
      aria-hidden
    >
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[13px] text-neutral-500">{label}</span>
      <span className="text-end text-[13px] font-medium text-neutral-900">{value || '—'}</span>
    </div>
  )
}

/** Textarea + live counter, shared by the three narrative fields and the reviewer comment. */
function CountedTextarea({
  id,
  label,
  required,
  value,
  placeholder,
  disabled,
  error,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  placeholder?: string
  disabled?: boolean
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={RESPONSE_TEXT_LIMIT}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className={cn('min-h-[92px] pb-8', error && 'border-error-500 focus:border-error-500 focus:ring-error-500')}
        />
        <span className="pointer-events-none absolute bottom-2.5 end-3 text-[12px] text-neutral-400" dir="ltr">
          {value.length}/{RESPONSE_TEXT_LIMIT}
        </span>
      </div>
      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}

/** Days since the finding was raised, or empty when the date cannot be read. */
function daysOpenOf(item: NonconformityItem): string {
  const raised = Date.parse(item.raisedDateRaw)
  if (Number.isNaN(raised)) return ''
  return String(Math.max(0, Math.floor((Date.now() - raised) / 86_400_000)))
}

/**
 * Audit Client view of one finding. Same layout as the CAB response page
 * (header, tabs, response form, more details, status rail), minus the reviewer
 * actions. Every control is disabled until the response backend exists.
 */
export function ClientFindingResponsePage() {
  const { ncId } = useParams<{ ncId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [item, setItem] = useState<NonconformityItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ResponseTab>('corrective_action')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!ncId) return
    let cancelled = false
    getClientFinding(ncId)
      .then((result) => {
        if (!cancelled) setItem(result)
      })
      .catch(() => {
        if (!cancelled) setItem(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ncId])

  const evidence = useMemo<EvidenceFile[]>(
    () =>
      (item?.attachments ?? []).map((file) => ({
        id: file.id,
        name: file.name,
        version: 1,
        uploadedAt: file.uploadedAt,
        sizeLabel: file.sizeLabel,
        url: null,
      })),
    [item],
  )

  const statusLabel = (value: string) => t(`cab.nonconformities.status.${value}`)
  const noop = () => undefined

  if (loading || !item) {
    return (
      <AppLayout>
        <AccreditationHeader titleKey="clientFindings.pageTitle" />
        <div className="flex flex-1 items-center justify-center p-6">
          {loading ? (
            <p className="text-[15px] text-neutral-500">{t('common.loading')}</p>
          ) : (
            <ErrorState
              title={t('clientFindings.detail.notFound')}
              description={t('clientFindings.detail.notFoundHint')}
              retryLabel={t('clientFindings.detail.backToFindings')}
              onRetry={() => navigate(ROUTES.findings)}
            />
          )}
        </div>
      </AppLayout>
    )
  }

  const status = item.status
  const daysOpen = daysOpenOf(item)
  const related = [
    { id: 'rel-1', label: t('cab.nonconformityResponse.related.rel-1', { defaultValue: 'Audit finding' }), reference: item.findingId },
    { id: 'rel-2', label: t('cab.nonconformityResponse.related.rel-2', { defaultValue: 'Audit report' }), reference: item.auditId },
  ]

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientFindings.pageTitle" />

      <main className="flex flex-1 overflow-auto">
        <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-5 p-4 pb-28 sm:p-6 sm:pb-28 md:pb-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
              <Link to={ROUTES.findings} className="font-light text-neutral-500 hover:text-primary">
                {t('clientFindings.pageTitle')}
              </Link>
              <Chevron />
              <Link to={ROUTES.findings} className="font-light text-neutral-500 hover:text-primary">
                {item.ncId}
              </Link>
              <Chevron />
              <span className="font-medium text-neutral-700">{t('cab.nonconformityResponse.title')}</span>
            </nav>

            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[28px] font-bold leading-tight text-neutral-900" dir="ltr">
                    {item.ncId}
                  </h1>
                  <NonconformityStatusBadge status={status} label={statusLabel(status)} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-neutral-600">
                  <span className="font-medium text-neutral-900">{item.clientName}</span>
                  <span className="text-neutral-200">|</span>
                  <span>
                    {t('cab.nonconformities.table.client')}: <span dir="ltr">{item.clientId}</span>
                  </span>
                  <span className="text-neutral-200">|</span>
                  <span>{item.country}</span>
                  <span className="text-neutral-200">|</span>
                  <span dir="ltr">
                    {t('cab.nonconformityResponse.fields.application')}: {'\u2014'}
                  </span>
                </div>
              </div>

              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  icon={<AppIcon icon={ExternalLinkIcon} size={18} />}
                  iconPosition="end"
                  onClick={() => navigate(ROUTES.portalApplications)}
                  className="h-11 flex-1 text-[14px] sm:flex-none"
                >
                  {t('cab.nonconformityResponse.viewApplication')}
                </Button>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
                    aria-expanded={menuOpen}
                    aria-label={t('cab.nonconformityResponse.moreActions')}
                    className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-blue-500 bg-white text-blue-500 transition-colors hover:bg-blue-50"
                  >
                    <AppIcon icon={MoreIcon} size={20} />
                  </button>
                  {menuOpen && (
                    <div className="absolute end-0 top-[calc(100%+4px)] z-10 min-w-[200px] overflow-hidden rounded-[10px] border border-[#ececec] bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setMenuOpen(false)
                          setTab('activity')
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] text-neutral-700 transition-colors hover:bg-[#f9fafc]"
                      >
                        <AppIcon icon={HistoryIcon} size={16} className="text-neutral-400" />
                        {t('cab.nonconformityResponse.tabs.activity')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="flex gap-1.5 overflow-x-auto border-b border-[#ececec]"
              role="tablist"
              aria-label={t('cab.nonconformityResponse.tabsLabel')}
            >
              {RESPONSE_TABS.map((tabId) => (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={tab === tabId}
                  onClick={() => setTab(tabId)}
                  className={cn(
                    'whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors',
                    tab === tabId
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900',
                  )}
                >
                  {t(`cab.nonconformityResponse.tabs.${tabId}`)}
                </button>
              ))}
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
              {tab === 'corrective_action' && (
                <>
                  <section className={cn(cardClassName, 'min-w-0 space-y-5 p-5')}>
                    <div className="flex flex-col gap-3 rounded-[10px] bg-[#f9fafc] p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-neutral-900">
                          {t('cab.nonconformityResponse.fields.originalFinding')}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">{item.description}</p>
                      </div>
                      <div className="shrink-0 border-[#ececec] sm:border-s sm:ps-4">
                        <p className="text-[12px] text-neutral-500">{t('cab.nonconformities.fields.raisedDate')}</p>
                        <p className="mt-0.5 text-[14px] font-medium text-neutral-900">{item.raisedDate}</p>
                      </div>
                    </div>

                    <CountedTextarea
                      id="nc-correction"
                      label={t('cab.nonconformityResponse.fields.correction')}
                      required
                      value=""
                      disabled
                      placeholder={t('cab.nonconformityResponse.placeholders.correction')}
                      onChange={noop}
                    />
                    <CountedTextarea
                      id="nc-root-cause"
                      label={t('cab.nonconformityResponse.fields.rootCause')}
                      required
                      value=""
                      disabled
                      placeholder={t('cab.nonconformityResponse.placeholders.rootCause')}
                      onChange={noop}
                    />
                    <CountedTextarea
                      id="nc-corrective-action"
                      label={t('cab.nonconformityResponse.fields.correctiveAction')}
                      required
                      value=""
                      disabled
                      placeholder={t('cab.nonconformityResponse.placeholders.correctiveAction')}
                      onChange={noop}
                    />

                    <EvidenceUploadField
                      label={t('cab.nonconformityResponse.fields.evidence')}
                      files={evidence}
                      accept={EVIDENCE_ACCEPT}
                      maxSizeBytes={EVIDENCE_MAX_BYTES}
                      hint={t('cab.nonconformityResponse.evidence.hint')}
                      disabled
                      onSelectFiles={noop}
                      onDeleteFile={noop}
                    />
                  </section>

                  <section className={cn(cardClassName, 'min-w-0 self-start p-5')}>
                    <button
                      type="button"
                      onClick={() => setDetailsOpen((open) => !open)}
                      aria-expanded={detailsOpen}
                      className="flex w-full items-center gap-2 text-start"
                    >
                      <AppIcon
                        icon={ArrowRightIcon}
                        size={18}
                        className={cn(
                          'shrink-0 text-neutral-500 transition-transform rtl-flip',
                          detailsOpen ? '-rotate-90' : 'rotate-90',
                        )}
                      />
                      <span className="text-[18px] font-medium text-neutral-900">
                        {t('cab.nonconformityResponse.moreDetails')}
                      </span>
                    </button>

                    {detailsOpen && (
                      <div className="mt-5 space-y-5">
                        <SelectField
                          id="nc-responsible"
                          label={t('cab.nonconformityResponse.fields.responsiblePerson')}
                          required
                          value=""
                          disabled
                          options={[]}
                          placeholder={t('cab.nonconformityResponse.placeholders.responsiblePerson')}
                          onChange={noop}
                        />

                        <div className="space-y-2">
                          <FormLabel required>{t('cab.nonconformityResponse.fields.targetDate')}</FormLabel>
                          <DatePicker
                            value={undefined}
                            disabled
                            onChange={noop}
                            placeholder={t('cab.nonconformityResponse.placeholders.date')}
                          />
                        </div>

                        <div className="space-y-2">
                          <FormLabel>{t('cab.nonconformities.table.status')}</FormLabel>
                          <div>
                            <NonconformityStatusBadge status={status} label={statusLabel(status)} />
                          </div>
                        </div>

                        <div className="space-y-5 border-t border-[#ececec] pt-5">
                          <p className="text-[18px] font-medium text-neutral-900">
                            {t('cab.nonconformityResponse.effectivenessReview')}
                          </p>
                          <div className="space-y-2">
                            <FormLabel>{t('cab.nonconformityResponse.fields.effectivenessReviewDate')}</FormLabel>
                            <DatePicker
                              value={undefined}
                              disabled
                              onChange={noop}
                              placeholder={t('cab.nonconformityResponse.placeholders.date')}
                            />
                          </div>
                          <SelectField
                            id="nc-effectiveness"
                            label={t('cab.nonconformityResponse.fields.effectivenessResult')}
                            value="not_reviewed"
                            disabled
                            options={EFFECTIVENESS_RESULTS.map((result) => ({
                              value: result,
                              label: t(`cab.nonconformityResponse.effectiveness.${result}`),
                            }))}
                            onChange={noop}
                          />
                          <CountedTextarea
                            id="nc-comments"
                            label={t('cab.nonconformityResponse.fields.comments')}
                            value=""
                            disabled
                            placeholder={t('cab.nonconformityResponse.placeholders.comments')}
                            onChange={noop}
                          />
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              {tab === 'activity' && (
                <section className={cn(cardClassName, 'min-w-0 p-5 lg:col-span-2')}>
                  {item.history.length === 0 ? (
                    <p className="py-8 text-center text-[14px] text-neutral-400">
                      {t('cab.nonconformityResponse.noActivity')}
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {item.history.map((entry) => (
                        <li key={entry.id} className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                            <AppIcon icon={HistoryIcon} size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-neutral-900">{entry.text}</p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">
                              {entry.by}
                              <span className="mx-2 text-neutral-200">|</span>
                              {entry.at}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === 'related' && (
                <section className={cn(cardClassName, 'min-w-0 p-5 lg:col-span-2')}>
                  <ul className="space-y-2">
                    {related.map((record) => (
                      <li
                        key={record.id}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-[#ececec] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] text-neutral-500">{record.label}</p>
                          <p className="mt-0.5 text-[14px] font-medium text-primary" dir="ltr">
                            {record.reference}
                          </p>
                        </div>
                        <AppIcon icon={LinkIcon} size={18} className="shrink-0 text-neutral-400" />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {tab === 'attachments' && (
                <section className={cn(cardClassName, 'min-w-0 p-5 lg:col-span-2')}>
                  <EvidenceUploadField
                    label={t('cab.nonconformityResponse.fields.evidence')}
                    files={evidence}
                    accept={EVIDENCE_ACCEPT}
                    maxSizeBytes={EVIDENCE_MAX_BYTES}
                    hint={t('cab.nonconformityResponse.evidence.hint')}
                    disabled
                    onSelectFiles={noop}
                    onDeleteFile={noop}
                  />
                </section>
              )}
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-0">
            <section className={cn(cardClassName, 'p-5')}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-medium text-neutral-900">
                  {t('cab.nonconformityResponse.statusCard')}
                </h2>
                <NonconformityStatusBadge status={status} label={statusLabel(status)} />
              </div>
              <div className="mt-4">
                <p className="text-[16px] font-bold text-neutral-900" dir="ltr">
                  {item.ncId}
                </p>
                <p className="mt-0.5 text-[14px] font-medium text-neutral-900">{item.clientName}</p>
                <p className="mt-2 text-[13px] text-neutral-500">
                  {t('cab.nonconformities.table.client')}: <span dir="ltr">{item.clientId}</span>
                </p>
                <p className="text-[13px] text-neutral-500">
                  {t('cab.nonconformityResponse.fields.application')}: <span dir="ltr">{'\u2014'}</span>
                </p>
                <p className="text-[13px] text-neutral-500">{item.country}</p>
              </div>
              <div className="mt-4 border-t border-[#ececec] pt-3">
                <RailRow label={t('cab.nonconformities.fields.raisedDate')} value={item.raisedDate} />
                <RailRow label={t('cab.nonconformityResponse.fields.targetClosureDate')} value={item.dueDate} />
                <RailRow label={t('cab.nonconformityResponse.fields.daysOpen')} value={daysOpen} />
              </div>
            </section>

            <section className={cn(cardClassName, 'p-5')}>
              <h2 className="text-[16px] font-medium text-neutral-900">{t('cab.nonconformityResponse.yourResponse')}</h2>
              <div className="mt-3">
                <RailRow label={t('cab.nonconformityResponse.lastSaved')} value={t('cab.nonconformityResponse.neverSaved')} />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  variant="primary"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 4h10.2L20 8.8V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 1-2Z M8 4v5h7 M8 20v-5h8v5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  disabled
                  className="h-11 w-full text-[14px]"
                >
                  {t('cab.nonconformityResponse.saveDraft')}
                </Button>
                <Button
                  variant="outline"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  disabled
                  className="h-11 w-full text-[14px]"
                >
                  {t('cab.nonconformityResponse.submitResponse')}
                </Button>
                <p role="status" className="text-[12px] text-neutral-600">
                  {t('clientFindings.detail.responseUnavailable')}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </AppLayout>
  )
}
