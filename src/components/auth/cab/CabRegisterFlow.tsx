import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { CabComingSoonStep } from '@/components/auth/cab/CabComingSoonStep'
import { CabStepNav } from '@/components/auth/cab/CabStepNav'
import {
  CabDetailsStep,
  type CabDetailsForm,
} from '@/components/auth/cab/CabDetailsStep'
import { CabAccreditationScopesStep } from '@/components/auth/cab/CabAccreditationScopesStep'
import {
  emptyCabDetailsForm,
  isCabDetailsComplete,
  isCabAccreditationScopesComplete,
} from '@/lib/cabDetailsForm'

interface CabRegisterFlowProps {
  /** Lets the user back out to entity-type selection from CAB step 1. */
  onBackToEntityType: () => void
}

const STEP_TITLE_KEYS = [
  'register.cab.steps.details',
  'register.cab.steps.scopeModules',
  'register.cab.steps.verification',
  'register.cab.steps.accountSetup',
] as const

export function CabRegisterFlow({ onBackToEntityType }: CabRegisterFlowProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  // Step 1 ("CAB Details") is split into two screens: the base details form,
  // then a continuation screen for accreditation scopes. The step nav stays
  // on "1" for both — this only tracks which screen within step 1 to show.
  const [detailsSubStep, setDetailsSubStep] = useState<1 | 2>(1)
  const [detailsForm, setDetailsForm] = useState<CabDetailsForm>(emptyCabDetailsForm)

  const patchDetails = (f: Partial<CabDetailsForm>) =>
    setDetailsForm((prev) => ({ ...prev, ...f }))

  const handleBack = () => {
    if (step === 1) {
      if (detailsSubStep === 2) {
        setDetailsSubStep(1)
        return
      }
      onBackToEntityType()
      return
    }
    if (step === 2) {
      setDetailsSubStep(2)
    }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  const handleNext = () => {
    if (step === 1 && detailsSubStep === 1) {
      setDetailsSubStep(2)
      return
    }
    // TODO: steps 2-4 aren't built yet — once they are, this should validate
    // and submit the same way the existing register() flow does.
    setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4)
  }

  const nextDisabled =
    step === 1 && detailsSubStep === 1
      ? !isCabDetailsComplete(detailsForm)
      : step === 1 && detailsSubStep === 2
        ? !isCabAccreditationScopesComplete(detailsForm)
        : false

  return (
    <>
      <h1 className="text-h1 text-neutral-900 mb-6">{t('register.cab.title')}</h1>

      <p className="text-body-2 text-neutral-500 -mt-4 mb-6">
        {t('register.selectedEntityLabel')}{' '}
        <span className="text-body-2-semibold text-neutral-900">
          {t('register.certificationBodies')}
        </span>{' '}
        ·{' '}
        <button
          type="button"
          onClick={onBackToEntityType}
          className="text-body-2-semibold text-primary underline underline-offset-2"
        >
          {t('common.change')}
        </button>
      </p>

      <CabStepNav current={step} className="mb-6" />

      {step === 1 && detailsSubStep === 1 && (
        <CabDetailsStep form={detailsForm} onPatch={patchDetails} />
      )}
      {step === 1 && detailsSubStep === 2 && (
        <CabAccreditationScopesStep form={detailsForm} onPatch={patchDetails} />
      )}
      {step > 1 && <CabComingSoonStep titleKey={STEP_TITLE_KEYS[step - 1]} />}

      <AuthStepActions
        className="mt-8"
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={t('common.next')}
        nextDisabled={nextDisabled}
        showBack
      />
    </>
  )
}