import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AuditeeStepNav } from '@/components/auth/auditee/AuditeeStepNav'
import {
  AuditeeAccountBasicsStep,
  AuditeeAccountSetupStep,
} from '@/components/auth/auditee/AuditeeAccountBasicsStep'
import { AuditeeVerificationStep } from '@/components/auth/auditee/AuditeeVerificationStep'
import {
  emptyAuditeeAccountBasicsForm,
  isAuditeeAccountBasicsComplete,
  isAuditeeAccountSetupComplete,
  type AuditeeAccountBasicsForm,
} from '@/lib/auditeeAccountBasicsForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, register, formatPhoneNumber } from '@/lib/api/authApi'
import { ROUTES } from '@/lib/routes'
import { ApiError } from '@/lib/api/client'
import { getCountryOptions } from '@/lib/countries'

interface AuditeeRegisterFlowProps {
  /** Lets the user back out to entity-type selection from step 1. */
  onBackToEntityType: () => void
  /** Lets the parent page hide chrome (e.g. the "Log in" link) on the final success screen. */
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AuditeeRegisterFlow({ onBackToEntityType, onSubmittedChange }: AuditeeRegisterFlowProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountError, setCreateAccountError] = useState<string | null>(null)
  const [basicsForm, setBasicsForm] = useState<AuditeeAccountBasicsForm>(emptyAuditeeAccountBasicsForm)
  const [submitted, setSubmitted] = useState(false)

  // Step 2 ("verification") — same email + OTP pattern as the AB/CAB flows.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const patchBasics = (f: Partial<AuditeeAccountBasicsForm>) =>
    setBasicsForm((prev) => ({ ...prev, ...f }))

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
    } catch (error) {
      setVerificationError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleBack = () => {
    if (step === 1) {
      onBackToEntityType()
      return
    }
    setStep((step - 1) as 1 | 2)
  }

  const handleCreateAccount = async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)
    setCreateAccountError(null)
    try {
      // Same backend limitation as the CAB/AB flows: /auth/register still
      // requires organizationName/administrationName/facilityOwnerManager/
      // activity/legalCapacity/city, none of which this trimmed sign-up
      // collects anymore (company name, location etc. are now collected in
      // the post-login onboarding wizard instead). Stand in with the
      // registrant's own name/country until the backend adds a dedicated
      // Auditee submission path that doesn't need these upfront.
      const countryName =
        getCountryOptions(i18n.language).find((c) => c.code === basicsForm.country)?.name ??
        basicsForm.country

      await register({
        entityType: 'CONSULTATION_BODY',
        email: verificationEmail,
        organizationName: basicsForm.companyName,
        administrationName: basicsForm.name,
        facilityOwnerManager: basicsForm.name,
        activity: basicsForm.companyName,
        legalCapacity: 'Audit Client',
        city: basicsForm.city || countryName,
        phone: formatPhoneNumber(basicsForm.mobileCountryCode, basicsForm.mobile),
        password: basicsForm.password,
        confirmPassword: basicsForm.confirmPassword,
      })

      setSubmitted(true)
      onSubmittedChange?.(true)
    } catch (error) {
      setCreateAccountError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      setVerificationEmail(basicsForm.email)
      setStep(2)
      return
    }
    if (step === 2 && !emailVerified) {
      void handleVerifyAndContinue()
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
    if (isCreatingAccount || !isAuditeeAccountSetupComplete(basicsForm)) return
    void handleCreateAccount()
  }

  const nextDisabled =
    step === 1
      ? !isAuditeeAccountBasicsComplete(basicsForm)
      : step === 2
        ? !emailValid || !codeSent || !otpComplete || isVerifyingEmail
        : !isAuditeeAccountSetupComplete(basicsForm) || isCreatingAccount

  const nextLabel =
    step === 3
      ? isCreatingAccount
        ? t('register.creatingAccount')
        : t('register.createAccount')
      : step === 2 && codeSent && !emailVerified
      ? isVerifyingEmail
        ? t('register.verifyingEmail')
        : t('register.verifyEmail')
      : t('common.next')

  if (submitted) {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center text-center">
        <AppIcon icon={SuccessCheckIcon} size={140} className="mb-6" />
        <h1 className="text-h1 mb-3 text-[#26a65b]">{t('register.auditee.summary.submittedTitle')}</h1>
        <p className="text-body-2 mb-8 max-w-md text-neutral-500">
          {t('register.auditee.summary.submittedDescription')}
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.login)}
          className="rounded-[var(--radius-sm)] bg-primary px-8 py-3 text-body-2-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('register.auditee.summary.goToLogin')}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-h1 text-neutral-900 mb-6">{t('register.auditee.title')}</h1>

      <AuditeeStepNav current={step} className="mb-6" />

      {step === 1 && <AuditeeAccountBasicsStep form={basicsForm} onPatch={patchBasics} />}
      {step === 2 && (
        <AuditeeVerificationStep
          email={verificationEmail}
          otp={otp}
          codeSent={codeSent}
          isSendingCode={isSendingCode}
          onEmailChange={setVerificationEmail}
          onOtpChange={setOtp}
          onSendCode={() => void handleSendCode()}
        />
      )}
      {step === 3 && <AuditeeAccountSetupStep form={basicsForm} onPatch={patchBasics} />}

      {verificationError && step === 2 && (
        <p className="text-small-light text-error-500 mt-4">{verificationError}</p>
      )}
      {createAccountError && step === 3 && (
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
