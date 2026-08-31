import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { CAB_ACTIVITY_OPTIONS, getYearEstablishedOptions } from '@/lib/api/cabSetupApi'
import { isValidEmailFormat } from '@/lib/validators'
import { toEnglishDigits } from '@/lib/englishDigits'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabProfileStep({ form, onPatch, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()

  const activityOptions = useMemo(
    () => CAB_ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const yearOptions = useMemo(() => getYearEstablishedOptions(), [])

  // Read-only when the org-type screen already pinned exactly one activity.
  const isActivityLocked = form.scopeAreas.length === 1

  const emailError =
    form.cabSetup.primaryContactEmail.trim().length > 0 &&
    !isValidEmailFormat(form.cabSetup.primaryContactEmail)
      ? t('validation.invalidEmail')
      : undefined

  return (
    <div className="w-full space-y-6">

      <TextField
        id="cab-setup-legal-name"
        label={t('cab.setup.profile.legalName')}
        required
        type="text"
        value={form.legalEntityName}
        placeholder={t('cab.setup.profile.legalNamePlaceholder')}
        onChange={(event) => onPatch({ legalEntityName: event.target.value })}
      />

      <TextField
        id="cab-setup-trading-name"
        label={t('cab.setup.profile.tradingName')}
        type="text"
        value={form.tradingName}
        placeholder={t('cab.setup.profile.tradingNamePlaceholder')}
        onChange={(event) => onPatch({ tradingName: event.target.value })}
      />

      <div className="space-y-2">
        <FormLabel required>{t('cab.setup.profile.activity')}</FormLabel>
        <MultiSelect
          tags={form.cabSetup.activities}
          options={activityOptions}
          onChange={(activities) => onPatchSetup({ activities })}
          layout="stacked"
          readOnly={isActivityLocked}
          searchable
          placeholder={t('cab.setup.profile.activityPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SetupNote>{t('cab.setup.profile.activityNote')}</SetupNote>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="cab-setup-registration-number"
          label={t('cab.setup.profile.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('cab.setup.profile.registrationNumberPlaceholder')}
          onChange={(event) => onPatch({ registrationNumber: event.target.value })}
        />
        <TextField
          id="cab-setup-website"
          label={t('cab.setup.profile.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('cab.setup.profile.websitePlaceholder')}
          onChange={(event) => onPatch({ website: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="cab-setup-contact-email"
          label={t('cab.setup.profile.contactEmail')}
          required
          type="email"
          lang="en"
          dir="ltr"
          value={form.cabSetup.primaryContactEmail}
          placeholder={t('cab.setup.profile.contactEmailPlaceholder')}
          onChange={(event) => onPatchSetup({ primaryContactEmail: toEnglishDigits(event.target.value) })}
          error={emailError}
        />
        <TextField
          id="cab-setup-contact-phone"
          label={t('cab.setup.profile.contactPhone')}
          required
          type="tel"
          lang="en"
          dir="ltr"
          value={form.cabSetup.primaryContactPhone}
          placeholder={t('cab.setup.profile.contactPhonePlaceholder')}
          onChange={(event) => onPatchSetup({ primaryContactPhone: toEnglishDigits(event.target.value) })}
        />
      </div>

      <SearchableSelect
        id="cab-setup-year-established"
        label={t('cab.setup.profile.yearEstablished')}
        value={form.cabSetup.yearEstablished}
        onChange={(yearEstablished) => onPatchSetup({ yearEstablished })}
        options={yearOptions}
        placeholder={t('cab.setup.profile.yearEstablishedPlaceholder')}
        searchPlaceholder={t('common.search')}
      />
    </div>
  )
}
