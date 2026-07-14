import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { AuthFeedbackScreen } from '@/components/auth/AuthFeedbackScreen'
import { authFieldLabelClassName } from '@/components/auth/AuthFieldLabel'
import { authFieldValueClassName } from '@/components/auth/AuthTextField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  AppIcon,
  EyeIcon,
  EyeSlashIcon,
  LockIcon,
  MailIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { englishDigitsClassName, englishDigitsLtrClassName } from '@/lib/englishDigits'
import {
  resendResetCode,
  resetPassword,
  sendResetCode,
  verifyResetCode,
} from '@/lib/api/authApi'
import { ApiError } from '@/lib/api/client'
import { isValidEmail } from '@/lib/authValidation'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6
const RESEND_SECONDS = 40

const inputClassName = cn(
  'w-full h-12 rounded-[var(--radius-sm)] border border-neutral-200 bg-white',
  authFieldValueClassName,
  'placeholder:text-[16px] placeholder:font-light placeholder:leading-[1.6] placeholder:text-neutral-600',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'transition-colors'
)

const emptyOtp = () => Array.from({ length: OTP_LENGTH }, () => '')

type ResetFeedback = 'success' | 'error'

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function useResendTimer(active: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    if (!active) return
    setSecondsLeft(RESEND_SECONDS)
  }, [active, generation])

  useEffect(() => {
    if (!active || secondsLeft <= 0) return
    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [active, secondsLeft])

  const restart = () => setGeneration((current) => current + 1)

  return {
    secondsLeft,
    countdown: formatCountdown(secondsLeft),
    canResend: secondsLeft <= 0,
    restart,
  }
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(emptyOtp())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetFeedback, setResetFeedback] = useState<ResetFeedback | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  const { countdown, canResend, restart } = useResendTimer(step === 2)

  const emailValid = isValidEmail(email)
  const otpComplete = otp.every((digit) => digit.length === 1)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSendCode = async () => {
    if (!emailValid || isSubmitting) return

    setIsSubmitting(true)
    setStepError(null)

    try {
      await sendResetCode(email.trim())
      setStep(2)
      restart()
    } catch (error) {
      setStepError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmOtp = async () => {
    if (!otpComplete || isSubmitting) return

    setIsSubmitting(true)
    setStepError(null)

    try {
      await verifyResetCode(email.trim(), otp.join(''))
      setStep(3)
    } catch (error) {
      setStepError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || isSubmitting) return

    setIsSubmitting(true)
    setStepError(null)

    try {
      await resendResetCode(email.trim())
      setOtp(emptyOtp())
      restart()
    } catch (error) {
      setStepError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!passwordsMatch || isSubmitting) return

    setIsSubmitting(true)
    setStepError(null)

    try {
      await resetPassword({
        email: email.trim(),
        newPassword: password,
        confirmNewPassword: confirmPassword,
      })
      setResetFeedback('success')
      setStep(4)
    } catch (error) {
      if (error instanceof ApiError) {
        setResetFeedback('error')
        setStep(4)
        return
      }
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTryAgain = () => {
    setResetFeedback(null)
    setPassword('')
    setConfirmPassword('')
    setStep(3)
  }

  const title =
    step === 2
      ? t('forgotPassword.otpTitle')
      : step === 3
        ? t('forgotPassword.resetTitle')
        : t('forgotPassword.title')

  const subtitle =
    step === 1
      ? t('forgotPassword.subtitle')
      : step === 2
        ? t('forgotPassword.otpSubtitle')
        : t('forgotPassword.resetSubtitle')

  const primaryDisabled =
    (step === 1 && (!emailValid || isSubmitting)) ||
    (step === 2 && (!otpComplete || isSubmitting)) ||
    (step === 3 && (!passwordsMatch || isSubmitting))

  const primaryLabel =
    step === 1
      ? isSubmitting
        ? t('forgotPassword.sendingCode')
        : t('forgotPassword.sendCode')
      : step === 2
        ? isSubmitting
          ? t('forgotPassword.verifyingCode')
          : t('forgotPassword.confirm')
        : isSubmitting
          ? t('forgotPassword.resetting')
          : t('forgotPassword.resetButton')

  const handlePrimary = () => {
    if (step === 1) void handleSendCode()
    else if (step === 2) void handleConfirmOtp()
    else void handleResetPassword()
  }

  return (
    <AuthLayout>
      <LanguageToggle variant="icon" className="mb-8" />

      {step === 4 && resetFeedback ? (
        <AuthFeedbackScreen
          variant={resetFeedback}
          imageSrc={
            resetFeedback === 'success'
              ? '/password-reset-success.svg'
              : '/password-reset-failure.svg'
          }
          title={
            resetFeedback === 'success'
              ? t('forgotPassword.successTitle')
              : t('forgotPassword.failureTitle')
          }
          description={
            resetFeedback === 'success'
              ? t('forgotPassword.successDescription')
              : t('forgotPassword.failureDescription')
          }
          primaryAction={{
            label:
              resetFeedback === 'success'
                ? t('forgotPassword.backToLogin')
                : t('forgotPassword.tryAgain'),
            onClick:
              resetFeedback === 'success' ? () => navigate('/login') : handleTryAgain,
          }}
          secondaryAction={
            resetFeedback === 'error'
              ? {
                  label: t('forgotPassword.backToLogin'),
                  onClick: () => navigate('/login'),
                }
              : undefined
          }
        />
      ) : (
        <>
          <h1 className="text-h1 text-neutral-900 mb-2">{title}</h1>
          <p className="text-body-1 text-neutral-500 mb-10">{subtitle}</p>

          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-2">
                <label htmlFor="forgot-email" className={authFieldLabelClassName}>
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
                    <AppIcon icon={MailIcon} size={16} />
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    lang="en"
                    placeholder="ex: info@foods.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(inputClassName, englishDigitsClassName, 'ps-10 pe-4')}
                  />
                </div>
              </div>
            )}

            {step === 2 && <OtpInput value={otp} onChange={setOtp} />}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <label htmlFor="new-password" className={authFieldLabelClassName}>
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
                      <AppIcon icon={LockIcon} size={16} />
                    </span>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      lang="en"
                      placeholder={t('auth.password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(inputClassName, englishDigitsClassName, 'ps-10 pe-10')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 end-3 flex items-center text-neutral-400 hover:text-neutral-500 transition-colors"
                    >
                      <AppIcon icon={showPassword ? EyeIcon : EyeSlashIcon} size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-new-password" className={authFieldLabelClassName}>
                    {t('register.confirmPassword')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
                      <AppIcon icon={LockIcon} size={16} />
                    </span>
                    <input
                      id="confirm-new-password"
                      type={showConfirm ? 'text' : 'password'}
                      lang="en"
                      placeholder={t('register.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(inputClassName, englishDigitsClassName, 'ps-10 pe-10')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 end-3 flex items-center text-neutral-400 hover:text-neutral-500 transition-colors"
                    >
                      <AppIcon icon={showConfirm ? EyeIcon : EyeSlashIcon} size={16} />
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-small-light text-error-500">
                      {t('register.passwordMismatch')}
                    </p>
                  )}
                </div>
              </>
            )}

            {stepError && <p className="text-small-light text-error-500">{stepError}</p>}

            <Button
              type="button"
              variant="primary"
              disabled={primaryDisabled}
              onClick={handlePrimary}
              className="w-full h-12 rounded-[var(--radius-sm)] text-[16px] font-medium text-white"
            >
              {primaryLabel}
            </Button>

            {step === 2 && (
              <p className="text-center text-body-2 text-neutral-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={isSubmitting}
                    className="text-body-2-semibold text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {t('forgotPassword.resend')}
                  </button>
                ) : (
                  <Trans
                    i18nKey="forgotPassword.resendIn"
                    values={{ time: countdown }}
                    components={{
                      time: (
                        <span lang="en" dir="ltr" className={englishDigitsLtrClassName} />
                      ),
                    }}
                  />
                )}
              </p>
            )}
          </div>

          {step !== 2 && (
            <p className="text-center text-body-2 text-neutral-500 mt-6">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-body-2-semibold text-blue-500 underline underline-offset-2"
              >
                {t('auth.signIn')}
              </Link>
            </p>
          )}
        </>
      )}
    </AuthLayout>
  )
}
