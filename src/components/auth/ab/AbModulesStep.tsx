import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/Checkbox'
import { MODULE_OPTIONS } from '@/lib/api/abRegisterApi'
import type { AbScopeModulesForm } from '@/lib/abScopeModulesForm'

interface AbModulesStepProps {
  form: AbScopeModulesForm
  onPatch: (f: Partial<AbScopeModulesForm>) => void
}

/** Second phase of Step 2 (still "Scope & Modules"): pick which product modules to enable. */
export function AbModulesStep({ form, onPatch }: AbModulesStepProps) {
  const { t } = useTranslation()

  const toggleModule = (value: string) => {
    const next = form.selectedModules.includes(value)
      ? form.selectedModules.filter((v) => v !== value)
      : [...form.selectedModules, value]
    onPatch({ selectedModules: next })
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-[16px] text-neutral-900">{t('register.ab.scopeModules.whichModule')}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULE_OPTIONS.map((module) => {
          const checked = form.selectedModules.includes(module.value)
          return (
            <label
              key={module.value}
              className="flex cursor-pointer items-start justify-between gap-3 rounded-[16px] border border-neutral-100 bg-white px-5 py-5 shadow-[0_2px_10px_rgba(16,24,40,0.06)]"
            >
              <span>
                <span className="block text-[15px] font-medium text-neutral-900">{module.title}</span>
                <span className="mt-1 block text-[13px] text-neutral-500">{module.description}</span>
              </span>
              <Checkbox checked={checked} onChange={() => toggleModule(module.value)} className="mt-1" />
            </label>
          )
        })}
      </div>
    </div>
  )
}