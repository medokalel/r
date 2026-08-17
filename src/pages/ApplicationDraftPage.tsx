import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationStepper } from '@/components/dashboard/cab/ApplicationStepper'
import { ApplicationDraftForm } from '@/components/dashboard/cab/ApplicationDraftForm'
import { StandardsScopeStep } from '@/components/dashboard/cab/StandardsScopeStep'
import { SitesFacilitiesStep } from '@/components/dashboard/cab/SitesFacilitiesStep'
import { buildClientWorkflowSteps } from '@/lib/workflowSteps'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import {
  emptyApplicationDraftForm,
  isApplicationDraftComplete,
} from '@/lib/applicationDraftForm'
import { emptyStandardsScopeForm, isStandardsScopeComplete } from '@/lib/standardsScopeForm'
import { emptySitesFacilitiesForm, isSitesFacilitiesComplete } from '@/lib/sitesFacilitiesForm'

export function ApplicationDraftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [form, setForm] = useState(emptyApplicationDraftForm)
  const [standardsScopeForm, setStandardsScopeForm] = useState(emptyStandardsScopeForm)
  const [sitesFacilitiesForm, setSitesFacilitiesForm] = useState(emptySitesFacilitiesForm)

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))
  const patchStandardsScope = (f: Partial<typeof standardsScopeForm>) =>
    setStandardsScopeForm((prev) => ({ ...prev, ...f }))
  const patchSitesFacilities = (f: Partial<typeof sitesFacilitiesForm>) =>
    setSitesFacilitiesForm((prev) => ({ ...prev, ...f }))

  const complete =
    step === 1
      ? isApplicationDraftComplete(form)
      : step === 2
        ? isStandardsScopeComplete(standardsScopeForm)
        : step === 3
          ? isSitesFacilitiesComplete(sitesFacilitiesForm)
          : true

  // TODO: wire to a real "save application draft" endpoint once the backend
  // exposes one — for now this is a no-op stub, matching the other
  // not-yet-backed CAB workflow actions. Unlike "Save & Continue", saving a
  // draft doesn't require the form to be complete.
  const handleSaveDraft = () => {}

  const handleBack = () => {
    if (step === 1) {
      navigate('/cab/dashboard')
      return
    }
    setStep((s) => (s - 1) as typeof step)
  }

  // TODO: wire to a real "save application draft" endpoint once the backend
  // exposes one, and build steps 4-5 (Documents, Review & Confirm) — for now
  // this just returns to the dashboard once step 3 is done, matching the
  // other not-yet-backed CAB workflow steps.
  const handleNext = () => {
    if (!complete) return
    if (step < 3) {
      setStep((s) => (s + 1) as typeof step)
      return
    }
    navigate('/cab/dashboard')
  }

    return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />
      <ApplicationStepper current={step} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="space-y-1">
          <h2 className="text-h3-semi text-neutral-900">{t('cab.applicationDraft.title')}</h2>
          <p className="text-body-2 text-neutral-500">{t('cab.applicationDraft.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
            {step === 1 && <ApplicationDraftForm form={form} onPatch={patch} />}
            {step === 2 && (
              <StandardsScopeStep form={standardsScopeForm} onPatch={patchStandardsScope} />
            )}
            {step === 3 && (
              <SitesFacilitiesStep form={sitesFacilitiesForm} onPatch={patchSitesFacilities} />
            )}
          </div>
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
        </div>
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={false}
        onSaveDraft={handleSaveDraft}
        onNext={handleNext}
        nextDisabled={!complete}
        nextLabel={t('cab.applicationDraft.saveDraftAndContinue')}
      />
    </CabLayout>
  )
}