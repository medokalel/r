import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CloseCircle } from 'iconsax-reactjs'
import { SelectField } from '@/components/ui'
import { FormLabel } from '@/components/ui/FormField'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { WesternDigits } from '@/components/WesternDigits'
import { useDirection } from '@/context/DirectionContext'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { CAB_TYPE_OPTIONS, MOCK_ACCREDITATION_BODIES } from '@/lib/api/cabRegisterApi'
import { cn } from '@/lib/utils'
import type { CabDetailsForm } from '@/lib/cabDetailsForm'

interface ScopeOption {
  value: string
  label: string
}

interface AccreditationScopesMultiSelectProps {
  scopes: string[]
  options: ScopeOption[]
  onChange: (scopes: string[]) => void
  placeholder?: string
}

/**
 * "CAB Type" multi-select for the accreditation-scopes screen: chips are
 * stacked full-width (unlike the compact wrapped pills in `MultiSelect`),
 * matching the "Create New CAB Account" step design.
 */
function AccreditationScopesMultiSelect({
  scopes,
  options,
  onChange,
  placeholder,
}: AccreditationScopesMultiSelectProps) {
  const { dir } = useDirection()
  const labelFor = (value: string) => options.find((option) => option.value === value)?.label ?? value
  const toggleScope = (value: string) =>
    onChange(scopes.includes(value) ? scopes.filter((scope) => scope !== value) : [...scopes, value])

  return (
    <DropdownMenu.Root dir={dir}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex min-h-12 w-full flex-col gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3 py-2.5 text-start',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500'
          )}
        >
          {scopes.length === 0 ? (
            <span className="flex items-center justify-between">
              <span className="text-[16px] font-light leading-[1.6] text-neutral-500">{placeholder}</span>
              <SelectDropdownIcon className="shrink-0 text-neutral-900" />
            </span>
          ) : (
            <>
              {scopes.map((scope) => (
                <span
                  key={scope}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-primary-subtle px-3 py-2.5',
                    fieldTextClassName,
                    'text-neutral-700'
                  )}
                >
                  <WesternDigits>{labelFor(scope)}</WesternDigits>
                  <span
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleScope(scope)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        toggleScope(scope)
                      }
                    }}
                    className="flex shrink-0 cursor-pointer items-center justify-center text-primary"
                    aria-label={`Remove ${labelFor(scope)}`}
                  >
                    <CloseCircle size={20} variant="Linear" />
                  </span>
                </span>
              ))}
              <SelectDropdownIcon className="absolute end-3 top-3 shrink-0 text-neutral-900" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 max-h-60 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-[var(--radius-sm)] border border-neutral-200 bg-white p-1 shadow-lg"
          sideOffset={4}
          align="start"
        >
          {options.map((option) => {
            const selected = scopes.includes(option.value)

            return (
              <DropdownMenu.Item
                key={option.value}
                onSelect={(event) => {
                  event.preventDefault()
                  toggleScope(option.value)
                }}
                className={cn(
                  fieldTextClassName,
                  'flex cursor-pointer select-none items-center gap-3 rounded-[var(--radius-xs)] px-3 py-2 text-neutral-900 outline-none',
                  'data-[highlighted]:bg-neutral-50',
                  selected && 'bg-primary-subtle'
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none',
                    selected ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white'
                  )}
                  aria-hidden
                >
                  {selected ? '✓' : ''}
                </span>
                {option.label}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

interface CabAccreditationScopesStepProps {
  form: CabDetailsForm
  onPatch: (f: Partial<CabDetailsForm>) => void
}

/** Continuation screen of CAB Details (still step 1): scopes + per-scope accreditation details. */
export function CabAccreditationScopesStep({ form, onPatch }: CabAccreditationScopesStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const scopeOptions = useMemo(
    () => CAB_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` })),
    [countries]
  )

  const handleScopesChange = (nextScopes: string[]) => {
    const nextDetails = Object.fromEntries(
      Object.entries(form.accreditationDetails).filter(([scope]) => nextScopes.includes(scope))
    )
    onPatch({ accreditationScopes: nextScopes, accreditationDetails: nextDetails })
  }

  const setScopeDetail = (
    scope: string,
    patch: Partial<{ accreditationBody: string; country: CountryCode }>
  ) => {
    const current = form.accreditationDetails[scope] ?? { accreditationBody: '', country: '' as CountryCode }
    onPatch({
      accreditationDetails: {
        ...form.accreditationDetails,
        [scope]: { ...current, ...patch },
      },
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <FormLabel required>{t('register.cab.cabType')}</FormLabel>
        <AccreditationScopesMultiSelect
          scopes={form.accreditationScopes}
          options={scopeOptions}
          onChange={handleScopesChange}
          placeholder={t('register.cab.cabTypePlaceholder')}
        />
      </div>

      {form.accreditationScopes.map((scope) => {
        const detail = form.accreditationDetails[scope] ?? { accreditationBody: '', country: '' as CountryCode }
        const scopeLabel = scopeOptions.find((option) => option.value === scope)?.label ?? scope

        return (
          <div key={scope} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="text-[15px] font-semibold text-primary">{scopeLabel}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SelectField
                label={t('register.cab.accreditationBodyName')}
                required
                value={detail.accreditationBody}
                placeholder={t('register.cab.accreditationBodyPlaceholder')}
                onChange={(value) => setScopeDetail(scope, { accreditationBody: value })}
                options={MOCK_ACCREDITATION_BODIES}
              />
              <SelectField
                label={t('register.cab.cabCountry')}
                required
                value={detail.country}
                placeholder={t('register.cab.cabCountryPlaceholder')}
                onChange={(value) => setScopeDetail(scope, { country: value as CountryCode })}
                options={countryOptions}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}