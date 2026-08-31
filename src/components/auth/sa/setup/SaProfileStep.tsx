import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SA_INDUSTRY_OPTIONS, SA_SUPPLIER_COUNT_OPTIONS } from '@/lib/api/saSetupApi'
import { isValidEmailFormat } from '@/lib/validators'
import { toEnglishDigits } from '@/lib/englishDigits'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

export function SaProfileStep({ form, onPatch, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const industryOptions = useMemo(
    () => SA_INDUSTRY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const emailError =
    setup.primaryContactEmail.trim().length > 0 && !isValidEmailFormat(setup.primaryContactEmail)
      ? t('validation.invalidEmail')
      : undefined

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="sa-setup-legal-name"
          label={t('sa.setup.profile.legalName')}
          required
          type="text"
          value={form.legalEntityName}
          placeholder={t('sa.setup.profile.legalNamePlaceholder')}
          onChange={(event) => onPatch({ legalEntityName: event.target.value })}
        />
        <SearchableSelect
          id="sa-setup-industry"
          label={t('sa.setup.profile.industry')}
          required
          value={setup.industry}
          onChange={(industry) => onPatchSetup({ industry })}
          options={industryOptions}
          placeholder={t('sa.setup.profile.industryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      {setup.industry === 'OTHER' && (
        <TextField
          id="sa-setup-industry-other"
          label={t('sa.setup.profile.industryOther')}
          required
          type="text"
          value={setup.industryOther}
          placeholder={t('sa.setup.profile.industryOtherPlaceholder')}
          onChange={(event) => onPatchSetup({ industryOther: event.target.value })}
        />
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="sa-setup-registration-number"
          label={t('sa.setup.profile.registrationNumber')}
          type="text"
          value={form.registrationNumber}
          placeholder={t('sa.setup.profile.registrationNumberPlaceholder')}
          onChange={(event) => onPatch({ registrationNumber: event.target.value })}
        />
        <TextField
          id="sa-setup-website"
          label={t('sa.setup.profile.website')}
          type="text"
          lang="en"
          dir="ltr"
          value={form.website}
          placeholder={t('sa.setup.profile.websitePlaceholder')}
          onChange={(event) => onPatch({ website: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="sa-setup-contact-email"
          label={t('sa.setup.profile.contactEmail')}
          required
          type="email"
          lang="en"
          dir="ltr"
          value={setup.primaryContactEmail}
          placeholder={t('sa.setup.profile.contactEmailPlaceholder')}
          onChange={(event) => onPatchSetup({ primaryContactEmail: toEnglishDigits(event.target.value) })}
          error={emailError}
        />
        <SearchableSelect
          id="sa-setup-supplier-count"
          label={t('sa.setup.profile.supplierCount')}
          value={setup.supplierCount}
          onChange={(supplierCount) => onPatchSetup({ supplierCount })}
          options={SA_SUPPLIER_COUNT_OPTIONS}
          placeholder={t('sa.setup.profile.supplierCountPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>
    </div>
  )
}
