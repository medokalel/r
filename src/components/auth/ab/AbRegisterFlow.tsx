import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AbStepNav } from '@/components/auth/ab/AbStepNav'
import {
  AbDetailsStep,
  type AbDetailsForm,
} from '@/components/auth/ab/AbDetailsStep'
import { AbAccreditationScopesStep } from '@/components/auth/ab/AbAccreditationScopesStep'
import { AbScopeModulesStep } from '@/components/auth/ab/AbScopeModulesStep'
import { AbModulesStep } from '@/components/auth/ab/AbModulesStep'
import { AbVerificationStep } from '@/components/auth/ab/AbVerificationStep'
import {
  AbAccountSetupStep,
  type AbAccountSetupForm,
} from '@/components/auth/ab/AbAccountSetupStep'
import { AbSummaryStep } from '@/components/auth/ab/AbSummaryStep'
import {
  emptyAbDetailsForm,
  isAbDetailsComplete,
  isAbAccreditationScopesComplete,
} from '@/lib/abDetailsForm'
import {
  emptyAbScopeModulesForm,
  isAbSchemeStandardsComplete,
  isAbModulesComplete,
  type AbScopeModulesForm,
} from '@/lib/abScopeModulesForm'
import { emptyAbAccountSetupForm, isAbAccountSetupComplete } from '@/lib/abAccountSetupForm'
import { SCOPE_STANDARDS_BY_TYPE } from '@/lib/api/abRegisterApi'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, register, login, formatPhoneNumber } from '@/lib/api/authApi'
import { getCountryOptions } from '@/lib/countries'
import { saveAuthSession } from '@/lib/authStorage'
import { ApiError } from '@/lib/api/client'

interface AbRegisterFlowProps {
  /** Lets the user back out to entity-type selection from AB step 1. */
  onBackToEntityType: () => void
  /** Lets the parent page hide chrome (e.g. the "Log in" link) on the final success screen. */
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AbRegisterFlow({ onBackToEntityType, onSubmittedChange }: AbRegisterFlowProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [submitted, setSubmitted] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountError, setCreateAccountError] = useState<string | null>(null)
  // Step 1 ("AB Details") is split into two screens: the base details form,
  // then a continuation screen for accreditation scopes. The step nav stays
  // on "1" for both — this only tracks which screen within step 1 to show.
  const [detailsSubStep, setDetailsSubStep] = useState<1 | 2>(1)
  // Step 2 ("Scope & Modules") is one screen per scheme chosen in step 1,
  // followed by the fixed "which module" picker. 0..schemes.length-1 shows
  // that scheme's screen; schemes.length shows the modules picker. The step
  // nav stays on "2" throughout.
  const [schemeScreenIndex, setSchemeScreenIndex] = useState(0)
  const [detailsForm, setDetailsForm] = useState<AbDetailsForm>(emptyAbDetailsForm)
  const [scopeModulesForm, setScopeModulesForm] = useState<AbScopeModulesForm>(emptyAbScopeModulesForm)
  const [accountSetupForm, setAccountSetupForm] = useState<AbAccountSetupForm>(
    emptyAbAccountSetupForm
  )

