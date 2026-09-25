import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { useCabApplicationSubmissionState } from '@/components/dashboard/cab/useCabApplicationSubmissionState'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { EntityDataForm } from '@/components/dashboard/EntityDataForm'
import {
  EntityDataNav,
  subSections,
  type EntityDataSubSection,
  type EntityDataViewTab,
} from '@/components/dashboard/EntityDataNav'
import { ApplicationFormContext } from '@/components/dashboard/entityData/ApplicationFormContext'
import { ApplicationLoadingSkeleton } from '@/components/dashboard/entityData/ApplicationLoadingSkeleton'
import { FieldSelectionSummary } from '@/components/dashboard/entityData/FieldSelectionSummary'
import { isSectionComplete } from '@/components/dashboard/entityData/applicationValidation'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { ProcessStepper } from '@/components/dashboard/ProcessStepper'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { startCabClientApplication } from '@/lib/api/cabCertificationApplicationApi'
import { listAllCabAuditClients, type CabAuditClientListItem } from '@/lib/api/clientRegistrationApi'
import {
  ROUTES,
  cabApplicationReceiptPath,
  cabApplicationReviewPath,
  cabApplicationSubmissionPath,
} from '@/lib/routes'
import { cn } from '@/lib/utils'

const STATUS_VIEWS: EntityDataViewTab[] = ['approved', 'underReview', 'rejected']

const viewTabCopyKeys: Record<
  'entityData' | 'field' | 'documents',
  { title: string; subtitle: string }
> = {
  entityData: {
    title: 'accreditation.entityData.title',
    subtitle: 'accreditation.entityData.subtitle',
  },
  field: {
    title: 'accreditation.entityData.field.pageTitle',
    subtitle: 'accreditation.entityData.field.pageSubtitle',
  },
  documents: {
    title: 'accreditation.entityData.documents.pageTitle',
    subtitle: 'accreditation.entityData.documents.pageSubtitle',
  },
}

