import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { CabStepNav } from '@/components/auth/cab/CabStepNav'
import {
  CabDetailsStep,
  type CabDetailsForm,
} from '@/components/auth/cab/CabDetailsStep'
import { CabAccreditationScopesStep } from '@/components/auth/cab/CabAccreditationScopesStep'
import { CabScopeModulesStep } from '@/components/auth/cab/CabScopeModulesStep'
import { CabModulesStep } from '@/components/auth/cab/CabModulesStep'
import { CabVerificationStep } from '@/components/auth/cab/CabVerificationStep'
import {
  CabAccountSetupStep,
  type CabAccountSetupForm,
} from '@/components/auth/cab/CabAccountSetupStep'
import { CabSummaryStep } from '@/components/auth/cab/CabSummaryStep'
import {
  emptyCabDetailsForm,
  isCabDetailsComplete,
  isCabAccreditationScopesComplete,
} from '@/lib/cabDetailsForm'
import {
  emptyCabScopeModulesForm,
  isCabScopeModulesComplete,
  isCabModulesComplete,
  type CabScopeModulesForm,
} from '@/lib/cabScopeModulesForm'
import { emptyCabAccountSetupForm, isCabAccountSetupComplete } from '@/lib/cabAccountSetupForm'
import { SCOPE_STANDARDS_BY_TYPE } from '@/lib/api/cabRegisterApi'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail } from '@/lib/api/authApi'
import { ApiError } from '@/lib/api/client'

interface CabRegisterFlowProps {
  /** Lets the user back out to entity-type selection from CAB step 1. */
  onBackToEntityType: () => void
  /** Lets the parent page hide chrome (e.g. the "Log in" link) on the final success screen. */
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function CabRegisterFlow({ onBackToEntityType, onSubmittedChange }: CabRegisterFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [submitted, setSubmitted] = useState(false)
  // Step 1 ("CAB Details") is split into two screens: the base details form,
  // then a continuation screen for accreditation scopes. The step nav stays
  // on "1" for both — this only tracks which screen within step 1 to show.
  const [detailsSubStep, setDetailsSubStep] = useState<1 | 2>(1)
  // Step 2 ("Scope & Modules") is likewise split: scheme/standards first,
  // then the fixed "which module" picker. The step nav stays on "2" for both.
  const [scopeModulesSubStep, setScopeModulesSubStep] = useState<1 | 2>(1)
  const [detailsForm, setDetailsForm] = useState<CabDetailsForm>(emptyCabDetailsForm)
  const [scopeModulesForm, setScopeModulesForm] = useState<CabScopeModulesForm>(emptyCabScopeModulesForm)
  const [accountSetupForm, setAccountSetupForm] = useState<CabAccountSetupForm>(
    emptyCabAccountSetupForm
  )

  // Step 3 ("verification") — same email + OTP pattern as RegisterPage.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const patchDetails = (f: Partial<CabDetailsForm>) =>
    setDetailsForm((prev) => ({ ...prev, ...f }))
  const patchScopeModules = (f: Partial<CabScopeModulesForm>) =>
    setScopeModulesForm((prev) => ({ ...prev, ...f }))
  const patchAccountSetup = (f: Partial<CabAccountSetupForm>) =>
    setAccountSetupForm((prev) => ({ ...prev, ...f }))

  const emailValid = isValidRequiredEmail(verificationEmail)
  const otpComplete = otp.every((digit) => digit.length === 1)

  const handleSendCode = async () => {
    if (!emailValid || isSendingCode) return
    setIsSendingCode(true)
    setVerificationError(null)
    try {
      await sendVerificationCode(verificationEmail.trim())
      setCodeSent(true)
      setEmailVerified(false)
      setOtp(emptyOtp())
    } catch (error) {
      setVerificationError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndContinue = async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail) return
    setIsVerifyingEmail(true)
    setVerificationError(null)
    try {
      await verifyEmail(verificationEmail.trim(), otp.join(''))
      setEmailVerified(true)
      setStep(4)
    } catch (error) {
      setVerificationError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsVerifyingEmail(false)
    }
  }

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
      if (scopeModulesSubStep === 2) {
        setScopeModulesSubStep(1)
        return
      }
      setStep(1)
      setDetailsSubStep(2)
      return
    }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  const handleCreateAccount = () => {
    // TODO: no CAB submission endpoint exists yet — once the backend adds
    // one, this should submit detailsForm/scopeModulesForm/accountSetupForm
    // together the same way the existing register() flow does, before
    // showing this confirmation screen.
    setSubmitted(true)
    onSubmittedChange?.(true)
  }

