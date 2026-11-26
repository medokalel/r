import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { AppIcon, HistoryIcon } from '@/components/icons'
import { getNonconformities, type NonconformityRecord } from '@/lib/api/cabNonconformitiesApi'
import { neighbours, type NcStage, type NcStageStatus, type NcStoredStatus } from '@/lib/api/nonconformityRegister'
import { ROUTES, cabAuditReportingPath, cabNonconformityPath, cabNonconformityResponsePath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const CARD = 'rounded-[16px] border border-[#ececec] bg-white'
const PIPELINE: NcStoredStatus[] = ['open', 'in_progress', 'submitted', 'closed']

const STAGE_STYLE: Record<NcStageStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  submitted: 'bg-[#fff7ed] text-[#ea580c]',
  accepted: 'bg-[#eafaf1] text-[#16a34a]',
  rejected: 'bg-[#fef2f2] text-[#dc2626]',
}

function Chevron({ toward }: { toward: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400" aria-hidden>
      <path d={toward === 'right' ? 'M9 18L15 12L9 6' : 'M15 18L9 12L15 6'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3 py-1.5">
      <p className="text-[13px] text-neutral-500">{label}</p>
      <div className="min-w-0 break-words text-[13px] font-medium text-neutral-900">{children || '—'}</div>
    </div>
  )
}

export function CabNonconformityDetailPage() {
  const { ncId } = useParams<{ ncId: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [list, setList] = useState<NonconformityRecord[] | null>(null)

  useEffect(() => {
    let active = true
    void getNonconformities().then((data) => active && setList(data))
    return () => {
      active = false
    }
  }, [ncId])

  const item = useMemo(() => list?.find((n) => n.id === ncId || n.ncId.toLowerCase() === (ncId ?? '').toLowerCase()) ?? null, [list, ncId])
  const nav = useMemo(() => (item && list ? neighbours(list, item.id) : { prev: null, next: null, index: -1 }), [item, list])

  const rtl = i18n.language === 'ar'
  const fmt = (iso: string) =>
    iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  const w = (key: string, fallback: string, opts?: Record<string, unknown>) => t(`cab.nonconformities.workflow.${key}`, { defaultValue: fallback, ...opts }) as string
  const statusLabel = (s: string) => t(`cab.nonconformities.status.${s}`) as string

  const header = <CabHeader title={t('cab.nonconformities.title')} notificationCount={3} />

  if (!list) {
    return (
      <CabLayout>
        {header}
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-[15px] text-neutral-500">{t('common.loading')}</p>
        </main>
      </CabLayout>
    )
  }

  if (!item) {
    return (
      <CabLayout>
        {header}
        <main className="flex flex-1 items-center justify-center p-6">
          <ErrorState
            title={w('notFound', 'This nonconformity was not found.')}
            description={w('notFoundHint', 'It may belong to another account or no longer exist.')}
            retryLabel={w('backToRegister', 'Back to Nonconformities')}
            onRetry={() => navigate(ROUTES.cabNonconformities)}
          />
        </main>
      </CabLayout>
    )
  }

  const view = item.view
  const stageIndex = PIPELINE.indexOf(view.status)
  const linked = Boolean(item.planId)

  return (
    <CabLayout>
      {header}
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-4 sm:p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.nonconformities.breadcrumbParent')}
          </Link>
          <Chevron toward={rtl ? 'left' : 'right'} />
          <Link to={ROUTES.cabNonconformities} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.nonconformities.title')}
          </Link>
          <Chevron toward={rtl ? 'left' : 'right'} />
          <span className="font-medium text-neutral-700" dir="ltr">{item.ncId}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold leading-tight text-neutral-900" dir="ltr">{item.ncId}</h1>
              <NonconformityStatusBadge status={item.status} label={statusLabel(item.status)} />
              <span className="rounded-[4px] bg-[#f4f4f5] px-3 py-1 text-[12px] font-medium text-neutral-700">
                {w(`class.${item.classification}`, item.classificationLabel)}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-neutral-500">
              {item.clientName || '—'}
              {item.clause ? ` · ${w('clauseShort', 'Clause')} ${item.clause}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label={w('previous', 'Previous nonconformity')}
              disabled={!nav.prev}
              onClick={() => nav.prev && navigate(cabNonconformityPath(nav.prev))}
              className="flex h-10 items-center gap-1 rounded-[8px] border border-[#e2e2e2] px-3 text-[13px] text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              <Chevron toward={rtl ? 'right' : 'left'} />
              {w('previous', 'Previous')}
            </button>
            <span className="text-[13px] text-neutral-500" dir="ltr">{nav.index + 1} / {list.length}</span>
            <button
              type="button"
              aria-label={w('next', 'Next nonconformity')}
              disabled={!nav.next}
              onClick={() => nav.next && navigate(cabNonconformityPath(nav.next))}
              className="flex h-10 items-center gap-1 rounded-[8px] border border-[#e2e2e2] px-3 text-[13px] text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              {w('next', 'Next')}
              <Chevron toward={rtl ? 'left' : 'right'} />
            </button>
            <Button variant="primary" className="h-10 text-[14px]" onClick={() => navigate(cabNonconformityResponsePath(item.id))}>
              {t('cab.nonconformities.openResponse')}
            </Button>
          </div>
        </div>

        <section className={cn(CARD, 'p-5')} aria-label={w('pipelineTitle', 'Status')}>
          <h2 className="mb-3 text-[16px] font-bold text-neutral-900">{w('pipelineTitle', 'Where it stands')}</h2>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PIPELINE.map((s, i) => (
              <li
                key={s}
                aria-current={i === stageIndex ? 'step' : undefined}
                className={cn(
                  'rounded-[10px] border px-3 py-2 text-[13px] font-medium',
                  i < stageIndex && 'border-[#bfe6cd] bg-[#eafaf1] text-[#16a34a]',
                  i === stageIndex && 'border-primary bg-[#e8edfc] text-primary',
                  i > stageIndex && 'border-[#ececec] bg-[#f9fafc] text-neutral-500',
                )}
              >
                <span className="me-2 inline-flex size-5 items-center justify-center rounded-full bg-white/70 text-[11px]" dir="ltr">{i + 1}</span>
                {statusLabel(s)}
              </li>
            ))}
          </ol>
          {view.overdue && (
            <p className="mt-3 rounded-[8px] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#dc2626]">
              {w('overdueNote', 'The due date {{date}} has passed and the response is not submitted yet.', { date: fmt(item.dueDateRaw) })}
            </p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className={cn(CARD, 'p-5')} aria-label={w('auditTitle', 'Audit')}>
            <h2 className="mb-2 text-[16px] font-bold text-neutral-900">{w('auditTitle', 'Audit')}</h2>
            {linked ? (
              <>
                <Row label={w('auditNumber', 'Audit')}>
                  <Link to={cabAuditReportingPath(item.planNumber || item.planId || '')} className="text-primary hover:underline" dir="ltr">
                    {item.planNumber}
                  </Link>
                </Row>
                <Row label={t('cab.nonconformities.table.client')}>{item.clientName}{item.clientId ? ` (${item.clientId})` : ''}</Row>
                <Row label={w('site', 'Site')}>{item.siteName}</Row>
                <Row label={w('standard', 'Standard')}>{item.standard}</Row>
                <Row label={t('cab.nonconformities.fields.country')}>{item.country}</Row>
                <Row label={t('cab.nonconformities.table.owner')}>{item.ownerName}</Row>
              </>
            ) : (
              <>
                <p className="rounded-[8px] bg-[#f9fafc] px-3 py-2 text-[13px] text-neutral-600">
                  {w('noAudit', 'Not linked to an audit in this system. It was imported from a previous system.')}
                </p>
                <Row label={w('auditNumber', 'Audit')}><span dir="ltr">{item.planNumber}</span></Row>
                <Row label={t('cab.nonconformities.table.client')}>{item.clientName}</Row>
                <Row label={w('standard', 'Standard')}>{item.standard}</Row>
                <Row label={t('cab.nonconformities.table.owner')}>{item.ownerName}</Row>
              </>
            )}
          </section>

          <section className={cn(CARD, 'p-5')} aria-label={w('findingTitle', 'Finding')}>
            <h2 className="mb-2 text-[16px] font-bold text-neutral-900">{w('findingTitle', 'Finding it came from')}</h2>
            <Row label={t('cab.nonconformities.fields.finding')}>
              {item.source === 'finding' && item.planId ? (
                <Link to={`${cabAuditReportingPath(item.planNumber || item.planId)}?tab=findings`} className="text-primary hover:underline" dir="ltr">
                  {item.findingCode || item.findingId}
                </Link>
              ) : (
                <span dir="ltr">{item.findingId}</span>
              )}
            </Row>
            <Row label={w('clause', 'Clause')}><span dir="ltr">{item.clause}</span></Row>
            <Row label={t('cab.nonconformities.table.classification')}>{w(`class.${item.classification}`, item.classificationLabel)}</Row>
            <Row label={t('cab.nonconformities.fields.description')}><span className="font-normal">{item.description}</span></Row>
            <Row label={t('cab.nonconformities.fields.raisedDate')}>{fmt(item.raisedDateRaw)}</Row>
            <Row label={t('cab.nonconformities.table.due')}><span className={cn(view.overdue && 'text-[#dc2626]')}>{fmt(item.dueDateRaw)}</span></Row>
            <Row label={w('source', 'Source')}>{item.source === 'import' ? w('sourceImport', 'Imported') : w('sourceFinding', 'Audit finding')}</Row>
          </section>
        </div>

        <section aria-label={w('stagesTitle', 'Response stages')}>
          <h2 className="mb-3 text-[16px] font-bold text-neutral-900">{w('stagesTitle', 'Response stages')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {view.stages.map((s, i) => (
              <article key={s.stage} className={cn(CARD, 'flex flex-col gap-3 p-4')}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-neutral-900">
                    <span className="me-2 inline-flex size-5 items-center justify-center rounded-full bg-neutral-100 text-[11px] text-neutral-500" dir="ltr">{i + 1}</span>
                    {t(`cab.nonconformities.actionStage.${s.stage as NcStage}`)}
                  </h3>
                  <span className={cn('shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-medium', STAGE_STYLE[s.status])}>
                    {t(`cab.nonconformities.actionStatus.${s.status}`)}
                  </span>
                </div>
                <p className={cn('min-h-[48px] break-words text-[13px]', s.text.trim() ? 'text-neutral-800' : 'text-neutral-400')}>
                  {s.text.trim() || w('stageEmpty', 'No response recorded yet.')}
                </p>
                <p className="text-[12px] text-neutral-500">
                  {s.ownerName || '—'}
                  <span className="mx-2 text-neutral-200">|</span>
                  {t('cab.nonconformities.table.due')}: {fmt(s.dueDate) || '—'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={cn(CARD, 'p-5')} aria-label={t('cab.nonconformities.tabs.history')}>
          <h2 className="mb-3 text-[16px] font-bold text-neutral-900">{t('cab.nonconformities.tabs.history')}</h2>
          <ul className="space-y-4">
            {[...view.events].reverse().map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                  <AppIcon icon={HistoryIcon} size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-neutral-900">
                    {w(`event.${e.code}`, item.history.find((h) => h.id === e.id)?.text ?? e.code, { ref: e.ref })}
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {e.by}
                    <span className="mx-2 text-neutral-200">|</span>
                    {fmtTime(e.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </CabLayout>
  )
}
