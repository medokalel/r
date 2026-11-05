import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import {
  TravelCityCapsSection,
  type TravelCityOption,
} from '@/components/dashboard/cab/travelPolicy/TravelCityCapsSection'
import { TravelCountryRatesSection } from '@/components/dashboard/cab/travelPolicy/TravelCountryRatesSection'
import { TravelPolicyRulesSection } from '@/components/dashboard/cab/travelPolicy/TravelPolicyRulesSection'
import { TravelRailRoutesSection } from '@/components/dashboard/cab/travelPolicy/TravelRailRoutesSection'
import { AppIcon, CorrectiveActionIcon } from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { TRAVEL_CITIES_MOCK, TRAVEL_POLICY_MOCK } from '@/lib/api/travelPolicyMockData'
import { toast } from '@/lib/toast'
import {
  countSampleRows,
  fieldIdForError,
  formatPolicyTimestamp,
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

  const errors = useMemo(() => validateDraft(draft), [draft])
  const dirty = serializeDraft(draft) !== baseline
  const sampleCount = countSampleRows(draft)

  const cityOptions: TravelCityOption[] = useMemo(
    () => TRAVEL_CITIES_MOCK.map((city) => ({ value: city.key, label: isArabic ? city.nameAr : city.name })),
    [isArabic]
  )

  const getError = (key: string) => {
    const code = errors[key]
    return showErrors && code ? t(`cab.travelPolicy.validation.${code}`) : undefined
  }

  const patchDraft = (patch: Partial<TravelPolicyDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const handleSave = () => {
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      setShowErrors(true)
      toast.error(t('cab.travelPolicy.invalidForm'))
      focusField(fieldIdForError(errorKeys[0]))
      return
    }

    // TODO: send `draftToInput(draft)` to the API once the travel policy endpoint exists.
    setBaseline(serializeDraft(draft))
    setSavedAt(new Date().toISOString())
    setShowErrors(false)
    toast.success(t('cab.travelPolicy.saved'))
  }

  const saveButton = (
    <Button type="button" onClick={handleSave} disabled={!dirty}>
      {t('cab.travelPolicy.save')}
    </Button>
  )

  return (
    <CabLayout>
      <CabHeader title={t('cab.travelPolicy.title')} />
      <main className="cab-setup flex flex-1 flex-col gap-6 overflow-auto bg-[var(--cab-canvas)] p-6">
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
      </main>
    </CabLayout>
  )
}
