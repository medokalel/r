import { AuthFieldLabel } from '@/components/auth/AuthFieldLabel'
import { SelectDropdownIcon } from '@/components/auth/SelectDropdownIcon'
import { authSelectFieldClassName } from '@/components/auth/AuthTextField'
import { cn } from '@/lib/utils'

interface AuthSelectFieldProps {
  id: string
  label: string
  value: string
  placeholder: string
  required?: boolean
  disabled?: boolean
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
}

export function AuthSelectField({
  id,
  label,
  value,
  placeholder,
  required,
  disabled,
  onChange,
  children,
  className,
}: AuthSelectFieldProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <AuthFieldLabel htmlFor={id} required={required}>
        {label}
      </AuthFieldLabel>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={onChange}
          className={cn(
            authSelectFieldClassName(value),
            'pe-10',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <SelectDropdownIcon className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-neutral-900" />
      </div>
    </div>
  )
}
