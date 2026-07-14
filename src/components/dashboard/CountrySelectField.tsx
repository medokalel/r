import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/dashboard/FormField'
import { getCountryOptions, type CountryCode, type CountryOption } from '@/lib/countries'

interface CountrySelectFieldProps {
  value: CountryCode | null
  onChange: (code: CountryCode) => void
  className?: string
}

function labelFor(country: CountryOption): string {
  return `${country.flag} ${country.name}`
}

/**
 * Country dropdown with flag + localized name (same look as the register
 * form), backed by ISO country codes so consumers stay language-agnostic.
 */
export function CountrySelectField({ value, onChange, className }: CountrySelectFieldProps) {
  const { i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const selected = countries.find((country) => country.code === value)

  const onLabelChange = (label: string) => {
    const country = countries.find((option) => labelFor(option) === label)
    if (country) onChange(country.code)
  }

  return (
    <SelectField
      value={selected ? labelFor(selected) : ''}
      options={countries.map(labelFor)}
      onChange={onLabelChange}
      className={className}
    />
  )
}
