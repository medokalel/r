import { useState } from 'react'
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
import { cn } from '@/lib/utils'

const defaultAddress =
  '9000 Prince Miteb, Al Aziziyah District - Jeddah 23342 - 3041, Unit No. 7, Kingdom of Saudi Arabia.'

const AR_BOLD_PHRASES = ['اسم الجهة', 'اسم المواصفة', 'جهة المنح']

function boldPlaceholders(text: string) {
  return text
    .split(new RegExp(`(\\[.*?\\]|${AR_BOLD_PHRASES.join('|')})`, 'g'))
    .map((part, i) =>
      /^\[.*\]$/.test(part) || AR_BOLD_PHRASES.includes(part)
        ? <span key={i} className="font-semibold">{part}</span>
        : part
    )
}

export function LegalDeclarationsStep() {
  const { t } = useTranslation()
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <div className="flex-1 space-y-5">
      {/* Section 1 */}
      <SectionHeading title={t('accreditation.entityData.fields.legal.sectionOneTitle')} />
      <FormSection>
        <div className="space-y-5 rounded-[var(--radius-sm)] bg-white p-5 text-neutral-900">
          <p className={cn(fieldBodyTextClassName, 'field-text')}>{boldPlaceholders(t('accreditation.entityData.fields.legal.greeting'))}</p>
          <p className={cn(fieldBodyTextClassName, 'field-text whitespace-pre-wrap')}>
            {boldPlaceholders(t('accreditation.entityData.fields.legal.applicationBody'))}
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
                placeholder={t('accreditation.entityData.fields.legal.signatoryPlaceholder')}
              />
            </FormField>

            <FormField label={t('accreditation.entityData.fields.legal.date')} required variant="question">
              <DatePicker />
            </FormField>
          </div>
        </div>
      </FormSection>

      {/* Section 2 */}
      <SectionHeading title={t('accreditation.entityData.fields.legal.sectionTwoTitle')} />
      <FormSection>
        <div className="rounded-[var(--radius-sm)] bg-white p-5 text-[#3d3d3d]">
          <p className={cn(fieldBodyTextClassName, 'field-text mb-4')}>{boldPlaceholders(t('accreditation.entityData.fields.legal.confidentialityIntro'))}</p>
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

      {/* Certificate Data */}
      <SectionHeading title={t('accreditation.entityData.fields.legal.certificateDataTitle')} />
      <FormSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.legal.certificateNameAr')}
            required
            variant="question"
          >
            <TextField
              type="text"
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
              defaultValue="Meyar Arabia Company For Commercial Services (MAC)"
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.legal.certificateAddressAr')}
            required
            variant="question"
          >
            <TextField type="text" defaultValue={defaultAddress} />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.legal.certificateAddressEn')}
            required
            variant="question"
          >
            <TextField
              type="text"
              defaultValue="Prince Miteb, Al Aziziyah District - Jeddah 23342 - 3041, Unit No.: 7 Kingdom of Saudi Arabia. 9000"
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
              placeholder={t('accreditation.entityData.fields.legal.certificateFieldArPlaceholder')}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.legal.certificateFieldEn')}
            required
            variant="question"
          >
            <TextField type="text" defaultValue="Ex: Chemicals" />
          </FormField>
        </div>
      </FormSection>

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
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
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
