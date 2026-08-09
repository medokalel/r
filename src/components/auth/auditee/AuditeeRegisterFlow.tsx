import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AuditeeStepNav } from '@/components/auth/auditee/AuditeeStepNav'
import {
  AuditeeDetailsStep,
  type AuditeeDetailsForm,
} from '@/components/auth/auditee/AuditeeDetailsStep'
import { AuditeeVerificationStep } from '@/components/auth/auditee/AuditeeVerificationStep'
import {
  AuditeeAccountSetupStep,
  type AuditeeAccountSetupForm,
} from '@/components/auth/auditee/AuditeeAccountSetupStep'
import { emptyAuditeeDetailsForm, isAuditeeDetailsComplete } from '@/lib/auditeeDetailsForm'
import {
  emptyAuditeeAccountSetupForm,
  isAuditeeAccountSetupComplete,
} from '@/lib/auditeeAccountSetupForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, register, formatPhoneNumber } from '@/lib/api/authApi'
import { fetchGovernorateOptions } from '@/lib/governorates'
import { ApiError } from '@/lib/api/client'

interface AuditeeRegisterFlowProps {
  /** Lets the user back out to entity-type selection from step 1. */
  onBackToEntityType: () => void
  /** Lets the parent page hide chrome (e.g. the "Log in" link) on the final success screen. */
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AuditeeRegisterFlow({ onBackToEntityType, onSubmittedChange }: AuditeeRegisterFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitted, setSubmitted] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountError, setCreateAccountError] = useState<string | null>(null)
  const [detailsForm, setDetailsForm] = useState<AuditeeDetailsForm>(emptyAuditeeDetailsForm)
  const [accountSetupForm, setAccountSetupForm] = useState<AuditeeAccountSetupForm>(
    emptyAuditeeAccountSetupForm
  )

  // Step 2 ("verification") — same email + OTP pattern as the AB/CAB flows.
  // Pre-filled from Details' email since we don't ask for it twice.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const patchDetails = (f: Partial<AuditeeDetailsForm>) =>
    setDetailsForm((prev) => ({ ...prev, ...f }))
  const patchAccountSetup = (f: Partial<AuditeeAccountSetupForm>) =>
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
      setStep(3)
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
    setStep((s) => (s - 1) as 1 | 2)
  }

  const handleCreateAccount = async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)
    setCreateAccountError(null)
    try {
      // The backend's /auth/register endpoint (shared by all entity types)
      // still requires administrationName/facilityOwnerManager/activity/
      // legalCapacity, which the lean Auditee form doesn't collect. Until
      // the backend makes those optional for CONSULTATION_BODY, we send
      // reasonable stand-in values derived from what we do collect:
      //   - administrationName / legalCapacity / activity → the company name
      //     (there's no better source for these yet)
      //   - facilityOwnerManager → the contact person, since they're the
      //     same "person in charge" concept
      const governorates = await fetchGovernorateOptions(detailsForm.country)
      const cityName = governorates.find((g) => g.id === detailsForm.city)?.name ?? detailsForm.city

      await register({
        entityType: 'CONSULTATION_BODY',
        email: detailsForm.email,
        organizationName: detailsForm.companyName,
        administrationName: detailsForm.companyName,
        facilityOwnerManager: detailsForm.contactPerson,
        activity: detailsForm.companyName,
        legalCapacity: detailsForm.companyName,
        city: cityName,
        phone: formatPhoneNumber(detailsForm.mobileCountryCode, detailsForm.mobile),
        password: accountSetupForm.password,
        confirmPassword: accountSetupForm.confirmPassword,
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
      // Carry the email from Details into Verification so it isn't re-typed.
      setVerificationEmail(detailsForm.email)
      setStep(2)
      return
    }
    if (step === 2) {
      if (!emailVerified) {
        void handleVerifyAndContinue()
        return
      }
      setStep(3)
      return
    }
    void handleCreateAccount()
  }

  const nextDisabled =
    step === 1
      ? !isAuditeeDetailsComplete(detailsForm)
      : step === 2
        ? !emailValid || !codeSent || !otpComplete || isVerifyingEmail
        : !isAuditeeAccountSetupComplete(accountSetupForm) || isCreatingAccount

  const nextLabel =
    step === 2 && codeSent && !emailVerified
      ? isVerifyingEmail
        ? t('register.verifyingEmail')
        : t('register.verifyEmail')
      : step === 3
        ? isCreatingAccount
          ? t('register.creatingAccount')
          : t('register.createAccount')
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
          onClick={() => navigate('/login')}
          className="rounded-[var(--radius-sm)] bg-primary px-8 py-3 text-body-2-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('register.auditee.summary.goToDashboard')}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-h1 text-neutral-900 mb-6">{t('register.auditee.title')}</h1>

      <p className="text-body-2 text-neutral-500 -mt-4 mb-6">
        {t('register.selectedEntityLabel')}{' '}
        <span className="text-body-2-semibold text-neutral-900">
          {t('register.auditClients')}
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

      <AuditeeStepNav current={step} className="mb-6" />

      {step === 1 && <AuditeeDetailsStep form={detailsForm} onPatch={patchDetails} />}
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
      {step === 3 && (
        <AuditeeAccountSetupStep form={accountSetupForm} onPatch={patchAccountSetup} />
      )}

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