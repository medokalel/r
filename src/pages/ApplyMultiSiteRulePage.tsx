import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { RadioGroup, SelectField, CheckboxGroup, FormField } from '@/components/ui'
import { Toggle } from '@/components/ui/Toggle'
import {
  emptyMultiSiteRuleForm,
  isMultiSiteRuleFormComplete,
  calculateMandays,
  MULTI_SITE_STRUCTURE_OPTIONS,
  CENTRAL_FUNCTION_OPTIONS,
  APPLICABLE_RULE_OPTIONS,
  MANDAYS_MODEL_OPTIONS,
  type MultiSiteRuleForm,
} from '@/lib/multiSiteRuleForm'
import {
  loadApplicationDraftSnapshot,
  savePendingMultiSiteRule,
} from '@/lib/applicationDraftSession'

export function ApplyMultiSiteRulePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Sites live in ApplicationDraftPage's state; it snapshots to
  // sessionStorage on every change (see applicationDraftSession.ts), so
  // this route reads that snapshot the same way AddSitePage's
  // OTHER_SITES_OPTIONS TODO describes doing.
  const [sites] = useState(() => loadApplicationDraftSnapshot()?.sitesFacilitiesForm.sites ?? [])

  const [form, setForm] = useState<MultiSiteRuleForm>(emptyMultiSiteRuleForm)
  const patch = (f: Partial<MultiSiteRuleForm>) => setForm((prev) => ({ ...prev, ...f }))
  const patchConsiderations = (f: Partial<MultiSiteRuleForm['considerations']>) =>
    setForm((prev) => ({ ...prev, considerations: { ...prev.considerations, ...f } }))

  const result = useMemo(() => calculateMandays(sites, form), [sites, form])
  const canApply = isMultiSiteRuleFormComplete(form)

  const headOfficeOptions = sites.map((s) => ({ value: s.id, label: s.name }))

  const handleBack = () => navigate('/cab/applications/draft')

  const handleApply = () => {
    if (!canApply) return
    savePendingMultiSiteRule(result)
    navigate('/cab/applications/draft')
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="space-y-1">
          <h2 className="text-h3-semi text-neutral-900">
            {t('cab.applicationDraft.sitesFacilities.multiSiteRule.title')}
          </h2>
          <p className="text-body-2 text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.multiSiteRule.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-5">
            <SectionHeading
              title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.sections.structure')}
              accordion
            >
              <RadioGroup
                name="structureType"
                value={form.structureType}
                onChange={(value) => patch({ structureType: value as MultiSiteRuleForm['structureType'] })}
                options={MULTI_SITE_STRUCTURE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: t(`cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptions.${o.value}`),
                }))}
              />
            </SectionHeading>

            <SectionHeading
              title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.sections.headOffice')}
              accordion
            >
              <div className="space-y-5">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.multiSiteRule.headOfficeSite')}
                  required
                >
                  <SelectField
                    value={form.headOfficeSiteId}
                    options={headOfficeOptions}
                    onChange={(value) => patch({ headOfficeSiteId: value })}
                    placeholder={
                      sites.length === 0
                        ? t('cab.applicationDraft.sitesFacilities.multiSiteRule.noSitesYet')
                        : t('cab.applicationDraft.sitesFacilities.multiSiteRule.headOfficeSitePlaceholder')
                    }
                    disabled={sites.length === 0}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.multiSiteRule.centralFunctions')}>
                  <CheckboxGroup
                    values={form.centralFunctions}
                    onChange={(values) => patch({ centralFunctions: values })}
                    options={CENTRAL_FUNCTION_OPTIONS.map((option) => ({ value: option, label: option }))}
                  />
                </FormField>
              </div>
            </SectionHeading>

            <SectionHeading
              title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.sections.ruleModel')}
              accordion
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.multiSiteRule.applicableRule')}
                  required
                >
                  <SelectField
                    value={form.applicableRule}
                    options={APPLICABLE_RULE_OPTIONS}
                    onChange={(value) => patch({ applicableRule: value })}
                  />
                </FormField>
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.multiSiteRule.mandaysModel')}
                  required
                >
                  <SelectField
                    value={form.mandaysModel}
                    options={MANDAYS_MODEL_OPTIONS}
                    onChange={(value) => patch({ mandaysModel: value })}
                  />
                </FormField>
              </div>
            </SectionHeading>

            <SectionHeading
              title={t('cab.applicationDraft.sitesFacilities.multiSiteRule.sections.considerations')}
              accordion
            >
              <div className="divide-y divide-[#ececec]">
                {(
                  [
                    'sameScopeDevelopment',
                    'includeHeadOfficeFunctions',
                    'calculateTravelPermitCosts',
                  ] as const
                ).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-body-2-medium text-neutral-900">
                      {t(`cab.applicationDraft.sitesFacilities.multiSiteRule.considerationOptions.${key}`)}
                    </span>
                    <Toggle
                      checked={form.considerations[key]}
                      onChange={(checked) => patchConsiderations({ [key]: checked })}
                      aria-label={t(
                        `cab.applicationDraft.sitesFacilities.multiSiteRule.considerationOptions.${key}`
                      )}
                    />
                  </div>
                ))}
              </div>
            </SectionHeading>
          </div>

          <div className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[340px]">
            <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
              <h3 className="mb-4 text-body-1-medium text-neutral-900">
                {t('cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.title')}
              </h3>
              <div className="space-y-3 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.totalBase')}
                  </span>
                  <span className="font-medium text-neutral-900">{result.totalBaseMandays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.samplingAdjustment')}
                  </span>
                  <span className="font-medium text-[#16a34a]">{result.samplingAdjustment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.travelAdjustment')}
                  </span>
                  <span className="font-medium text-neutral-900">
                    {result.travelPermitAdjustment > 0 ? '+' : ''}
                    {result.travelPermitAdjustment}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#ececec] pt-3">
                  <span className="font-semibold text-neutral-900">
                    {t('cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.total')}
                  </span>
                  <span className="text-[20px] font-bold text-primary">{result.totalEstimatedMandays}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={false}
        onSaveDraft={() => {}}
        onNext={handleApply}
        nextDisabled={!canApply}
        nextLabel={t('cab.applicationDraft.sitesFacilities.multiSiteRule.applyRule')}
      />
    </CabLayout>
  )
}