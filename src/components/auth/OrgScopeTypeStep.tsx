import { useTranslation } from 'react-i18next'
import { CabOptionCard } from '@/components/auth/cab/CabOptionCard'
import { FormLabel } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import {
  ORG_SCOPE_CATEGORY_OPTIONS,
  getOrgScopeSubOptions,
  type OrgScopeCategory,
} from '@/lib/api/onboardingOrgScopeApi'
import type { OrgScopeFormFields } from '@/lib/onboardingOrgScopeForm'

interface OrgScopeTypeStepProps {
  form: OrgScopeFormFields
  onPatch: (fields: Partial<OrgScopeFormFields>) => void
}

export function OrgScopeTypeStep({ form, onPatch }: OrgScopeTypeStepProps) {
  const { t } = useTranslation()

  const getSubOptions = (category: OrgScopeCategory) =>
    getOrgScopeSubOptions(category).map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    }))

  const handleCategorySelect = (category: OrgScopeCategory) => {
    if (form.scopeCategory === category) {
      onPatch({ scopeCategory: '', scopeAreas: [] })
      return
    }
    onPatch({ scopeCategory: category, scopeAreas: [] })
  }

  return (
    <div className="w-full onboarding-fade-up motion-safe:animate-[onboardingFadeUp_0.4s_ease-out_both]">
      <p className="mb-2 text-body-2-medium text-primary">{t('onboarding.orgType.hint')}</p>
      <h1 className="text-h1 text-neutral-900">{t('onboarding.orgType.title')}</h1>
      <p className="mt-2 mb-6 text-body-2 text-neutral-500">{t('onboarding.orgType.subtitle')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ORG_SCOPE_CATEGORY_OPTIONS.map((option) => (
          <CabOptionCard
            key={option.value}
            icon={option.icon}
            title={t(option.titleKey)}
            description={t(option.descriptionKey)}
            selected={form.scopeCategory === option.value}
            onSelect={() => handleCategorySelect(option.value)}
          />
        ))}
      </div>

      {form.scopeCategory && (
        <div
          key={form.scopeCategory}
          className="mt-6 space-y-2 onboarding-fade-up motion-safe:animate-[onboardingFadeUp_0.35s_ease-out_both]"
        >
          <FormLabel required>{t('onboarding.orgType.areasLabel')}</FormLabel>
          {form.scopeCategory === 'CONFORMITY_ASSESSMENT_BODY' ? (
            <MultiSelect
              tags={form.scopeAreas.slice(0, 1)}
              options={getSubOptions(form.scopeCategory)}
              onChange={(scopeAreas) => {
                if (scopeAreas.length === 0) {
                  onPatch({ scopeAreas: [] })
                  return
                }
                const added = scopeAreas.find((area) => !form.scopeAreas.includes(area))
                onPatch({ scopeAreas: [added ?? scopeAreas[scopeAreas.length - 1]] })
              }}
              layout="stacked"
              searchable
              placeholder={t('onboarding.orgType.areasSinglePlaceholder')}
              searchPlaceholder={t('onboarding.orgType.areasSearchPlaceholder')}
            />
          ) : (
            <MultiSelect
              tags={form.scopeAreas}
              options={getSubOptions(form.scopeCategory)}
              onChange={(scopeAreas) => onPatch({ scopeAreas })}
              layout="stacked"
              searchable
              placeholder={t('onboarding.orgType.areasPlaceholder')}
              searchPlaceholder={t('onboarding.orgType.areasSearchPlaceholder')}
            />
          )}
        </div>
      )}
    </div>
  )
}
