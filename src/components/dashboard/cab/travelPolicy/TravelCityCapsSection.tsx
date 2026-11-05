import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { TravelPolicyRowActions } from '@/components/dashboard/cab/travelPolicy/TravelPolicyRowActions'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import {
  createCityRow,
  removeRow,
  rowErrorKey,
  rowFieldId,
  updateRow,
  type TravelCityRow,
} from '@/lib/travelPolicyForm'

export interface TravelCityOption {
  value: string
  label: string
}

interface TravelCityCapsSectionProps {
  rows: TravelCityRow[]
  cityOptions: TravelCityOption[]
  getError: (key: string) => string | undefined
  onChange: (rows: TravelCityRow[]) => void
}

/** Hotel nightly cap per city; overrides the country cap. */
export function TravelCityCapsSection({ rows, cityOptions, getError, onChange }: TravelCityCapsSectionProps) {
  const { t } = useTranslation()
  const usedKeys = new Set(rows.map((row) => row.cityKey))
  const nextCity = cityOptions.find((option) => !usedKeys.has(option.value)) ?? cityOptions[0]

  return (
    <SectionCard
      title={t('cab.travelPolicy.cities')}
      action={
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!nextCity}
          icon={<AppIcon icon={AddCircleIcon} size={18} />}
          onClick={() => nextCity && onChange([...rows, createCityRow(nextCity.value)])}
        >
          {t('cab.travelPolicy.addCity')}
        </Button>
      }
    >
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.empty')}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const update = (patch: Partial<TravelCityRow>) => onChange(updateRow(rows, row.id, patch))
            const cityError = getError(rowErrorKey('cities', row.id, 'cityKey'))
            // Keep the saved city selectable even if the city list no longer includes it.
            const options = cityOptions.some((option) => option.value === row.cityKey)
              ? cityOptions
              : [{ value: row.cityKey, label: row.cityKey }, ...cityOptions]
            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--cab-border)] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)_auto] sm:items-start"
              >
                <div>
                  <SelectField
                    id={rowFieldId('cities', row.id, 'cityKey')}
                    label={t('cab.travelPolicy.city')}
                    value={row.cityKey}
                    onChange={(cityKey) => update({ cityKey })}
                    options={options}
                  />
                  {cityError && (
                    <p role="alert" className="mt-2 text-small-light text-error-500">
                      {cityError}
                    </p>
                  )}
                </div>
                <TextField
                  id={rowFieldId('cities', row.id, 'hotelCap')}
                  label={t('cab.travelPolicy.hotelCap')}
                  type="number"
                  min="0"
                  step="any"
                  value={row.hotelCap}
                  onChange={(event) => update({ hotelCap: event.target.value })}
                  error={getError(rowErrorKey('cities', row.id, 'hotelCap'))}
                />
                <TravelPolicyRowActions
                  className="sm:mt-[29px] sm:h-[45px]"
                  confirmed={row.confirmed}
                  onConfirmedChange={(confirmed) => update({ confirmed })}
                  onRemove={() => onChange(removeRow(rows, row.id))}
                />
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
