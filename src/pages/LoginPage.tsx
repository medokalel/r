import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '@/lib/api/authApi'
import { ApiError } from '@/lib/api/client'
import { getAuthToken, saveAuthSession } from '@/lib/authStorage'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { authFieldLabelClassName } from '@/components/auth/AuthFieldLabel'
import { authFieldValueClassName } from '@/components/auth/AuthTextField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { isValidEmail } from '@/lib/authValidation'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { AppIcon, EyeIcon, EyeSlashIcon, LockIcon, MailIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const inputClassName = cn(
  'w-full h-12 rounded-[var(--radius-sm)] border border-neutral-200 bg-white text-body-2 text-neutral-900',
  'placeholder-body-2-light placeholder:text-neutral-400',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'transition-colors'
)

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (getAuthToken()) {
      navigate('/certification-request', { replace: true })
    }
  }, [navigate])

  const emailError =
    form.email.trim().length > 0 && !isValidEmail(form.email)
      ? t('validation.invalidEmail')
      : undefined

  const canSubmit =
    isValidEmail(form.email) &&
    form.password.trim().length > 0 &&
    !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const data = await login(form.email.trim(), form.password)
      saveAuthSession(data, rememberMe)
      navigate('/certification-request', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message)
      } else {
        setSubmitError(t('errors.generic'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <LanguageToggle variant="icon" className="mb-8" />

      <h1 className="text-h1 text-neutral-900 mb-2">{t('auth.loginTitle')}</h1>
      <p className="text-body-1 text-neutral-500 mb-10">{t('auth.loginSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className={authFieldLabelClassName}>
            {t('auth.email')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
              <AppIcon icon={MailIcon} size={16} />
            </span>
            <input
              id="email"
              type="email"
              lang="en"
              placeholder="ex: info@foods.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: toEnglishDigits(e.target.value) })
              }
              required
              className={cn(
                'w-full h-12 rounded-[var(--radius-sm)] border bg-white',
                emailError
                  ? 'border-error-400 focus:ring-error-400 focus:border-error-400'
                  : 'border-neutral-200 focus:ring-blue-500 focus:border-blue-500',
                authFieldValueClassName,
                'placeholder:text-[16px] placeholder:font-light placeholder:leading-[1.6] placeholder:text-neutral-600',
                'focus:outline-none focus:ring-1 transition-colors',
                englishDigitsClassName,
                'ps-10 pe-4'
              )}
            />
          </div>
          {emailError && <p className="text-small-light text-error-500">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className={authFieldLabelClassName}>
            {t('auth.password')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
              <AppIcon icon={LockIcon} size={16} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              lang="en"
              placeholder={t('auth.password')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
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

        <div className="flex items-center gap-2.5">
          <Checkbox.Root
            id="remember"
            checked={rememberMe}
            onCheckedChange={(v) => setRememberMe(Boolean(v))}
            className={cn(
              'h-4 w-4 rounded-[var(--radius-xs)] border border-neutral-200 bg-white',
              'data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'transition-colors flex items-center justify-center shrink-0'
            )}
          >
            <Checkbox.Indicator>
              <CheckIcon className="text-white w-3 h-3" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="remember" className="text-body-3 text-neutral-500 cursor-pointer select-none">
            {t('auth.rememberMe')}
          </label>
        </div>

        {submitError && (
          <p className="text-small-light text-error-500">{submitError}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          className="w-full h-12 rounded-[var(--radius-sm)] text-[16px] font-medium text-white"
        >
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/forgot-password"
          className="text-body-2 text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          {t('auth.forgotPassword')}
        </Link>
      </div>

      <p className="text-center text-body-2 text-neutral-500 mt-4">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-body-2-semibold text-blue-500 underline underline-offset-2">
          {t('auth.registerNow')}
        </Link>
      </p>
    </AuthLayout>
  )
}
