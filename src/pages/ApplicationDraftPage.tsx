import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationStepper } from '@/components/dashboard/cab/ApplicationStepper'
import { ApplicationDraftForm } from '@/components/dashboard/cab/ApplicationDraftForm'
import { StandardsScopeStep } from '@/components/dashboard/cab/StandardsScopeStep'
import { SitesFacilitiesStep } from '@/components/dashboard/cab/SitesFacilitiesStep'
import { DocumentsStep, DocumentsSidebar } from '@/components/dashboard/cab/DocumentsStep'
import { ReviewConfirmStep } from '@/components/dashboard/cab/ReviewConfirmStep'
import { ReviewConfirmSidebar } from '@/components/dashboard/cab/ReviewConfirmSidebar'
import { buildClientWorkflowSteps } from '@/lib/workflowSteps'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { Button } from '@/components/ui/Button'
import {
  emptyApplicationDraftForm,
  isApplicationDraftComplete,
} from '@/lib/applicationDraftForm'
import { emptyStandardsScopeForm, isStandardsScopeComplete } from '@/lib/standardsScopeForm'
import { emptySitesFacilitiesForm, isSitesFacilitiesComplete } from '@/lib/sitesFacilitiesForm'
import { emptyDocumentsForm, isDocumentsComplete } from '@/lib/documentsForm'
import {
  clearApplicationDraftSnapshot,
  clearPendingMultiSiteRule,
  clearPendingNewSite,
  loadApplicationDraftSnapshot,
  peekPendingMultiSiteRule,
  peekPendingNewSite,
  saveApplicationDraftSnapshot,
} from '@/lib/applicationDraftSession'