  const handleNext = () => {
    if (step === 1 && detailsSubStep === 1) {
      setDetailsSubStep(2)
      return
    }
    if (step === 1 && detailsSubStep === 2) {
      setStep(2)
      setScopeModulesSubStep(1)
      return
    }
    if (step === 2 && scopeModulesSubStep === 1) {
      setScopeModulesSubStep(2)
      return
    }
    if (step === 2 && scopeModulesSubStep === 2) {
      setStep(3)
      return
    }
    if (step === 3) {
      if (!emailVerified) {
        void handleVerifyAndContinue()
        return
      }
      setStep(4)
      return
    }
    if (step === 4) {
      setStep(5)
      return
    }
    handleCreateAccount()
  }

  const nextDisabled =
    step === 1 && detailsSubStep === 1
      ? !isCabDetailsComplete(detailsForm)
      : step === 1 && detailsSubStep === 2
        ? !isCabAccreditationScopesComplete(detailsForm)
        : step === 2 && scopeModulesSubStep === 1
          ? !isCabScopeModulesComplete(
              scopeModulesForm,
              detailsForm.accreditationScopes,
              SCOPE_STANDARDS_BY_TYPE
            )
          : step === 2 && scopeModulesSubStep === 2
            ? !isCabModulesComplete(scopeModulesForm)
            : step === 3
              ? !emailValid || !codeSent || !otpComplete || isVerifyingEmail
              : step === 4
                ? !isCabAccountSetupComplete(accountSetupForm)
                : step === 5
                  ? false
                  : false

  const nextLabel =
    step === 3 && codeSent && !emailVerified
      ? isVerifyingEmail
        ? t('register.verifyingEmail')
        : t('register.verifyEmail')
      : step === 5
        ? t('register.createAccount')
        : t('common.next')

  if (submitted) {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center text-center">
        <AppIcon icon={SuccessCheckIcon} size={140} className="mb-6" />
        <h1 className="text-h1 mb-3 text-[#26a65b]">{t('register.cab.summary.submittedTitle')}</h1>
        <p className="text-body-2 mb-8 max-w-md text-neutral-500">
          {t('register.cab.summary.submittedDescription')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="rounded-[var(--radius-sm)] bg-primary px-8 py-3 text-body-2-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('register.cab.summary.goToDashboard')}
        </button>
      </div>
    )
  }

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

      {step <= 4 && <CabStepNav current={step} className="mb-6" />}

      {step === 1 && detailsSubStep === 1 && (
        <CabDetailsStep form={detailsForm} onPatch={patchDetails} />
      )}
      {step === 1 && detailsSubStep === 2 && (
        <CabAccreditationScopesStep form={detailsForm} onPatch={patchDetails} />
      )}
      {step === 2 && scopeModulesSubStep === 1 && (
        <CabScopeModulesStep
          schemes={detailsForm.accreditationScopes}
          form={scopeModulesForm}
          onPatch={patchScopeModules}
        />
      )}
      {step === 2 && scopeModulesSubStep === 2 && (
        <CabModulesStep form={scopeModulesForm} onPatch={patchScopeModules} />
      )}
      {step === 3 && (
        <CabVerificationStep
          email={verificationEmail}
          otp={otp}
          codeSent={codeSent}
          isSendingCode={isSendingCode}
          onEmailChange={setVerificationEmail}
          onOtpChange={setOtp}
          onSendCode={() => void handleSendCode()}
        />
      )}
      {step === 4 && (
        <CabAccountSetupStep form={accountSetupForm} onPatch={patchAccountSetup} />
      )}
      {step === 5 && (
        <CabSummaryStep detailsForm={detailsForm} scopeModulesForm={scopeModulesForm} />
      )}

      {verificationError && step === 3 && (
        <p className="text-small-light text-error-500 mt-4">{verificationError}</p>
      )}

      <AuthStepActions
        className="mt-8"
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        showBack
      />
    </>
  )
}