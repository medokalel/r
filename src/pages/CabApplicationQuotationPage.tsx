import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationSummaryCard } from '@/components/dashboard/cab/ApplicationSummaryCard'
import { ApplicationPicker } from '@/components/dashboard/cab/ApplicationPicker'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { QuotationStatusBadge, QuotationView } from '@/components/dashboard/cab/QuotationView'
import { AppIcon, DownloadIcon } from '@/components/icons'
import { buildCabWorkflowSteps } from '@/lib/workflowSteps'
import { downloadExcelCsv } from '@/lib/tableTools'
import { Button } from '@/components/ui/Button'
import { FormField, FormLabel, MultiSelect, SelectField, TextField, Textarea } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { getStoredPersonnel } from '@/lib/api/cabCompetenceApi'
import {
  getCabApplicationQuotation,
  listQuotationApplications,
  type CabApplicationQuotation,
} from '@/lib/api/cabApplicationQuotationApi'
import { createQuotation, upsertPricingConfig, type Quotation } from '@/lib/api/cabQuotationApi'
import { ApiError } from '@/lib/api/client'
import { ROUTES, cabApplicationQuotationPath, cabApplicationReviewPath } from '@/lib/routes'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6'
const asDate = (iso: string) => (iso ? new Date(`${iso}T00:00:00`) : undefined)

const COMPLEXITY_OPTIONS: Record<string, string[]> = {
  ISO_14001: ['HIGH', 'MEDIUM', 'LOW', 'LIMITED'],
  ISO_45001: ['HIGH', 'MEDIUM', 'LOW'],
}
const FOOD_CATEGORIES = ['AI', 'AII', 'BI', 'BII', 'BIII', 'CO', 'CI', 'CII', 'CIII', 'CIV', 'D', 'E', 'FI', 'FII', 'G', 'H', 'I', 'J', 'K']

interface ChargeRow { id: string; name: string; cost: string }

/** ISO standards present on the application that need extra quotation inputs. */
function standardCodesOf(application: CabApplicationQuotation['application']): string[] {
  const text = (application.certificates ?? []).map((c) => `${c.certificateName ?? ''} ${c.certificateCode ?? ''}`).join(' ')
  return [...new Set([...text.matchAll(/\b(9001|14001|45001|22000)\b/g)].map((match) => `ISO_${match[1]}`))]
}

