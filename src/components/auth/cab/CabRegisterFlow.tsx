import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { CabComingSoonStep } from '@/components/auth/cab/CabComingSoonStep'
import { CabStepNav } from '@/components/auth/cab/CabStepNav'
import {
  CabDetailsStep,
  type CabDetailsForm,
} from '@/components/auth/cab/CabDetailsStep'
import { emptyCabDetailsForm, isCabDetailsComplete } from '@/lib/cabDetailsForm'

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
  const [detailsForm, setDetailsForm] = useState<CabDetailsForm>(emptyCabDetailsForm)

  const patchDetails = (f: Partial<CabDetailsForm>) =>
    setDetailsForm((prev) => ({ ...prev, ...f }))

  const handleBack = () => {
    if (step === 1) {
      onBackToEntityType()
      return
    }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  const handleNext = () => {
    // TODO: steps 2-4 aren't built yet — once they are, this should validate
    // and submit the same way the existing register() flow does.
    setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4)
  }

  const nextDisabled = step === 1 && !isCabDetailsComplete(detailsForm)

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

      {step === 1 && <CabDetailsStep form={detailsForm} onPatch={patchDetails} />}
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