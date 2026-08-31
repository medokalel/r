import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { CabStepNav } from '@/components/auth/cab/CabStepNav'
import { CabAccountBasicsStep } from '@/components/auth/cab/CabAccountBasicsStep'
import { CabVerificationStep } from '@/components/auth/cab/CabVerificationStep'
import { emptyCabAccountBasicsForm, isCabAccountBasicsComplete, type CabAccountBasicsForm } from '@/lib/cabAccountBasicsForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, login, formatPhoneNumber } from '@/lib/api/authApi'
import { registerCab } from '@/lib/api/cabApi'
import { saveAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { ApiError } from '@/lib/api/client'

interface CabRegisterFlowProps {
  /** Lets the user back out to entity-type selection from CAB step 1. */
  onBackToEntityType: () => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function CabRegisterFlow({ onBackToEntityType }: CabRegisterFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountError, setCreateAccountError] = useState<string | null>(null)
  const [basicsForm, setBasicsForm] = useState<CabAccountBasicsForm>(emptyCabAccountBasicsForm)

  // Step 2 ("verification") — same email + OTP pattern as RegisterPage.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const patchBasics = (f: Partial<CabAccountBasicsForm>) =>
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
    setStep(1)
  }

  const handleCreateAccount = async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)
    setCreateAccountError(null)
    try {
      // Same backend limitation as before: /auth/register still requires
      // organizationName/administrationName/facilityOwnerManager/activity/
      // legalCapacity/city, none of which this trimmed sign-up collects
      // anymore (organization name, location etc. are now collected in the
      // post-login onboarding wizard instead). Stand in with the registrant's
      // own name/country until the backend adds a dedicated CAB submission
      // path that doesn't need these upfront.
      await registerCab({
        contactPersonName: basicsForm.name.trim(),
        email: verificationEmail.trim(),
        phone: formatPhoneNumber(basicsForm.mobileCountryCode, basicsForm.mobile),
        password: basicsForm.password,
        confirmPassword: basicsForm.confirmPassword,
      })

      const session = await login(verificationEmail.trim(), basicsForm.password)
      saveAuthSession(session, true)
      navigate(ROUTES.onboarding)
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
    if (!emailVerified) {
      void handleVerifyAndContinue()
      return
    }
    if (isCreatingAccount) return
    void handleCreateAccount()
  }

  const nextDisabled =
    step === 1
      ? !isCabAccountBasicsComplete(basicsForm)
      : !emailValid || !codeSent || !otpComplete || isVerifyingEmail || isCreatingAccount

  const nextLabel =
    step === 2 && codeSent && !emailVerified
      ? isVerifyingEmail
        ? t('register.verifyingEmail')
        : t('register.verifyEmail')
      : step === 2 && emailVerified
        ? isCreatingAccount
          ? t('register.creatingAccount')
          : t('register.createAccount')
        : t('common.next')

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

      {step === 1 && <CabAccountBasicsStep form={basicsForm} onPatch={patchBasics} />}
      {step === 2 && (
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

      {verificationError && step === 2 && (
        <p className="text-small-light text-error-500 mt-4">{verificationError}</p>
      )}
      {createAccountError && step === 2 && (
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
