import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import {
  fieldHeightClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/components/ui/fieldStyles'
import {
  createCabEmployeeAvailabilityPeriod,
  deleteCabEmployeeAvailabilityPeriod,
  type CabAvailabilityPeriod,
} from '@/lib/api/cabEmployeesApi'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const inputClass = `mt-1 ${fieldInputClassName} ${fieldHeightClassName}`

const SUGGESTED_REASONS = [
  'Annual Leave',
  'Sick Leave',
  'Training',
  'Other',
] as const

export type StagedOrSavedAvailabilityPeriod = CabAvailabilityPeriod & { isStaged?: boolean }

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const datePart = value.split('T')[0]
  const parsed = new Date(`${datePart}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export interface PersonnelAvailabilitySectionProps {
  savedEmployeeId?: string
  periods: StagedOrSavedAvailabilityPeriod[]
  onChangePeriods: React.Dispatch<React.SetStateAction<StagedOrSavedAvailabilityPeriod[]>>
  onError: (message: string, details?: string[]) => void
  disabled?: boolean
}

export function PersonnelAvailabilitySection({
  savedEmployeeId,
  periods,
  onChangePeriods,
  onError,
  disabled = false,
}: PersonnelAvailabilitySectionProps) {
  const { t, i18n } = useTranslation()

  const today = new Date()
  const localDate = toIsoDate(today)

  const [startDate, setStartDate] = useState(localDate)
  const [endDate, setEndDate] = useState(localDate)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null)

  const formatDisplayDate = (iso?: string | null) => {
    if (!iso) return '—'
    const clean = iso.split('T')[0]
    const parsed = new Date(`${clean}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return clean
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(parsed)
  }

  const handleAddPeriod = async () => {
    const trimmedReason = reason.trim()
    if (!startDate || !endDate) {
      onError(
        t(
          'cab.competence.availability.datesRequired',
          'Please select both start date and end date.',
        ),
      )
      return
    }
    if (startDate > endDate) {
      onError(
        t(
          'cab.competence.memberProfile.dateError',
          'End date must be on or after the start date.',
        ),
      )
      return
    }
    if (!trimmedReason) {
      onError(
        t(
          'cab.competence.availability.reasonRequired',
          'Please enter a reason for the availability period.',
        ),
      )
      return
    }

    onError('', [])

    if (savedEmployeeId) {
      setSavingPeriod(true)
      try {
        const { period } = await createCabEmployeeAvailabilityPeriod(savedEmployeeId, {
          startDate,
          endDate,
          reason: trimmedReason,
          notes: notes.trim() || null,
        })
        onChangePeriods((prev) =>
          [...prev, period].sort((a, b) => a.startDate.localeCompare(b.startDate)),
        )
        setReason('')
        setNotes('')
      } catch (err) {
        if (err instanceof ApiError) {
          onError(err.message, err.errors ?? [])
        } else {
          onError(
            t(
              'cab.competence.availability.createFailed',
              'Could not create availability period.',
            ),
          )
        }
      } finally {
        setSavingPeriod(false)
      }
    } else {
      const stagedPeriod: StagedOrSavedAvailabilityPeriod = {
        id: `staged-avail-${crypto.randomUUID()}`,
        isStaged: true,
        startDate,
        endDate,
        reason: trimmedReason,
        notes: notes.trim() || null,
        createdAt: new Date().toISOString(),
      }
      onChangePeriods((prev) =>
        [...prev, stagedPeriod].sort((a, b) => a.startDate.localeCompare(b.startDate)),
      )
      setReason('')
      setNotes('')
    }
  }

  const handleDeletePeriod = async (period: StagedOrSavedAvailabilityPeriod) => {
    onError('', [])

    if (period.isStaged || !savedEmployeeId) {
      onChangePeriods((prev) => prev.filter((item) => item.id !== period.id))
      return
    }

    setDeletingPeriodId(period.id)
    try {
      await deleteCabEmployeeAvailabilityPeriod(savedEmployeeId, period.id)
      onChangePeriods((prev) => prev.filter((item) => item.id !== period.id))
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message, err.errors ?? [])
      } else {
        onError(
          t(
            'cab.competence.availability.deleteFailed',
            'Could not delete availability period.',
          ),
        )
      }
    } finally {
      setDeletingPeriodId(null)
    }
  }

  return (
    <div>
      <SectionHeading
        title={t(
          'cab.competence.availability.sectionTitle',
          'Availability & Leave Periods',
        )}
        accordion
      >
        <div className="space-y-4">
          <div>
            <p className="text-[13px] text-neutral-500">
              {t(
                'cab.competence.availability.sectionDesc',
                'Record employee leave, training, or unavailability periods (startDate must be on or before endDate).',
              )}
            </p>
          </div>

          <div className="space-y-4 rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <span className={`mb-1 block ${fieldLabelClassName}`}>
                  {t('cab.competence.availability.startDate', 'Start date')} *
                </span>
                <DatePicker
                  value={fromIsoDate(startDate)}
                  onChange={(date) => setStartDate(toIsoDate(date))}
                />
              </div>

              <div>
                <span className={`mb-1 block ${fieldLabelClassName}`}>
                  {t('cab.competence.availability.endDate', 'End date')} *
                </span>
                <DatePicker
                  value={fromIsoDate(endDate)}
                  onChange={(date) => setEndDate(toIsoDate(date))}
                />
              </div>

              <div>
                <label className={`block ${fieldLabelClassName}`}>
                  {t('cab.competence.availability.reason', 'Reason')} *
                  <input
                    type="text"
                    maxLength={200}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t(
                      'cab.competence.availability.reasonPlaceholder',
                      'e.g. Annual Leave, Training...',
                    )}
                    className={cn(inputClass, 'bg-white')}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium text-neutral-500">
                {t('cab.competence.availability.quickReasons', 'Quick reason:')}
              </span>
              {SUGGESTED_REASONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setReason(suggestion)}
                  className={cn(
                    'inline-flex items-center rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors',
                    reason.trim().toLowerCase() === suggestion.toLowerCase()
                      ? 'bg-[#1236a3] text-white'
                      : 'bg-[#e8edfc] text-[#1236a3] hover:bg-[#dbe4fb]',
                  )}
                >
                  {t(
                    `cab.competence.availability.reasons.${suggestion}`,
                    suggestion,
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className={`block ${fieldLabelClassName}`}>
                  {t('cab.competence.availability.notes', 'Notes (optional)')}
                  <input
                    type="text"
                    maxLength={1000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t(
                      'cab.competence.availability.notesPlaceholder',
                      'e.g. Approved by HR / Planned summer holiday...',
                    )}
                    className={cn(inputClass, 'bg-white')}
                  />
                </label>
              </div>

              <Button
                type="button"
                variant="secondary"
                disabled={savingPeriod || disabled}
                icon={<AppIcon icon={AddCircleIcon} size={18} />}
                onClick={() => void handleAddPeriod()}
                className="h-11 shrink-0 whitespace-nowrap"
              >
                {savingPeriod
                  ? t('common.saving', 'Saving...')
                  : t('cab.competence.availability.addPeriod', 'Add period')}
              </Button>
            </div>
          </div>

          {periods.length > 0 ? (
            <div className="overflow-x-auto rounded-[12px] border border-[#ececec] bg-white">
              <table className="w-full min-w-[600px] border-collapse text-center text-[13px]">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      {t('cab.competence.availability.startDate', 'Start date')}
                    </th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      {t('cab.competence.availability.endDate', 'End date')}
                    </th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      {t('cab.competence.availability.reason', 'Reason')}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t('cab.competence.availability.notes', 'Notes')}
                    </th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period, idx) => (
                    <tr
                      key={period.id}
                      className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                    >
                      <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                        {formatDisplayDate(period.startDate)}
                      </td>
                      <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                        {formatDisplayDate(period.endDate)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-[#1236a3]">
                          {period.reason}
                        </span>
                        {period.isStaged && (
                          <span className="ms-1.5 inline-flex items-center rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            {t('cab.competence.impartiality.stagedBadge', 'Pending Save')}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[280px] px-3 py-3 text-neutral-600">
                        {period.notes || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={deletingPeriodId === period.id || disabled}
                          onClick={() => void handleDeletePeriod(period)}
                          className="inline-flex items-center justify-center rounded-[6px] p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title={t('common.delete', 'Delete')}
                        >
                          <AppIcon icon={TrashIcon} size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-[10px] border border-dashed border-[#e2e2e2] bg-white py-4 text-center text-[13px] text-neutral-500">
              {t(
                'cab.competence.availability.noPeriods',
                'No availability or leave periods recorded yet.',
              )}
            </p>
          )}
        </div>
      </SectionHeading>
    </div>
  )
}
