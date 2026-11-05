import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { TravelPolicyRowActions } from '@/components/dashboard/cab/travelPolicy/TravelPolicyRowActions'
import type { TravelCityOption } from '@/components/dashboard/cab/travelPolicy/TravelCityCapsSection'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import {
  createRailRow,
  removeRow,
  rowErrorKey,
  rowFieldId,
  TRAVEL_OPERATOR_MAX_LENGTH,
  updateRow,
  type TravelRailRow,
} from '@/lib/travelPolicyForm'

interface TravelRailRoutesSectionProps {
  rows: TravelRailRow[]
  cityOptions: TravelCityOption[]
  getError: (key: string) => string | undefined
  onChange: (rows: TravelRailRow[]) => void
}

/** Reference train fares, used because no live rail booking service is connected. */
export function TravelRailRoutesSection({ rows, cityOptions, getError, onChange }: TravelRailRoutesSectionProps) {
  const { t } = useTranslation()
  const canAdd = cityOptions.length >= 2

  return (
    <SectionCard
      title={t('cab.travelPolicy.rail')}
      action={
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!canAdd}
          icon={<AppIcon icon={AddCircleIcon} size={18} />}
          onClick={() => onChange([...rows, createRailRow(cityOptions[0].value, cityOptions[1].value)])}
        >
          {t('cab.travelPolicy.addRoute')}
        </Button>
      }
    >
      <p className="mb-3 text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.railHint')}</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.travelPolicy.empty')}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const update = (patch: Partial<TravelRailRow>) => onChange(updateRow(rows, row.id, patch))
            const toError = getError(rowErrorKey('railRoutes', row.id, 'to'))
            const withSaved = (key: string) =>
              cityOptions.some((option) => option.value === key)
                ? cityOptions
                : [{ value: key, label: key }, ...cityOptions]
            return (
              <div
                key={row.id}
                className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--cab-border)] p-3 sm:grid-cols-2 sm:items-start"
              >
                <SelectField
                  id={rowFieldId('railRoutes', row.id, 'from')}
                  label={t('cab.travelPolicy.from')}
                  value={row.from}
                  onChange={(from) => update({ from })}
                  options={withSaved(row.from)}
                />
                <div>
                  <SelectField
                    id={rowFieldId('railRoutes', row.id, 'to')}
                    label={t('cab.travelPolicy.to')}
                    value={row.to}
                    onChange={(to) => update({ to })}
                    options={withSaved(row.to)}
                  />
                  {toError && (
                    <p role="alert" className="mt-2 text-small-light text-error-500">
                      {toError}
                    </p>
                  )}
                </div>
                <TextField
                  id={rowFieldId('railRoutes', row.id, 'fare')}
                  label={t('cab.travelPolicy.fare')}
                  type="number"
                  min="0"
                  step="any"
                  value={row.fare}
                  onChange={(event) => update({ fare: event.target.value })}
                  error={getError(rowErrorKey('railRoutes', row.id, 'fare'))}
                />
                <TextField
                  id={rowFieldId('railRoutes', row.id, 'hours')}
                  label={t('cab.travelPolicy.hours')}
                  type="number"
                  min="0"
                  step="any"
                  value={row.hours}
                  onChange={(event) => update({ hours: event.target.value })}
                  error={getError(rowErrorKey('railRoutes', row.id, 'hours'))}
                />
                <TextField
                  id={rowFieldId('railRoutes', row.id, 'operator')}
                  label={t('cab.travelPolicy.operator')}
                  maxLength={TRAVEL_OPERATOR_MAX_LENGTH}
                  value={row.operator}
                  onChange={(event) => update({ operator: event.target.value })}
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
