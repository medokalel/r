import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  FormSection,
  RadioGroup,
  fieldHeightClassName,
  fieldInputClassName,
  fieldTextareaClassName,
} from '@/components/dashboard/FormField'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'

export function SpecificationQuestionsStep() {
  const { t } = useTranslation()
  const [energyBaseline, setEnergyBaseline] = useState('yes')
  const [baselineUpdatedDate, setBaselineUpdatedDate] = useState<Date | undefined>()
  const [ohsSystemInPlace, setOhsSystemInPlace] = useState('yes')
  const [ohsStartDate, setOhsStartDate] = useState<Date | undefined>()
  const [risksIdentified, setRisksIdentified] = useState('yes')
  const [internalAudits, setInternalAudits] = useState('yes')
  const [legalViolations, setLegalViolations] = useState('yes')
  const [ohsCertification, setOhsCertification] = useState('yes')

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading title="ISO 50001:2018" />
      <FormSection>
        <FormField
          label={t('accreditation.entityData.fields.spec.iso50001.energyConsumers')}
          required
          variant="question"
        >
          <textarea
            placeholder={t('accreditation.entityData.fields.common.writeHere')}
            className={fieldTextareaClassName}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.spec.iso50001.enpi')}
          required
          variant="question"
        >
          <textarea
            placeholder={t('accreditation.entityData.fields.common.writeHere')}
            className={fieldTextareaClassName}
          />
        </FormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.spec.iso50001.energyBaseline')}
            required
            variant="question"
          >
            <RadioGroup
              name="energyBaseline"
              value={energyBaseline}
              onChange={setEnergyBaseline}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.spec.iso50001.baselineUpdated')}
            required
            variant="question"
          >
            <DatePicker value={baselineUpdatedDate} onChange={setBaselineUpdatedDate} />
          </FormField>
        </div>

        <FormField
          label={t('accreditation.entityData.fields.spec.iso50001.monitoringTools')}
          required
          variant="question"
        >
          <textarea
            placeholder={t('accreditation.entityData.fields.common.writeHere')}
            className={fieldTextareaClassName}
          />
        </FormField>
      </FormSection>

      <SectionHeading title="ISO 45001:2018" />
      <FormSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.spec.iso45001.ohsSystemInPlace')}
            required
            variant="question"
          >
            <RadioGroup
              name="ohsSystemInPlace"
              value={ohsSystemInPlace}
              onChange={setOhsSystemInPlace}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.spec.iso45001.ohsStartDate')}
            required
            variant="question"
          >
            <DatePicker value={ohsStartDate} onChange={setOhsStartDate} />
          </FormField>
        </div>

        <FormField
          label={t('accreditation.entityData.fields.spec.iso45001.risksIdentified')}
          required
          variant="question"
        >
          <RadioGroup
            name="risksIdentified"
            value={risksIdentified}
            onChange={setRisksIdentified}
            options={yesNoOptions}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.spec.iso45001.criticalRisks')}
          required
          variant="question"
        >
          <textarea
            placeholder={t('accreditation.entityData.fields.common.writeHere')}
            className={fieldTextareaClassName}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.spec.iso45001.internalAudits')}
          required
          variant="question"
        >
          <RadioGroup
            name="internalAudits"
            value={internalAudits}
            onChange={setInternalAudits}
            options={yesNoOptions}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.spec.iso45001.complianceLaws')}
          required
          variant="question"
        >
          <textarea
            placeholder={t('accreditation.entityData.fields.common.writeHere')}
            className={fieldTextareaClassName}
          />
        </FormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField
            label={t('accreditation.entityData.fields.spec.iso45001.legalViolations')}
            required
            variant="question"
          >
            <RadioGroup
              name="legalViolations"
              value={legalViolations}
              onChange={setLegalViolations}
              options={yesNoOptions}
            />
          </FormField>

          <FormField
            label={t('accreditation.entityData.fields.spec.iso45001.ohsCertification')}
            required
            variant="question"
          >
            <RadioGroup
              name="ohsCertification"
              value={ohsCertification}
              onChange={setOhsCertification}
              options={yesNoOptions}
            />
          </FormField>
        </div>

        <FormField label={t('accreditation.entityData.fields.spec.iso45001.certifyingBody')}>
          <input
            type="text"
            placeholder={t('accreditation.entityData.fields.common.writeHere')}
            className={cn(fieldInputClassName, fieldHeightClassName)}
          />
        </FormField>
      </FormSection>
    </div>
  )
}