function ClientPicker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState<CabAuditClientListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listAllCabAuditClients()
      .then((items) => {
        if (!cancelled) setClients(items)
      })
      .catch(() => {
        if (!cancelled) setClients([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: `${client.name}${client.owner?.email ? ` — ${client.owner.email}` : ''}`,
      })),
    [clients],
  )

  const start = async () => {
    if (!selectedClientId) return
    setStarting(true)
    setError(null)
    try {
      const application = await startCabClientApplication(selectedClientId)
      const fill = searchParams.get('fill') === '1'
      navigate(
        cabApplicationSubmissionPath(selectedClientId, application.id, { fill }),
        { replace: true },
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('errors.generic'))
    } finally {
      setStarting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-[640px] rounded-[var(--radius-md)] border border-[#ececec] bg-white p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">
        {t('cab.applicationSubmission.selectClient')}
      </h2>
      <p className="mb-5 mt-1 text-[14px] text-neutral-500">
        {t('cab.applicationSubmission.selectClientHint')}
      </p>
      <SearchableSelect
        value={selectedClientId}
        onChange={setSelectedClientId}
        options={options}
        placeholder={
          loading
            ? t('common.loading')
            : clients.length === 0
              ? t('cab.applicationSubmission.noClients')
              : t('cab.applicationSubmission.clientPlaceholder')
        }
        searchPlaceholder={t('cab.applicationSubmission.clientSearchPlaceholder')}
        disabled={loading || starting || clients.length === 0}
      />
      {error && <p className="mt-3 text-[13px] text-error-500">{error}</p>}
      <Button
        variant="primary"
        className="mt-5 w-full"
        disabled={!selectedClientId || starting}
        onClick={() => void start()}
      >
        {starting ? t('common.loading') : t('cab.applicationSubmission.startApplication')}
      </Button>
    </section>
  )
}

export function CabApplicationSubmissionPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedClientId = searchParams.get('clientId')
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeSubSection, setActiveSubSection] = useState<EntityDataSubSection>('legalIdentity')
  const [activeViewTab, setActiveViewTab] = useState<EntityDataViewTab>('entityData')
  const [fieldPhase, setFieldPhase] = useState<FieldPhase>('sectors')
  const [activeAction, setActiveAction] = useState<'next' | 'draft' | null>(null)

  const {
    contextValue,
    form,
    update,
    clientId,
    applicationId,
    loading,
    status,
    orderNumber,
    saving,
    submitting,
    notification,
    loadError,
    reload,
    saveDraft,
    submit,
    fillData,
  } = useCabApplicationSubmissionState()

  const isReadOnly = status !== 'DRAFT'

  const selectedSectors = form.selectedSectors
  const selectedStandards = form.selectedStandards
  const activeIndex = subSections.indexOf(activeSubSection)
  const isStatusView = STATUS_VIEWS.includes(activeViewTab)
  const copyKeys =
    activeViewTab === 'field' && fieldPhase === 'codes'
      ? {
          title: 'accreditation.entityData.field.codesTitle',
          subtitle: 'accreditation.entityData.field.pageSubtitle',
        }
      : activeViewTab === 'entityData' || activeViewTab === 'field' || activeViewTab === 'documents'
        ? viewTabCopyKeys[activeViewTab]
        : { title: '', subtitle: '' }

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleSubSectionChange = useCallback(
    (section: EntityDataSubSection) => {
      setActiveSubSection(section)
      scrollToContent()
    },
    [scrollToContent],
  )

  const handleViewTabChange = useCallback(
    (tab: EntityDataViewTab) => {
      setActiveViewTab(tab)
      if (tab !== 'field') setFieldPhase('sectors')
      scrollToContent()
    },
    [scrollToContent],
  )

  const handleBack = useCallback(() => {
    if (activeViewTab === 'documents') {
      handleViewTabChange('field')
      return
    }
    if (activeViewTab === 'field' && fieldPhase === 'codes') {
      setFieldPhase('sectors')
      return
    }
    if (activeViewTab === 'field') {
      handleViewTabChange('entityData')
      return
    }
    if (activeIndex > 0) handleSubSectionChange(subSections[activeIndex - 1])
  }, [
    activeIndex,
    activeViewTab,
    fieldPhase,
    handleSubSectionChange,
    handleViewTabChange,
  ])

  const handleNext = useCallback(async () => {
    setActiveAction('next')
    try {
      if (isReadOnly) {
        if (activeViewTab === 'documents') {
          navigate(ROUTES.cabApplicationRegister)
          return
        }
        if (activeViewTab === 'field' && fieldPhase === 'sectors') {
          setFieldPhase('codes')
        } else if (activeViewTab === 'field') {
          handleViewTabChange('documents')
        } else if (activeIndex >= subSections.length - 1) {
          handleViewTabChange('field')
        } else {
          handleSubSectionChange(subSections[activeIndex + 1])
        }
        return
      }
      if (activeViewTab === 'documents') {
        const submitted = await submit()
        if (submitted) handleViewTabChange('underReview')
        return
      }
      const saved = await saveDraft()
      if (!saved) return
      if (activeViewTab === 'field' && fieldPhase === 'sectors') {
        setFieldPhase('codes')
      } else if (activeViewTab === 'field') {
        handleViewTabChange('documents')
      } else if (activeIndex >= subSections.length - 1) {
        handleViewTabChange('field')
      } else {
        handleSubSectionChange(subSections[activeIndex + 1])
      }
    } finally {
      setActiveAction(null)
    }
  }, [
    activeIndex,
    activeViewTab,
    fieldPhase,
    handleSubSectionChange,
    handleViewTabChange,
    isReadOnly,
    navigate,
    saveDraft,
    submit,
  ])

  const handleSaveDraft = useCallback(async () => {
    setActiveAction('draft')
    try {
      await saveDraft()
    } finally {
      setActiveAction(null)
    }
  }, [saveDraft])

  const setSelectedSectors = useCallback(
    (standard: StandardKey, sectors: SectorKey[]) =>
      update('selectedSectors', { ...form.selectedSectors, [standard]: sectors }),
    [form.selectedSectors, update],
  )
  const setSelectedStandards = useCallback(
    (standards: StandardKey[]) => update('selectedStandards', standards),
    [update],
  )
  const setSelectedCodes = useCallback(
    (codes: Record<string, string[]>) => update('selectedCodes', codes),
    [update],
  )

  const standardsMissingSectors = selectedStandards.filter(
    (standard) => (selectedSectors[standard] ?? []).length === 0,
  )
  const standardsMissingCodes = selectedStandards.filter(
    (standard) =>
      !Object.entries(form.selectedCodes).some(
        ([key, codes]) => key.startsWith(`${standard}:`) && codes.length > 0,
      ),
  )
  const anySectorSelected = Object.values(selectedSectors).some((sectors) => sectors.length > 0)
  const busy = saving || submitting
  const nextDisabled =
    busy ||
    loading ||
    isStatusView ||
    (!isReadOnly &&
      ((activeViewTab === 'entityData' && !isSectionComplete(activeSubSection, form)) ||
        (activeViewTab === 'field' &&
          fieldPhase === 'sectors' &&
          (!anySectorSelected || standardsMissingSectors.length > 0)) ||
        (activeViewTab === 'field' && fieldPhase === 'codes' && standardsMissingCodes.length > 0) ||
        (activeViewTab === 'documents' && !form.agreed)))

  const missingHint =
    activeViewTab === 'field' && fieldPhase === 'sectors' && standardsMissingSectors.length > 0
      ? t('accreditation.entityData.field.missingSectorsHint', {
          standards: standardsMissingSectors.join(isRTL ? '، ' : ', '),
        })
      : activeViewTab === 'field' && fieldPhase === 'codes' && standardsMissingCodes.length > 0
        ? t('accreditation.entityData.field.missingCodesHint', {
            standards: standardsMissingCodes.join(isRTL ? '، ' : ', '),
          })
        : null

  const footerStartContent = notification ? (
    <p
      className={cn(
        'min-w-0 whitespace-pre-line text-[14px] font-medium',
        notification.type === 'success' ? 'text-[#26a65b]' : 'text-error-500',
      )}
    >
      {notification.message}
    </p>
  ) : missingHint && !isReadOnly ? (
    <p className="rounded-[var(--radius-sm)] bg-[#fef3c6] px-3 py-1.5 text-[14px] font-medium text-[#a58401]">
      {missingHint}
    </p>
  ) : activeViewTab === 'field' && fieldPhase === 'sectors' ? (
    <FieldSelectionSummary
      selectedSectors={[...new Set(Object.values(selectedSectors).flat())]}
    />
  ) : undefined

  const workflowLinks =
    applicationId && (clientId || selectedClientId) ? (
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={cabApplicationReviewPath(applicationId, clientId ?? selectedClientId ?? undefined)}
          className="rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t('cab.applicationSubmission.reviewApplication')}
        </Link>
        <Link
          to={cabApplicationReceiptPath(applicationId, clientId ?? selectedClientId ?? undefined)}
          className="rounded-[var(--radius-sm)] border border-primary px-6 py-3 text-[16px] font-semibold text-primary transition-colors hover:bg-primary-subtle"
        >
          {t('cab.applicationSubmission.viewReceipt')}
        </Link>
        <Link
          to={ROUTES.cabApplicationRegister}
          className="rounded-[var(--radius-sm)] px-6 py-3 text-[16px] font-semibold text-neutral-600 hover:text-primary"
        >
          {t('cab.applicationSubmission.backToRegister')}
        </Link>
      </div>
    ) : null

  return (
    <CabLayout>
      <ApplicationFormContext.Provider value={contextValue}>
        <CabHeader
          title={
            isReadOnly
              ? t('cab.applicationSubmission.viewTitle')
              : t('cab.applicationSubmission.title')
          }
          notificationCount={3}
        />
        <ProcessStepper activeStep={isStatusView ? 1 : 0} />

        <div ref={contentRef} className="flex flex-1 flex-col gap-5 overflow-auto p-5">
          <nav className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <div className="flex items-center gap-2">
              <Link to={ROUTES.cabApplicationRegister} className="text-neutral-400 hover:text-primary">
                {t('cab.applicationRegister.title')}
              </Link>
              <span className="text-neutral-400">/</span>
              <span className="font-medium text-neutral-700">
                {isReadOnly
                  ? t('cab.applicationSubmission.viewTitle')
                  : isStatusView
                    ? t('cab.applicationSubmission.submitted')
                    : t('cab.applicationSubmission.title')}
              </span>
              {orderNumber && (
                <span className="text-neutral-400" dir="ltr">
                  · {orderNumber}
                </span>
              )}
            </div>
            {selectedClientId && !isStatusView && !isReadOnly && (
              <Button variant="outline" size="sm" disabled={busy || loading} onClick={fillData}>
                {t('cab.applicationRegister.fillData')}
              </Button>
            )}
          </nav>

          {!selectedClientId ? (
            <ClientPicker />
          ) : loadError ? (
            <div className="flex flex-1 items-center justify-center rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
              <ErrorState
                variant={loadError === 'rateLimit' ? 'rateLimit' : 'generic'}
                onRetry={reload}
              />
            </div>
          ) : loading ? (
            <div className="flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
              <ApplicationLoadingSkeleton />
            </div>
          ) : (
            <>
              {!isStatusView && copyKeys.title && (
                <div className="space-y-2">
                  <h1 className="text-h3-semi text-neutral-900">{t(copyKeys.title)}</h1>
                  <p className={cn('text-body-2 text-neutral-600', isRTL && 'font-light')}>
                    {t(copyKeys.subtitle)}
                  </p>
                </div>
              )}

              <div className="flex flex-1 gap-5">
                {!isStatusView && (
                  <EntityDataNav
                    activeSubSection={activeSubSection}
                    activeViewTab={activeViewTab}
                    onSubSectionChange={handleSubSectionChange}
                    onViewTabChange={handleViewTabChange}
                  />
                )}
                <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
                  <fieldset
                    disabled={isReadOnly}
                    className={cn(
                      'min-w-0 border-0 p-0',
                      isReadOnly && 'pointer-events-none opacity-90',
                    )}
                  >
                    <legend className="sr-only">
                      {isReadOnly
                        ? t('cab.applicationSubmission.viewTitle')
                        : t('cab.applicationSubmission.title')}
                    </legend>
                    <EntityDataForm
                      section={activeSubSection}
                      viewTab={activeViewTab}
                      fieldPhase={fieldPhase}
                      selectedSectors={selectedSectors}
                      onSelectedSectorsChange={isReadOnly ? () => undefined : setSelectedSectors}
                      selectedStandards={selectedStandards}
                      onSelectedStandardsChange={isReadOnly ? () => undefined : setSelectedStandards}
                      selectedCodes={form.selectedCodes}
                      onSelectedCodesChange={isReadOnly ? () => undefined : setSelectedCodes}
                    />
                  </fieldset>
                  {isStatusView && <div className="mt-6">{workflowLinks}</div>}
                </div>
              </div>
            </>
          )}
        </div>

        {selectedClientId && !isStatusView && (
          <DashboardFooter
            backDisabled={
              busy ||
              (activeViewTab === 'entityData' && activeIndex === 0) ||
              (activeViewTab === 'field' && fieldPhase === 'sectors')
            }
            nextDisabled={nextDisabled}
            nextLabel={
              activeAction === 'next' && busy
                ? t('common.loading')
                : activeViewTab === 'documents'
                  ? isReadOnly
                    ? t('cab.applicationSubmission.backToRegister')
                    : t('accreditation.messages.submitRequest')
                  : undefined
            }
            startContent={footerStartContent}
            onBack={handleBack}
            onNext={handleNext}
            onSaveDraft={isReadOnly ? undefined : handleSaveDraft}
            saveDraftDisabled={busy || loading}
            saveDraftLoading={saving && activeAction === 'draft'}
          />
        )}
      </ApplicationFormContext.Provider>
    </CabLayout>
  )
}