  // Step 3 ("verification") — same email + OTP pattern as RegisterPage.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const patchDetails = (f: Partial<AbDetailsForm>) =>
    setDetailsForm((prev) => ({ ...prev, ...f }))
  const patchScopeModules = (f: Partial<AbScopeModulesForm>) =>
    setScopeModulesForm((prev) => ({ ...prev, ...f }))
  const patchAccountSetup = (f: Partial<AbAccountSetupForm>) =>
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
      if (schemeScreenIndex > 0) {
        setSchemeScreenIndex((i) => i - 1)
        return
      }
      setStep(1)
      setDetailsSubStep(2)
      return
    }
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  const handleCreateAccount = async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)
    setCreateAccountError(null)
    try {
      // Same backend limitation as the CAB flow: /auth/register still
      // requires administrationName/facilityOwnerManager/activity/
      // legalCapacity/city, which the AB Details form doesn't collect.
      // Until the backend makes those optional for ACCREDITATION_BODY (or
      // adds a dedicated AB submission endpoint that also accepts the
      // accreditation-scopes/scope-modules data), we send reasonable
      // stand-in values derived from what we do collect — see
      // CabRegisterFlow's handleCreateAccount for the same mapping.
      const countryName =
        getCountryOptions(i18n.language).find((c) => c.code === detailsForm.country)?.name ??
        detailsForm.country

      await register({
        entityType: 'ACCREDITATION_BODY',
        // The account/login email is whichever address got OTP-verified in
        // step 3 — NOT detailsForm.email ("Official Email" from step 1,
        // which is just organization contact info, unrelated to login).
        email: verificationEmail,
        organizationName: detailsForm.abName,
        administrationName: detailsForm.abName,
        facilityOwnerManager: detailsForm.contactPerson,
        activity: detailsForm.abName,
        legalCapacity: detailsForm.abName,
        city: countryName,
        phone: formatPhoneNumber(detailsForm.mobileCountryCode, detailsForm.mobile),
        password: accountSetupForm.password,
        confirmPassword: accountSetupForm.confirmPassword,
      })

      // Registration only creates the account — it doesn't return a token.
      // Log the new account in right away. Unlike CAB (which has its own
      // dashboard), AB accounts land on the regular dashboard for now.
      const session = await login(verificationEmail, accountSetupForm.password)
      saveAuthSession(session, true)

      setSubmitted(true)
      onSubmittedChange?.(true)
    } catch (error) {
      setCreateAccountError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && detailsSubStep === 1) {
      setDetailsSubStep(2)
      return
    }
    if (step === 1 && detailsSubStep === 2) {
      setStep(2)
      setSchemeScreenIndex(0)
      return
    }
    if (step === 2) {
      const schemes = detailsForm.accreditationScopes
      if (schemeScreenIndex < schemes.length) {
        // Currently on a scheme's standards screen — advance to the next
        // scheme's screen, or to the modules screen once schemes run out.
        setSchemeScreenIndex((i) => i + 1)
        return
      }
      // Currently on the modules screen (schemeScreenIndex === schemes.length).
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
    if (isCreatingAccount) return
    void handleCreateAccount()
  }

  const nextDisabled =
    step === 1 && detailsSubStep === 1
      ? !isAbDetailsComplete(detailsForm)
      : step === 1 && detailsSubStep === 2
        ? !isAbAccreditationScopesComplete(detailsForm)
        : step === 2
          ? schemeScreenIndex < detailsForm.accreditationScopes.length
            ? !isAbSchemeStandardsComplete(
                scopeModulesForm,
                detailsForm.accreditationScopes[schemeScreenIndex],
                SCOPE_STANDARDS_BY_TYPE
              )
            : !isAbModulesComplete(scopeModulesForm)
          : step === 3
              ? !emailValid || !codeSent || !otpComplete || isVerifyingEmail
              : step === 4
                ? !isAbAccountSetupComplete(accountSetupForm)
                : step === 5
                  ? isCreatingAccount
                  : false

                const nextLabel =
                  step === 3 && codeSent && !emailVerified
                    ? isVerifyingEmail
                      ? t('register.verifyingEmail')
                      : t('register.verifyEmail')
                    : step === 5
                      ? isCreatingAccount
                        ? t('register.creatingAccount')
                        : t('register.createAccount')
                      : t('common.next')

  if (submitted) {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center text-center">
        <AppIcon icon={SuccessCheckIcon} size={140} className="mb-6" />
        <h1 className="text-h1 mb-3 text-[#26a65b]">{t('register.ab.summary.submittedTitle')}</h1>
        <p className="text-body-2 mb-8 max-w-md text-neutral-500">
          {t('register.ab.summary.submittedDescription')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-[var(--radius-sm)] bg-primary px-8 py-3 text-body-2-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('register.ab.summary.goToDashboard')}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-h1 text-neutral-900 mb-6">{t('register.ab.title')}</h1>

      <p className="text-body-2 text-neutral-500 -mt-4 mb-6">
        {t('register.selectedEntityLabel')}{' '}
        <span className="text-body-2-semibold text-neutral-900">
          {t('register.accreditationBodies')}
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

      {step <= 4 && <AbStepNav current={step} className="mb-6" />}

      {step === 1 && detailsSubStep === 1 && (
        <AbDetailsStep form={detailsForm} onPatch={patchDetails} />
      )}
      {step === 1 && detailsSubStep === 2 && (
        <AbAccreditationScopesStep form={detailsForm} onPatch={patchDetails} />
      )}
        {step === 2 && schemeScreenIndex < detailsForm.accreditationScopes.length && (
          <AbScopeModulesStep
            scheme={detailsForm.accreditationScopes[schemeScreenIndex]}
            form={scopeModulesForm}
            onPatch={patchScopeModules}
          />
        )}
        {step === 2 && schemeScreenIndex >= detailsForm.accreditationScopes.length && (
          <AbModulesStep form={scopeModulesForm} onPatch={patchScopeModules} />
        )}
      {step === 3 && (
        <AbVerificationStep
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
        <AbAccountSetupStep form={accountSetupForm} onPatch={patchAccountSetup} />
      )}
      {step === 5 && (
        <AbSummaryStep detailsForm={detailsForm} scopeModulesForm={scopeModulesForm} />
      )}

      {verificationError && step === 3 && (
        <p className="text-small-light text-error-500 mt-4">{verificationError}</p>
      )}
      {createAccountError && step === 5 && (
        <p className="text-small-light text-error-500 mt-4">{createAccountError}</p>
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