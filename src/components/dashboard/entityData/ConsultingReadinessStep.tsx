import { useTranslation } from 'react-i18next'
import {
  FormField,
  FormSection,
  RadioGroup,
  RatingScale,
  TextField,
  fieldTextClassName,
} from '@/components/ui'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import type { YesNo } from '@/components/dashboard/entityData/applicationTypes'
import { cn } from '@/lib/utils'

export function ConsultingReadinessStep() {
  const { t } = useTranslation()
  const { form, update } = useApplicationForm()

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const languageOptions = [
    { value: 'arabic', label: t('accreditation.entityData.fields.readiness.arabic') },
    { value: 'english', label: t('accreditation.entityData.fields.readiness.english') },
  ]

  const isoSystemOptions = [
    { value: 'iso9001', label: 'ISO 9001' },
    { value: 'iso14001', label: 'ISO 14001' },
    { value: 'iso45001', label: 'ISO 45001' },
    { value: 'iso22000', label: 'ISO 22000' },
  ]

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading title={t('accreditation.entityData.fields.consulting.title')} />
      <FormSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.consulting.qualifiedByConsultant')}
            variant="question"
          >
            <RadioGroup
              name="qualifiedByConsultant"
              value={form.usedConsultant}
              onChange={(v) => update('usedConsultant', v as YesNo)}
              options={yesNoOptions}
            />
          </FormField>

          <FormField label={t('accreditation.entityData.fields.consulting.consultantName')} variant="question">
            <TextField
              type="text"
              value={form.consultantName}
              onChange={(e) => update('consultantName', e.target.value)}
              placeholder={t('accreditation.entityData.fields.consulting.consultantNamePlaceholder')}
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.consulting.cvAttached')}
            variant="question"
          >
            <RadioGroup
              name="cvAttached"
              value={form.consultantCvAttached}
              onChange={(v) => update('consultantCvAttached', v as YesNo)}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.consulting.consultationPeriod')}
            variant="question"
          >
            <TextField
              type="number"
              min={1}
              value={form.consultancyMonths}
              onChange={(e) => update('consultancyMonths', e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <FormField
          label={t('accreditation.entityData.fields.consulting.consultantRating')}
          variant="question"
        >
          <RatingScale
            value={form.qualificationRate}
            onChange={(value) => update('qualificationRate', value)}
          />
          <p className="text-body-3 text-neutral-600">
            {t('accreditation.entityData.fields.consulting.ratingNote')}
          </p>
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.consulting.recommendationRating')}
          variant="question"
        >
          <RatingScale
            value={form.recommendationRate}
            onChange={(value) => update('recommendationRate', value)}
          />
          <p className="text-body-3 text-neutral-600">
            {t('accreditation.entityData.fields.consulting.ratingNote')}
          </p>
        </FormField>
      </FormSection>

      <SectionHeading title={t('accreditation.entityData.fields.readiness.title')} />
      <FormSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.readiness.systemLanguage')}
            variant="question"
          >
            <RadioGroup
              name="systemLanguage"
              value={form.systemLanguage}
              onChange={(v) => update('systemLanguage', v as 'arabic' | 'english')}
              options={languageOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.readiness.easySiteAccess')}
            variant="question"
          >
            <RadioGroup
              name="easySiteAccess"
              value={form.easyAccess}
              onChange={(v) => update('easyAccess', v as YesNo)}
              options={yesNoOptions}
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.readiness.safetyProcedures')}
            variant="question"
          >
            <RadioGroup
              name="safetyProcedures"
              value={form.safetyProcedures}
              onChange={(v) => update('safetyProcedures', v as YesNo)}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.readiness.subcontracting')}
            variant="question"
          >
            <RadioGroup
              name="subcontracting"
              value={form.usesSubcontractors}
              onChange={(v) => update('usesSubcontractors', v as YesNo)}
              options={yesNoOptions}
            />
          </FormField>
        </div>

        <FormField
          label={t('accreditation.entityData.fields.readiness.previousGrants')}
          variant="question"
          className="max-w-2xl"
        >
          <RadioGroup
            name="previousGrants"
            value={form.previousGrants}
            onChange={(v) => update('previousGrants', v as YesNo)}
            options={yesNoOptions}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.readiness.otherManagementSystems')}
          variant="question"
        >
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            {isoSystemOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center gap-2',
                  form.otherSystemSelected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                )}
              >
                <input
                  type="checkbox"
                  checked={form.currentSystems.includes(opt.value)}
                  disabled={form.otherSystemSelected}
                  onChange={() =>
                    update(
                      'currentSystems',
                      form.currentSystems.includes(opt.value)
                        ? form.currentSystems.filter((v) => v !== opt.value)
                        : [...form.currentSystems, opt.value]
                    )
                  }
                  className="size-5 accent-primary"
                />
                <span className={cn(fieldTextClassName, 'text-neutral-600')}>{opt.label}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.otherSystemSelected}
                onChange={() => {
                  // "Other" is exclusive — picking it clears the ISO choices
                  if (!form.otherSystemSelected) update('currentSystems', [])
                  update('otherSystemSelected', !form.otherSystemSelected)
                }}
                className="size-5 accent-primary"
              />
              <span className={cn(fieldTextClassName, 'text-neutral-600')}>
                {t('accreditation.entityData.fields.readiness.other')}
              </span>
            </label>
          </div>
        </FormField>

        <FormField label={t('accreditation.entityData.fields.readiness.otherSpecification')}>
          <TextField
            type="text"
            value={form.otherSpecification}
            onChange={(e) => update('otherSpecification', e.target.value)}
            placeholder={t('accreditation.entityData.fields.readiness.other')}
          />
        </FormField>
      </FormSection>

      <SectionHeading title={t('accreditation.entityData.fields.readiness.designActivities')} />
      <FormSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.readiness.designActivity')}
            required
            variant="question"
          >
            <RadioGroup
              name="designActivity"
              value={form.designActivity}
              onChange={(v) => {
                update('designActivity', v as YesNo)
                // The exception reason only applies when the answer is "no"
                if (v === 'yes') update('designException', '')
              }}
              options={yesNoOptions}
            />
          </FormField>

          <FormField label={t('accreditation.entityData.fields.readiness.designExceptionReason')}>
            <TextField
              type="text"
              value={form.designException}
              onChange={(e) => update('designException', e.target.value)}
              placeholder={t('accreditation.form.stateReasonPlaceholder')}
              disabled={form.designActivity !== 'no'}
              className="disabled:cursor-not-allowed disabled:bg-[#efefef]"
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  )
}
