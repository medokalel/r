import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { Checkbox } from '@/components/ui/Checkbox'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { TRAVEL_CABINS } from '@/lib/travelPolicyTypes'
import {
  settingErrorKey,
  settingFieldId,
  TRAVEL_CURRENCY_FIELD_ID,
  TRAVEL_CURRENCY_LENGTH,
  TRAVEL_SETTING_GROUPS,
  type TravelNumericSetting,
  type TravelPolicyDraft,
} from '@/lib/travelPolicyForm'

interface TravelPolicyRulesSectionProps {
  draft: TravelPolicyDraft
  getError: (key: string) => string | undefined
  onDraftChange: (patch: Partial<Omit<TravelPolicyDraft, 'settings'>>) => void
  onSettingChange: (setting: TravelNumericSetting, value: string) => void
}

/** Currency, cabin and yes/no rules, then every numeric rule grouped by topic. */
export function TravelPolicyRulesSection({
  draft,
  getError,
  onDraftChange,
  onSettingChange,
}: TravelPolicyRulesSectionProps) {
  const { t } = useTranslation()

  return (
    <SectionCard title={t('cab.travelPolicy.rules')}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id={TRAVEL_CURRENCY_FIELD_ID}
            label={t('cab.travelPolicy.currency')}
            maxLength={TRAVEL_CURRENCY_LENGTH}
            value={draft.currency}
            onChange={(event) => onDraftChange({ currency: event.target.value.toUpperCase() })}
            error={getError('currency')}
          />
          <SelectField
            id="travel-long-cabin"
            label={t('cab.travelPolicy.settings.longFlightCabin')}
            value={draft.longFlightCabin}
            onChange={(value) => onDraftChange({ longFlightCabin: value as (typeof TRAVEL_CABINS)[number] })}
            options={TRAVEL_CABINS.map((cabin) => ({ value: cabin, label: t(`cab.travelPolicy.cabin.${cabin}`) }))}
          />
          <div className="flex flex-col justify-end gap-3 pb-1 text-[14px] text-[var(--cab-ink)]">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={draft.insuranceDomestic}
                onChange={() => onDraftChange({ insuranceDomestic: !draft.insuranceDomestic })}
              />
              {t('cab.travelPolicy.settings.insuranceDomestic')}
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={draft.perDiemOnLocalAudits}
                onChange={() => onDraftChange({ perDiemOnLocalAudits: !draft.perDiemOnLocalAudits })}
              />
              {t('cab.travelPolicy.settings.perDiemOnLocalAudits')}
            </label>
          </div>
        </div>

        {TRAVEL_SETTING_GROUPS.map((group) => (
          <section key={group.key} className="space-y-3">
            <h3 className="text-[14px] font-bold text-neutral-900">
              {t(`cab.travelPolicy.group.${group.key}`)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {group.settings.map((setting) => (
                <TextField
                  key={setting}
                  id={settingFieldId(setting)}
                  label={t(`cab.travelPolicy.settings.${setting}`)}
                  type="number"
                  min="0"
                  step="any"
                  value={draft.settings[setting]}
                  onChange={(event) => onSettingChange(setting, event.target.value)}
                  error={getError(settingErrorKey(setting))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </SectionCard>
  )
}
