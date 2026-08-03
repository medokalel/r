import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormLabel } from '@/components/ui/FormField'
import { fieldHeightClassName, fieldInputClassName, fieldTextClassName } from '@/components/ui/fieldStyles'
import { AB_TYPE_OPTIONS, SCOPE_STANDARDS_BY_TYPE } from '@/lib/api/abRegisterApi'
import type { AbScopeModulesForm } from '@/lib/abScopeModulesForm'
import { cn } from '@/lib/utils'

interface AbScopeModulesStepProps {
  /** The single accreditation scope this screen covers — AbRegisterFlow renders one of these per scheme chosen in step 1, one screen at a time. */
  scheme: string
  form: AbScopeModulesForm
  onPatch: (f: Partial<AbScopeModulesForm>) => void
}

/**
 * One screen per scheme chosen in step 1 ("AB Type"): shows that scheme's
 * name (read-only — no picker here, AbRegisterFlow steps through schemes
 * one screen at a time), its owner picker if appliable, and its
 * appliable standards.
 */
export function AbScopeModulesStep({ scheme, form, onPatch }: AbScopeModulesStepProps) {
  const { t } = useTranslation()

  const schemeLabel = useMemo(() => {
    const option = AB_TYPE_OPTIONS.find((o) => o.value === scheme)
    return option ? t(option.labelKey) : scheme
  }, [scheme, t])

  const catalog = SCOPE_STANDARDS_BY_TYPE[scheme]

  const activeOwnerValue =
    catalog?.kind === 'byOwner' ? form.selectedOwnerByScheme[scheme] ?? catalog.owners[0]?.value ?? '' : ''
  const ownerCatalog =
    catalog?.kind === 'byOwner' ? catalog.owners.find((owner) => owner.value === activeOwnerValue) : undefined
  const ownerOptions =
    catalog?.kind === 'byOwner' ? catalog.owners.map((owner) => ({ value: owner.value, label: owner.label })) : []

  const standardsKey = catalog?.kind === 'byOwner' ? `${scheme}::${activeOwnerValue}` : scheme
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
        <FormLabel required>{t('register.ab.scopeModules.schemeName')}</FormLabel>
        <div
          className={cn(
            fieldInputClassName,
            fieldHeightClassName,
            'flex items-center text-neutral-700'
          )}
        >
          {schemeLabel}
        </div>
      </div>

      {catalog?.kind === 'byOwner' && (
        <div className="space-y-3">
          <FormLabel required>{t('register.ab.scopeModules.schemeOwners')}</FormLabel>
          <SelectField
            value={activeOwnerValue}
            onChange={(value) =>
              onPatch({ selectedOwnerByScheme: { ...form.selectedOwnerByScheme, [scheme]: value } })
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
                <Checkbox
                  checked={selected.includes(standard.value)}
                  onChange={() => toggleStandard(standard.value)}
                  className="mt-1"
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
        <p className="text-[14px] text-neutral-500">{t('register.ab.scopeModules.noStandards')}</p>
      )}
    </div>
  )
}