import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { AppIcon, EyeIcon, EyeSlashIcon, LockIcon, MailIcon } from '@/components/icons'
import { SelectField, TextField } from '@/components/ui'
import { CAB_ROLE_OPTIONS } from '@/lib/api/cabRegisterApi'
import { isValidPassword, passwordsMatch } from '@/lib/authValidation'
import { cn } from '@/lib/utils'
import { type CabAccountSetupForm } from '@/lib/cabAccountSetupForm'

export type { CabAccountSetupForm }

interface CabAccountSetupStepProps {
  form: CabAccountSetupForm
  onPatch: (f: Partial<CabAccountSetupForm>) => void
}

/** Step 4 ("Account setup"): admin name/role/email + password + privacy consent. */
export function CabAccountSetupStep({ form, onPatch }: CabAccountSetupStepProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const adminRoleOptions = useMemo(
    () => CAB_ROLE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  const passwordError =
    form.password.length > 0 && !isValidPassword(form.password)
      ? t('validation.passwordTooShort')
      : undefined
  const confirmError =
    form.confirmPassword.length > 0 && !passwordsMatch(form.password, form.confirmPassword)
      ? t('register.passwordMismatch')
      : undefined

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="admin-name"
          label={t('register.cab.adminName')}
          required
          placeholder={t('register.cab.adminNamePlaceholder')}
          value={form.adminName}
          onChange={(e) => onPatch({ adminName: e.target.value })}
        />
        <SelectField
          id="admin-role"
          label={t('register.cab.adminRole')}
          required
          value={form.adminRole}
          placeholder={t('register.cab.adminRolePlaceholder')}
          onChange={(value) => onPatch({ adminRole: value })}
          options={adminRoleOptions}
        />
      </div>

      <TextField
        id="admin-email"
        label={t('register.cab.adminEmail')}
        icon={MailIcon}
        required
        type="email"
        lang="en"
        placeholder="ex: info@foods.com"
        value={form.adminEmail}
        onChange={(e) => onPatch({ adminEmail: e.target.value })}
      />

      <TextField
        id="password"
        label={t('auth.password')}
        icon={LockIcon}
        type={showPassword ? 'text' : 'password'}
        placeholder={t('auth.password')}
        value={form.password}
        onChange={(e) => onPatch({ password: e.target.value })}
        error={passwordError}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <AppIcon icon={showPassword ? EyeIcon : EyeSlashIcon} size={20} />
          </button>
        }
      />

      <TextField
        id="confirm-password"
        label={t('register.confirmPassword')}
        icon={LockIcon}
        type={showConfirm ? 'text' : 'password'}
        placeholder={t('register.confirmPasswordPlaceholder')}
        value={form.confirmPassword}
        onChange={(e) => onPatch({ confirmPassword: e.target.value })}
        error={confirmError}
        trailing={
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            <AppIcon icon={showConfirm ? EyeIcon : EyeSlashIcon} size={20} />
          </button>
        }
      />

      <div className="flex items-center gap-2 justify-start">
        <Checkbox.Root
          id="cab-privacy"
          checked={form.agreePrivacy}
          onCheckedChange={(v) => onPatch({ agreePrivacy: Boolean(v) })}
          className={cn(
            'h-5 w-5 rounded-[var(--radius-xs)] border border-neutral-200 bg-white',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
            'flex items-center justify-center shrink-0'
          )}
        >
          <Checkbox.Indicator>
            <CheckIcon className="text-white w-3.5 h-3.5" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="cab-privacy" className="text-body-2-medium text-primary cursor-pointer">
          {t('register.agreePrivacyLead')}{' '}
        </label>
        <Link
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-2-medium text-primary underline hover:opacity-80"
        >
          {t('register.privacyPolicy')}
        </Link>
      </div>
    </div>
  )
}