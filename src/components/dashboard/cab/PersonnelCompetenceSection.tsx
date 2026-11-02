import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import type { UploadedDocumentFile } from '@/components/dashboard/DocumentUploadField'
import { DatePicker } from '@/components/ui/DatePicker'
import { fieldLabelClassName } from '@/components/ui/fieldStyles'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getIafCodeOptions } from '@/lib/iafCodes'
import { PersonnelQualificationsSection } from '@/components/dashboard/cab/PersonnelQualificationsSection'
import {
  AUDIT_LANGUAGE_OPTIONS,
  fromIsoDate,
  includeSavedOptions,
  toIsoDate,
  type PersonnelFormState,
  type QualificationCategoryItem,
} from '@/components/dashboard/cab/personnelFormHelpers'

export interface PersonnelCompetenceSectionProps {
  form: PersonnelFormState
  onChangeForm: React.Dispatch<React.SetStateAction<PersonnelFormState>>
  schemeOptions: { value: string; label: string }[]
  sectorOptions: { value: string; label: string }[]
  countryOptions: { value: string; label: string }[]
  savedEmployeeId?: string
  qualCategories: QualificationCategoryItem[]
  onChangeQualCategories: React.Dispatch<React.SetStateAction<QualificationCategoryItem[]>>
  uncategorizedFiles: UploadedDocumentFile[]
  onChangeUncategorizedFiles: React.Dispatch<React.SetStateAction<UploadedDocumentFile[]>>
  loadingQuals: boolean
  isSubmitting: boolean
  onBusyChange: (busy: boolean) => void
  onError: (message: string, details?: string[]) => void
}

export function PersonnelCompetenceSection({
  form,
  onChangeForm,
  schemeOptions,
  sectorOptions,
  countryOptions,
  savedEmployeeId,
  qualCategories,
  onChangeQualCategories,
  uncategorizedFiles,
  onChangeUncategorizedFiles,
  loadingQuals,
  isSubmitting,
  onBusyChange,
  onError,
}: PersonnelCompetenceSectionProps) {
  const { t, i18n } = useTranslation()
  const label = (key: string, fallback?: string) =>
    t(`cab.competence.memberProfile.${key}`, fallback ?? key)

  const languageOptions = includeSavedOptions(
    AUDIT_LANGUAGE_OPTIONS.map((lang) => ({
      value: lang.value,
      label: t(`cab.competence.languages.${lang.key}`, lang.defaultLabel),
    })),
    form.auditLanguages,
  )

  return (
    <div>
      <SectionHeading title={label('competenceDetails')} accordion>
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset>
            <legend className={`mb-1 ${fieldLabelClassName}`}>{label('iafCodes')}</legend>
            <MultiSelect
              tags={form.iafCodes}
              options={getIafCodeOptions(i18n.language)}
              onChange={(iafCodes) => onChangeForm((prev) => ({ ...prev, iafCodes }))}
              searchable
              placeholder={label('iafCodes')}
            />
          </fieldset>
          <fieldset>
            <legend className={`mb-1 ${fieldLabelClassName}`}>
              {t('cab.competence.columns.schemes')}
            </legend>
            <MultiSelect
              tags={form.schemes}
              options={schemeOptions}
              searchable
              onChange={(schemes) => onChangeForm((prev) => ({ ...prev, schemes }))}
              placeholder={t('cab.competence.columns.schemes')}
            />
            <p className="mt-2 text-sm text-neutral-500">
              Additional schemes must first be configured in the{' '}
              <a className="text-primary underline" href="/cab/company-profile">
                CAB company profile
              </a>{' '}
              before they can be assigned.
            </p>
          </fieldset>
          <SearchableSelect
            id="personnel-sector"
            label={t('cab.competence.authorizedScope')}
            value={form.authorizedScope}
            options={sectorOptions}
            onChange={(authorizedScope) =>
              onChangeForm((prev) => ({ ...prev, authorizedScope }))
            }
            placeholder={t('cab.competence.authorizedScope')}
          />
          <SearchableSelect
            id="personnel-country"
            label={t('cab.competence.country')}
            value={form.country}
            options={countryOptions}
            onChange={(country) => onChangeForm((prev) => ({ ...prev, country }))}
            placeholder={t('cab.competence.country')}
          />
          <fieldset>
            <legend className={`mb-1 ${fieldLabelClassName}`}>
              {label('auditLanguages', 'Audit languages')}
            </legend>
            <MultiSelect
              tags={form.auditLanguages}
              options={languageOptions}
              searchable
              onChange={(auditLanguages) =>
                onChangeForm((prev) => ({ ...prev, auditLanguages }))
              }
              placeholder={label('auditLanguagesPlaceholder', 'Select audit languages')}
            />
          </fieldset>
          <div>
            <span className={`block ${fieldLabelClassName}`}>
              {t('cab.competence.memberProfile.expiryDate', 'Expiry (optional)')}
            </span>
            <div className="mt-1">
              <DatePicker
                value={fromIsoDate(form.expiryDate)}
                onChange={(date) =>
                  onChangeForm((prev) => ({ ...prev, expiryDate: toIsoDate(date) }))
                }
              />
            </div>
          </div>

          <PersonnelQualificationsSection
            savedEmployeeId={savedEmployeeId}
            qualCategories={qualCategories}
            onChangeQualCategories={onChangeQualCategories}
            uncategorizedFiles={uncategorizedFiles}
            onChangeUncategorizedFiles={onChangeUncategorizedFiles}
            loadingQuals={loadingQuals}
            isSubmitting={isSubmitting}
            onBusyChange={onBusyChange}
            onError={onError}
          />
        </div>
      </SectionHeading>
    </div>
  )
}
