import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import {
  CAB_ROLE_OPTIONS,
  CAB_TYPE_OPTIONS,
  MODULE_OPTIONS,
  SCOPE_STANDARDS_BY_TYPE,
} from '@/lib/api/cabRegisterApi'
import type { CabDetailsForm } from '@/lib/cabDetailsForm'
import type { CabScopeModulesForm } from '@/lib/cabScopeModulesForm'

interface CabSummaryStepProps {
  detailsForm: CabDetailsForm
  scopeModulesForm: CabScopeModulesForm
}

/** Row layout matching the design: light label on the start side, value on the end side, hairline divider below. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(140px,1fr)_2fr] gap-4 border-b border-[#f0f0f0] py-4 last:border-b-0">
      <span className="text-[14px] text-neutral-500">{label}</span>
      <span className="text-[15px] font-medium text-neutral-900">{value}</span>
    </div>
  )
}

function standardLabel(value: string): string {
  for (const catalog of Object.values(SCOPE_STANDARDS_BY_TYPE)) {
    const standards =
      catalog.kind === 'flat' ? catalog.standards : catalog.owners.flatMap((owner) => owner.standards)
    const match = standards.find((standard) => standard.value === value)
    if (match) return match.name
  }
  return value
}

export function CabSummaryStep({ detailsForm, scopeModulesForm }: CabSummaryStepProps) {
  const { t } = useTranslation()

  const cabTypeLabels = detailsForm.accreditationScopes
    .map((scope) => {
      const option = CAB_TYPE_OPTIONS.find((o) => o.value === scope)
      return option ? t(option.labelKey) : scope
    })
    .join(', ')

  const roleLabel =
    t(CAB_ROLE_OPTIONS.find((o) => o.value === detailsForm.role)?.labelKey ?? '') || detailsForm.role

  const selectedSchemeLabels = Object.values(scopeModulesForm.selectedStandardsByScheme)
    .flat()
    .map(standardLabel)
    .join(', ')

  const selectedModuleLabels = scopeModulesForm.selectedModules
    .map((value) => MODULE_OPTIONS.find((m) => m.value === value)?.title ?? value)
    .join(', ')

  return (
    <div className="w-full">
      <SectionHeading title={t('register.cab.summary.title')} />

      <div className="rounded-[16px] border border-[#f0f0f0] px-5">
        <SummaryRow label={t('register.cab.cabType')} value={cabTypeLabels || '—'} />
        <SummaryRow label={t('register.cab.cabName')} value={detailsForm.cabName || '—'} />
        <SummaryRow
          label={t('register.cab.accreditationBodyName')}
          value={detailsForm.accreditationBodies.join(', ') || '—'}
        />
        <SummaryRow label={t('register.cab.contactPerson')} value={detailsForm.contactPerson || '—'} />
        <SummaryRow label={t('register.cab.role')} value={roleLabel || '—'} />
        <SummaryRow
          label={t('register.cab.summary.selectedSchemes')}
          value={selectedSchemeLabels || '—'}
        />
        <SummaryRow
          label={t('register.cab.summary.selectedModules')}
          value={selectedModuleLabels || '—'}
        />
      </div>
    </div>
  )
}