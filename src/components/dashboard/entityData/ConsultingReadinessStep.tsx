import { useState } from 'react'
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
import { cn } from '@/lib/utils'

export function ConsultingReadinessStep() {
  const { t } = useTranslation()
  const [qualifiedByConsultant, setQualifiedByConsultant] = useState('yes')
  const [cvAttached, setCvAttached] = useState('yes')
  const [consultantRating, setConsultantRating] = useState<number | null>(5)
  const [recommendationRating, setRecommendationRating] = useState<number | null>(5)
  const [systemLanguage, setSystemLanguage] = useState('arabic')
  const [easySiteAccess, setEasySiteAccess] = useState('yes')
  const [safetyProcedures, setSafetyProcedures] = useState('yes')
  const [subcontracting, setSubcontracting] = useState('yes')
  const [previousGrants, setPreviousGrants] = useState('yes')
  const [otherSelected, setOtherSelected] = useState(false)
  const [selectedISOs, setSelectedISOs] = useState<string[]>([])
  const [designActivity, setDesignActivity] = useState('yes')

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
              value={qualifiedByConsultant}
              onChange={setQualifiedByConsultant}
              options={yesNoOptions}
            />
          </FormField>

          <FormField label={t('accreditation.entityData.fields.consulting.consultantName')} variant="question">
            <TextField
              type="text"
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
              value={cvAttached}
              onChange={setCvAttached}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.consulting.consultationPeriod')}
            variant="question"
          >
            <TextField type="number" min={1} placeholder="0" />
          </FormField>
        </div>

        <FormField
          label={t('accreditation.entityData.fields.consulting.consultantRating')}
          variant="question"
        >
          <RatingScale value={consultantRating} onChange={setConsultantRating} />
          <p className="text-body-3 text-neutral-600">
            {t('accreditation.entityData.fields.consulting.ratingNote')}
          </p>
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.consulting.recommendationRating')}
          variant="question"
        >
          <RatingScale value={recommendationRating} onChange={setRecommendationRating} />
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
              value={systemLanguage}
              onChange={setSystemLanguage}
              options={languageOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.readiness.easySiteAccess')}
            variant="question"
          >
            <RadioGroup
              name="easySiteAccess"
              value={easySiteAccess}
              onChange={setEasySiteAccess}
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
              value={safetyProcedures}
              onChange={setSafetyProcedures}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.readiness.subcontracting')}
            variant="question"
          >
            <RadioGroup
              name="subcontracting"
              value={subcontracting}
              onChange={setSubcontracting}
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
            value={previousGrants}
            onChange={setPreviousGrants}
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
                  otherSelected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedISOs.includes(opt.value)}
                  disabled={otherSelected}
                  onChange={() =>
                    setSelectedISOs((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((v) => v !== opt.value)
                        : [...prev, opt.value]
                    )
                  }
                  className="size-5 accent-primary"
                />
                <span className={cn(fieldTextClassName, 'text-neutral-600')}>{opt.label}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="otherSystem"
                checked={otherSelected}
                onChange={() => {
                  if (!otherSelected) setSelectedISOs([])
                  setOtherSelected((prev) => !prev)
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
              value={designActivity}
              onChange={setDesignActivity}
              options={yesNoOptions}
            />
          </FormField>

          <FormField label={t('accreditation.entityData.fields.readiness.designExceptionReason')}>
            <TextField
              type="text"
              placeholder={t('accreditation.form.stateReasonPlaceholder')}
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  )
}