function QuotationEditor({ applicationId }: { applicationId: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<CabApplicationQuotation | null>(null)
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [step, setStep] = useState(1)
  const [offerEnd, setOfferEnd] = useState('')
  const [rateInput, setRateInput] = useState<string | null>(null)
  const [auditors, setAuditors] = useState<string[]>([])
  const [experts, setExperts] = useState<string[]>([])
  const [travel, setTravel] = useState('')
  const [charges, setCharges] = useState<ChargeRow[]>([])
  const [notes, setNotes] = useState('')
  const [complexities, setComplexities] = useState<Record<string, string>>({})
  const [foodCategory, setFoodCategory] = useState('')
  const [studies, setStudies] = useState('1')
  const [fte, setFte] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const today = useMemo(() => toIsoDate(new Date()), [])
  const personnel = useMemo(() => getStoredPersonnel(), [])
  const namesWithRole = (roles: string[]) =>
    [...new Set(personnel.filter((person) => roles.includes(person.role)).map((person) => person.name.trim()))]

  useEffect(() => {
    let cancelled = false
    getCabApplicationQuotation(applicationId)
      .then((result) => { if (!cancelled) { setData(result); setQuotation(result.quotation) } })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [applicationId, attempt])

  if (loading) return <p className="p-6 text-neutral-500">{t('common.loading')}</p>
  if (error || !data) {
    return (
      <section className={cardClassName}>
        <p role="alert" className="mb-4 text-error-500">{t('cab.quotationEditor.loadError')}</p>
        <Button variant="outline" onClick={() => { setError(false); setLoading(true); setAttempt(attempt + 1) }}>
          {t('cab.quotationEditor.retry')}
        </Button>
      </section>
    )
  }

  const { application, cab, pricing, reviewComplete } = data
  if (!reviewComplete) {
    return (
      <section className={cardClassName}>
        <p role="alert" className="mb-4 text-error-500">{t('cab.quotationEditor.reviewIncomplete')}</p>
        <Link className="font-semibold text-primary underline" to={cabApplicationReviewPath(application.id)}>
          {t('cab.quotationEditor.openReview')}
        </Link>
      </section>
    )
  }
  if (!pricing && !quotation) {
    return (
      <section className={cardClassName}>
        <p role="alert" className="mb-4 text-neutral-700">{t('cab.quotationEditor.missingPricing')}</p>
        <Link className="font-semibold text-primary underline" to={ROUTES.cabCompanyProfile}>
          {t('cab.quotationEditor.openProfile')}
        </Link>
      </section>
    )
  }

  const standards = standardCodesOf(application)
  const rate = rateInput ?? (pricing && Number(pricing.dailyRate) > 0 ? String(Number(pricing.dailyRate)) : '')
  const withComplexity = standards.filter((code) => code in COMPLEXITY_OPTIONS)
  const hasFsms = standards.includes('ISO_22000')
  // The API matches complexity against each certificate's own code, so key by that (not by the normalised ISO_xxxx).
  const complexityByCertificate: Record<string, string> = {}
  for (const cert of application.certificates ?? []) {
    const code = standardCodesOf({ ...application, certificates: [cert] })[0]
    if (code && cert.certificateCode && complexities[code]) complexityByCertificate[cert.certificateCode] = complexities[code]
  }
  const chargesValid = charges.every((row) => row.name.trim() && row.cost.trim() !== '' && Number(row.cost) >= 0)
  const standardsOk =
    withComplexity.every((code) => complexities[code]) &&
    (!hasFsms || (foodCategory && Number.isInteger(Number(studies)) && Number(studies) >= 1))
  const stepOk = [
    Boolean(offerEnd && offerEnd >= today && Number(rate) > 0 && standardsOk),
    auditors.length > 0,
    travel.trim() !== '' && Number(travel) >= 0 && chargesValid,
  ]
  const allOk = stepOk.every(Boolean)
  const applicationNumber = application.orderNumber || application.id

  const create = async () => {
    setCreating(true)
    setCreateError(null)
    try {
      // The API prices a quotation from the saved config, so the rate entered here becomes the saved rate first.
      if (pricing && Number(rate) !== Number(pricing.dailyRate)) {
        await upsertPricingConfig({ dailyRate: Number(rate), currency: pricing.currency, taxRate: Number(pricing.taxRate) })
      }
      setQuotation(
        await createQuotation(applicationId, {
          travelExpenses: Number(travel),
          additionalItems: charges.map((row) => ({ name: row.name.trim(), cost: Number(row.cost) })),
          ...(withComplexity.length ? { complexities: complexityByCertificate } : {}),
          ...(hasFsms ? { fsmsInputs: { foodCategory, studies: Number(studies), ...(fte.trim() ? { fteEmployees: Number(fte) } : {}) } } : {}),
          offerEndDate: offerEnd,
          notes: notes.trim() || null,
          // ponytail: the API has no audit-team field, so the team travels in internalNotes (never shown to the client).
          internalNotes: `${t('cab.applications.quotation.stats.auditTeam')}: ${auditors.join(', ')}${experts.length ? ` | ${t('cab.quotationEditor.technicalExperts')}: ${experts.join(', ')}` : ''}`,
        }),
      )
    } catch (failure) {
      setCreateError(failure instanceof ApiError ? failure.message : t('errors.generic'))
    } finally {
      setCreating(false)
    }
  }

  const download = () => {
    if (!quotation) return
    const rows = [
      ...quotation.events.map((event) => ({ description: `${event.standardCode} ${event.auditEventType}`, quantity: Number(event.auditDays), rate: Number(event.dailyRate), amount: Number(event.auditFee) })),
      { description: t('cab.quotationEditor.travelExpenses'), quantity: 1, rate: Number(quotation.travelExpenses), amount: Number(quotation.travelExpenses) },
      ...quotation.additionalItems.map((item) => ({ description: item.name, quantity: 1, rate: item.cost, amount: item.cost })),
      { description: t('cab.quotationEditor.taxes'), quantity: 1, rate: Number(quotation.taxAmount), amount: Number(quotation.taxAmount) },
      { description: t('cab.applications.quotation.breakdown.total'), quantity: 0, rate: 0, amount: Number(quotation.totalAmount) },
    ]
    downloadExcelCsv(`${applicationNumber}-quotation`, [
      { header: t('cab.applications.quotation.breakdown.columns.description'), value: (row: typeof rows[number]) => row.description },
      { header: t('cab.applications.quotation.breakdown.columns.quantity'), value: (row: typeof rows[number]) => row.quantity },
      { header: `${t('cab.quotationEditor.dailyRate')} (${quotation.currency})`, value: (row: typeof rows[number]) => row.rate },
      { header: `${t('cab.quotationEditor.amount')} (${quotation.currency})`, value: (row: typeof rows[number]) => row.amount },
    ], rows)
  }

  const stepLabels = [t('cab.quotationFlow.stepTerms'), t('cab.applications.quotation.stats.auditTeam'), t('cab.quotationEditor.travelStep'), t('cab.quotationFlow.stepReview')]
  const progress = (
    <nav className="flex flex-wrap gap-1 border-b border-[#ececec]" aria-label={t('cab.quotationEditor.prepare')}>
      {stepLabels.map((label, index) => (
        <button type="button" key={label} aria-pressed={step === index + 1}
          disabled={stepOk.slice(0, index).includes(false)}
          onClick={() => setStep(index + 1)}
          className={`border-b-2 px-4 py-3 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${step === index + 1 ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}>
          {label}
        </button>
      ))}
    </nav>
  )

  const preparation = (
    <section className={cardClassName}>
      <form onSubmit={(event) => event.preventDefault()}>
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.quotationFlow.startDate')}><DatePicker value={asDate(today)} disabled /></FormField>
              <TextField id="quotation-rate" label={`${t('cab.quotationEditor.dailyRate')} (${pricing?.currency ?? ''})`} type="number" min="0.01" step="0.01" required value={rate} onChange={(event) => setRateInput(event.target.value)} />
              <FormField label={t('cab.quotationFlow.offerEnd')} required>
                <DatePicker value={asDate(offerEnd)} onChange={(date) => setOfferEnd(toIsoDate(date))} />
                {offerEnd && offerEnd < today && <p className="text-small-light text-error-500">{t('cab.quotationFlow.offerEndPast')}</p>}
              </FormField>
            </div>
            {withComplexity.map((code) => (
              <SelectField
                key={code}
                id={`complexity-${code}`}
                label={`${code.replace('_', ' ')} — ${t('cab.quotationFlow.complexity.label')}`}
                required
                value={complexities[code] ?? ''}
                placeholder={t('cab.quotationFlow.complexity.placeholder')}
                options={COMPLEXITY_OPTIONS[code].map((value) => ({ value, label: t(`cab.quotationFlow.complexity.${value}`) }))}
                onChange={(value) => setComplexities((prev) => ({ ...prev, [code]: value }))}
              />
            ))}
            {hasFsms && (
              <div className="grid gap-5 sm:grid-cols-3">
                <SelectField id="fsms-category" label={t('cab.quotationFlow.fsms.category')} required value={foodCategory}
                  options={FOOD_CATEGORIES} onChange={setFoodCategory} />
                <TextField id="fsms-studies" label={t('cab.quotationFlow.fsms.studies')} type="number" min="1" step="1" required
                  value={studies} onChange={(e) => setStudies(e.target.value)} />
                <TextField id="fsms-fte" label={t('cab.quotationFlow.fsms.fte')} type="number" min="0" step="1"
                  value={fte} onChange={(e) => setFte(e.target.value)} />
              </div>
            )}
            <p className="text-[13px] text-neutral-500">{t('cab.quotationFlow.autoDaysHint')}</p>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2"><FormLabel htmlFor="quotation-auditors" required>{t('cab.quotationEditor.auditorNames')}</FormLabel><MultiSelect tags={auditors} options={namesWithRole(['Auditor', 'Lead Auditor'])} onChange={setAuditors} searchable searchPlaceholder={t('common.search')} /></div>
            <div className="space-y-2"><FormLabel htmlFor="quotation-experts">{t('cab.quotationEditor.expertNames')}</FormLabel><MultiSelect tags={experts} options={namesWithRole(['Technical Expert'])} onChange={setExperts} searchable searchPlaceholder={t('common.search')} /></div>
            <p className="text-[13px] text-neutral-500">{t('cab.quotationEditor.teamHint')}</p>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <TextField id="quotation-travel" label={`${t('cab.quotationEditor.travelExpenses')} (${pricing?.currency ?? ''})`} type="number" min="0" step="0.01" required value={travel} onChange={(event) => setTravel(event.target.value)} />
            <div className="space-y-4">
              <h2 className="text-[16px] font-bold text-primary">{t('cab.quotationEditor.additionalCosts')}</h2>
              <p className="text-[13px] text-neutral-500">{t('cab.quotationEditor.extrasHint')}</p>
              {charges.map((row, index) => (
                <div key={row.id} className="grid items-end gap-3 rounded-[10px] border border-[#ececec] p-4 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                  <TextField id={`charge-name-${row.id}`} label={t('cab.quotationEditor.description', { number: index + 1 })} maxLength={200} required value={row.name}
                    onChange={(e) => setCharges((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))} />
                  <TextField id={`charge-cost-${row.id}`} label={`${t('cab.quotationEditor.amount')} (${pricing?.currency ?? ''})`} type="number" min="0" step="0.01" required value={row.cost}
                    onChange={(e) => setCharges((rows) => rows.map((r) => (r.id === row.id ? { ...r, cost: e.target.value } : r)))} />
                  <Button type="button" variant="outline" onClick={() => setCharges((rows) => rows.filter((r) => r.id !== row.id))}>{t('cab.quotationEditor.remove')}</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setCharges((rows) => [...rows, { id: crypto.randomUUID(), name: '', cost: '' }])}>+ {t('cab.quotationEditor.addCharge')}</Button>
              {!chargesValid && <p role="alert" className="text-[13px] text-error-500">{t('cab.quotationEditor.invalidExtras')}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="quotation-notes" className="text-[14px] font-medium">{t('cab.quotationFlow.notes')}</label>
              <Textarea id="quotation-notes" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4 text-[14px]">
            <p>{t('cab.quotationFlow.reviewIntro')}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-neutral-500">{t('cab.quotationFlow.offerEnd')}</dt><dd className="font-semibold">{offerEnd}</dd></div>
              <div><dt className="text-neutral-500">{t('cab.quotationEditor.dailyRate')}</dt><dd className="font-semibold">{rate} {pricing?.currency}</dd></div>
              <div><dt className="text-neutral-500">{t('cab.quotationEditor.travelExpenses')}</dt><dd className="font-semibold">{travel} {pricing?.currency}</dd></div>
              <div><dt className="text-neutral-500">{t('cab.applications.quotation.stats.auditTeam')}</dt><dd className="font-semibold">{auditors.join(', ')}</dd></div>
              <div><dt className="text-neutral-500">{t('cab.quotationEditor.additionalCosts')}</dt><dd className="font-semibold">{charges.map((row) => `${row.name} (${row.cost})`).join(', ') || '—'}</dd></div>
            </dl>
            {createError && <p role="alert" className="text-error-500">{createError}</p>}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}>{t('common.back')}</Button>
          {step < 4 ? (
            <Button type="button" disabled={!stepOk[step - 1]} onClick={() => setStep(step + 1)}>{t('common.next')}</Button>
          ) : (
            <Button type="button" disabled={!allOk || creating} onClick={() => void create()}>
              {creating ? t('common.loading') : t('cab.quotationFlow.create')}
            </Button>
          )}
        </div>
      </form>
    </section>
  )

  return (
    <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-black">{t('cab.applications.quotation.title')}</h1>
              {quotation ? <QuotationStatusBadge status={quotation.status} /> : (
                <span className="rounded bg-[#e8edfc] px-2 py-1 text-[11px] font-semibold text-primary">{t('cab.applications.quotation.status.inProgress')}</span>
              )}
            </div>
            <p className="mt-2 text-[13px]">{t('cab.applications.quotation.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2 border-[#ececec] text-[12px]" disabled={!quotation} onClick={download}><AppIcon icon={DownloadIcon} size={16} />{t('cab.applications.quotation.actions.downloadQuotation')}</Button>
            <details className="relative">
              <summary className="cursor-pointer rounded-[8px] border border-[#ececec] px-3 py-2 text-[13px]">{t('cab.applications.quotation.actions.moreActions')}</summary>
              <div className="absolute end-0 z-10 mt-2 w-56 space-y-3 rounded-lg border border-[#ececec] bg-white p-4 text-[13px] shadow-lg">
                <Link className="block text-primary" to={ROUTES.cabQuotationApproval}>{t('cab.quotationFlow.allQuotations')}</Link>
                <Link className="block text-primary" to={ROUTES.cabCompanyProfile}>{t('cab.quotationEditor.openProfile')}</Link>
                <Link className="block text-primary" to={ROUTES.cabApplicationQuotation}>{t('cab.quotationEditor.changeApplication')}</Link>
              </div>
            </details>
          </div>
        </div>
        <ApplicationSummaryCard
          applicationNumber={applicationNumber}
          clientName={application.organization?.name || application.legalInfo?.organizationName || '—'}
          applicationType={application.legalInfo?.requestType || '—'}
          certificationBody={cab.tradingBrandName || cab.legalEntityName || '—'}
          primaryStandard={application.certificates?.[0]?.certificateName || application.certificates?.[0]?.certificateCode || '—'}
          receivedOn={application.submittedAt || application.createdAt}
          statusLabel={t('cab.quotationEditor.status')}
        />
        {quotation ? (
          <QuotationView key={`${quotation.id}-${quotation.updatedAt}-${quotation.status}`} quotation={quotation} onChange={(next) => setQuotation(next.status === 'CANCELLED' ? null : next)} />
        ) : (
          <>
            {progress}
            {preparation}
          </>
        )}
      </div>
      <WorkflowProgressCard
        steps={buildCabWorkflowSteps(t, 'quotation')}
        title={t('cab.applications.receipt.sections.workflowProgress')}
        viewFullLabel={t('cab.applications.receipt.actions.viewFullWorkflow')}
        statusLabels={{ completed: t('cab.applications.receipt.workflow.completed'), inProgress: t('cab.applications.receipt.workflow.inProgress'), pending: t('cab.applications.receipt.workflow.pending') }}
        className="xl:sticky xl:top-4"
      />
    </div>
  )
}

export function CabApplicationQuotationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { applicationId } = useParams()
  return (
    <CabLayout>
      <CabHeader title={t('cab.applications.quotation.title')} />
      <main className="flex flex-1 flex-col gap-6 overflow-auto bg-white p-4 sm:p-6 lg:p-8">
        {applicationId ? (
          <QuotationEditor key={applicationId} applicationId={applicationId} />
        ) : (
          <ApplicationPicker
            title={t('cab.quotationEditor.selectApplication')}
            hint={t('cab.quotationEditor.selectHint')}
            actionLabel={t('cab.quotationEditor.openQuotation')}
            loadApplications={listQuotationApplications}
            statusLabel={t('cab.quotationEditor.status')}
            onSelect={(application) => navigate(cabApplicationQuotationPath(application.id, application.clientId))}
          />
        )}
      </main>
    </CabLayout>
  )
}
