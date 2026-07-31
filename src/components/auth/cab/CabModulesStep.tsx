import { useTranslation } from 'react-i18next'
import { MODULE_OPTIONS } from '@/lib/api/cabRegisterApi'
import type { CabScopeModulesForm } from '@/lib/cabScopeModulesForm'

interface CabModulesStepProps {
  form: CabScopeModulesForm
  onPatch: (f: Partial<CabScopeModulesForm>) => void
}

/** Second phase of Step 2 (still "Scope & Modules"): pick which product modules to enable. */
export function CabModulesStep({ form, onPatch }: CabModulesStepProps) {
  const { t } = useTranslation()

  const toggleModule = (value: string) => {
    const next = form.selectedModules.includes(value)
      ? form.selectedModules.filter((v) => v !== value)
      : [...form.selectedModules, value]
    onPatch({ selectedModules: next })
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-[16px] text-neutral-900">{t('register.cab.scopeModules.whichModule')}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULE_OPTIONS.map((module) => {
          const checked = form.selectedModules.includes(module.value)
          return (
            <label
              key={module.value}
              className="flex cursor-pointer items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-neutral-200 px-4 py-4"
            >
              <span>
                <span className="block text-[15px] font-medium text-neutral-900">{module.title}</span>
                <span className="mt-1 block text-[13px] text-neutral-500">{module.description}</span>
              </span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleModule(module.value)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}