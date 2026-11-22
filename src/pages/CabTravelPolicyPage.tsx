import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { TravelCityCapsSection } from '@/components/dashboard/cab/travelPolicy/TravelCityCapsSection'
import { TravelCountryRatesSection } from '@/components/dashboard/cab/travelPolicy/TravelCountryRatesSection'
import { TravelPricingProvidersSection } from '@/components/dashboard/cab/travelPolicy/TravelPricingProvidersSection'
import { TravelPolicyRulesSection } from '@/components/dashboard/cab/travelPolicy/TravelPolicyRulesSection'
import { TravelRailRoutesSection } from '@/components/dashboard/cab/travelPolicy/TravelRailRoutesSection'
import { AppIcon, CorrectiveActionIcon } from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { TRAVEL_POLICY_MOCK } from '@/lib/api/travelPolicyMockData'
import { getTravelPolicy, saveTravelPolicy } from '@/lib/api/cabTravelPolicyApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { useTravelCityOptions } from '@/lib/useTravelCityOptions'
import {
  countSampleRows,
  fieldIdForError,
  formatPolicyTimestamp,
  draftToInput,
  policyToDraft,
  serializeDraft,
  validateDraft,
  type TravelPolicyDraft,
} from '@/lib/travelPolicyForm'

function focusField(id: string) {
  requestAnimationFrame(() => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element?.focus({ preventScroll: true })
  })
}

export function CabTravelPolicyPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')

  const [draft, setDraft] = useState<TravelPolicyDraft>(() => policyToDraft(TRAVEL_POLICY_MOCK))
  const [baseline, setBaseline] = useState(() => serializeDraft(draft))
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Show what the CAB saved; sample values only until it saves a policy.
  useEffect(() => {
    let active = true
    getTravelPolicy()
      .then((policy) => {
        if (!active || !policy) return
        const saved = policyToDraft(policy)
        setDraft(saved)
        setBaseline(serializeDraft(saved))
      })
      .catch((error) => active && toast.error(getUserErrorMessage(error, t)))
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  const errors = useMemo(() => validateDraft(draft), [draft])
  const dirty = serializeDraft(draft) !== baseline
  const sampleCount = countSampleRows(draft)

  const cityOptions = useTravelCityOptions(isArabic)

  const getError = (key: string) => {
    const code = errors[key]
    return showErrors && code ? t(`cab.travelPolicy.validation.${code}`) : undefined
  }

  const patchDraft = (patch: Partial<TravelPolicyDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const handleSave = async () => {
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      setShowErrors(true)
      toast.error(t('cab.travelPolicy.invalidForm'))
      focusField(fieldIdForError(errorKeys[0]))
      return
    }

    setSaving(true)
    try {
      const saved = await saveTravelPolicy(draftToInput(draft))
      setBaseline(serializeDraft(draft))
      setSavedAt(saved.updatedAt ?? new Date().toISOString())
      setShowErrors(false)
      toast.success(t('cab.travelPolicy.saved'))
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(false)
    }
  }

  const saveButton = (
    <Button type="button" onClick={handleSave} disabled={!dirty || saving}>
      {t('cab.travelPolicy.save')}
    </Button>
  )

  return (
    <CabLayout>
      <CabHeader title={t('cab.travelPolicy.title')} />
      <main className="cab-setup flex flex-1 flex-col gap-6 overflow-auto bg-[var(--cab-canvas)] p-6">
        {loaded && (
        <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[var(--cab-ink)]">{t('cab.travelPolicy.title')}</h1>
            <p className="mt-1 text-[16px] text-[var(--cab-muted)]">{t('cab.travelPolicy.subtitle')}</p>
          </div>
          {saveButton}
        </div>

        {sampleCount > 0 && (
          <CalloutCard
            tone="amber"
            icon={<AppIcon icon={CorrectiveActionIcon} size={20} className="text-[#d97706]" />}
            title={t('cab.travelPolicy.samplesTitle', { count: sampleCount })}
          >
            {t('cab.travelPolicy.samplesText')}
          </CalloutCard>
        )}
        {savedAt && (
          <p className="text-[13px] text-[var(--cab-muted)]">
            {t('cab.travelPolicy.lastSaved', { date: formatPolicyTimestamp(savedAt, i18n.language) })}
          </p>
        )}

        <TravelPricingProvidersSection currency={draft.currency} />
        <TravelPolicyRulesSection
          draft={draft}
          getError={getError}
          onDraftChange={patchDraft}
          onSettingChange={(setting, value) =>
            setDraft((current) => ({ ...current, settings: { ...current.settings, [setting]: value } }))
          }
        />
        <TravelCountryRatesSection
          rows={draft.countries}
          getError={getError}
          onChange={(countries) => patchDraft({ countries })}
        />
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <TravelCityCapsSection
            rows={draft.cities}
            cityOptions={cityOptions}
            getError={getError}
            onChange={(cities) => patchDraft({ cities })}
          />
          <TravelRailRoutesSection
            rows={draft.railRoutes}
            cityOptions={cityOptions}
            getError={getError}
            onChange={(railRoutes) => patchDraft({ railRoutes })}
          />
        </div>
        <div className="flex justify-end">{saveButton}</div>
        </>
        )}
      </main>
    </CabLayout>
  )
}
