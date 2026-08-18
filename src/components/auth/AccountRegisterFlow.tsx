import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AccountBasicsStep } from '@/components/auth/AccountBasicsStep'
import { CabVerificationStep } from '@/components/auth/cab/CabVerificationStep'
import {
  emptyAccountRegisterForm,
  isAccountRegisterComplete,
  type AccountRegisterForm,
} from '@/lib/accountRegisterForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, register, formatPhoneNumber } from '@/lib/api/authApi'
import { getRegistrationAuthError } from '@/lib/authErrors'
import { ROUTES } from '@/lib/routes'
import { ApiError } from '@/lib/api/client'
import { getCountryOptions } from '@/lib/countries'

interface AccountRegisterFlowProps {
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AccountRegisterFlow({ onSubmittedChange }: AccountRegisterFlowProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountError, setCreateAccountError] = useState<string | null>(null)
  const [form, setForm] = useState<AccountRegisterForm>(emptyAccountRegisterForm)
  const [submitted, setSubmitted] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false)

  const sendInFlightRef = useRef(false)

  const patch = (fields: Partial<AccountRegisterForm>) => setForm((prev) => ({ ...prev, ...fields }))

  const emailValid = isValidRequiredEmail(verificationEmail)
  const otpComplete = otp.every((digit) => digit.length === 1)

  const handleSendCode = async (emailOverride?: string): Promise<boolean> => {
    const targetEmail = (emailOverride ?? verificationEmail).trim()
    if (!isValidRequiredEmail(targetEmail) || isSendingCode || sendInFlightRef.current) return false

    sendInFlightRef.current = true
    setIsSendingCode(true)
    setVerificationError(null)
    setEmailAlreadyRegistered(false)

    try {
      await sendVerificationCode(targetEmail)
      setCodeSent(true)
      setEmailVerified(false)
      setOtp(emptyOtp())
      return true
    } catch (error) {
      const authError = getRegistrationAuthError(error, t)
      setVerificationError(authError.message)
      setEmailAlreadyRegistered(authError.emailAlreadyRegistered)
      return false
    } finally {
      sendInFlightRef.current = false
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndContinue = async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail) return
    setIsVerifyingEmail(true)
    setVerificationError(null)
    setEmailAlreadyRegistered(false)
    try {
      await verifyEmail(verificationEmail.trim(), otp.join(''))
      setEmailVerified(true)
    } catch (error) {
      const authError = getRegistrationAuthError(error, t)
      setVerificationError(authError.message)
      setEmailAlreadyRegistered(authError.emailAlreadyRegistered)
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleCreateAccount = async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)
    setCreateAccountError(null)
    try {
      const countryName =
        getCountryOptions(i18n.language).find((country) => country.code === form.country)?.name ??
        form.country
      const registrantName = form.fullName.trim()

      await register({
        entityType: 'CONSULTATION_BODY',
        email: verificationEmail,
        organizationName: registrantName,
        administrationName: registrantName,
        facilityOwnerManager: registrantName,
        activity: registrantName,
        legalCapacity: registrantName,
        city: countryName,
        phone: formatPhoneNumber(form.mobileCountryCode, form.mobile),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })

      setSubmitted(true)
      onSubmittedChange?.(true)
    } catch (error) {
      setCreateAccountError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleBackToBasics = () => {
    setStep(1)
    setCodeSent(false)
    setOtp(emptyOtp())
    setEmailVerified(false)
    setVerificationError(null)
    setEmailAlreadyRegistered(false)
  }

  const handleNext = () => {
    if (step === 1) {
      if (isSendingCode) return
      const email = form.email.trim()
      setVerificationEmail(email)
      void handleSendCode(email).then((sent) => {
        if (sent) setStep(2)
      })
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
      ? !isAccountRegisterComplete(form) || isSendingCode
      : !emailValid || !codeSent || !otpComplete || isSendingCode || isVerifyingEmail || isCreatingAccount

  const nextLabel =
    step === 1 && isSendingCode
      ? t('register.sendingCode')
      : step === 2 && codeSent && !emailVerified
        ? isVerifyingEmail
          ? t('register.verifyingEmail')
          : t('register.verifyEmail')
        : step === 2 && emailVerified
          ? isCreatingAccount
            ? t('register.creatingAccount')
            : t('register.createAccount')
          : t('common.next')

  if (submitted) {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center text-center">
        <AppIcon icon={SuccessCheckIcon} size={140} className="mb-6" />
        <h1 className="text-h1 mb-3 text-[#26a65b]">{t('register.account.submittedTitle')}</h1>
        <p className="text-body-2 mb-8 max-w-md text-neutral-500">{t('register.account.submittedDescription')}</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.login)}
          className="rounded-[var(--radius-sm)] bg-primary px-8 py-3 text-body-2-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('register.account.goToLogin')}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-h1 text-neutral-900 mb-6">{t('register.title')}</h1>
      <p className="text-body-2 text-neutral-500 -mt-4 mb-6">{t('register.account.subtitle')}</p>

      {step === 1 && <AccountBasicsStep form={form} onPatch={patch} />}
      {step === 2 && (
        <CabVerificationStep
          email={verificationEmail}
          otp={otp}
          codeSent={codeSent}
          isSendingCode={isSendingCode}
          onEmailChange={setVerificationEmail}
          onOtpChange={setOtp}
          onSendCode={() => void handleSendCode()}
          showSendButton={false}
        />
      )}

      {verificationError && (
        <div className="mt-4 space-y-2">
          <p className="text-small-light text-error-500">{verificationError}</p>
          {emailAlreadyRegistered && (
            <p className="text-body-2 text-neutral-500">
              <Link to={ROUTES.login} className="text-body-2-semibold text-primary underline underline-offset-2">
                {t('auth.signIn')}
              </Link>
            </p>
          )}
        </div>
      )}
      {createAccountError && step === 2 && (
        <p className="text-small-light text-error-500 mt-4">{createAccountError}</p>
      )}

      <AuthStepActions
        className="mt-8"
        onBack={step === 1 ? undefined : handleBackToBasics}
        onNext={handleNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        showBack={step === 2}
      />
    </>
  )
}
