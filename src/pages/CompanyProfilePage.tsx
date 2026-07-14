import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ProfileFormContext } from '@/components/dashboard/companyProfile/ProfileFormContext'
import { Breadcrumb, Stepper } from '@/components/dashboard/companyProfile/Primitives'
import {
  BasicDataStep,
  AddressStep,
  BranchesStep,
  OfficialDocsStep,
} from '@/components/dashboard/companyProfile/steps'
import { ProfileLoadingSkeleton } from '@/components/dashboard/companyProfile/ProfileLoadingSkeleton'
import { STEPS, type StepKey } from '@/components/dashboard/companyProfile/types'
import { isStepComplete } from '@/components/dashboard/companyProfile/validation'
import { useCompanyProfileState } from '@/components/dashboard/companyProfile/useCompanyProfileState'

export function CompanyProfilePage() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState<StepKey>('basicData')
  const { contextValue, loading, saving, submitting, notification, saveDraft, submitProfile } =
    useCompanyProfileState()

  const stepData = {
    form: contextValue.form,
    branches: contextValue.branches,
    documents: contextValue.documents,
  }

  const isLastStep = activeStep === STEPS[STEPS.length - 1]
  const currentStepComplete = isStepComplete(activeStep, stepData)
  const allStepsComplete = STEPS.every((step) => isStepComplete(step, stepData))

  const goNext = () => {
    const idx = STEPS.indexOf(activeStep)
    if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1])
  }

  const goBack = () => {
    const idx = STEPS.indexOf(activeStep)
    if (idx > 0) setActiveStep(STEPS[idx - 1])
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="companyProfile.title" />

      <ProfileFormContext.Provider value={contextValue}>
        <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
          <Breadcrumb />

          <div className="flex flex-col gap-1">
            <h2 className="text-[24px] font-medium leading-[1.6] tracking-[-0.6px] text-neutral-900">
              {t('companyProfile.title')}
            </h2>
            <p className="text-[18px] font-light leading-[1.6] text-[#666]">
              {t(`companyProfile.stepSubtitles.${activeStep}`)}
            </p>
          </div>

          <Stepper activeStep={activeStep} onStepClick={setActiveStep} />

          {loading ? (
            <ProfileLoadingSkeleton />
          ) : (
            <>
              {activeStep === 'basicData' && <BasicDataStep />}
              {activeStep === 'address' && <AddressStep />}
              {activeStep === 'branches' && <BranchesStep />}
              {activeStep === 'officialDocs' && <OfficialDocsStep />}
            </>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-[#ececec] bg-white px-6 py-3">
          <div className="min-w-0 flex-1">
            {notification && (
              <p
                className={cn(
                  'truncate text-[14px] font-medium',
                  notification.type === 'success' ? 'text-[#26a65b]' : 'text-error-500'
                )}
              >
                {notification.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="tertiary"
              size="lg"
              onClick={saveDraft}
              disabled={saving || loading}
              className="min-w-[180px] bg-[#F3F6FD]"
            >
              {saving ? t('common.loading') : t('companyProfile.footer.saveDraft')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={goBack}
              disabled={activeStep === STEPS[0]}
              className="min-w-[180px]"
            >
              {t('companyProfile.footer.back')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={isLastStep ? submitProfile : goNext}
              disabled={
                loading ||
                submitting ||
                (isLastStep ? !allStepsComplete : !currentStepComplete)
              }
              className="min-w-[180px]"
            >
              {isLastStep
                ? submitting
                  ? t('common.loading')
                  : t('companyProfile.footer.submit')
                : t('companyProfile.footer.next')}
            </Button>
          </div>
        </footer>
      </ProfileFormContext.Provider>
    </AppLayout>
  )
}
