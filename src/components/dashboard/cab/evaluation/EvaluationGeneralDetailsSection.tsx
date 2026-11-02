import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  fieldInputClassName,
  fieldHeightClassName,
  fieldLabelClassName,
} from '@/components/ui/fieldStyles'
import { AppIcon, ChevronDownIcon } from '@/components/icons'
import { CAB_PROFESSIONAL_ROLES } from '@/lib/api/cabEmployeesApi'
import {
  AUDIT_LANGUAGE_OPTIONS,
  fromIsoDate,
} from '@/components/dashboard/cab/personnelFormHelpers'
import { countryName } from '@/lib/countries'
import { cn } from '@/lib/utils'

const readonlyFieldClass = cn(
  'mt-1',
  fieldInputClassName,
  fieldHeightClassName,
  'bg-[#f9fafb] text-neutral-500 cursor-not-allowed'
)

export interface EvaluationGeneralDetailsSectionProps {
  code: string
  fullName: string
  role: string
  email: string
  phone: string
  baseCountry?: string
  baseCity?: string
  auditLanguages?: string[]
  schemes?: string[]
  scheme: string
  proposedSector: string
  evaluationDate: string
  evaluator: string
}

export function EvaluationGeneralDetailsSection({
  code,
  fullName,
  role,
  email,
  phone,
  baseCountry,
  baseCity,
  auditLanguages = [],
  schemes,
  scheme,
  proposedSector,
  evaluationDate,
  evaluator,
}: EvaluationGeneralDetailsSectionProps) {
  const { t, i18n } = useTranslation()

  const formattedResidence = [
    baseCity?.trim(),
    baseCountry?.trim()
      ? baseCountry.trim().length === 2
        ? countryName(baseCountry.trim(), i18n.language)
        : baseCountry.trim()
      : '',
  ]
    .filter(Boolean)
    .join('، ')

  const formattedLanguages = auditLanguages
    .map((lang) => {
      const found = AUDIT_LANGUAGE_OPTIONS.find(
        (opt) => opt.value.toLowerCase() === lang.toLowerCase()
      )
      return found
        ? t(`cab.competence.languages.${found.key}`, found.defaultLabel)
        : lang
    })
    .join(', ')

  return (
    <div className="space-y-5">
      <SectionHeading
        title={`${t('cab.competence.evaluation.sections.generalInfo', 'General information')} & ${t('cab.competence.evaluation.sections.evalDetails', 'Evaluation details')}`}
        accordion
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Column 1: General information */}
          <div className="space-y-4">
            <h3 className="border-b border-[#ececec] pb-2 text-[15px] font-bold text-neutral-900">
              {t('cab.competence.evaluation.sections.generalInfo', 'General information')}
            </h3>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.personId', 'Person ID')}
              </label>
              <input
                type="text"
                disabled
                dir="ltr"
                value={code}
                className={cn(readonlyFieldClass, 'text-start')}
              />
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.fullName', 'Full name')}
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={fullName}
                className={readonlyFieldClass}
              />
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.role', 'Role')}
              </label>
              <div className="relative">
                <select
                  disabled
                  value={role}
                  className={cn(readonlyFieldClass, 'appearance-none pe-8')}
                >
                  {CAB_PROFESSIONAL_ROLES.map((r) => (
                    <option key={r.value} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <AppIcon
                  icon={ChevronDownIcon}
                  size={14}
                  className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.email', 'Email')}
              </label>
              <input
                type="email"
                disabled
                readOnly
                dir="ltr"
                value={email}
                className={cn(readonlyFieldClass, 'text-start')}
              />
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.phone', 'Phone')}
              </label>
              <input
                type="text"
                disabled
                readOnly
                dir="ltr"
                value={phone}
                className={cn(readonlyFieldClass, 'text-start')}
              />
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.memberProfile.residenceLocation', 'Place of residence')}
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={formattedResidence || '—'}
                className={readonlyFieldClass}
              />
            </div>
          </div>

          {/* Column 2: Evaluation details */}
          <div className="space-y-4">
            <h3 className="border-b border-[#ececec] pb-2 text-[15px] font-bold text-neutral-900">
              {t('cab.competence.evaluation.sections.evalDetails', 'Evaluation details')}
            </h3>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.scheme', 'Scheme')}
              </label>
              <div className="relative">
                <select
                  disabled
                  value={scheme}
                  className={cn(readonlyFieldClass, 'appearance-none pe-8')}
                >
                  {schemes?.length ? (
                    schemes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ISO 9001">ISO 9001</option>
                      <option value="ISO 14001">ISO 14001</option>
                      <option value="ISO 45001">ISO 45001</option>
                      <option value="ISO 22000">ISO 22000</option>
                      <option value="ISO 27001">ISO 27001</option>
                      <option value="HACCP">HACCP</option>
                    </>
                  )}
                </select>
                <AppIcon
                  icon={ChevronDownIcon}
                  size={14}
                  className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.proposedSector', 'Proposed sector')}
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={proposedSector}
                className={readonlyFieldClass}
              />
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.memberProfile.auditLanguages', 'Audit languages')}
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={formattedLanguages || '—'}
                className={readonlyFieldClass}
              />
            </div>

            <div>
              <label className={cn('mb-1 block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.evalDate', 'Evaluation date')}
              </label>
              <DatePicker disabled value={fromIsoDate(evaluationDate)} />
            </div>

            <div>
              <label className={cn('block', fieldLabelClassName)}>
                {t('cab.competence.evaluation.fields.evaluator', 'Evaluator')}
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={evaluator}
                className={readonlyFieldClass}
              />
            </div>
          </div>
        </div>
      </SectionHeading>
    </div>
  )
}
