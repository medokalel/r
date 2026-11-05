import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { TravelPolicyRowActions } from '@/components/dashboard/cab/travelPolicy/TravelPolicyRowActions'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import {
  createCountryRow,
  removeRow,
  rowErrorKey,
  rowFieldId,
  TRAVEL_COUNTRY_LENGTH,
  TRAVEL_NOTE_MAX_LENGTH,
  updateRow,
  type TravelCountryRow,
} from '@/lib/travelPolicyForm'

interface TravelCountryRatesSectionProps {
  rows: TravelCountryRow[]
  getError: (key: string) => string | undefined
  onChange: (rows: TravelCountryRow[]) => void
}

/** Per diem, hotel cap and visa fee per country (ISO code). */
export function TravelCountryRatesSection({ rows, getError, onChange }: TravelCountryRatesSectionProps) {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t('cab.travelPolicy.countries')}
      action={
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={<AppIcon icon={AddCircleIcon} size={18} />}
          onClick={() => onChange([...rows, createCountryRow()])}
        >
          {t('cab.travelPolicy.addCountry')}
        </Button>
      }
    >
      <p className="mb-3 text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.countriesHint')}</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.empty')}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const update = (patch: Partial<TravelCountryRow>) => onChange(updateRow(rows, row.id, patch))
            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--cab-border)] p-3 sm:grid-cols-2 lg:grid-cols-[90px_repeat(3,minmax(0,1fr))_minmax(0,1.5fr)_auto] lg:items-start"
              >
                <TextField
                  id={rowFieldId('countries', row.id, 'country')}
                  label={t('cab.travelPolicy.country')}
                  maxLength={TRAVEL_COUNTRY_LENGTH}
                  value={row.country}
                  onChange={(event) => update({ country: event.target.value.toUpperCase() })}
                  error={getError(rowErrorKey('countries', row.id, 'country'))}
                />
                <TextField
                  id={rowFieldId('countries', row.id, 'perDiem')}
                  label={t('cab.travelPolicy.perDiem')}
                  type="number"
                  min="0"
                  step="any"
                  value={row.perDiem}
                  onChange={(event) => update({ perDiem: event.target.value })}
                  error={getError(rowErrorKey('countries', row.id, 'perDiem'))}
                />
                <TextField
                  id={rowFieldId('countries', row.id, 'hotelCap')}
                  label={t('cab.travelPolicy.hotelCap')}
                  type="number"
                  min="0"
                  step="any"
                  value={row.hotelCap}
                  onChange={(event) => update({ hotelCap: event.target.value })}
                  error={getError(rowErrorKey('countries', row.id, 'hotelCap'))}
                />
                <TextField
                  id={rowFieldId('countries', row.id, 'visaFee')}
                  label={t('cab.travelPolicy.visaFee')}
                  type="number"
                  min="0"
                  step="any"
                  value={row.visaFee}
                  onChange={(event) => update({ visaFee: event.target.value })}
                  error={getError(rowErrorKey('countries', row.id, 'visaFee'))}
                />
                <TextField
                  id={rowFieldId('countries', row.id, 'note')}
                  label={t('cab.travelPolicy.note')}
                  maxLength={TRAVEL_NOTE_MAX_LENGTH}
                  value={row.note}
                  onChange={(event) => update({ note: event.target.value })}
                />
                <TravelPolicyRowActions
                  className="sm:col-span-2 lg:col-span-1 lg:mt-[29px] lg:h-[45px]"
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
