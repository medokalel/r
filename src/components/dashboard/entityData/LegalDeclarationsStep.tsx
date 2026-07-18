import { useTranslation } from 'react-i18next'
import {
  FormField,
  FormSection,
  RequiredMark,
  TextField,
  fieldBodyTextClassName,
  fieldLabelClassName,
} from '@/components/ui'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { DatePicker } from '@/components/ui/DatePicker'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import { cn } from '@/lib/utils'

/** Name of the granting certification body shown in the declaration letter. */
const CB_NAME = 'iCasco'

const AR_BOLD_PHRASES = ['اسم الجهة', 'اسم المواصفة', 'جهة المنح']

function boldPlaceholders(text: string, replacements: Record<string, string>) {
  return text
    .split(new RegExp(`(\\[.*?\\]|${AR_BOLD_PHRASES.join('|')})`, 'g'))
    .map((part, i) =>
      /^\[.*\]$/.test(part) || AR_BOLD_PHRASES.includes(part) ? (
        <span key={i} className="font-semibold">
          {replacements[part] || part}
        </span>
      ) : (
        part
      )
    )
}

export function LegalDeclarationsStep() {
  const { t, i18n } = useTranslation()
  const { form, update } = useApplicationForm()

  const standardNames = form.selectedStandards
    .map((standard) => t(`accreditation.entityData.field.standards.${standard}`))
    .join(i18n.dir() === 'rtl' ? '، ' : ', ')

  // The bold placeholder phrases render the real application data once known
  const replacements: Record<string, string> = {
    'اسم الجهة': form.organizationName,
    '[Name of the Entity]': form.organizationName,
    'اسم المواصفة': standardNames,
    '[Name of the Standard]': standardNames,
    'جهة المنح': CB_NAME,
    '[CB Name]': CB_NAME,
  }

  return (
    <div className="flex-1 space-y-5">
      {/* Section 1 */}
      <SectionHeading title={t('accreditation.entityData.fields.consulting.title')} accordion>
        <FormSection>
          <div className="space-y-5 rounded-[var(--radius-sm)] bg-white p-5 text-neutral-900">
            <p className={cn(fieldBodyTextClassName, 'field-text')}>{boldPlaceholders(t('accreditation.entityData.fields.legal.greeting'), replacements)}</p>
            <p className={cn(fieldBodyTextClassName, 'field-text whitespace-pre-wrap')}>
              {boldPlaceholders(t('accreditation.entityData.fields.legal.applicationBody'), replacements)}
            </p>
            <p className={cn(fieldBodyTextClassName, 'field-text')}>{t('accreditation.entityData.fields.legal.closing')}</p>

            <div className="grid gap-5 pt-2 lg:grid-cols-2">
              <FormField
                label={t('accreditation.entityData.fields.legal.authorizedSignatory')}
                required
                variant="question"
              >
                <TextField
                  type="text"
                  value={form.signatoryName}
                  onChange={(e) => update('signatoryName', e.target.value)}
                  placeholder={t('accreditation.entityData.fields.legal.signatoryPlaceholder')}
                />
              </FormField>

              <FormField label={t('accreditation.entityData.fields.legal.date')} required variant="question">
                <DatePicker
                  value={form.declarationDate}
                  onChange={(date) => update('declarationDate', date)}
                />
              </FormField>
            </div>
          </div>
        </FormSection>
      </SectionHeading>

      {/* Section 2 */}
      <SectionHeading title={t('accreditation.entityData.fields.consulting.title')} accordion>
        <FormSection>
          <div className="rounded-[var(--radius-sm)] bg-white p-5 text-[#3d3d3d]">
            <p className={cn(fieldBodyTextClassName, 'field-text mb-4')}>{boldPlaceholders(t('accreditation.entityData.fields.legal.confidentialityIntro'), replacements)}</p>
            <ul className="space-y-2 ps-2">
              {[
                t('accreditation.entityData.fields.legal.confidentialityItem1'),
                t('accreditation.entityData.fields.legal.confidentialityItem2'),
                t('accreditation.entityData.fields.legal.confidentialityItem3'),
              ].map((item, i) => (
                <li key={i} className={cn(fieldBodyTextClassName, 'field-text flex gap-2')}>
                  <span className="mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </FormSection>
      </SectionHeading>

      {/* Certificate Data */}
      <SectionHeading title={t('accreditation.entityData.fields.consulting.title')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.legal.certificateNameAr')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateNameAr}
                onChange={(e) => update('certificateNameAr', e.target.value)}
                placeholder={t('accreditation.entityData.fields.legal.certificateNameArPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.legal.certificateNameEn')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateNameEn}
                onChange={(e) => update('certificateNameEn', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.legal.certificateAddressAr')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateAddressAr}
                onChange={(e) => update('certificateAddressAr', e.target.value)}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.legal.certificateAddressEn')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateAddressEn}
                onChange={(e) => update('certificateAddressEn', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField
              label={t('accreditation.entityData.fields.legal.certificateFieldAr')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateScopeAr}
                onChange={(e) => update('certificateScopeAr', e.target.value)}
                placeholder={t('accreditation.entityData.fields.legal.certificateFieldArPlaceholder')}
              />
            </FormField>

            <FormField
              label={t('accreditation.entityData.fields.legal.certificateFieldEn')}
              required
              variant="question"
            >
              <TextField
                type="text"
                value={form.certificateScopeEn}
                onChange={(e) => update('certificateScopeEn', e.target.value)}
                placeholder="Ex: Chemicals"
              />
            </FormField>
          </div>
        </FormSection>
      </SectionHeading>

      {/* Acknowledgement */}
      <div className="space-y-4 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-6">
        <div className="rounded-[var(--radius-sm)] bg-[#FCEAE84D] px-4 py-3">
          <p className="field-text text-[18px] leading-[1.6] text-error-500">
            {t('accreditation.entityData.fields.legal.submissionWarning')}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={form.agreed}
            onChange={(e) => update('agreed', e.target.checked)}
            className="mt-1 size-5 accent-primary"
          />
          <span className={fieldLabelClassName}>
            {t('accreditation.entityData.fields.legal.acknowledgement')}
            <RequiredMark />
          </span>
        </label>
      </div>
    </div>
  )
}
