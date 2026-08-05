import { useTranslation } from 'react-i18next'
import { FormLabel, fieldInputTextClassName } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/auth/OtpInput'
import { AppIcon, MailIcon } from '@/components/icons'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

interface AuditeeVerificationStepProps {
  email: string
  otp: string[]
  codeSent: boolean
  isSendingCode: boolean
  onEmailChange: (email: string) => void
  onOtpChange: (otp: string[]) => void
  onSendCode: () => void
}

/** Step 2 ("verification"): same email + inline "verify" + OTP pattern as the AB/CAB flows. */
export function AuditeeVerificationStep({
  email,
  otp,
  codeSent,
  isSendingCode,
  onEmailChange,
  onOtpChange,
  onSendCode,
}: AuditeeVerificationStepProps) {
  const { t } = useTranslation()
  const emailValid = isValidRequiredEmail(email)
  const emailError = email.trim().length > 0 && !emailValid ? t('validation.invalidEmail') : undefined

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <FormLabel htmlFor="auditee-verification-email" required>
          {t('auth.email')}
        </FormLabel>
        <div
          className={cn(
            'flex h-12 items-center gap-3 rounded-[var(--radius-sm)] border bg-white ps-4 pe-1.5',
            emailError ? 'border-error-400' : 'border-neutral-200'
          )}
        >
          <AppIcon icon={MailIcon} size={20} className="shrink-0 text-primary" />
          <input
            id="auditee-verification-email"
            type="email"
            lang="en"
            placeholder="ex: info@foods.com"
            value={email}
            onChange={(e) => onEmailChange(toEnglishDigits(e.target.value))}
            className={cn(
              'min-w-0 flex-1 bg-transparent pe-1 focus:outline-none',
              fieldInputTextClassName,
              englishDigitsClassName
            )}
          />
          <Button
            type="button"
            variant="primary"
            onClick={onSendCode}
            disabled={!emailValid || isSendingCode}
            className={cn(
              'h-10 w-[131px] shrink-0 gap-[10px] rounded-[var(--radius-sm)] px-6',
              'text-body-2-semibold lowercase'
            )}
          >
            {isSendingCode ? t('register.sendingCode') : t('register.verify')}
          </Button>
        </div>
        {emailError && <p className="text-small-light text-error-500">{emailError}</p>}
      </div>

      {codeSent && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-body-1-medium text-neutral-900">{t('register.emailVerification')}</p>
            <p className="text-body-2 text-neutral-500">{t('register.codeSentPrompt')}</p>
          </div>
          <OtpInput value={otp} onChange={onOtpChange} />
        </div>
      )}
    </div>
  )
}