export function ApplicationDraftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Resume from sessionStorage if returning from AddSitePage (lazy
  // initializer, not a module constant, so it re-reads on every mount).
  // pendingSiteOnLoad peeks (doesn't delete) since StrictMode calls this
  // twice in dev — deleting here would lose the site on the 2nd call.
  const [{ restoredSnapshot, pendingSiteOnLoad, pendingMultiSiteRuleOnLoad }] = useState(() => ({
    restoredSnapshot: loadApplicationDraftSnapshot(),
    pendingSiteOnLoad: peekPendingNewSite(),
    pendingMultiSiteRuleOnLoad: peekPendingMultiSiteRule(),
  }))

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(
    pendingSiteOnLoad || pendingMultiSiteRuleOnLoad ? 3 : restoredSnapshot?.step ?? 1
  )
  const [form, setForm] = useState(restoredSnapshot?.form ?? emptyApplicationDraftForm)
  const [standardsScopeForm, setStandardsScopeForm] = useState(
    restoredSnapshot?.standardsScopeForm ?? emptyStandardsScopeForm
  )
  const [sitesFacilitiesForm, setSitesFacilitiesForm] = useState(() => {
    const base = restoredSnapshot?.sitesFacilitiesForm ?? emptySitesFacilitiesForm
    const withSite = pendingSiteOnLoad ? { ...base, sites: [...base.sites, pendingSiteOnLoad] } : base
    return pendingMultiSiteRuleOnLoad ? { ...withSite, multiSiteRule: pendingMultiSiteRuleOnLoad } : withSite
  })
  const [documentsForm, setDocumentsForm] = useState(
    restoredSnapshot?.documentsForm ?? emptyDocumentsForm
  )

  // Persist on every change so AddSitePage's round trip doesn't lose the draft.
  useEffect(() => {
    saveApplicationDraftSnapshot({ step, form, standardsScopeForm, sitesFacilitiesForm, documentsForm })
  }, [step, form, standardsScopeForm, sitesFacilitiesForm, documentsForm])

  // Site/rule were already folded in above; just clear the flags now they're consumed.
  useEffect(() => {
    if (pendingSiteOnLoad) clearPendingNewSite()
  }, [pendingSiteOnLoad])

  useEffect(() => {
    if (pendingMultiSiteRuleOnLoad) clearPendingMultiSiteRule()
  }, [pendingMultiSiteRuleOnLoad])

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))
  const patchStandardsScope = (f: Partial<typeof standardsScopeForm>) =>
    setStandardsScopeForm((prev) => ({ ...prev, ...f }))
  const patchSitesFacilities = (f: Partial<typeof sitesFacilitiesForm>) =>
    setSitesFacilitiesForm((prev) => ({ ...prev, ...f }))
  const patchDocuments = (f: Partial<typeof documentsForm>) =>
    setDocumentsForm((prev) => ({ ...prev, ...f }))

  const complete =
    step === 1
      ? isApplicationDraftComplete(form)
      : step === 2
        ? isStandardsScopeComplete(standardsScopeForm)
        : step === 3
          ? isSitesFacilitiesComplete(sitesFacilitiesForm)
          : step === 4
            ? isDocumentsComplete(documentsForm)
            : // Step 5 (Review & Confirm): gate "Submit Application" on every
              // earlier step actually being complete, not just on having
              // reached this step.
              isApplicationDraftComplete(form) &&
              isStandardsScopeComplete(standardsScopeForm) &&
              isSitesFacilitiesComplete(sitesFacilitiesForm) &&
              isDocumentsComplete(documentsForm)

  // TODO: wire to a real "save application draft" endpoint once the backend
  // exposes one — for now this is a no-op stub, matching the other
  // not-yet-backed CAB workflow actions. Unlike "Save & Continue", saving a
  // draft doesn't require the form to be complete.
  const handleSaveDraft = () => {}

  // TODO: wire to a real print/PDF preview once the backend exposes a
  // submission-ready rendering — for now this is a no-op stub, matching
  // handleSaveDraft above.
  const handlePreview = () => {}

  const handleBack = () => {
    if (step === 1) {
      navigate('/cab/dashboard')
      return
    }
    setStep((s) => (s - 1) as typeof step)
  }

  // TODO: wire to a real "submit application" endpoint once the backend
  // exposes one — for now this just sends the user to the (also mocked)
  // Application Receipt page, matching the other not-yet-backed CAB
  // workflow steps.
  const handleNext = () => {
    if (!complete) return
    if (step < 5) {
      setStep((s) => (s + 1) as typeof step)
      return
    }
    clearApplicationDraftSnapshot()
    navigate('/cab/applications/receipt')
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-h3-semi text-neutral-900">{t('cab.applicationDraft.title')}</h2>
            <p className="text-body-2 text-neutral-500">{t('cab.applicationDraft.subtitle')}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-[var(--radius-sm)] px-5"
            onClick={handlePreview}
          >
            {t('cab.applicationDraft.review.preview')}
          </Button>
        </div>

        {/* TODO(DEV ONLY): onStepClick lets you jump between steps directly
        while building — remove this prop once the flow is finished. */}
        <ApplicationStepper current={step} onStepClick={setStep} />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
            {step === 1 && <ApplicationDraftForm form={form} onPatch={patch} />}
            {step === 2 && (
              <StandardsScopeStep form={standardsScopeForm} onPatch={patchStandardsScope} />
            )}
            {step === 3 && (
              <SitesFacilitiesStep
                form={sitesFacilitiesForm}
                onPatch={patchSitesFacilities}
                onApplyMultiSiteRule={() => navigate('/cab/applications/draft/sites/multi-site-rule')}
              />
            )}
            {step === 4 && <DocumentsStep form={documentsForm} onPatch={patchDocuments} />}
            {step === 5 && (
              <ReviewConfirmStep
                form={form}
                standardsScopeForm={standardsScopeForm}
                sitesFacilitiesForm={sitesFacilitiesForm}
                documentsForm={documentsForm}
                onEditStep={setStep}
              />
            )}
          </div>
          {step === 4 ? (
            <DocumentsSidebar form={documentsForm} />
          ) : step === 5 ? (
            <ReviewConfirmSidebar
              form={form}
              standardsScopeForm={standardsScopeForm}
              sitesFacilitiesForm={sitesFacilitiesForm}
              documentsForm={documentsForm}
            />
          ) : (
            <WorkflowProgressCard
              steps={buildClientWorkflowSteps(t, 'application')}
              title={t('cab.clientRegistration.workflow.title')}
              viewFullLabel={t('cab.clientRegistration.workflow.viewFull')}
              statusLabels={{
                completed: t('cab.applications.receipt.workflow.completed'),
                inProgress: t('cab.clientRegistration.workflow.inProgress'),
                pending: t('cab.clientRegistration.workflow.pending'),
              }}
            />
          )}
        </div>
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={false}
        onSaveDraft={handleSaveDraft}
        onNext={handleNext}
        nextDisabled={!complete}
        nextLabel={
          step === 5 ? t('cab.applicationDraft.review.submitApplication') : t('cab.applicationDraft.saveDraftAndContinue')
        }
      />
    </CabLayout>
  )
}