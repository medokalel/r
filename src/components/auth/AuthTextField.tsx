import type { AppIconComponent } from '@/components/icons'
import { AppIcon } from '@/components/icons'
import { AuthFieldLabel } from '@/components/auth/AuthFieldLabel'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

export const authFieldHeightClassName = 'h-12'

export const authFieldValueClassName = 'text-[16px] font-normal leading-[1.6] text-neutral-900'
export const authFieldPlaceholderClassName = 'text-[16px] font-light leading-[1.6] text-neutral-600'
export const authPlaceholderClassName = 'placeholder-body-2-light placeholder:text-neutral-600'

export const authInputClassName = cn(
  'w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white',
  authFieldHeightClassName,
  authFieldValueClassName,
  authPlaceholderClassName,
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50'
)

export const authSelectClassName = cn(
  'w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white',
  authFieldHeightClassName,
  'px-4 appearance-none cursor-pointer font-sans',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50'
)

export function authSelectFieldClassName(value: string) {
  return cn(
    authSelectClassName,
    value ? authFieldValueClassName : authFieldPlaceholderClassName
  )
}

export interface AuthTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: AppIconComponent
  error?: string
  trailing?: React.ReactNode
  required?: boolean
}

export function AuthTextField({
  label,
  icon,
  error,
  trailing,
  required,
  className,
  id,
  type,
  inputMode,
  onChange,
  ...props
}: AuthTextFieldProps) {
  const usesEnglishDigits =
    type === 'email' ||
    type === 'tel' ||
    type === 'password' ||
    type === 'number' ||
    inputMode === 'numeric' ||
    inputMode === 'decimal'

  const forceLtr =
    type === 'tel' || type === 'number' || inputMode === 'numeric' || inputMode === 'decimal'

  return (
    <div className="space-y-3">
      <AuthFieldLabel htmlFor={id} required={required}>
        {label}
      </AuthFieldLabel>
      <div className="relative">
        <div
          className={cn(
            'flex items-center overflow-hidden rounded-[var(--radius-sm)] border border-neutral-200 bg-white',
            authFieldHeightClassName,
            'focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500',
            error && 'border-error-400 focus-within:ring-error-400',
            className
          )}
        >
          {icon && (
            <span className="flex size-10 shrink-0 items-center justify-center text-primary pointer-events-none">
              <AppIcon icon={icon} size={20} />
            </span>
          )}
          <input
            id={id}
            type={type}
            inputMode={inputMode}
            lang={usesEnglishDigits ? 'en' : undefined}
            dir={forceLtr ? 'ltr' : undefined}
            className={cn(
              'min-w-0 flex-1 h-full bg-transparent focus:outline-none',
              authFieldValueClassName,
              authPlaceholderClassName,
              icon ? 'pe-4' : 'px-4',
              trailing && 'pe-10',
              usesEnglishDigits && englishDigitsClassName,
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            onChange={
              usesEnglishDigits && onChange
                ? (e) => {
                    e.target.value = toEnglishDigits(e.target.value)
                    onChange(e)
                  }
                : onChange
            }
            {...props}
          />
        </div>
        {trailing && (
          <div className="absolute inset-y-0 end-3 flex items-center">{trailing}</div>
        )}
      </div>
      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}

export { authInputClassName as inputClassName }
