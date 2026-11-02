import { useEffect, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, PhoneIcon } from '@/components/icons'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { SelectField } from '@/components/ui/Select'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  fieldHeightClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/components/ui/fieldStyles'
import { CAB_PROFESSIONAL_ROLES, toBackendRole } from '@/lib/api/cabEmployeesApi'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import type { CountryCode } from '@/lib/countries'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { cn } from '@/lib/utils'
import {
  includeSavedOptions,
  type PersonnelFormState,
} from '@/components/dashboard/cab/personnelFormHelpers'

const inputClass = `mt-1 ${fieldInputClassName} ${fieldHeightClassName}`

export interface PersonnelPersonalDetailsSectionProps {
  form: PersonnelFormState
  onChangeForm: React.Dispatch<React.SetStateAction<PersonnelFormState>>
  isExistingPerson: boolean
  phoneError?: string
  readingImage: boolean
  onUploadImage: (event: ChangeEvent<HTMLInputElement>) => void
  baseCountryOptions: { value: string; label: string }[]
}

export function PersonnelPersonalDetailsSection({
  form,
  onChangeForm,
  isExistingPerson,
  phoneError,
  readingImage,
  onUploadImage,
  baseCountryOptions,
}: PersonnelPersonalDetailsSectionProps) {
  const { t } = useTranslation()
  const label = (key: string, fallback?: string) =>
    t(`cab.competence.memberProfile.${key}`, fallback ?? key)

  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    let cancelled = false
    const code = form.baseCountry?.trim().toUpperCase()
    const load =
      code && code.length === 2
        ? fetchGovernorateOptions(code as CountryCode)
        : Promise.resolve<GovernorateOption[]>([])
    load
      .then((options) => {
        if (!cancelled) setGovernorates(options)
      })
      .catch(() => {
        if (!cancelled) setGovernorates([])
      })
    return () => {
      cancelled = true
    }
  }, [form.baseCountry])

  const cityOptions = includeSavedOptions(
    governorates.map((g) => ({
      value: g.name.replace(/\s+(Region|Province|Governorate)$/i, ''),
      label: g.name,
    })),
    [form.baseCity],
  )

  return (
    <div>
      <SectionHeading title={label('personalDetails')} accordion>
        <div className="grid gap-5 md:grid-cols-2">
          <label className={`block ${fieldLabelClassName}`}>
            {label('name')} *
            <input
              required
              value={form.name}
              onChange={(e) => onChangeForm((prev) => ({ ...prev, name: e.target.value }))}
              className={inputClass}
            />
          </label>
          <div>
            <span className={`mb-1 block ${fieldLabelClassName}`}>
              {t('cab.competence.role')}
            </span>
            <SelectField
              value={toBackendRole(form.role)}
              onChange={(val) => onChangeForm((prev) => ({ ...prev, role: val }))}
              options={CAB_PROFESSIONAL_ROLES.map((r) => ({
                value: r.value,
                label: r.label,
              }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:col-span-2">
            <label className={`block ${fieldLabelClassName}`}>
              {label('email')} {!isExistingPerson && '*'}
              <input
                type="email"
                required={!isExistingPerson}
                value={form.email}
                onChange={(e) => onChangeForm((prev) => ({ ...prev, email: e.target.value }))}
                className={inputClass}
              />
            </label>
            <div>
              <label htmlFor="personnel-phone" className={`block ${fieldLabelClassName}`}>
                {label('phone')}
              </label>
              <div className="mt-1">
                <PhoneInputRow
                  rowClassName="gap-3"
                  value={form.phoneCountryCode}
                  onChange={(code) =>
                    onChangeForm((prev) => ({ ...prev, phoneCountryCode: code }))
                  }
                  aria-label={t('register.countryCode', 'Country code')}
                  className="border border-neutral-200"
                >
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-blue-500">
                      <AppIcon icon={PhoneIcon} size={20} />
                    </span>
                    <input
                      id="personnel-phone"
                      type="tel"
                      lang="en"
                      dir="ltr"
                      placeholder="ex: 567XXXXXXXX"
                      value={form.phone}
                      onChange={(e) =>
                        onChangeForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className={cn(
                        fieldInputClassName,
                        fieldHeightClassName,
                        'ps-12',
                        phoneError && 'border-error-400 focus-within:ring-error-400',
                      )}
                    />
                  </div>
                </PhoneInputRow>
                {phoneError && (
                  <p className="mt-1 text-small-light text-error-500">{phoneError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Residence location (Country & City) filtered dynamically per iCASCO pattern */}
          <div className="grid gap-5 sm:grid-cols-2 md:col-span-2">
            <SearchableSelect
              id="personnel-base-country"
              label={label('baseCountry', 'Country of residence')}
              value={form.baseCountry}
              options={baseCountryOptions}
              onChange={(baseCountry) =>
                onChangeForm((prev) => ({
                  ...prev,
                  baseCountry,
                  baseCity: prev.baseCountry === baseCountry ? prev.baseCity : '',
                }))
              }
              placeholder={label('baseCountryPlaceholder', 'Select country of residence')}
              searchPlaceholder={t('common.search', 'Search...')}
            />
            <SearchableSelect
              id="personnel-base-city"
              label={label('baseCity', 'City of residence')}
              value={form.baseCity}
              options={cityOptions}
              disabled={!form.baseCountry && cityOptions.length === 0}
              onChange={(baseCity) =>
                onChangeForm((prev) => ({ ...prev, baseCity }))
              }
              placeholder={
                form.baseCountry
                  ? label('baseCityPlaceholder', 'Select city of residence')
                  : t('register.selectCountryFirst', 'Select a country first')
              }
              searchPlaceholder={t('common.search', 'Search...')}
            />
          </div>

          <div className="md:col-span-2">
            <span className={`mb-1.5 block ${fieldLabelClassName}`}>{label('image')}</span>
            <div className="flex flex-wrap items-center gap-4 rounded-[12px] border border-dashed border-primary/30 bg-white p-4">
              {form.avatarUrl ? (
                <img
                  src={resolvePublicAssetUrl(form.avatarUrl)}
                  alt={form.name}
                  className="size-16 shrink-0 rounded-full object-cover shadow-xs"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[16px] font-bold text-primary">
                  {(form.name || 'EM').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={readingImage}
                  onChange={onUploadImage}
                  className="block w-full text-[13px] text-neutral-600 file:me-4 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#e8edfc] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-[#1236a3] hover:file:bg-[#dbe4fb]"
                />
                <span className="block text-[12px] font-normal text-neutral-500">
                  {label('imageHelp')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionHeading>
    </div>
  )
}
