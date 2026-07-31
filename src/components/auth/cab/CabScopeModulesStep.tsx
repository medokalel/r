import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui'
import { FormLabel } from '@/components/ui/FormField'
import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { CAB_TYPE_OPTIONS, SCOPE_STANDARDS_BY_TYPE } from '@/lib/api/cabRegisterApi'
import type { CabScopeModulesForm } from '@/lib/cabScopeModulesForm'
import { cn } from '@/lib/utils'

interface CabScopeModulesStepProps {
  /** The accreditation scopes chosen back in step 1 (Continuation screen). */
  schemes: string[]
  form: CabScopeModulesForm
  onPatch: (f: Partial<CabScopeModulesForm>) => void
}

/**
 * First phase of Step 2 ("Scope & Modules"): pick a scheme, then (for
 * schemes like Product Certification) a scheme owner, then its applicable
 * standards.
 */
export function CabScopeModulesStep({ schemes, form, onPatch }: CabScopeModulesStepProps) {
  const { t } = useTranslation()
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null)
  // Fall back to the first scheme if none is picked yet, or if the user went
  // back and changed their step-1 selections so the picked one no longer applies.
  const activeScheme = selectedScheme && schemes.includes(selectedScheme) ? selectedScheme : schemes[0] ?? ''

  const schemeOptions = useMemo(
    () =>
      schemes.map((scheme) => {
        const option = CAB_TYPE_OPTIONS.find((o) => o.value === scheme)
        return { value: scheme, label: option ? t(option.labelKey) : scheme }
      }),
    [schemes, t]
  )

  const catalog = SCOPE_STANDARDS_BY_TYPE[activeScheme]

  const activeOwnerValue =
    catalog?.kind === 'byOwner' ? form.selectedOwnerByScheme[activeScheme] ?? catalog.owners[0]?.value ?? '' : ''
  const ownerCatalog =
    catalog?.kind === 'byOwner' ? catalog.owners.find((owner) => owner.value === activeOwnerValue) : undefined
  const ownerOptions =
    catalog?.kind === 'byOwner' ? catalog.owners.map((owner) => ({ value: owner.value, label: owner.label })) : []

  const standardsKey = catalog?.kind === 'byOwner' ? `${activeScheme}::${activeOwnerValue}` : activeScheme
  const sectionTitle = catalog?.kind === 'flat' ? catalog.sectionTitle : ownerCatalog?.sectionTitle
  const standardsList = catalog?.kind === 'flat' ? catalog.standards : ownerCatalog?.standards
  const defaultSelected = (catalog?.kind === 'flat' ? catalog.defaultSelected : ownerCatalog?.defaultSelected) ?? []
  const selected = form.selectedStandardsByScheme[standardsKey] ?? defaultSelected

  const toggleStandard = (value: string) => {
    const current = form.selectedStandardsByScheme[standardsKey] ?? defaultSelected
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    onPatch({ selectedStandardsByScheme: { ...form.selectedStandardsByScheme, [standardsKey]: next } })
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <FormLabel required>{t('register.cab.scopeModules.schemeName')}</FormLabel>
        <SelectField value={activeScheme} onChange={setSelectedScheme} options={schemeOptions} />
      </div>

      {catalog?.kind === 'byOwner' && (
        <div className="space-y-3">
          <FormLabel required>{t('register.cab.scopeModules.schemeOwners')}</FormLabel>
          <SelectField
            value={activeOwnerValue}
            onChange={(value) =>
              onPatch({ selectedOwnerByScheme: { ...form.selectedOwnerByScheme, [activeScheme]: value } })
            }
            options={ownerOptions}
          />
        </div>
      )}

      {standardsList ? (
        <div className="rounded-[var(--radius-sm)] border border-neutral-200">
          <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
            <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="text-[15px] font-semibold text-primary">{sectionTitle}</span>
          </div>
          <div className="max-h-[280px] space-y-4 overflow-y-auto px-4 py-4">
            {standardsList.map((standard) => (
              <label key={standard.value} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(standard.value)}
                  onChange={() => toggleStandard(standard.value)}
                  className="mt-1 size-4 shrink-0 accent-primary"
                />
                <span>
                  <span className={cn(fieldTextClassName, 'block font-medium text-neutral-900')}>
                    {standard.name}
                  </span>
                  <span className="block text-[13px] text-neutral-500">{standard.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[14px] text-neutral-500">{t('register.cab.scopeModules.noStandards')}</p>
      )}
    </div>
  )
}