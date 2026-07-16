import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { nativeSelectClassName } from '@/components/ui/fieldStyles'
import {
  DEFAULT_COUNTRY_CODE,
  getCountryOptions,
  type CountryCode,
} from '@/lib/countries'
import { cn } from '@/lib/utils'

export type { CountryCode }

interface CountryCodeSelectProps {
  value: CountryCode
  onChange: (code: CountryCode) => void
  'aria-label': string
  className?: string
  disabled?: boolean
}

interface PhoneInputRowProps extends CountryCodeSelectProps {
  rowClassName?: string
  children: ReactNode
}

// Phone numbers always read left-to-right, so the flag selector + input row
// keeps LTR order even when the page is RTL.
export function PhoneInputRow({
  rowClassName,
  children,
  ...selectProps
}: PhoneInputRowProps) {
  return (
    <div dir="ltr" className={cn('flex', rowClassName)}>
      <CountryCodeSelect {...selectProps} />
      {children}
    </div>
  )
}

export function CountryCodeSelect({
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
  disabled,
}: CountryCodeSelectProps) {
  const { i18n } = useTranslation()
  const countries = useMemo(
    () => getCountryOptions(i18n.language),
    [i18n.language]
  )
  const selected =
    countries.find((country) => country.code === value) ??
    countries.find((country) => country.code === DEFAULT_COUNTRY_CODE) ??
    countries[0]

  return (
    <div className={cn('relative w-[66px] shrink-0 rounded-[8px] bg-white', className)}>
      <select
        value={selected.code}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CountryCode)}
        className={cn(
          nativeSelectClassName(true),
          'h-full w-full cursor-pointer appearance-none border-0 px-2 pe-5 text-transparent',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code} className="text-neutral-900">
            {country.flag} {country.dial} {country.name}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2"
        aria-hidden
      >
        <img
          src={`https://flagcdn.com/w80/${selected.code.toLowerCase()}.png`}
          alt=""
          className="h-[26px] w-[39px] rounded-[4px] object-cover"
        />
        <SelectDropdownIcon className="shrink-0 text-neutral-900" />
      </span>
    </div>
  )
}
